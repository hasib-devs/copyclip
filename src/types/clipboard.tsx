import { Dispatch, SetStateAction } from "react";

export type ContentTypes = "text" | "image";
export type ClipType = {
  id: string;
  content_type: ContentTypes;
  content: string;
  is_pinned?: boolean;
  created_at: number;
  updated_at: number;
};

export type ClipCreateType = Omit<
  ClipType,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type ClipboardContextType = {
  clips: ClipType[];
  setClips: React.Dispatch<React.SetStateAction<ClipType[]>>;
  filteredClips: ClipType[];
  addClip: (newEntry: ClipCreateType) => Promise<void>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  filterTerm: ContentTypes | "";
  setFilterTerm: Dispatch<SetStateAction<ContentTypes | "">>;
  copyToClipboard: (clip: ClipType) => Promise<void>;
  clearClips: (opt: ClearOptions) => Promise<void>;
  deleteClip: (id: string) => Promise<void>;
  isLoading: boolean;
  togglePin: (clip: ClipType) => Promise<void>;
};

export enum ClearOptions {
  Pined,
  Unpined,
  All,
}
