import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import {
    CheckSquare,
    Plus,
    GripVertical,
    Calendar,
    Flag,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high" | "urgent";
    assignee?: { name: string; email: string; avatar?: string };
    dueDate?: string;
    labels: string[];
    order: number;
}

interface KanbanData {
    todo: Task[];
    "in-progress": Task[];
    review: Task[];
    done: Task[];
}

const columns = [
    { id: "todo", title: "To Do", color: "from-gray-500 to-gray-600" },
    { id: "in-progress", title: "In Progress", color: "from-blue-500 to-cyan-500" },
    { id: "review", title: "Review", color: "from-amber-500 to-orange-500" },
    { id: "done", title: "Done", color: "from-emerald-500 to-green-500" },
] as const;

const priorityColors: Record<string, string> = {
    low: "bg-gray-500/20 text-gray-400",
    medium: "bg-blue-500/20 text-blue-400",
    high: "bg-orange-500/20 text-orange-400",
    urgent: "bg-red-500/20 text-red-400",
};

const priorityDots: Record<string, string> = {
    low: "bg-gray-400",
    medium: "bg-blue-400",
    high: "bg-orange-400",
    urgent: "bg-red-400",
};

export function TasksPage() {
    const [tasks, setTasks] = useState<KanbanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium" as Task["priority"],
    });
    const [draggedTask, setDraggedTask] = useState<{ task: Task; column: string } | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await client.tasks.kanban();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.title) return;

        try {
            await client.tasks.create({
                title: newTask.title,
                description: newTask.description || undefined,
                priority: newTask.priority,
                status: "todo",
            });
            setShowCreateDialog(false);
            setNewTask({ title: "", description: "", priority: "medium" });
            fetchTasks();
        } catch (error) {
            console.error("Failed to create task:", error);
        }
    };

    const handleDragStart = (task: Task, column: string) => {
        setDraggedTask({ task, column });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetColumn: string) => {
        if (!draggedTask || draggedTask.column === targetColumn) {
            setDraggedTask(null);
            return;
        }

        try {
            await client.tasks.updateStatus({
                id: draggedTask.task.id,
                status: targetColumn as "todo" | "in-progress" | "review" | "done",
                order: 0,
            });
            fetchTasks();
        } catch (error) {
            console.error("Failed to update task:", error);
        }
        setDraggedTask(null);
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await client.tasks.delete({ id });
            fetchTasks();
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CheckSquare className="w-7 h-7 text-violet-400" />
                        Tasks
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your tasks with Kanban board</p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((column) => {
                    const columnTasks = tasks?.[column.id] ?? [];
                    return (
                        <div
                            key={column.id}
                            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(column.id)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${column.color}`} />
                                    <h3 className="font-semibold text-white">{column.title}</h3>
                                    <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5">
                                        {columnTasks.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[200px]">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    columnTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={() => handleDragStart(task, column.id)}
                                            className={cn(
                                                "group p-3 rounded-xl bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-white/10 hover:border-white/20",
                                                draggedTask?.task.id === task.id && "opacity-50"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <GripVertical className="w-4 h-4 text-gray-500 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium truncate">{task.title}</p>
                                                        {task.description && (
                                                            <p className="text-gray-500 text-sm truncate mt-1">{task.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", priorityColors[task.priority])}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", priorityDots[task.priority])} />
                                                    {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            {task.assignee && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">
                                                            {task.assignee.name[0]}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 truncate">{task.assignee.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-violet-400" />
                            Create New Task
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Task Title</label>
                            <Input
                                value={newTask.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Enter task title"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Description</label>
                            <Input
                                value={newTask.description}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({ ...newTask, description: e.target.value })}
                                placeholder="Optional description"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                                <Flag className="w-3 h-3" /> Priority
                            </label>
                            <div className="flex gap-2">
                                {(["low", "medium", "high", "urgent"] as const).map((priority) => (
                                    <button
                                        key={priority}
                                        onClick={() => setNewTask({ ...newTask, priority })}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all",
                                            newTask.priority === priority
                                                ? priorityColors[priority] + " ring-2 ring-white/20"
                                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        )}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-400">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTask}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                            >
                                Create Task
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
