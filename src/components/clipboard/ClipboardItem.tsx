import placeholderImage from "@/assets/images/placeholder-image.svg";
import { useClipboardContext } from "@/contexts/clipboard-context";
import { cn, timeAgo } from "@/lib/utils";
import { ClipType } from "@/types/clipboard";
import { Avatar, Badge, DropdownMenu } from "@radix-ui/themes";
import { Copy, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import { ToggleGroup } from "radix-ui";

type Props = {
  clip: ClipType;
  index: number;
};
const ClipboardItem = ({ clip, index }: Props) => {
  const { togglePin, copyToClipboard, deleteClip } = useClipboardContext();
  const isPined = Boolean(clip.is_pinned);

  const renderContent = () => {
    switch (clip.content_type) {
      case "text":
        const lines = clip.content.split("\n");
        // Filter out empty lines, and get leading whitespace counts
        const leadingSpaces = lines
          .filter((line) => line.trim() !== "")
          .map((line) => line.match(/^(\s*)/)?.[0]?.length)
          .filter((indent): indent is number => indent !== undefined);

        const minIndent = Math.min(...leadingSpaces);

        const normalized = lines
          .map((line) => line.slice(minIndent))
          .join("\n");
        return (
          <div className="text-sm font-medium w-[374px] bg-white px-1 py-2 max-h-[300px] overflow-auto text-zinc-800 break-all flex-1 scrollbar">
            <pre>{normalized}</pre>
          </div>
        );
      case "image":
        return (
          <div className="relative w-full px-1 bg-white overflow-hidden flex items-center justify-center">
            <Avatar
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                objectFit: "contain",
              }}
              src={`data:image/png;base64,${clip.content}`}
              radius="none"
              fallback={
                <img
                  src={placeholderImage}
                  alt="Clipboard image"
                  className="w-full h-full object-cover"
                />
              }
            />
          </div>
        );

      default:
        return <div className="text-sm text-zinc-800">{clip.content}</div>;
    }
  };

  return (
    <ToggleGroup.Item
      className="w-full cursor-pointer hover:border-blue-400 text-left border data-[state=on]:bg-violet6 focus:outline-0 focus-within:outline-0 focus:border-blue-400 focus-within:border-blue-400 border-gray-200 rounded mb-3"
      value={index.toString()}
    >
      <div className="text-sm font-medium text-zinc-800 break-all flex-1">
        {/* Header */}
        <div className="flex   items-center gap-2 px-2 py-1">
          <Badge
            className="cursor-default mr-auto"
            variant="outline"
            style={{
              padding: "0px 6px",
              fontSize: "10px",
              color: "#09090b",
              borderColor: "#e5e7eb",
              fontWeight: "600",
            }}
            radius="full"
            color="gray"
            size="1"
          >
            {clip.content_type}
          </Badge>

          {isPined && (
            <Pin
              onClick={() => togglePin(clip)}
              className={cn("h-3 w-3 text-zinc-600 fill-zinc-600 mr-1")}
            />
          )}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content sideOffset={-20}>
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(clip);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(clip);
                }}
              >
                <Pin className="mr-2 h-4 w-4" />
                <span>{isPined ? "Unpin" : "Pin"}</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClip(clip.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {renderContent()}

        {/* Footer/Timestamp */}
        <div className="text-xs text-zinc-500 px-2 py-1">
          <p className="text-xs text-right text-zinc-500">
            {timeAgo(clip.updated_at)}
          </p>
        </div>
      </div>
    </ToggleGroup.Item>
  );
};

export default ClipboardItem;
