import appIcon from "@/assets/images/app-icon.png";
import { ScrollArea, TextField } from "@radix-ui/themes";
import ClipboardItem from "./ClipboardItem";

import { useClipboardContext } from "@/contexts/clipboard-context";
import { Clipboard, Search } from "lucide-react";
import { ToggleGroup } from "radix-ui";
import FilterAction from "./FilterAction";
import MenuAction from "./MenuAction";

const ClipboardList = () => {
  const { filteredClips, searchTerm, setSearchTerm, copyToClipboard } =
    useClipboardContext();
  return (
    <>
      <div className="px-4 pb-4 pt-3 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <div>
            <img src={appIcon} alt="Copyclip" className="w-10" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-800">
            Clipboard History
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <TextField.Root
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <TextField.Slot>
                <Search className="text-zinc-400" height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </div>

          <FilterAction />
          <MenuAction />
        </div>
      </div>

      <ScrollArea
        scrollbars="vertical"
        style={{ height: 430 }}
        aria-checked={false}
      >
        <div className="p-3">
          {filteredClips.length > 0 ? (
            <ToggleGroup.Root
              type="single"
              orientation="vertical"
              loop={false}
              aria-checked={true}
              onValueChange={(index: string) => {
                const clip = filteredClips[Number(index)];
                if (!clip) return;

                copyToClipboard(clip);
              }}
            >
              {filteredClips.map((clip, index) => (
                <ClipboardItem clip={clip} key={clip.id} index={index} />
              ))}
            </ToggleGroup.Root>
          ) : (
            <div className="text-center bg-white rounded-md flex justify-center items-center gap-2 flex-col py-8 text-zinc-400">
              <Clipboard />
              <p>No clipboard items found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};

export default ClipboardList;
