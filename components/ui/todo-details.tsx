'use client';

import { useState } from 'react';
import { db, Todo } from '@/lib/db';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Plus, Link as LinkIcon, MessageSquare, X, Link } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TodoDetailsProps {
  todo: Todo;
  onUpdate: (todo: Todo) => void;
}

export function TodoDetails({ todo, onUpdate }: TodoDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      text: newComment,
      createdAt: new Date(),
    };

    const updatedTodo = {
      ...todo,
      comments: [...todo.comments, comment],
      updatedAt: new Date(),
    };

    await db.todos.update(todo.id!, updatedTodo);
    onUpdate(updatedTodo);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    let url = newLink.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const updatedTodo = {
      ...todo,
      links: [...todo.links, { ...newLink, url }],
      updatedAt: new Date(),
    };

    await db.todos.update(todo.id!, updatedTodo);
    onUpdate(updatedTodo);
    setNewLink({ title: '', url: '' });
    toast.success('Link added');
  };

  const handleDeleteComment = async (commentId: number) => {
    const updatedTodo = {
      ...todo,
      comments: todo.comments.filter(c => c.id !== commentId),
      updatedAt: new Date(),
    };

    await db.todos.update(todo.id!, updatedTodo);
    onUpdate(updatedTodo);
    toast.success('Comment deleted');
  };

  const handleDeleteLink = async (index: number) => {
    const updatedTodo = {
      ...todo,
      links: todo.links.filter((_, i) => i !== index),
      updatedAt: new Date(),
    };

    await db.todos.update(todo.id!, updatedTodo);
    onUpdate(updatedTodo);
    toast.success('Link deleted');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <div className="space-y-4">
          <AnimatePresence>
            {todo.comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-muted rounded-lg relative group"
              >
                <p className="text-sm">{comment.text}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(comment.createdAt, 'MMM d, yyyy HH:mm')}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddComment}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Links</h3>
        <div className="space-y-4">
          <AnimatePresence>
            {todo.links.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 p-4 bg-muted rounded-lg relative group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LinkIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline block truncate"
                    >
                      {link.title}
                    </a>
                    <span className="text-xs text-muted-foreground truncate block">
                      {link.url}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => handleDeleteLink(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-2">
            <Input
              placeholder="Link title"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="flex-1"
            />
            <Button onClick={handleAddLink}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 