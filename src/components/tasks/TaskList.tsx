import { initialTodos, PRIORITIES } from "@/assets/data/tasks";
import { cn } from "@/lib/utils";
import { Priority, TaskType } from "@/types/tasks";
import {
  Button,
  Dialog,
  DropdownMenu,
  Flex,
  Popover,
  ScrollArea,
  TextArea,
} from "@radix-ui/themes";
import {
  CalendarIcon,
  Check,
  Flag,
  ListTodo,
  Plus,
  SquareX,
} from "lucide-react";
import { useState } from "react";
import TaskItem from "./TaskItem";

const TaskList = () => {
  // Initial todos
  const [todos, setTodos] = useState<TaskType[]>(initialTodos);
  const [_, setEditingTodo] = useState<TaskType | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showAddTodo, setShowAddTodo] = useState(false);

  // Filter todos based on completion status
  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  // Sort todos: incomplete first, then by priority, then by due date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // Completed items go to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Sort by priority (high to low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Sort by due date (closest first)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }

    // Items with due dates come before those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Finally, sort by creation date (newest first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Add a new todo
  // const addTodo = () => {
  //     if (newTodoText.trim() === "") return;

  //     const newTodo: TaskType = {
  //         id: Date.now(),
  //         text: newTodoText.trim(),
  //         completed: false,
  //         createdAt: new Date(),
  //         dueDate: null,
  //         priority: "medium",
  //     };

  //     setTodos([...todos, newTodo]);
  //     setNewTodoText("");
  //     setShowAddTodo(false);
  // };

  // Toggle todo completion
  const toggleTodoCompletion = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Edit a todo
  const startEditTodo = (todo: TaskType) => {
    setEditingTodo({ ...todo });
  };

  // Save edited todo
  // const saveEditedTodo = () => {
  //     if (editingTodo) {
  //         setTodos(todos.map((todo) => (todo.id === editingTodo.id ? editingTodo : todo)));
  //         setEditingTodo(null);
  //     }
  // };

  return (
    <div>
      <div className="p-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-800">Quick Tasks</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">Manage your daily tasks</p>
      </div>

      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-200">
          <div className="flex gap-2">
            <Button
              style={{ cursor: "pointer" }}
              onClick={() => setFilter("all")}
              size={"1"}
              color="gray"
              radius="large"
              variant={filter === "all" ? "solid" : "surface"}
              highContrast
            >
              All
            </Button>
            <Button
              style={{ cursor: "pointer" }}
              onClick={() => setFilter("active")}
              size={"1"}
              color="gray"
              radius="large"
              variant={filter === "active" ? "solid" : "surface"}
              highContrast
            >
              Active
            </Button>
            <Button
              style={{ cursor: "pointer" }}
              onClick={() => setFilter("completed")}
              size={"1"}
              color="gray"
              radius="large"
              variant={filter === "completed" ? "solid" : "surface"}
              highContrast
            >
              Completed
            </Button>
          </div>
          <Button
            style={{ cursor: "pointer" }}
            size={"1"}
            radius="large"
            variant="surface"
            highContrast
            onClick={() => setShowAddTodo(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New
          </Button>
        </div>

        {/* TaskType list */}
        <ScrollArea style={{ height: 430 }}>
          <div className="p-3">
            {sortedTodos.length > 0 ? (
              sortedTodos.map((todo) => (
                <TaskItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodoCompletion}
                  onDelete={deleteTodo}
                  onEdit={startEditTodo}
                />
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <Check className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No tasks found</p>
                <Button
                  onClick={() => setShowAddTodo(true)}
                  className="mt-2 text-emerald-600"
                >
                  Add your first task
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Add TaskType Dialog */}
        <Dialog.Root open={showAddTodo} onOpenChange={setShowAddTodo}>
          <Dialog.Content maxWidth="450px">
            <Flex mb={"1"} align={"baseline"} justify={"between"}>
              <Dialog.Title>Add new task</Dialog.Title>

              <SquareX
                cursor={"pointer"}
                onClick={() => setShowAddTodo(false)}
                color="gray"
              />
            </Flex>
            <Dialog.Description size="2" mb="4">
              Create a new task to keep track of your to-dos
            </Dialog.Description>

            <TextArea placeholder="What needs to be done?" mb={"3"} />

            <Flex align={"center"} justify={"between"} gap={"2"}>
              <TodoDatePicker
                date={null}
                onSelect={() => {}}
                label="Due date (optional)"
              />
              <TodoPrioritySelect priority="medium" onSelect={() => {}} />
            </Flex>

            <Flex gap="3" mt="5" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button>Save</Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
};

// Date picker component for todos
function TodoDatePicker({}: {
  date: Date | null | undefined;
  onSelect: (date: Date | null) => void;
  label?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button
          color="gray"
          variant="outline"
          className="justify-start text-left font-normal h-9"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Today
        </Button>
      </Popover.Trigger>
      <Popover.Content width="360px">
        <p>Calendar Here</p>
      </Popover.Content>
    </Popover.Root>
  );
}

// Priority selector component
function TodoPrioritySelect({
  priority,
  onSelect,
}: {
  priority: Priority;
  onSelect: (priority: Priority) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button color="gray" variant="outline" className="h-9">
          <div
            className={cn(
              "w-2 h-2 rounded-full mr-2",
              PRIORITIES[priority].color
            )}
          />
          {PRIORITIES[priority].label} Priority
          <Flag className="ml-2 h-3.5 w-3.5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
          <DropdownMenu.Item
            key={key}
            onClick={() => onSelect(key as Priority)}
            className="flex items-center"
          >
            <div className={cn("w-2 h-2 rounded-full mr-2", color)} />
            {label}
            {key === priority && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export default TaskList;
