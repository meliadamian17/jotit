import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { Todo } from '@/types/todo';
import { Status, Priority } from '../types/status';

interface TodoState {
  todos: Todo[];
  lastSynced?: string;
  isAutoSyncEnabled: boolean;
  addTodo: (title: string, description?: string) => void;
  updateTodo: (id: number, updates: Partial<Todo>) => void;
  deleteTodo: (id: number) => void;
  syncTodos: () => Promise<void>;
  setAutoSync: (enabled: boolean) => void;
}

const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      isAutoSyncEnabled: true,
      lastSynced: undefined,
      addTodo: (title, description) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: Date.now(),
              title,
              description,
              status: 'backlog' as Status,
              priority: 'medium' as Priority,
              tags: [],
              links: [],
              comments: [],
              order: state.todos.length,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, ...updates, updatedAt: new Date() }
              : todo
          ),
        })),
      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      syncTodos: async () => {
        // TODO: Implement sync with backend
        set({ lastSynced: new Date().toISOString() });
      },
      setAutoSync: (enabled) => set({ isAutoSyncEnabled: enabled }),
    }),
    {
      name: 'todo-storage',
    }
  )
);

export default useTodoStore;