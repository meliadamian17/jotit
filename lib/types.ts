export interface Todo {
  id?: number;
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

export interface TodoStore {
  todos: Todo[];
  lastSynced?: string;
}

export type Status = 'backlog' | 'in-progress' | 'blocked' | 'done' | 'canceled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Column {
  id: Status;
  title: string;
  color: string;
}

export const defaultColumns: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#003973',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#4776E6',
  },
  {
    id: 'blocked',
    title: 'Blocked',
    color: '#dc2626',
  },
  {
    id: 'done',
    title: 'Done',
    color: '#22c55e',
  },
  {
    id: 'canceled',
    title: 'Canceled',
    color: '#6b7280',
  },
];