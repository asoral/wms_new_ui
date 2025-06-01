
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  RefreshCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Database
} from "lucide-react";

const Sync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const syncStatus = {
    lastSync: "2024-01-15 14:30:00",
    totalRecords: 1247,
    syncedRecords: 1195,
    pendingRecords: 42,
    failedRecords: 10
  };

  const pendingRecords = [
    { id: "SR-001", type: "Stock Receipt", status: "pending", timestamp: "2024-01-15 14:25:00" },
    { id: "DE-002", type: "Delivery", status: "pending", timestamp: "2024-01-15 14:20:00" },
    { id: "SC-003", type: "Stock Count", status: "pending", timestamp: "2024-01-15 14:15:00" },
    { id: "QI-004", type: "Quality Inspection", status: "pending", timestamp: "2024-01-15 14:10:00" }
  ];

  const failedRecords = [
    { id: "SR-005", type: "Stock Receipt", status: "failed", error: "Network timeout", timestamp: "2024-01-15 13:45:00" },
    { id: "DE-006", type: "Delivery", status: "failed", error: "Invalid warehouse", timestamp: "2024-01-15 13:30:00" }
  ];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 3000);
  };

  const handleRetryFailed = (recordId: string) => {
    console.log(`Retrying sync for record: ${recordId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Wifi className="w-6 h-6 text-green-600" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-600" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">{syncStatus.totalRecords}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Synced</p>
                  <p className="text-2xl font-bold text-green-600">{syncStatus.syncedRecords}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{syncStatus.pendingRecords}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{syncStatus.failedRecords}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge className={isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Sync:</span>
                <span className="text-gray-600">{syncStatus.lastSync}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sync Rate:</span>
                <span className="text-gray-600">
                  {Math.round((syncStatus.syncedRecords / syncStatus.totalRecords) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span>Pending Sync</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{record.id}</h4>
                      <Badge variant="outline" className="text-yellow-700">
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{record.type}</p>
                    <p className="text-xs text-gray-500">{record.timestamp}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Failed Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Sync Errors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{record.id}</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRetryFailed(record.id)}
                      >
                        Retry
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{record.type}</p>
                    <p className="text-sm text-red-600 mb-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {record.error}
                    </p>
                    <p className="text-xs text-gray-500">{record.timestamp}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sync;
