'use client';

import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  Tag as TagIcon,
  Link as LinkIcon,
  MessageSquare
} from 'lucide-react';
import { db, Todo, Status, Priority } from '@/lib/db';
import { Tag } from '@/lib/types';
import { Button } from './button';
import { Calendar } from './calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Badge } from './badge';
import Link from 'next/link';
import { todoService } from '@/lib/services/todo-service';
import { useLiveQuery } from 'dexie-react-hooks';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in-progress', 'blocked', 'done', 'canceled'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  deadline: z.date().optional(),
  tags: z.array(z.string()),
});

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo;
  initialStatus?: Status;
}

export function TodoDialog({ open, onOpenChange, todo, initialStatus }: TodoDialogProps) {
  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newComment, setNewComment] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>(todo?.links ?? []);
  const [comments, setComments] = useState<{ id: number; text: string; createdAt: Date }[]>(todo?.comments ?? []);
  
  const availableTags = useLiveQuery(
    () => todoService.getAllTags(),
    []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: todo ?? {
      title: '',
      description: '',
      status: initialStatus ?? 'backlog',
      priority: 'medium',
      tags: [],
    },
  });

  // Reset form when dialog opens with initialStatus
  useEffect(() => {
    if (open && initialStatus && !todo) {
      form.reset({
        title: '',
        description: '',
        status: initialStatus,
        priority: 'medium',
        tags: [],
      });
      setLinks([]);
      setComments([]);
    } else if (todo) {
      setLinks(todo.links);
      setComments(todo.comments);
    }
  }, [open, initialStatus, todo, form]);

  const handleAddTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;
    
    const currentTags = form.getValues('tags');
    if (!currentTags.includes(tag)) {
      await todoService.addTag(tag);
      form.setValue('tags', [...currentTags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    
    // Ensure URL is absolute
    let url = newLink.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    setLinks([...links, { ...newLink, url }]);
    setNewLink({ title: '', url: '' });
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      { id: Date.now(), text: newComment, createdAt: new Date() }
    ]);
    setNewComment('');
  };

  const handleRemoveComment = (id: number) => {
    setComments(comments.filter(comment => comment.id !== id));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const todoData = {
        ...values,
        tags: values.tags,
        links,
        comments,
        createdAt: todo?.createdAt ?? new Date(),
      };

      if (todo?.id) {
        await todoService.update(todo.id, todoData);
        toast.success('Todo updated successfully');
      } else {
        await todoService.create(todoData);
        toast.success('Todo created successfully');
      }

      form.reset();
      setLinks([]);
      setComments([]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save todo');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>
              {todo ? 'Edit Todo' : 'Create Todo'}
            </DialogTitle>
            <DialogDescription>
              {todo ? 'Edit your existing todo item' : 'Create a new todo item'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Todo title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your todo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Links
                  </h3>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md group">
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
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Link title"
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        className="flex-1 h-9"
                      />
                      <Input
                        placeholder="URL"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        className="flex-1 h-9"
                      />
                      <Button type="button" onClick={handleAddLink} size="icon" className="h-9 w-9">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </h3>
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 p-2 bg-muted rounded-md group">
                        <div className="flex-1">
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(comment.createdAt, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveComment(comment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddComment}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('tags').map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <TagIcon className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {availableTags && availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags.map((tag: Tag) => (
                      <Badge
                        key={tag.id}
                        variant={form.watch('tags').includes(tag.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTags = form.getValues('tags');
                          if (!currentTags.includes(tag.name)) {
                            form.setValue('tags', [...currentTags, tag.name]);
                          }
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {todo ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}