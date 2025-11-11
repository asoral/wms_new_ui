import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ERPNextConfig {
  erpnext_url: string
  erpnext_api_key: string
  erpnext_api_secret: string
  erpnext_default_company: string
}

interface DashboardMetrics {
  totalItems: number
  lowStockItems: number
  pendingOrders: number
  totalWarehouses: number
  totalStockValue: number
  stockTurnoverRatio: number
  deadStockValue: number
  carryingCostPercentage: number
  operationalMetrics: {
    completedPickLists: number
    totalPickLists: number
    completedDeliveries: number
    totalDeliveryNotes: number
    fullyDeliveredOrders: number
    totalSalesOrders: number
    warehouseUtilization: number
    avgDeliveryTime: number
  }
  stockAgingData: {
    items_count: number
    aged_30_days: number
    aged_90_days: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Set the auth token for the Supabase client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Create authenticated Supabase client for RPC calls
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get ERPNext credentials using authenticated client
    const { data: credentials, error: credError } = await authenticatedClient
      .rpc('get_user_erpnext_credentials')
      
    if (credError || !credentials || credentials.length === 0) {
      console.error('Credentials error:', credError)
      return new Response(
        JSON.stringify({ error: 'ERPNext credentials not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const config: ERPNextConfig = credentials[0]

    if (!config.erpnext_url || !config.erpnext_api_key || !config.erpnext_api_secret) {
      return new Response(
        JSON.stringify({ error: 'Incomplete ERPNext configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const company = config.erpnext_default_company

    // Create authorization header for ERPNext API
    const erpAuthHeader = `token ${config.erpnext_api_key}:${config.erpnext_api_secret}`

    console.log('Fetching dashboard metrics for company:', company)

    // Fetch dashboard metrics in parallel
    const [
      itemsResponse,
      binResponse,
      purchaseOrdersResponse,
      warehousesResponse,
      stockLedgerResponse,
      batchResponse,
      pickListsResponse,
      deliveryNotesResponse,
      salesOrdersResponse
    ] = await Promise.allSettled([
      // 1. Total Items - count of enabled items
      fetch(`${config.erpnext_url}/api/resource/Item?fields=["name"]&filters=[["disabled","=",0]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 2. Bin data for low stock and stock value
      fetch(`${config.erpnext_url}/api/resource/Bin?fields=["item_code","warehouse","actual_qty","projected_qty","stock_value"]&filters=[["warehouse","like","%${company || ''}%"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 3. Purchase Orders with pending status
      fetch(`${config.erpnext_url}/api/resource/Purchase Order?fields=["name","status","company"]&filters=[["status","in",["To Receive","To Receive and Bill"]],["company","=","${company || ''}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 4. Warehouses under "All Warehouses"
      fetch(`${config.erpnext_url}/api/resource/Warehouse?fields=["name","company","parent_warehouse","is_group"]&filters=[["company","=","${company || ''}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 5. Stock Ledger for turnover calculation
      fetch(`${config.erpnext_url}/api/resource/Stock Ledger Entry?fields=["posting_date","item_code","qty_after_transaction","stock_value"]&filters=[["company","=","${company || ''}"],["posting_date",">=","${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 6. Batch data for dead stock analysis
      fetch(`${config.erpnext_url}/api/resource/Batch?fields=["name","item","expiry_date"]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 7. Pick Lists for pick accuracy
      fetch(`${config.erpnext_url}/api/resource/Pick List?fields=["name","status","creation","modified","company"]&filters=[["company","=","${company || ''}"],["creation",">=","${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 8. Delivery Notes for fulfillment metrics
      fetch(`${config.erpnext_url}/api/resource/Delivery Note?fields=["name","status","posting_date","docstatus","company"]&filters=[["company","=","${company || ''}"],["posting_date",">=","${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      }),
      
      // 9. Sales Orders for fulfillment rate
      fetch(`${config.erpnext_url}/api/resource/Sales Order?fields=["name","status","transaction_date","delivery_status","docstatus","company"]&filters=[["company","=","${company || ''}"],["transaction_date",">=","${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"]]&limit_page_length=999999`, {
        headers: {
          'Authorization': erpAuthHeader,
          'Content-Type': 'application/json'
        }
      })
    ])

    // Process responses
    const items = itemsResponse.status === 'fulfilled' 
      ? (await itemsResponse.value.json()).data || []
      : []
      
    const bins = binResponse.status === 'fulfilled' 
      ? (await binResponse.value.json()).data || []
      : []
      
    const purchaseOrders = purchaseOrdersResponse.status === 'fulfilled'
      ? (await purchaseOrdersResponse.value.json()).data || []
      : []
      
    const warehouses = warehousesResponse.status === 'fulfilled'
      ? (await warehousesResponse.value.json()).data || []
      : []
      
    const stockLedgerEntries = stockLedgerResponse.status === 'fulfilled'
      ? (await stockLedgerResponse.value.json()).data || []
      : []
      
    const batches = batchResponse.status === 'fulfilled'
      ? (await batchResponse.value.json()).data || []
      : []
      
    const pickLists = pickListsResponse.status === 'fulfilled'
      ? (await pickListsResponse.value.json()).data || []
      : []
      
    const deliveryNotes = deliveryNotesResponse.status === 'fulfilled'
      ? (await deliveryNotesResponse.value.json()).data || []
      : []
      
    const salesOrders = salesOrdersResponse.status === 'fulfilled'
      ? (await salesOrdersResponse.value.json()).data || []
      : []

    console.log('Data fetched - Items:', items.length, 'Bins:', bins.length, 'POs:', purchaseOrders.length, 'Warehouses:', warehouses.length, 'Pick Lists:', pickLists.length, 'DNs:', deliveryNotes.length, 'SOs:', salesOrders.length)
    console.log('Warehouse details:', warehouses.map(w => ({ name: w.name, is_group: w.is_group })))
    console.log('Sample bins:', bins.slice(0, 3).map(b => ({ item_code: b.item_code, actual_qty: b.actual_qty, projected_qty: b.projected_qty, stock_value: b.stock_value })))

    // Calculate metrics
    const metrics: DashboardMetrics = {
      // 1. Total Items
      totalItems: items.length,
      
      // 2. Low Stock Items (items with actual qty <= 10 or projected qty <= 0)
      lowStockItems: bins.filter(bin => (bin.actual_qty || 0) <= 10 || (bin.projected_qty || 0) <= 0).length,
      
      // 3. Pending Purchase Orders
      pendingOrders: purchaseOrders.length,
      
      // 4. Total Warehouses (non-group warehouses)
      totalWarehouses: warehouses.filter(wh => wh.is_group !== 1).length,
      
      // 5. Total Stock Value
      totalStockValue: bins.reduce((sum, bin) => sum + (bin.stock_value || 0), 0),
      
      // 6. Stock Turnover Ratio (simplified calculation)
      stockTurnoverRatio: calculateStockTurnover(stockLedgerEntries),
      
      // 7. Dead Stock Value (expired batches + old stock)
      deadStockValue: calculateDeadStockValue(bins, batches),
      
      // 8. Carrying Cost (percentage of stock value - estimated)
      carryingCostPercentage: 15.0, // Standard estimate, could be made configurable
      
      // Operational metrics calculated from real ERPNext data
      operationalMetrics: {
        completedPickLists: pickLists.filter(pl => pl.status === 'Completed').length,
        totalPickLists: pickLists.length,
        completedDeliveries: deliveryNotes.filter(dn => dn.docstatus === 1).length,
        totalDeliveryNotes: deliveryNotes.length,
        fullyDeliveredOrders: salesOrders.filter(so => so.delivery_status === 'Fully Delivered').length,
        totalSalesOrders: salesOrders.filter(so => so.docstatus === 1).length,
        warehouseUtilization: calculateWarehouseUtilization(bins),
        avgDeliveryTime: calculateAverageDeliveryTime(salesOrders, deliveryNotes)
      },
      
      // Stock aging data
      stockAgingData: calculateStockAging(stockLedgerEntries)
    }

    console.log('Calculated metrics:', metrics)

    return new Response(
      JSON.stringify({ data: metrics }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in erpnext-dashboard function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function calculateStockTurnover(stockLedgerEntries: any[]): number {
  if (stockLedgerEntries.length === 0) return 0
  
  // Calculate COGS (total outgoing stock value) and average inventory
  const outgoingEntries = stockLedgerEntries.filter(entry => (entry.qty_after_transaction || 0) < 0)
  const totalCOGS = Math.abs(outgoingEntries.reduce((sum, entry) => sum + (entry.stock_value || 0), 0))
  
  // Average inventory value
  const averageInventoryValue = stockLedgerEntries.reduce((sum, entry) => 
    sum + Math.abs(entry.stock_value || 0), 0) / stockLedgerEntries.length
  
  return averageInventoryValue > 0 ? totalCOGS / averageInventoryValue : 0
}

function calculateDeadStockValue(bins: any[], batches: any[]): number {
  const currentDate = new Date()
  const oneYearAgo = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  // Get expired batches
  const expiredBatches = batches.filter(batch => {
    const expiryDate = batch.expiry_date ? new Date(batch.expiry_date) : null
    return expiryDate && expiryDate < currentDate
  }).map(batch => batch.item)
  
  // Calculate dead stock value
  let deadStockValue = 0
  
  bins.forEach(bin => {
    // If item has expired batch or is very old stock
    const isExpiredBatch = expiredBatches.includes(bin.item_code)
    
    if (isExpiredBatch) {
      deadStockValue += bin.stock_value || 0
    }
  })
  
  return deadStockValue
}

function calculateWarehouseUtilization(bins: any[]): number {
  // Simple calculation based on bins with stock vs total bins
  const binsWithStock = bins.filter(bin => (bin.actual_qty || 0) > 0).length
  const totalBins = bins.length
  
  return totalBins > 0 ? (binsWithStock / totalBins) * 100 : 0
}

function calculateStockAging(stockLedgerEntries: any[]): { items_count: number; aged_30_days: number; aged_90_days: number } {
  const currentDate = new Date()
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  const uniqueItems = new Set(stockLedgerEntries.map(entry => entry.item_code))
  const itemsCount = uniqueItems.size
  
  // Count items with transactions older than 30 and 90 days
  const aged30Days = stockLedgerEntries.filter(entry => {
    const postingDate = new Date(entry.posting_date)
    return postingDate < thirtyDaysAgo
  }).length
  
  const aged90Days = stockLedgerEntries.filter(entry => {
    const postingDate = new Date(entry.posting_date)
    return postingDate < ninetyDaysAgo
  }).length
  
  return {
    items_count: itemsCount,
    aged_30_days: aged30Days,
    aged_90_days: aged90Days
  }
}

function calculateAverageDeliveryTime(salesOrders: any[], deliveryNotes: any[]): number {
  // Calculate average time from Sales Order to Delivery Note (in days)
  let totalDays = 0
  let count = 0
  
  deliveryNotes.forEach(dn => {
    // In ERPNext, DN would link to SO via items table, but for simplicity
    // we'll calculate average time from SO transaction_date to DN posting_date
    const dnDate = new Date(dn.posting_date)
    
    salesOrders.forEach(so => {
      const soDate = new Date(so.transaction_date)
      if (soDate <= dnDate) {
        const diffTime = Math.abs(dnDate.getTime() - soDate.getTime())
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        totalDays += diffDays
        count++
      }
    })
  })
  
  return count > 0 ? totalDays / count : 0
}