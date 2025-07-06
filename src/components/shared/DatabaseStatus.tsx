import { useDatabaseHealth } from "@/hooks/useDatabaseHealth";
import { useDatabase } from "@/contexts/database-context";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

export const DatabaseStatus = () => {
  const {
    healthStatus,
    performHealthCheck,
    retryConnection,
    getConnectionSummary,
    isConnected,
    isHealthy,
    status,
    error,
  } = useDatabaseHealth();

  const { resetDatabase } = useDatabase();

  const getStatusIcon = () => {
    switch (status) {
      case "ready":
        return isHealthy ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        );
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "initializing":
      case "retrying":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (status === "ready" && isHealthy) return "text-green-600";
    if (status === "ready" && !isHealthy) return "text-yellow-600";
    if (status === "error") return "text-red-600";
    return "text-blue-600";
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
        <button
          onClick={performHealthCheck}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Check database health"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getConnectionSummary()}
            </span>
          </div>
        </div>

        {/* Connection Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Connection:</span>
          <span
            className={`text-sm ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Health Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Health:</span>
          <span
            className={`text-sm ${
              isHealthy ? "text-green-600" : "text-red-600"
            }`}
          >
            {isHealthy ? "Healthy" : "Unhealthy"}
          </span>
        </div>

        {/* Last Check Row */}
        {healthStatus.lastCheck && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Last Check:
            </span>
            <span className="text-sm text-gray-500">
              {healthStatus.lastCheck.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Error Count Row */}
        {healthStatus.errorCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Error Count:
            </span>
            <span className="text-sm text-red-600">
              {healthStatus.errorCount}
            </span>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-red-800">
                Error Details
              </summary>
              <div className="mt-2 text-xs font-mono text-red-700">
                {error.message}
              </div>
            </details>
          </div>
        )}

        {/* Retry Button */}
        {status === "error" && (
          <div className="mt-4 space-y-2">
            <button
              onClick={retryConnection}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Retry Connection
            </button>
            <button
              onClick={resetDatabase}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Database
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
