import { useClipboardApi } from "./useClipboardApi";
import { useCallback } from "react";
import type { ClipType } from "@/types/clipboard";

export const useClipboardOperations = () => {
  const api = useClipboardApi();

  // Simplified wrapper functions that handle the result structure
  const createClip = useCallback(
    async (clip: ClipType): Promise<boolean> => {
      const result = await api.createOne(clip);
      if (!result.success) {
        console.error("Failed to create clip:", result.error);
      }
      return result.success;
    },
    [api]
  );

  const loadClips = useCallback(
    async (limit?: number): Promise<ClipType[]> => {
      const result = await api.findAll(limit);
      if (!result.success) {
        console.error("Failed to load clips:", result.error);
        return [];
      }
      return result.data || [];
    },
    [api]
  );

  const updateClip = useCallback(
    async (clip: ClipType): Promise<boolean> => {
      const result = await api.updateOne(clip);
      if (!result.success) {
        console.error("Failed to update clip:", result.error);
      }
      return result.success;
    },
    [api]
  );

  const togglePinStatus = useCallback(
    async (id: string, isPinned: boolean): Promise<boolean> => {
      const result = await api.updatePin(id, isPinned);
      if (!result.success) {
        console.error("Failed to update pin status:", result.error);
      }
      return result.success;
    },
    [api]
  );

  const deleteClip = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await api.deleteOne(id);
      if (!result.success) {
        console.error("Failed to delete clip:", result.error);
      }
      return result.success;
    },
    [api]
  );

  const clearAllClips = useCallback(async (): Promise<boolean> => {
    const result = await api.deleteAll();
    if (!result.success) {
      console.error("Failed to clear all clips:", result.error);
    }
    return result.success;
  }, [api]);

  const clearPinnedClips = useCallback(async (): Promise<boolean> => {
    const result = await api.deletePinned();
    if (!result.success) {
      console.error("Failed to clear pinned clips:", result.error);
    }
    return result.success;
  }, [api]);

  const clearUnpinnedClips = useCallback(async (): Promise<boolean> => {
    const result = await api.deleteUnpinned();
    if (!result.success) {
      console.error("Failed to clear unpinned clips:", result.error);
    }
    return result.success;
  }, [api]);

  // Get detailed operation results for advanced use cases
  const getDetailedResults = useCallback(async () => {
    const status = api.getDatabaseStatus();
    return {
      status,
      retryCounts: status.retryCounts,
      clearRetryCounts: api.clearRetryCounts,
    };
  }, [api]);

  return {
    // Simple boolean result functions
    createClip,
    loadClips,
    updateClip,
    togglePinStatus,
    deleteClip,
    clearAllClips,
    clearPinnedClips,
    clearUnpinnedClips,

    // Advanced functions
    getDetailedResults,

    // Raw API access for advanced use cases
    api,
  };
};
