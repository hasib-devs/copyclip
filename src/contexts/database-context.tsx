import SplashScreen from "@/components/layouts/SplashScreen";
import Database from "@tauri-apps/plugin-sql";
import {
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type DatabaseStatus = "initializing" | "ready" | "error" | "retrying";

type DatabaseError = {
  message: string;
  code?: string;
  timestamp: number;
};

type DatabaseContextType = {
  db?: Database;
  isDbReady: boolean;
  status: DatabaseStatus;
  error: DatabaseError | null;
  retryConnection: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  isHealthy: boolean;
};

export const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined
);

const DB_DATABASE = "sqlite:copyclip.db";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export const DatabaseProvider: FC<{ children: ReactElement }> = ({
  children,
}) => {
  const [db, setDb] = useState<Database | undefined>(undefined);
  const [status, setStatus] = useState<DatabaseStatus>("initializing");
  const [error, setError] = useState<DatabaseError | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);

  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const healthCheckIntervalRef = useRef<number | null>(null);

  // Clear retry timeout
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Clear health check interval
  const clearHealthCheckInterval = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  // Initialize database connection
  const initDatabase = useCallback(
    async (dbPath: string): Promise<void> => {
      if (db) {
        return Promise.resolve();
      }

      try {
        const database = await Database.load(dbPath);
        setDb(database);
        setStatus("ready");
        setError(null);
        setIsHealthy(true);
        retryCountRef.current = 0;
        clearRetryTimeout();
      } catch (error) {
        console.error("Failed to load database:", error);

        const dbError: DatabaseError = {
          message:
            error instanceof Error ? error.message : "Unknown database error",
          code: error instanceof Error ? (error as any).code : undefined,
          timestamp: Date.now(),
        };

        setError(dbError);
        setStatus("error");
        setIsHealthy(false);

        // Retry logic
        if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          retryCountRef.current++;
          console.log(
            `Retrying database connection (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
          );

          clearRetryTimeout();
          retryTimeoutRef.current = setTimeout(() => {
            initDatabase(dbPath);
          }, RETRY_DELAY_MS * retryCountRef.current);
        } else {
          console.error("Max retry attempts reached for database connection");
        }
      }
    },
    [db, status, isHealthy, error, retryCountRef, clearRetryTimeout]
  );

  // Manual retry function
  const retryConnection = useCallback(async (): Promise<void> => {
    retryCountRef.current = 0;
    clearRetryTimeout();
    await initDatabase(DB_DATABASE);
  }, [initDatabase, clearRetryTimeout]);

  // Reset database connection completely
  const resetDatabase = useCallback(async (): Promise<void> => {
    console.log("Resetting database connection...");

    // Clear all timers
    clearRetryTimeout();
    clearHealthCheckInterval();

    // Close existing connection
    if (db) {
      try {
        await db.close();
        setDb(undefined);
        setStatus("initializing");
        setError(null);
        setIsHealthy(false);
        retryCountRef.current = 0;
      } catch (error) {
        console.warn("Error closing database during reset:", error);
      }
    }

    // Reset state
    setDb(undefined);
    setStatus("initializing");
    setError(null);
    setIsHealthy(false);
    retryCountRef.current = 0;

    // Reinitialize
    await initDatabase(DB_DATABASE);
  }, [db, initDatabase, clearRetryTimeout, clearHealthCheckInterval]);

  // Initialize database on mount
  useEffect(() => {
    initDatabase(DB_DATABASE);
    // return () => {
    //   resetDatabase();
    // };
  }, []);

  // Computed isDbReady value
  const isDbReady = status === "ready" && isHealthy;

  const value: DatabaseContextType = {
    db,
    isDbReady,
    status,
    error,
    retryConnection,
    resetDatabase,
    isHealthy,
  };

  // Show error state if database failed to initialize after max retries
  if (status === "error" && retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
    return (
      <DatabaseContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Database Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to connect to the database. Please check your system and
              try again.
            </p>
            {error && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  {error.message}
                </div>
              </details>
            )}
            <button
              onClick={retryConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </DatabaseContext.Provider>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {isDbReady ? children : <SplashScreen />}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx)
    throw new Error("useDatabase must be used within a DatabaseProvider");
  return ctx;
};
