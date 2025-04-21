'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { defaultColumns, Column, Status, Priority } from '@/lib/types';
import { Todo } from '@/lib/db';
import { todoService } from '@/lib/services/todo-service';
import { TodoColumn } from './todo-column';
import { TodoItem } from './todo-item';
import { Button } from './button';
import { Plus, ListFilter } from 'lucide-react';
import { TodoDialog } from './todo-dialog';
import { TodoFilters } from './todo-filters';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Filters {
  search: string;
  priority: Priority | '';
  tags: string[];
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in-progress', 'blocked', 'done', 'canceled'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  deadline: z.date().optional(),
  tags: z.array(z.string()),
});

export function TodoBoard() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [columns] = useState<Column[]>(defaultColumns);
  const [initialStatus, setInitialStatus] = useState<Status | undefined>();
  const [filters, setFilters] = useState<Filters>({
    search: '',
    priority: '',
    tags: [],
  });
  const [optimisticTodos, setOptimisticTodos] = useState<Todo[]>([]);
  const [dragOverId, setDragOverId] = useState<string | number | null>(null);

  const allTodos = useLiveQuery(
    () => todoService.getAll(),
    []
  );

  const availableTags = useLiveQuery(
    () => todoService.getAllTags(),
    []
  );

  // Update optimistic state when allTodos changes
  useEffect(() => {
    if (allTodos) {
      setOptimisticTodos(allTodos as Todo[]);
    }
  }, [allTodos]);

  const filteredTodos = optimisticTodos?.filter(todo => {
    const matchesSearch = !filters.search ||
      todo.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      todo.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      todo.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesPriority = !filters.priority || todo.priority === filters.priority;

    const matchesTags = filters.tags.length === 0 ||
      filters.tags.every(tag => todo.tags.includes(tag));

    return matchesSearch && matchesPriority && matchesTags;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 55,
        tolerance: 5,
      },
    })
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'backlog',
      priority: 'medium',
      tags: [],
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(Number(active.id));
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;
    const activeTodo = filteredTodos?.find(t => t.id === activeId);
    const overTodo = typeof overId === 'number' ? filteredTodos?.find(t => t.id === overId) : null;

    // If dragging over a column
    if (typeof overId === 'string') {
      setDragOverId(overId);
      return;
    }

    // If dragging over a todo
    if (overTodo) {
      setDragOverId(overId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !filteredTodos) {
      setActiveId(null);
      setIsDragging(false);
      setDragOverId(null);
      return;
    }

    const activeId = Number(active.id);
    const overId = over.id;

    try {
      const activeTodo = filteredTodos.find(t => t.id === activeId);
      if (!activeTodo) {
        console.error('Active todo not found for ID:', activeId);
        toast.error('Failed to move todo');
        return;
      }

      // If dropping on a column
      if (typeof overId === 'string') {
        const newStatus = overId as Status;
        const todosInNewStatus = filteredTodos.filter(t => t.status === newStatus);

        // Calculate new order based on position
        let newOrder: number;
        if (todosInNewStatus.length === 0) {
          newOrder = 0;
        } else {
          newOrder = Math.max(...todosInNewStatus.map(t => t.order)) + 1;
        }

        // Optimistically update the UI
        setOptimisticTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === activeId
              ? { ...todo, status: newStatus, order: newOrder }
              : todo
          )
        );

        await todoService.update(activeId, {
          status: newStatus,
          order: newOrder
        });
        toast.success('Todo moved successfully');
        return;
      }

      // If dropping on another todo
      if (typeof overId === 'number' && over.data.current?.type === 'todo') {
        const overTodo = filteredTodos.find(t => t.id === overId);
        if (!overTodo) {
          console.error('Over todo not found for ID:', overId);
          toast.error('Failed to move todo');
          return;
        }

        const newStatus = overTodo.status;
        const todosInNewStatus = filteredTodos.filter(t => t.status === newStatus);
        const overIndex = todosInNewStatus.findIndex(t => t.id === overId);

        // Calculate new order based on position
        let newOrder: number;
        if (overIndex === 0) {
          // If dropping at the top
          newOrder = todosInNewStatus[0].order - 1;
        } else if (overIndex === todosInNewStatus.length - 1) {
          // If dropping at the bottom
          newOrder = todosInNewStatus[todosInNewStatus.length - 1].order + 1;
        } else {
          // If dropping in the middle
          const prevTodo = todosInNewStatus[overIndex - 1];
          const nextTodo = todosInNewStatus[overIndex];
          newOrder = (prevTodo.order + nextTodo.order) / 2;
        }

        // If moving to a different column
        if (activeTodo.status !== newStatus) {
          // Optimistically update the UI
          setOptimisticTodos(prevTodos =>
            prevTodos.map(todo =>
              todo.id === activeId
                ? { ...todo, status: newStatus, order: newOrder }
                : todo
            )
          );

          await todoService.update(activeId, {
            status: newStatus,
            order: newOrder
          });
          toast.success('Todo moved successfully');
          return;
        }

        // If moving within the same column
        const todosInStatus = filteredTodos.filter(t => t.status === activeTodo.status);
        const activeIndex = todosInStatus.findIndex(t => t.id === activeId);

        if (activeIndex === -1) {
          console.error('Active todo not found in status:', activeTodo.status);
          toast.error('Failed to move todo');
          return;
        }

        // Update all todos in between
        if (activeIndex < overIndex) {
          // Moving down
          for (let i = activeIndex + 1; i <= overIndex; i++) {
            const todoToUpdate = todosInStatus[i];
            if (!todoToUpdate || !todoToUpdate.id) continue;

            // Optimistically update the UI
            setOptimisticTodos(prevTodos =>
              prevTodos.map(todo =>
                todo.id === todoToUpdate.id
                  ? { ...todo, order: todo.order - 1 }
                  : todo
              )
            );

            await todoService.update(todoToUpdate.id, {
              order: todoToUpdate.order - 1
            });
          }
        } else {
          // Moving up
          for (let i = overIndex; i < activeIndex; i++) {
            const todoToUpdate = todosInStatus[i];
            if (!todoToUpdate || !todoToUpdate.id) continue;

            // Optimistically update the UI
            setOptimisticTodos(prevTodos =>
              prevTodos.map(todo =>
                todo.id === todoToUpdate.id
                  ? { ...todo, order: todo.order + 1 }
                  : todo
              )
            );

            await todoService.update(todoToUpdate.id, {
              order: todoToUpdate.order + 1
            });
          }
        }

        // Update the active todo
        setOptimisticTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === activeId
              ? { ...todo, order: newOrder }
              : todo
          )
        );

        await todoService.update(activeId, { order: newOrder });
        toast.success('Todo reordered successfully');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to move todo');
      // Revert optimistic update on error
      if (allTodos) {
        setOptimisticTodos(allTodos as Todo[]);
      }
    } finally {
      setActiveId(null);
      setIsDragging(false);
      setDragOverId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setDragOverId(null);
  };

  const handleStatusChange = async (todoId: number, newStatus: Status) => {
    try {
      await todoService.updateOrder(todoId, newStatus);
      toast.success('Todo status updated');
    } catch (error) {
      console.error('Error updating todo status:', error);
      toast.error('Failed to update todo status');
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await todoService.delete(todoId);
      toast.success('Todo deleted');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  if (!filteredTodos) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Modern, Integrated Header */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        {/* Title Row with Add Button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`
                rounded-full
                border-primary/70
                ${showFilters ? 'bg-primary/10 text-primary' : ''}
                transition-colors
              `}
            >
              <ListFilter className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters (Expandable) */}
        {showFilters && (
          <div className="
            bg-background/40 dark:bg-background/30
            backdrop-blur-sm
            border border-border
            rounded-xl p-3 mb-4
            animate-in fade-in  duration-400
          ">
            <TodoFilters
              onFilterChange={setFilters}
              availableTags={availableTags ?? []}
            />
          </div>
        )}

        {/* Stats Bar */}
        <div className="
          flex items-center justify-between
          bg-background/60 dark:bg-background/40
          border border-border
          rounded-lg px-4 py-2
          text-sm text-muted-foreground
        ">
          <div>
            <span className="font-medium text-foreground">{filteredTodos.length}</span> tasks
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="font-medium text-foreground">
                {filteredTodos.filter(t => t.status === 'done').length}
              </span> completed
            </div>
            <div>
              <span className="font-medium text-foreground">
                {filteredTodos.filter(t => t.status === 'in-progress').length}
              </span> in progress
            </div>
            <div>
              <span className="font-medium text-foreground">
                {filteredTodos.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
              </span> high priority
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Keep your existing DnD implementation */}
      <main className="flex-1 container mx-auto px-4 pb-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map(column => (
              <TodoColumn
                key={column.id}
                column={column}
                todos={filteredTodos.filter(todo => todo.status === column.id) ?? []}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                isDragging={isDragging}
                onAddNew={() => {
                  setInitialStatus(column.id);
                  setIsDialogOpen(true);
                }}
                dragOverId={dragOverId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && filteredTodos ? (
              <TodoItem
                todo={filteredTodos.find(t => t.id === activeId)!}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <TodoDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setInitialStatus(undefined);
          }
        }}
        initialStatus={initialStatus}
      />
    </div>
  );
}
