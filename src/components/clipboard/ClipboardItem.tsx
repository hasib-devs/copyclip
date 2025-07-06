import placeholderImage from "@/assets/images/placeholder-image.svg";
import { useClipboardContext } from "@/contexts/clipboard-context";
import { timeAgo } from "@/lib/utils";
import { ClipType } from "@/types/clipboard";
import { Avatar, Badge, ContextMenu } from "@radix-ui/themes";
import { Copy, Pin, Trash2 } from "lucide-react";
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
        return (
          <div className="text-sm font-medium text-zinc-800 break-all line-clamp-5 flex-1 pr-2">
            {clip.content}
          </div>
        );
      case "image":
        return (
          <div className="relative w-full h-[120px] bg-zinc-100 rounded-md overflow-hidden mb-2">
            <Avatar
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              src={`data:image/png;base64,${clip.content}`}
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
      className="w-full cursor-pointer hover:border-blue-400 text-left border data-[state=on]:bg-violet6 focus:outline-0 focus-within:outline-0 focus:border-blue-400 focus-within:border-blue-400 border-gray-200 mb-2 rounded"
      autoFocus={index === 0}
      aria-checked={index === 0}
      value={index.toString()}
    >
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <div className="mb-1 flex p-3 flex-1">
            <div className="text-sm font-medium text-zinc-800 break-all line-clamp-2 flex-1 pr-2">
              {renderContent()}

              {/* Timestamp */}
              <div className="text-xs text-zinc-500">
                {timeAgo(clip.updated_at)}
              </div>
            </div>

            <div className="flex items-center flex-col gap-2">
              <Badge
                className="cursor-default"
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
                  className="h-3.5 w-3.5 text-zinc-600 fill-zinc-600 mr-1"
                />
              )}
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onClick={() => copyToClipboard(clip)}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </ContextMenu.Item>
          <ContextMenu.Item onClick={() => togglePin(clip)}>
            <Pin className="mr-2 h-4 w-4" />
            <span>{isPined ? "Unpin" : "Pin"}</span>
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item color="red" onClick={() => deleteClip(clip.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </ToggleGroup.Item>
  );
};

export default ClipboardItem;
