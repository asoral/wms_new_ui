
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { StockCountSession } from "@/types";

const StockCount = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StockCountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStockCountSessions();
  }, []);

  const loadStockCountSessions = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const response = await erpnextAPI.getStockReconciliations();
      console.log('Stock count sessions response:', response);

      if (response?.data) {
        // Transform the data to match our StockCountSession interface
        const transformedSessions: StockCountSession[] = response.data.map((session: any) => ({
          id: session.name,
          name: session.name,
          warehouse: session.warehouse || 'Unknown',
          purpose: session.purpose || 'Stock Reconciliation',
          status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
          startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
          completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
          totalItems: session.items?.length || 0,
          matchedItems: 0,
          varianceItems: session.items?.length || 0,
          entries: session.items || []
        }));

        setSessions(transformedSessions);
      } else {
        setSessions([]);
      }

    } catch (error) {
      console.error('Failed to load stock count sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load stock count sessions from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'dd MMM yyyy, HH:mm');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stock Count Management</h1>
        <p className="text-gray-500">Manage stock reconciliation and counting sessions</p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'Submitted').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 mb-1">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{sessions.filter(s => s.status === 'Draft').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{sessions.filter(s => s.status === 'Cancelled').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start New Session Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/stock-count/new')} size="lg" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Start New Stock Count Session
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Stock Count Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500 mb-2" />
              <p className="text-gray-500">Loading stock count sessions...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Session ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead className="text-right">Total Items</TableHead>
                    <TableHead className="text-right">Matched Items</TableHead>
                    <TableHead className="text-right">Variance Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.id}</TableCell>
                      <TableCell>{session.warehouse}</TableCell>
                      <TableCell>{session.purpose}</TableCell>
                      <TableCell>
                        {session.status === 'Open' ? (
                          <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500 inline" />
                        ) : session.status === 'Completed' ? (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Completed
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                            {session.status}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(session.startedAt)}</TableCell>
                      <TableCell className="text-right">{session.totalItems}</TableCell>
                      <TableCell className="text-right">{session.matchedItems}</TableCell>
                      <TableCell className="text-right">{session.varianceItems}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No active stock count sessions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCount;
