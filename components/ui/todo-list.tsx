'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { db, Todo, Category, initializeDB } from '@/lib/db';
import { TodoItem } from './todo-item';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { ThemeToggle } from '../theme-toggle';
import { Plus } from 'lucide-react';
import { TodoDialog } from './todo-dialog';
import { toast } from 'sonner';

export function TodoList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const categories = useLiveQuery(() => db.categories.toArray());
  const todos = useLiveQuery(
    () => {
      const query = db.todos.orderBy('order');
      return selectedCategory === 'all'
        ? query.toArray()
        : query.filter(todo => todo.category === selectedCategory).toArray();
    },
    [selectedCategory]
  );

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    initializeDB();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos?.findIndex(todo => todo.id === active.id) ?? -1;
    const newIndex = todos?.findIndex(todo => todo.id === over.id) ?? -1;

    if (oldIndex !== -1 && newIndex !== -1 && todos) {
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      await Promise.all(
        newTodos.map((todo, index) =>
          db.todos.update(todo.id!, { order: index })
        )
      );
      toast.success('Todo order updated');
    }
  };

  if (!categories || !todos) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Todo App</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger
                key={category.id}
                value={category.name}
                className="capitalize"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory}>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={todos.map(t => t.id!)}>
                <div className="space-y-4">
                  {todos.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onEdit={() => setEditingTodo(todo)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>
        </Tabs>
      </main>

      <TodoDialog
        open={isDialogOpen || !!editingTodo}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTodo(null);
        }}
        categories={categories}
        todo={editingTodo}
      />
    </div>
  );
}