import { db } from '@/lib/db';
import { Todo, Status, Priority } from '@/lib/types';

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  deadline?: Date;
  order?: number;
  tags?: string[];
  links?: { title: string; url: string; }[];
  comments?: { id: number; text: string; createdAt: Date; }[];
}

export const todoService = {
  async getAll() {
    return db.todos.orderBy('order').toArray();
  },

  async getByStatus(status: Status) {
    return db.todos.where('status').equals(status).toArray();
  },

  async create(todo: Omit<Todo, 'id' | 'order' | 'updatedAt'>) {
    const todosInStatus = await db.todos
      .where('status')
      .equals(todo.status)
      .toArray();
    
    const maxOrder = Math.max(...todosInStatus.map(t => t.order), -1);
    
    return db.todos.add({
      id: Date.now(),
      ...todo,
      order: maxOrder + 1,
      updatedAt: new Date(),
    });
  },

  async update(id: number, updates: UpdateTodoInput) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    // If status is changing, update order
    if (updates.status && updates.status !== todo.status) {
      const todosInNewStatus = await db.todos
        .where('status')
        .equals(updates.status)
        .toArray();
      
      const maxOrder = Math.max(...todosInNewStatus.map(t => t.order), -1);
      updates.order = maxOrder + 1;
    }

    await db.todos.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    return db.todos.get(id);
  },

  async delete(id: number) {
    await db.todos.delete(id);
  },

  async updateOrder(id: number, newStatus: Status) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    const todosInNewStatus = await db.todos
      .where('status')
      .equals(newStatus)
      .toArray();
    
    const maxOrder = Math.max(...todosInNewStatus.map(t => t.order), -1);
    
    await db.todos.update(id, {
      status: newStatus,
      order: maxOrder + 1,
      updatedAt: new Date(),
    });
  },

  async addTag(id: number, tag: string) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');
    
    const normalizedTag = tag.toLowerCase().trim();
    if (todo.tags.includes(normalizedTag)) {
      throw new Error('Tag already exists');
    }

    await db.todos.update(id, {
      tags: [...todo.tags, normalizedTag],
      updatedAt: new Date(),
    });
  },

  async removeTag(id: number, tag: string) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    await db.todos.update(id, {
      tags: todo.tags.filter(t => t !== tag),
      updatedAt: new Date(),
    });
  },

  async addLink(id: number, link: { title: string; url: string; }) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    await db.todos.update(id, {
      links: [...todo.links, link],
      updatedAt: new Date(),
    });
  },

  async removeLink(id: number, index: number) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    await db.todos.update(id, {
      links: todo.links.filter((_, i) => i !== index),
      updatedAt: new Date(),
    });
  },

  async addComment(id: number, text: string) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    await db.todos.update(id, {
      comments: [
        ...todo.comments,
        { id: Date.now(), text, createdAt: new Date() }
      ],
      updatedAt: new Date(),
    });
  },

  async removeComment(id: number, commentId: number) {
    const todo = await db.todos.get(id);
    if (!todo) throw new Error('Todo not found');

    await db.todos.update(id, {
      comments: todo.comments.filter(c => c.id !== commentId),
      updatedAt: new Date(),
    });
  },
}; 