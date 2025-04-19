import Dexie, { Table } from 'dexie';

export type Status = 'backlog' | 'in-progress' | 'blocked' | 'done' | 'canceled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  tags: string[];
  links: { title: string; url: string }[];
  comments: { id: number; text: string; createdAt: Date }[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

export interface Column {
  id: Status;
  title: string;
  color: string;
  order: number;
}

export class TodoDB extends Dexie {
  todos!: Table<Todo>;

  constructor() {
    super('TodoDB');
    this.version(1).stores({
      todos: '++id, status, priority, tags, order, deadline',
    });
  }
}

export const db = new TodoDB();

export const defaultColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#003973', order: 0 },
  { id: 'in-progress', title: 'In Progress', color: '#4776E6', order: 1 },
  { id: 'blocked', title: 'Blocked', color: '#dc2626', order: 2 },
  { id: 'done', title: 'Done', color: '#22c55e', order: 3 },
  { id: 'canceled', title: 'Canceled', color: '#6b7280', order: 4 },
];