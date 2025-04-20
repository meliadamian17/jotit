import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter, DragOverlay, useSensor, PointerSensor } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { TodoColumn } from '@/components/todo-column';
import { TodoDialog } from '@/components/todo-dialog';
import { TodoItem } from '@/components/todo-item';
import { Status } from '@/types/status';
import { Todo } from '@/types/todo';

export function TodoBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = [useSensor(PointerSensor)];

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    setIsDragging(true);
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    if (activeId === overId) return;

    const activeTodo = todos.find(todo => todo.id === activeId);
    const overTodo = todos.find(todo => todo.id === overId);

    if (!activeTodo || !overTodo) return;

    const newStatus = overTodo.status;
    const newTodos = todos.map(todo => {
      if (todo.id === activeId) {
        return { ...todo, status: newStatus };
      }
      return todo;
    });

    setTodos(newTodos);

    try {
      await fetch(`/api/todos/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating todo status:', error);
      loadTodos();
    }
  };

  const handleStatusChange = async (todoId: number, newStatus: Status) => {
    try {
      await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTodos(todos.map(todo =>
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      ));
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Todo
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(Status).map((status) => (
            <TodoColumn
              key={status}
              status={status}
              todos={todos.filter(todo => todo.status === status)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              isDragging={isDragging}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <TodoItem
              todo={todos.find(todo => todo.id === activeId)!}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
} 
