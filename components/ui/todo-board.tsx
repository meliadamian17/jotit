'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Todo, defaultColumns, Column, Status, Priority } from '@/lib/types';
import { todoService } from '@/lib/services/todo-service';
import { TodoColumn } from './todo-column';
import { TodoItem } from './todo-item';
import { Button } from './button';
import { Plus } from 'lucide-react';
import { TodoDialog } from './todo-dialog';
import { TodoFilters } from './todo-filters';
import { ThemeToggle } from '../theme-toggle';
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
  const [columns] = useState<Column[]>(defaultColumns);
  const [initialStatus, setInitialStatus] = useState<Status | undefined>();
  const [filters, setFilters] = useState<Filters>({
    search: '',
    priority: '',
    tags: [],
  });
  
  const allTodos = useLiveQuery(
    () => todoService.getAll(),
    []
  );

  const availableTags = useLiveQuery(
    async () => {
      const todos = await todoService.getAll();
      const tagSet = new Set(todos.flatMap(todo => todo.tags));
      return Array.from(tagSet).sort();
    },
    []
  );

  const filteredTodos = allTodos?.filter(todo => {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !filteredTodos) {
      setActiveId(null);
      setIsDragging(false);
      return;
    }

    const activeId = Number(active.id);
    
    try {
      // If dropping on a column
      if (typeof over.id === 'string') {
        const newStatus = over.id as Status;
        await todoService.updateOrder(activeId, newStatus);
        toast.success('Todo moved successfully');
      }
      // If dropping on another todo
      else if (typeof over.id === 'number' && over.data.current?.type === 'todo') {
        const overTodo = filteredTodos.find(t => t.id === over.id);
        if (overTodo) {
          await todoService.updateOrder(activeId, overTodo.status);
          toast.success('Todo moved successfully');
        }
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to move todo');
    }
    
    setActiveId(null);
    setIsDragging(false);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Todo Board</h1>
              <p className="text-muted-foreground mt-1">
                Organize and track your tasks efficiently
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <div>
            <TodoFilters
              onFilterChange={setFilters}
              availableTags={availableTags ?? []}
            />
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4 min-h-screen">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-6">
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