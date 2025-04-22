'use client';

import { useState, useRef, useEffect } from 'react';
import { Todo } from '@/types/todo';
import { Status } from '@/types/status';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import {
  Calendar,
  Link as LinkIcon,
  Tag,
} from 'lucide-react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { TodoView } from './todo-view';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { Sheet, SheetContent } from './sheet';

interface TodoItemProps {
  todo: Todo;
  overlay?: boolean;
  onStatusChange?: (todoId: number, status: Status) => void;
  onDelete?: (todoId: number) => void;
}

const priorityColors = {
  low: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose-500/10 text-rose-400',
  urgent: 'bg-purple-500/10 text-purple-400',
};

const DRAG_DELAY = 200; // ms

export function TodoItem({ todo, overlay, onStatusChange, onDelete }: TodoItemProps) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const mouseDownTimeRef = useRef<number>(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDndDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
    },
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  } : {
    touchAction: 'none',
  };

  useEffect(() => {
    setIsDragging(isDndDragging);
  }, [isDndDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    mouseDownTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (Date.now() - mouseDownTimeRef.current < DRAG_DELAY) {
      setIsViewOpen(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTimeRef.current = Date.now();
  };

  const handleMouseUp = () => {
    if (Date.now() - mouseDownTimeRef.current < DRAG_DELAY) {
      setIsViewOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await db.todos.delete(todo.id);
        onDelete(todo.id);
        toast.success('Todo deleted');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'relative flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors',
          isDragging && 'cursor-grabbing opacity-50',
          !isDragging && 'cursor-grab hover:bg-accent/50'
        )}
        onClick={() => !isDragging && setIsViewOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-none line-clamp-2 break-words min-w-0 flex-1">{todo.title}</h3>
          {todo.priority && (
            <Badge
              variant={
                todo.priority === 'urgent'
                  ? 'destructive'
                  : todo.priority === 'high'
                    ? 'default'
                    : 'secondary'
              }
              className="shrink-0"
            >
              {todo.priority}
            </Badge>
          )}
        </div>

        {todo.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
          {todo.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {format(new Date(todo.deadline), 'MMM d')}
              </span>
            </div>
          )}
          {todo.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span className="text-xs">
                {todo.tags.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
        <SheetContent className="w-[800px] sm:max-w-[800px]">
          <TodoView
            todo={todo}
            onClose={() => setIsViewOpen(false)}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
