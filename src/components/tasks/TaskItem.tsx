import { PRIORITIES } from "@/assets/data/tasks";
import { cn } from "@/lib/utils";
import { TaskType } from "@/types/tasks";
import { Button, Checkbox, DropdownMenu } from "@radix-ui/themes";
import { CalendarIcon, Edit2, MoreHorizontal, Trash2 } from "lucide-react";

function TaskItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: TaskType;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: TaskType) => void;
}) {
  const isOverdue =
    todo.dueDate && !todo.completed && todo.dueDate < new Date();

  return (
    <div
      className={cn(
        "group p-3 mb-2 rounded-lg border transition-all",
        todo.completed
          ? "bg-zinc-50 border-zinc-200"
          : isOverdue
          ? "bg-red-50 border-red-200"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className={cn("mt-0.5", todo.completed && "opacity-50")}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium text-zinc-800 break-all",
                todo.completed && "line-through text-zinc-500"
              )}
            >
              {todo.text}
            </p>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button
                  variant="ghost"
                  size="1"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" className="w-[160px]">
                <DropdownMenu.Item onClick={() => onEdit(todo)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onClick={() => onDelete(todo.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button
                  variant="ghost"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator />

                {/* Delete */}
                <DropdownMenu.Item color="red">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {todo.dueDate && (
              <div
                className={cn(
                  "flex items-center text-xs",
                  isOverdue ? "text-red-600" : "text-zinc-500"
                )}
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                Due date
              </div>
            )}
            <div className="flex items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mr-1",
                  PRIORITIES[todo.priority].color
                )}
              />
              <span className="text-xs text-zinc-500">
                {PRIORITIES[todo.priority].label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;
