'use client';

import { Column, Todo, Status } from '@/lib/db';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TodoItem } from './todo-item';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from './button';

interface TodoColumnProps {
  column: Column;
  todos: Todo[];
  onStatusChange: (todoId: number, status: Status) => void;
  onDelete: (todoId: number) => void;
  isDragging: boolean;
  onAddNew: () => void;
}

export function TodoColumn({ column, todos, onStatusChange, onDelete, isDragging, onAddNew }: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      status: column.id,
    },
  });

  return (
    <motion.div 
      className={cn(
        "flex flex-col w-[280px] shrink-0",
        "transition-all duration-200",
        isDragging && "opacity-100",
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          "rounded-t-lg p-3 font-semibold",
          "transition-colors duration-200",
          isOver && "bg-primary/10"
        )}
        style={{ 
          backgroundColor: 'hsl(var(--secondary))',
          borderBottom: '1px solid hsl(var(--border))'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ 
              background: column.color
            }}
          />
          <span className="text-foreground">{column.title}</span>
          <span className="ml-auto text-muted-foreground">
            {todos.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent hover:ring-1 hover:ring-muted-foreground/20"
            onClick={onAddNew}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <motion.div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-4 py-4 px-2 rounded-b-lg min-h-[150px]",
          "bg-card/50 transition-colors duration-200",
          isDragging && "bg-primary/5 ring-2 ring-primary/20",
          isOver && "bg-primary/10 ring-2 ring-primary/40"
        )}
        layout="position"
        layoutRoot
      >
        <SortableContext
          items={todos.map(t => t.id!)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {todos.length === 0 && !isOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/20 rounded-lg"
              >
                Drop Tasks Here
              </motion.div>
            )}
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </motion.div>
    </motion.div>
  );
}