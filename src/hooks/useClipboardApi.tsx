import { useDatabase } from "@/contexts/database-context";
import type { ClipType } from "@/types/clipboard";
import { useCallback, useRef } from "react";

type DatabaseOperationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
};

type RetryConfig = {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
};

export const useClipboardApi = () => {
  const { db, isHealthy, status } = useDatabase();
  const retryCountRef = useRef<Record<string, number>>({});

  const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  // Helper function to cast boolean values consistently
  const castBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value === "true" || value === "1";
    if (typeof value === "number") return value !== 0;
    return Boolean(value);
  };

  // Helper function to process clip data and ensure proper types
  const processClipData = (clip: any): ClipType => {
    return {
      ...clip,
      is_pinned: castBoolean(clip.is_pinned),
      created_at: Number(clip.created_at),
      updated_at: Number(clip.updated_at),
    };
  };

  // Helper function to check database availability
  const checkDatabaseAvailability = useCallback(() => {
    if (!db) {
      throw new Error("Database connection not available");
    }
    if (!isHealthy) {
      throw new Error("Database is unhealthy");
    }
    if (status === "error") {
      throw new Error("Database is in error state");
    }
  }, [db, isHealthy, status]);

  // Helper function to handle database operations with retry logic
  const executeWithRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      operationName: string,
      retryConfig: Partial<RetryConfig> = {}
    ): Promise<DatabaseOperationResult<T>> => {
      const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
      const currentRetryCount = retryCountRef.current[operationName] || 0;

      try {
        checkDatabaseAvailability();
        const result = await operation();
        retryCountRef.current[operationName] = 0; // Reset retry count on success
        return { success: true, data: result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to ${operationName}:`, error);

        // Handle specific database errors
        if (error instanceof Error && error.message.includes("closed pool")) {
          console.warn(
            `Database connection pool is closed for ${operationName}`
          );
          return {
            success: false,
            error: "Database connection pool is closed",
            retryCount: currentRetryCount,
          };
        }

        // Retry logic
        if (currentRetryCount < config.maxRetries) {
          retryCountRef.current[operationName] = currentRetryCount + 1;
          const delay =
            config.retryDelay *
            Math.pow(config.backoffMultiplier, currentRetryCount);

          console.log(
            `Retrying ${operationName} in ${delay}ms (attempt ${
              currentRetryCount + 1
            }/${config.maxRetries})`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeWithRetry(operation, operationName, config);
        }

        return {
          success: false,
          error: errorMessage,
          retryCount: currentRetryCount,
        };
      }
    },
    [checkDatabaseAvailability]
  );

  // Validate clip data
  const validateClip = useCallback((clip: ClipType) => {
    if (!clip.id || clip.id.trim() === "") {
      throw new Error("Clip ID is required");
    }
    if (!clip.content_type || !["text", "image"].includes(clip.content_type)) {
      throw new Error("Invalid content type");
    }
    if (!clip.content || clip.content.trim() === "") {
      throw new Error("Clip content is required");
    }
    if (typeof clip.created_at !== "number" || clip.created_at <= 0) {
      throw new Error("Invalid created_at timestamp");
    }
    if (typeof clip.updated_at !== "number" || clip.updated_at <= 0) {
      throw new Error("Invalid updated_at timestamp");
    }
  }, []);

  const createOne = useCallback(
    async (clip: ClipType): Promise<DatabaseOperationResult<void>> => {
      try {
        validateClip(clip);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Validation failed",
        };
      }

      return executeWithRetry(async () => {
        await db!.execute(
          "INSERT INTO clips (id, content_type, content, is_pinned, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            clip.id,
            clip.content_type,
            clip.content,
            castBoolean(clip.is_pinned) ? 1 : 0, // Store as integer for SQLite
            clip.created_at,
            clip.updated_at,
          ]
        );
      }, "create clip");
    },
    [validateClip, executeWithRetry, db, castBoolean]
  );

  const findAll = useCallback(
    async (
      limit: number = 20
    ): Promise<DatabaseOperationResult<ClipType[]>> => {
      return executeWithRetry(async () => {
        const result = await db!.select<ClipType[]>(
          "SELECT * FROM clips ORDER BY created_at DESC LIMIT $1",
          [limit]
        );

        // Process and cast all clip data to ensure proper types
        const processedResult = (result || []).map(processClipData);

        return processedResult;
      }, "fetch clips");
    },
    [executeWithRetry, db, processClipData]
  );

  const updateOne = useCallback(
    async (clip: ClipType): Promise<DatabaseOperationResult<void>> => {
      try {
        validateClip(clip);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Validation failed",
        };
      }

      return executeWithRetry(async () => {
        await db!.execute("UPDATE clips SET updated_at = $1 WHERE id = $2", [
          clip.updated_at,
          clip.id,
        ]);
      }, "update clip");
    },
    [validateClip, executeWithRetry, db, castBoolean]
  );

  const updatePin = useCallback(
    async (
      id: string,
      isPinned: boolean
    ): Promise<DatabaseOperationResult<void>> => {
      if (!id || id.trim() === "") {
        return { success: false, error: "Clip ID is required" };
      }

      return executeWithRetry(async () => {
        await db!.execute("UPDATE clips SET is_pinned = $1 WHERE id = $2", [
          castBoolean(isPinned) ? 1 : 0, // Store as integer for SQLite
          id,
        ]);
      }, "update pin status");
    },
    [executeWithRetry, db, castBoolean]
  );

  const deleteOne = useCallback(
    async (id: string): Promise<DatabaseOperationResult<void>> => {
      if (!id || id.trim() === "") {
        return { success: false, error: "Clip ID is required" };
      }

      return executeWithRetry(async () => {
        await db!.execute("DELETE FROM clips WHERE id = $1", [id]);
      }, "delete clip");
    },
    [executeWithRetry, db]
  );

  const deleteAll = useCallback(async (): Promise<
    DatabaseOperationResult<void>
  > => {
    return executeWithRetry(async () => {
      await db!.execute("DELETE FROM clips");
    }, "delete all clips");
  }, [executeWithRetry, db]);

  const deletePinned = useCallback(async (): Promise<
    DatabaseOperationResult<void>
  > => {
    return executeWithRetry(async () => {
      await db!.execute("DELETE FROM clips WHERE is_pinned = 1");
    }, "delete pinned clips");
  }, [executeWithRetry, db]);

  const deleteUnpinned = useCallback(async (): Promise<
    DatabaseOperationResult<void>
  > => {
    return executeWithRetry(async () => {
      await db!.execute(
        "DELETE FROM clips WHERE is_pinned = 0 OR is_pinned IS NULL"
      );
    }, "delete unpinned clips");
  }, [executeWithRetry, db]);

  // Get database status for debugging
  const getDatabaseStatus = useCallback(
    () => ({
      isConnected: !!db,
      isHealthy,
      status,
      retryCounts: { ...retryCountRef.current },
    }),
    [db, isHealthy, status]
  );

  // Clear retry counts (useful for debugging)
  const clearRetryCounts = useCallback(() => {
    retryCountRef.current = {};
  }, []);

  return {
    createOne,
    findAll,
    updateOne,
    updatePin,
    deleteOne,
    deleteAll,
    deletePinned,
    deleteUnpinned,
    getDatabaseStatus,
    clearRetryCounts,
  };
};
