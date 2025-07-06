import { useDatabase } from "@/contexts/database-context";
import { useCallback, useEffect, useState } from "react";

type DatabaseHealthStatus = {
  isConnected: boolean;
  isHealthy: boolean;
  lastCheck: Date | null;
  errorCount: number;
  status: "checking" | "healthy" | "unhealthy" | "error";
};

export const useDatabaseHealth = () => {
  const { db, isHealthy, status, error, retryConnection, resetDatabase } =
    useDatabase();
  const [healthStatus, setHealthStatus] = useState<DatabaseHealthStatus>({
    isConnected: false,
    isHealthy: false,
    lastCheck: null,
    errorCount: 0,
    status: "checking",
  });

  // Update health status when database state changes
  useEffect(() => {
    setHealthStatus((prev) => ({
      ...prev,
      isConnected: !!db,
      isHealthy,
      lastCheck: new Date(),
      status: isHealthy
        ? "healthy"
        : status === "error"
        ? "error"
        : "unhealthy",
    }));
  }, [db, isHealthy, status]);

  // Manual health check
  const performHealthCheck = useCallback(async () => {
    if (!db) {
      setHealthStatus((prev) => ({
        ...prev,
        status: "error",
        lastCheck: new Date(),
      }));
      return false;
    }

    try {
      setHealthStatus((prev) => ({ ...prev, status: "checking" }));
      await db.select("SELECT 1 as health_check");

      setHealthStatus((prev) => ({
        ...prev,
        status: "healthy",
        isHealthy: true,
        errorCount: 0,
        lastCheck: new Date(),
      }));
      return true;
    } catch (error) {
      console.warn("Database health check failed:", error);
      setHealthStatus((prev) => ({
        ...prev,
        status: "unhealthy",
        isHealthy: false,
        errorCount: prev.errorCount + 1,
        lastCheck: new Date(),
      }));
      return false;
    }
  }, [db]);

  // Get connection status summary
  const getConnectionSummary = useCallback(() => {
    if (status === "initializing") return "Initializing database...";
    if (status === "retrying") return "Retrying connection...";
    if (status === "error") return "Database connection failed";
    if (status === "ready" && isHealthy)
      return "Database connected and healthy";
    if (status === "ready" && !isHealthy)
      return "Database connected but unhealthy";
    return "Unknown status";
  }, [status, isHealthy]);

  return {
    healthStatus,
    performHealthCheck,
    retryConnection,
    resetDatabase,
    getConnectionSummary,
    isConnected: !!db,
    isHealthy,
    status,
    error,
  };
};
