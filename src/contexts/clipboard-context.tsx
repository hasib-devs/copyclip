import SplashScreen from "@/components/layouts/SplashScreen";
import { useClipboardApi } from "@/hooks/useClipboardApi";
import { ensureImageDirExists } from "@/lib/imageStorage";
import {
  ClearOptions,
  ClipboardContextType,
  ClipCreateType,
  ClipType,
  ContentTypes,
} from "@/types/clipboard";
import {
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  listenToMonitorStatusUpdate,
  onImageUpdate,
  onTextUpdate,
  startListening,
  writeImageBase64,
  writeText,
} from "tauri-plugin-clipboard-api";

export const ClipboardContext = createContext<ClipboardContextType | undefined>(
  undefined
);

export const ClipboardProvider: FC<{ children: ReactElement }> = ({
  children,
}) => {
  // Clipboard Listener
  const abortRef = useRef<AbortController | null>(null);
  const isListeningRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Clipboard State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState<ContentTypes | "">("");
  const [clips, setClips] = useState<ClipType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastEntryRef = useRef<ClipCreateType | null>(null);
  const ignoreClip = useRef(false);
  const ignoreId = useRef<string | undefined>();

  const {
    findAll,
    createOne,
    deleteOne,
    updatePin,
    deleteAll,
    deletePinned,
    deleteUnpinned,
  } = useClipboardApi();

  const DEBOUNCE_MS = 200;

  // Clear debounce timer
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Add a new clip
  const addClip = useCallback(
    async (newEntry: ClipCreateType) => {
      // Handle ignored clips (when copying to clipboard)
      if (ignoreClip.current) {
        setClips((prev) => {
          return prev.map((entry) => {
            if (entry.id === ignoreId.current) {
              return { ...entry, updated_at: Date.now() };
            }
            return entry;
          });
        });

        // Reset ignore flag after a short delay
        setTimeout(() => {
          ignoreClip.current = false;
          ignoreId.current = undefined;
        }, 10);
        return;
      }

      // Validate content
      const isEmpty = !newEntry.content || newEntry.content.trim?.() === "";
      if (isEmpty) return;

      // Check for duplicate with last entry
      if (
        lastEntryRef.current &&
        lastEntryRef.current.content === newEntry.content &&
        lastEntryRef.current.content_type === newEntry.content_type
      ) {
        return;
      }

      // Check for duplicate with first clip using functional state update
      setClips((prevClips) => {
        const exists = prevClips[0]?.content === newEntry.content;
        if (exists) return prevClips;

        lastEntryRef.current = newEntry;

        const now = Date.now();
        const entry: ClipType = {
          id: crypto.randomUUID(),
          is_pinned: false,
          created_at: now,
          updated_at: now,
          ...newEntry,
        };

        const newClips = [entry, ...prevClips];

        // Debounce save operation
        clearDebounceTimer();
        debounceTimerRef.current = setTimeout(
          () => saveClip(entry),
          DEBOUNCE_MS
        );

        return newClips;
      });
    },
    [clearDebounceTimer]
  );

  // Save to DB
  const saveClip = useCallback(
    async (entry: ClipType) => {
      try {
        const result = await createOne(entry);
        if (!result.success) {
          console.error("Failed to save clip to database:", result.error);
          // Optionally remove from state if save failed
          setClips((prev) => prev.filter((clip) => clip.id !== entry.id));
        }
      } catch (error) {
        console.error("Failed to save clip to database:", error);
        // Optionally remove from state if save failed
        setClips((prev) => prev.filter((clip) => clip.id !== entry.id));
      }
    },
    [createOne]
  );

  // Delete a specific clip
  const deleteClip = useCallback(
    async (id: string) => {
      setClips((prev) => prev.filter((entry) => entry.id !== id));
      try {
        const result = await deleteOne(id);
        if (!result.success) {
          console.error("Failed to delete clip from database:", result.error);
        }
      } catch (error) {
        console.error("Failed to delete clip from database:", error);
      }
    },
    [deleteOne]
  );

  // Clear clipboard history
  const clearClips = useCallback(
    async (opt: ClearOptions) => {
      try {
        switch (opt) {
          case ClearOptions.All:
            setClips(() => []);
            const deleteAllResult = await deleteAll();
            if (!deleteAllResult.success) {
              console.error(
                "Failed to clear all clips:",
                deleteAllResult.error
              );
            }
            break;

          case ClearOptions.Pined:
            setClips((prev) => prev.filter((entry) => !entry.is_pinned));
            const deletePinnedResult = await deletePinned();
            if (!deletePinnedResult.success) {
              console.error(
                "Failed to delete pinned clips:",
                deletePinnedResult.error
              );
            }
            break;

          case ClearOptions.Unpined:
            setClips((prev) => prev.filter((entry) => entry.is_pinned));
            const deleteUnpinnedResult = await deleteUnpinned();
            if (!deleteUnpinnedResult.success) {
              console.error(
                "Failed to delete unpinned clips:",
                deleteUnpinnedResult.error
              );
            }
            break;
        }
      } catch (error) {
        console.error("Failed to clear clips:", error);
      }
    },
    [deleteAll, deletePinned, deleteUnpinned]
  );

  // Copy to clipboard handler
  const copyToClipboard = useCallback(async (clip: ClipType) => {
    ignoreClip.current = true;
    ignoreId.current = clip.id;

    try {
      if (clip.content_type === "text") {
        await writeText(clip.content);
      } else {
        await writeImageBase64(clip.content);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Reset ignore flags on error
      ignoreClip.current = false;
      ignoreId.current = undefined;
    }
  }, []);

  // Toggle pin status
  const togglePin = useCallback(
    async (clip: ClipType) => {
      const newPinnedState = !clip.is_pinned;

      setClips((prev) => {
        const updatedClips = prev.map((c) => {
          if (c.id === clip.id) {
            return { ...c, is_pinned: newPinnedState };
          }
          return c;
        });
        return updatedClips;
      });

      try {
        const result = await updatePin(clip.id, newPinnedState);
        if (!result.success) {
          console.error("Failed to update pin status:", result.error);
          // Revert state change on error
          setClips((prev) => {
            const revertedClips = prev.map((c) => {
              if (c.id === clip.id) {
                return { ...c, is_pinned: clip.is_pinned };
              }
              return c;
            });
            return revertedClips;
          });
        }
      } catch (error) {
        console.error("Failed to update pin status:", error);
        // Revert state change on error
        setClips((prev) => {
          const revertedClips = prev.map((c) => {
            if (c.id === clip.id) {
              return { ...c, is_pinned: clip.is_pinned };
            }
            return c;
          });
          return revertedClips;
        });
      }
    },
    [updatePin]
  );

  // Filter search result
  const filteredClips = useMemo(() => {
    return clips
      .filter((entry) => {
        // Filter by content type and search term
        const matchesType = filterTerm
          ? entry.content_type === filterTerm
          : true;
        const matchesSearch = entry.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [clips, searchTerm, filterTerm]);

  // Stop monitoring clipboard
  const stopMonitoring = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearDebounceTimer();
  }, [clearDebounceTimer]);

  // Start monitoring clipboard
  const startMonitoring = useCallback(async () => {
    if (isListeningRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      const [unMonitor, unText, unImage] = await Promise.all([
        listenToMonitorStatusUpdate((running) => {
          if (signal.aborted) return;
          console.log("Status: ", running);
        }),
        onTextUpdate((newText) => {
          if (signal.aborted) return;
          // Use a stable reference to avoid circular dependency
          const addClipStable = (entry: ClipCreateType) => {
            // Handle ignored clips (when copying to clipboard)
            if (ignoreClip.current) {
              setClips((prev) => {
                return prev.map((entry) => {
                  if (entry.id === ignoreId.current) {
                    return { ...entry, updated_at: Date.now() };
                  }
                  return entry;
                });
              });

              // Reset ignore flag after a short delay
              setTimeout(() => {
                ignoreClip.current = false;
                ignoreId.current = undefined;
              }, 10);
              return;
            }

            // Validate content
            const isEmpty = !entry.content || entry.content.trim?.() === "";
            if (isEmpty) return;

            // Check for duplicate with last entry
            if (
              lastEntryRef.current &&
              lastEntryRef.current.content === entry.content &&
              lastEntryRef.current.content_type === entry.content_type
            ) {
              return;
            }

            // Check for duplicate with first clip using functional state update
            setClips((prevClips) => {
              const exists = prevClips[0]?.content === entry.content;
              if (exists) return prevClips;

              lastEntryRef.current = entry;

              const now = Date.now();
              const newEntry: ClipType = {
                id: crypto.randomUUID(),
                is_pinned: false,
                created_at: now,
                updated_at: now,
                ...entry,
              };

              const newClips = [newEntry, ...prevClips];

              // Debounce save operation
              clearDebounceTimer();
              debounceTimerRef.current = setTimeout(
                () => saveClip(newEntry),
                DEBOUNCE_MS
              );

              return newClips;
            });
          };
          addClipStable({ content_type: "text", content: newText });
        }),
        onImageUpdate(async (base64Img) => {
          if (signal.aborted) return;
          // Use a stable reference to avoid circular dependency
          const addClipStable = (entry: ClipCreateType) => {
            // Handle ignored clips (when copying to clipboard)
            if (ignoreClip.current) {
              setClips((prev) => {
                return prev.map((entry) => {
                  if (entry.id === ignoreId.current) {
                    return { ...entry, updated_at: Date.now() };
                  }
                  return entry;
                });
              });

              // Reset ignore flag after a short delay
              setTimeout(() => {
                ignoreClip.current = false;
                ignoreId.current = undefined;
              }, 10);
              return;
            }

            // Validate content
            const isEmpty = !entry.content || entry.content.trim?.() === "";
            if (isEmpty) return;

            // Check for duplicate with last entry
            if (
              lastEntryRef.current &&
              lastEntryRef.current.content === entry.content &&
              lastEntryRef.current.content_type === entry.content_type
            ) {
              return;
            }

            // Check for duplicate with first clip using functional state update
            setClips((prevClips) => {
              const exists = prevClips[0]?.content === entry.content;
              if (exists) return prevClips;

              lastEntryRef.current = entry;

              const now = Date.now();
              const newEntry: ClipType = {
                id: crypto.randomUUID(),
                is_pinned: false,
                created_at: now,
                updated_at: now,
                ...entry,
              };

              const newClips = [newEntry, ...prevClips];

              // Debounce save operation
              clearDebounceTimer();
              debounceTimerRef.current = setTimeout(
                () => saveClip(newEntry),
                DEBOUNCE_MS
              );

              return newClips;
            });
          };
          addClipStable({ content_type: "image", content: base64Img });
        }),
      ]);

      const unStart = await startListening();

      signal.addEventListener("abort", () => {
        unMonitor();
        unText();
        unImage();
        unStart();
        isListeningRef.current = false;
      });

      isListeningRef.current = true;
    } catch (err) {
      console.error("Clipboard listener error:", err);
      stopMonitoring();
    }
  }, [clearDebounceTimer, saveClip, stopMonitoring]);

  // Initialize
  useEffect(() => {
    const initializeApp = async () => {
      // Load clips from the database
      console.log("Initializing app...");
      setIsLoading(true);
      try {
        const result = await findAll();
        if (result.success && result.data) {
          setClips(result.data);
        } else {
          console.error("Failed to load clips from database:", result.error);
          setClips([]);
        }
      } catch (error) {
        console.error("Failed to load clips from database:", error);
        setClips([]);
      } finally {
        setIsLoading(false);
      }

      // Init fs plugin
      ensureImageDirExists();

      // Start monitoring clipboard
      startMonitoring();
    };

    initializeApp();

    return () => {
      stopMonitoring(); // Cleanup
      clearDebounceTimer(); // Clear any pending debounced operations
    };
  }, []); // Empty dependency array to run only once on mount

  const value: ClipboardContextType = {
    filteredClips,
    addClip,
    searchTerm,
    setSearchTerm,
    filterTerm,
    setFilterTerm,
    copyToClipboard,
    clearClips,
    deleteClip,
    clips,
    setClips,
    isLoading,
    togglePin,
  };

  return (
    <ClipboardContext.Provider value={value}>
      {isLoading ? <SplashScreen /> : children}
    </ClipboardContext.Provider>
  );
};

export const useClipboardContext = () => {
  const ctx = useContext(ClipboardContext);
  if (!ctx)
    throw new Error("useClipboard must be used within a ClipboardProvider");
  return ctx;
};
