import { UserContext } from "@/Context/UserContext";
import { api, authHeaders } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  CheckCheck,
  CircleDashed,
  Clock3,
  Loader2,
  PencilLine,
  Search,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const initialFormState = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  status: "pending",
};

const statusLabels = {
  pending: "Queued",
  in_progress: "In Motion",
  completed: "Completed",
};

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-green-50 text-green-700 ring-green-200",
};

const priorityClasses = {
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  medium: "bg-orange-50 text-orange-700 ring-orange-200",
  high: "bg-red-50 text-red-700 ring-red-200",
};

const panelFieldClassName =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500";

const formatDate = (value) => {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toInputDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isOverdue = (todo) => {
  if (!todo.dueDate || todo.status === "completed") {
    return false;
  }

  const dueDate = new Date(todo.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
};

const getDeadlineLabel = (todo) => {
  if (todo.status === "completed") {
    return `Closed ${formatDate(todo.completedAt || todo.updatedAt)}`;
  }

  if (!todo.dueDate) {
    return "No deadline set";
  }

  const dueDate = new Date(todo.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (dueDate.getTime() === today.getTime()) {
    return "Due today";
  }

  if (dueDate < today) {
    return `Overdue since ${formatDate(todo.dueDate)}`;
  }

  return `Due ${formatDate(todo.dueDate)}`;
};

const sortTodos = (todoList) => {
  const statusRank = {
    in_progress: 0,
    pending: 1,
    completed: 2,
  };

  return [...todoList].sort((left, right) => {
    const statusDifference = statusRank[left.status] - statusRank[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const leftDueDate = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDueDate = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDueDate !== rightDueDate) {
      return leftDueDate - rightDueDate;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
};

const matchesFilters = (todo, searchTerm, statusFilter, priorityFilter) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (statusFilter !== "all" && todo.status !== statusFilter) {
    return false;
  }

  if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
    return false;
  }

  if (!normalizedSearch) {
    return true;
  }

  return [todo.title, todo.description]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedSearch));
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <Card className="todo-panel border border-black/6 bg-white/72 shadow-none">
    <CardContent className="flex items-start justify-between gap-3 px-5 py-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#7c7168]">{label}</p>
        <p className="mt-3 todo-display text-3xl text-[#1f1b16]">{value}</p>
      </div>
      <div className={`rounded-full border px-3 py-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

const TodoDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);
  const user = context?.user;
  const setUser = context?.setUser;
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const handleSessionFailure = (error, fallbackMessage) => {
    const message = error.response?.data?.message || fallbackMessage;
    const normalizedMessage = message.toLowerCase();

    if (
      error.response?.status === 401 ||
      normalizedMessage.includes("token") ||
      normalizedMessage.includes("authorization")
    ) {
      localStorage.removeItem("accessToken");
      setUser?.(null);
      toast.error("Your session expired. Please log in again.");
      navigate("/login");
      return;
    }

    toast.error(message);
  };

  const loadTodos = async ({ initial = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await api.get("/todos", {
        headers: authHeaders(),
      });

      setTodos(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      handleSessionFailure(error, "Unable to load your todo board right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTodos({ initial: true });
  }, []);

  const upsertTodo = (updatedTodo) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) => (todo._id === updatedTodo._id ? updatedTodo : todo))
    );
  };

  const resetCreateForm = () => {
    setFormData(initialFormState);
  };

  const beginEdit = (todo) => {
    setEditingId(todo._id);
    setEditData({
      title: todo.title,
      description: todo.description || "",
      priority: todo.priority,
      dueDate: toInputDate(todo.dueDate),
      status: todo.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(initialFormState);
  };

  const handleCreateTodo = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Give your task a title first.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post(
        "/todos",
        {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
        },
        {
          headers: authHeaders(),
        }
      );

      setTodos((currentTodos) => [response.data.data, ...currentTodos]);
      resetCreateForm();
      toast.success("Todo added to your board.");
    } catch (error) {
      handleSessionFailure(error, "Unable to create the todo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (todoId) => {
    if (!editData.title.trim()) {
      toast.error("A todo title cannot be empty.");
      return;
    }

    try {
      setSavingId(todoId);
      const response = await api.patch(
        `/todos/${todoId}`,
        {
          title: editData.title,
          description: editData.description,
          priority: editData.priority,
          dueDate: editData.dueDate || null,
          status: editData.status,
        },
        {
          headers: authHeaders(),
        }
      );

      upsertTodo(response.data.data);
      cancelEdit();
      toast.success("Todo updated.");
    } catch (error) {
      handleSessionFailure(error, "Unable to save the todo changes.");
    } finally {
      setSavingId(null);
    }
  };

  const handleQuickStatus = async (todo, nextStatus) => {
    try {
      setSavingId(todo._id);
      const response = await api.patch(
        `/todos/${todo._id}`,
        { status: nextStatus },
        {
          headers: authHeaders(),
        }
      );

      upsertTodo(response.data.data);
      toast.success(`Todo moved to ${statusLabels[nextStatus].toLowerCase()}.`);
    } catch (error) {
      handleSessionFailure(error, "Unable to update the todo status.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      setDeletingId(todoId);
      await api.delete(`/todos/${todoId}`, {
        headers: authHeaders(),
      });

      setTodos((currentTodos) => currentTodos.filter((todo) => todo._id !== todoId));

      if (editingId === todoId) {
        cancelEdit();
      }

      toast.success("Todo removed from the board.");
    } catch (error) {
      handleSessionFailure(error, "Unable to delete the todo.");
    } finally {
      setDeletingId(null);
    }
  };

  const orderedTodos = sortTodos(todos);
  const visibleTodos = orderedTodos.filter((todo) =>
    matchesFilters(todo, deferredSearchTerm, statusFilter, priorityFilter)
  );
  const totalTodos = todos.length;
  const activeTodos = todos.filter((todo) => todo.status !== "completed").length;
  const completedTodos = todos.filter((todo) => todo.status === "completed").length;
  const overdueTodos = todos.filter((todo) => isOverdue(todo)).length;

  return (
    <main className="min-h-screen bg-green-50 overflow-hidden px-4 py-8 md:px-6 md:py-10">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm md:p-8">
            <Badge className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
              Welcome
            </Badge>
            <div className="mt-5 max-w-3xl">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Hello, {user?.username || "builder"}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-green-600 md:text-5xl">
                Organize your tasks
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
                Create, update, and manage your todo items. All your data is securely stored
                and synced to your authenticated account.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={CircleDashed}
                label="Total Tasks"
                value={totalTodos}
                accent="border-gray-200 bg-gray-50 text-gray-700"
              />
              <StatCard
                icon={Target}
                label="Active"
                value={activeTodos}
                accent="border-blue-200 bg-blue-50 text-blue-700"
              />
              <StatCard
                icon={CheckCheck}
                label="Completed"
                value={completedTodos}
                accent="border-green-200 bg-green-50 text-green-700"
              />
              <StatCard
                icon={TriangleAlert}
                label="Overdue"
                value={overdueTodos}
                accent="border-red-200 bg-red-50 text-red-700"
              />
            </div>
          </div>

          <Card className="rounded-2xl border border-green-100 bg-green-600 shadow-sm">
            <CardContent className="p-6 text-white md:p-8">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-white/20 bg-white/10 p-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-green-100">Tip</p>
                  <h2 className="mt-1 text-2xl font-bold">Stay organized</h2>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm leading-relaxed text-green-50">
                <p>Add tasks on the left panel to get started.</p>
                <p>Filter by status, search by keyword, and track your progress effortlessly.</p>
              </div>

              <Button
                className="mt-6 h-10 rounded-lg bg-white text-green-600 font-medium hover:bg-gray-50"
                onClick={() => loadTodos()}
                disabled={isRefreshing}
              >
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-2xl border border-green-100 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Add</p>
                  <h2 className="mt-2 text-2xl font-bold text-green-600">New task</h2>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Your account
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCreateTodo}>
                <div className="space-y-2">
                  <Label htmlFor="todo-title" className="text-sm font-medium text-gray-700">
                    Title *
                  </Label>
                  <Input
                    id="todo-title"
                    className={`${panelFieldClassName} h-10`}
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="What needs to be done?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="todo-description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <textarea
                    id="todo-description"
                    className={`${panelFieldClassName} min-h-24 resize-none`}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Add any details..."
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="todo-priority" className="text-sm font-medium text-gray-700">
                      Priority
                    </Label>
                    <select
                      id="todo-priority"
                      className={`${panelFieldClassName} h-10`}
                      value={formData.priority}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, priority: event.target.value }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="todo-due-date" className="text-sm font-medium text-gray-700">
                      Due date
                    </Label>
                    <Input
                      id="todo-due-date"
                      type="date"
                      className={`${panelFieldClassName} h-10`}
                      value={formData.dueDate}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, dueDate: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Add task
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-green-100 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Tasks</p>
                    <h2 className="mt-2 text-2xl font-bold text-green-600">Your list</h2>
                  </div>

                  <div className="relative w-full md:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      className={`${panelFieldClassName} h-10 pl-9`}
                      value={searchTerm}
                      onChange={(event) =>
                        startTransition(() => {
                          setSearchTerm(event.target.value);
                        })
                      }
                      placeholder="Search..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "pending", label: "Queued" },
                      { key: "in_progress", label: "In Progress" },
                      { key: "completed", label: "Done" },
                    ].map((filterItem) => (
                      <button
                        key={filterItem.key}
                        type="button"
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          statusFilter === filterItem.key
                            ? "border-green-500 bg-green-600 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300"
                        }`}
                        onClick={() => setStatusFilter(filterItem.key)}
                      >
                        {filterItem.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "high", label: "High" },
                      { key: "medium", label: "Medium" },
                      { key: "low", label: "Low" },
                    ].map((filterItem) => (
                      <button
                        key={filterItem.key}
                        type="button"
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          priorityFilter === filterItem.key
                            ? "border-blue-500 bg-blue-600 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300"
                        }`}
                        onClick={() => setPriorityFilter(filterItem.key)}
                      >
                        {filterItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading tasks...</span>
                    </div>
                  </div>
                ) : visibleTodos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="text-xs uppercase tracking-widest text-gray-500">No tasks</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-700">Nothing here yet</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                      Create a new task or adjust your filters.
                    </p>
                  </div>
                ) : (
                  visibleTodos.map((todo, index) => {
                    const isEditing = editingId === todo._id;
                    const isSavingThisTodo = savingId === todo._id;
                    const isDeletingThisTodo = deletingId === todo._id;

                    return (
                      <article
                        key={todo._id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap gap-2">
                                <Badge className={`rounded-full px-2.5 py-1 text-xs ring-1 shadow-none ${statusClasses[todo.status]}`}>
                                  {statusLabels[todo.status]}
                                </Badge>
                                <Badge
                                  className={`rounded-full px-2.5 py-1 capitalize text-xs ring-1 shadow-none ${priorityClasses[todo.priority]}`}
                                >
                                  {todo.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`rounded-full border-none px-2.5 py-1 text-xs shadow-none ${
                                    isOverdue(todo)
                                      ? "bg-red-50 text-red-700"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  <CalendarDays className="mr-1 h-3 w-3" />
                                  {getDeadlineLabel(todo)}
                                </Badge>
                              </div>

                              {isEditing ? (
                                <div className="space-y-2 mt-2">
                                  <Input
                                    className={`${panelFieldClassName} h-9`}
                                    value={editData.title}
                                    onChange={(event) =>
                                      setEditData((current) => ({ ...current, title: event.target.value }))
                                    }
                                  />
                                  <textarea
                                    className={`${panelFieldClassName} min-h-20 resize-none`}
                                    value={editData.description}
                                    onChange={(event) =>
                                      setEditData((current) => ({
                                        ...current,
                                        description: event.target.value,
                                      }))
                                    }
                                  />
                                  <div className="grid gap-2 md:grid-cols-3">
                                    <select
                                      className={`${panelFieldClassName} h-9`}
                                      value={editData.priority}
                                      onChange={(event) =>
                                        setEditData((current) => ({
                                          ...current,
                                          priority: event.target.value,
                                        }))
                                      }
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                    </select>
                                    <select
                                      className={`${panelFieldClassName} h-9`}
                                      value={editData.status}
                                      onChange={(event) =>
                                        setEditData((current) => ({
                                          ...current,
                                          status: event.target.value,
                                        }))
                                      }
                                    >
                                      <option value="pending">Queued</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                    <Input
                                      type="date"
                                      className={`${panelFieldClassName} h-9`}
                                      value={editData.dueDate}
                                      onChange={(event) =>
                                        setEditData((current) => ({
                                          ...current,
                                          dueDate: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {todo.title}
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {todo.description || "No details added."}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              {todo.status !== "in_progress" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  onClick={() => handleQuickStatus(todo, "in_progress")}
                                  disabled={isSavingThisTodo || isDeletingThisTodo}
                                >
                                  <Clock3 className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Start</span>
                                </Button>
                              )}

                              {todo.status !== "completed" && (
                                <Button
                                  size="sm"
                                  className="rounded-lg bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => handleQuickStatus(todo, "completed")}
                                  disabled={isSavingThisTodo || isDeletingThisTodo}
                                >
                                  {isSavingThisTodo ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCheck className="h-3 w-3" />
                                  )}
                                  <span className="hidden sm:inline ml-1">Done</span>
                                </Button>
                              )}

                              {todo.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                                  onClick={() => handleQuickStatus(todo, "pending")}
                                  disabled={isSavingThisTodo || isDeletingThisTodo}
                                >
                                  <CircleDashed className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Undo</span>
                                </Button>
                              )}

                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="rounded-lg bg-green-600 text-white hover:bg-green-700"
                                    onClick={() => handleSaveEdit(todo._id)}
                                    disabled={isSavingThisTodo || isDeletingThisTodo}
                                  >
                                    {isSavingThisTodo ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-3 w-3" />
                                    )}
                                    <span className="hidden sm:inline ml-1">Save</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg text-gray-600 hover:bg-gray-200"
                                    onClick={cancelEdit}
                                    disabled={isSavingThisTodo || isDeletingThisTodo}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg text-gray-600 hover:bg-gray-200"
                                  onClick={() => beginEdit(todo)}
                                  disabled={isSavingThisTodo || isDeletingThisTodo}
                                >
                                  <PencilLine className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Edit</span>
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteTodo(todo._id)}
                                disabled={isSavingThisTodo || isDeletingThisTodo}
                              >
                                {isDeletingThisTodo ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span className="hidden sm:inline ml-1">Delete</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500">
                            <span>Created {formatDate(todo.createdAt)}</span>
                            <span>Updated {formatDate(todo.updatedAt)}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default TodoDashboard;
