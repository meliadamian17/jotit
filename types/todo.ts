import { Status, Priority } from './status';

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