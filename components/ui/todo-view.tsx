'use client';

import { useState, useRef, useEffect } from 'react';
import { Todo } from '@/lib/types';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ScrollArea } from './scroll-area';
import { toast } from 'sonner';
import { todoService } from '@/lib/services/todo-service';
import {
  Tag,
  Link as LinkIcon,
  MessageSquare,
  Calendar,
  X,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type TodoStatus = 'backlog' | 'in-progress' | 'blocked' | 'done' | 'canceled';
type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TodoViewProps {
  todo: Todo;
  onClose: () => void;
  onDelete: () => void;
}

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
}

const statusColors = {
  backlog: 'bg-[#003973] text-white',
  'in-progress': 'bg-[#4776E6] text-white',
  blocked: 'bg-red-600 text-white',
  done: 'bg-green-500 text-white',
  canceled: 'bg-gray-500 text-white',
} as const;

const statusIcons = {
  backlog: <Clock className="h-4 w-4" />,
  'in-progress': <ChevronRight className="h-4 w-4" />,
  blocked: <AlertCircle className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
  canceled: <Ban className="h-4 w-4" />,
} as const;

const priorityColors = {
  low: 'text-[#003973]',
  medium: 'text-[#4776E6]',
  high: 'text-orange-500',
  urgent: 'text-red-500',
} as const;

function EditableField({ value, onSave, multiline, placeholder }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    try {
      if (editValue !== value) {
        await onSave(editValue);
        toast.success('Changes saved');
      }
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  if (isEditing) {
    return multiline ? (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
          }
        }}
        placeholder={placeholder}
        className="min-h-[100px]"
      />
    ) : (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
          }
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'rounded-md px-3 py-2 hover:bg-accent/50 cursor-text min-h-[40px]',
        !value && 'text-muted-foreground italic'
      )}
    >
      {value || placeholder}
    </div>
  );
}

export function TodoView({ todo, onClose, onDelete }: TodoViewProps) {
  const [newTag, setNewTag] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newComment, setNewComment] = useState('');

  const updateTodo = async (updates: Partial<Todo>) => {
    try {
      await todoService.update(todo.id!, updates);
      toast.success('Changes saved');
    } catch (error) {
      toast.error('Failed to save changes');
      throw error;
    }
  };

  const addTag = async () => {
    if (!newTag) return;
    try {
      await todoService.addTag(todo.id!, newTag);
      setNewTag('');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add tag');
      }
    }
  };

  const removeTag = async (tag: string) => {
    try {
      await todoService.removeTag(todo.id!, tag);
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const addLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return;
    
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      await todoService.addLink(todo.id!, { title: newLinkTitle, url });
      setNewLinkTitle('');
      setNewLinkUrl('');
    } catch (error) {
      toast.error('Failed to add link');
    }
  };

  const removeLink = async (index: number) => {
    try {
      await todoService.removeLink(todo.id!, index);
    } catch (error) {
      toast.error('Failed to remove link');
    }
  };

  const addComment = async () => {
    if (!newComment) return;
    try {
      await todoService.addComment(todo.id!, newComment);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const removeComment = async (commentId: number) => {
    try {
      await todoService.removeComment(todo.id!, commentId);
    } catch (error) {
      toast.error('Failed to remove comment');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Select
            value={todo.status}
            onValueChange={(value: TodoStatus) => updateTodo({ status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusIcons).map(([status, icon]) => (
                <SelectItem key={status} value={status}>
                  <div className={cn("flex items-center gap-2 px-2 py-1 rounded", statusColors[status as TodoStatus])}>
                    {icon}
                    <span className="capitalize">{status.replace('-', ' ')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={todo.priority}
            onValueChange={(value: TodoPriority) => updateTodo({ priority: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityColors).map(([priority, color]) => (
                <SelectItem key={priority} value={priority}>
                  <span className={cn('capitalize', color)}>{priority}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-left gap-2 px-12">
          <Button variant="outline" size="sm" onClick={onDelete}>
            Delete
          </Button>
          {/* <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button> */}
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-6 py-1 px-1">
          <div>
            <EditableField
              value={todo.title}
              onSave={(value) => updateTodo({ title: value })}
              placeholder="Add a title..."
            />
          </div>

          <div className='px-1'>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <EditableField
              value={todo.description || ''}
              onSave={(value) => updateTodo({ description: value })}
              multiline
              placeholder="Add a description..."
            />
          </div>

          <div className='pl-0.5'>
            <h4 className="text-sm font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {todo.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 group">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 p-0.5">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag();
                  }
                }}
              />
              <Button variant="outline" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className='pl-0.5'>
            <h4 className="text-sm font-medium mb-2">Links</h4>
            <div className="space-y-2 mb-2">
              {todo.links.map((link, index) => (
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
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-0.5">
              <Input
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Link title..."
                className="flex-1"
              />
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="URL..."
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addLink}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className='pl-0.5'>
            <h4 className="text-sm font-medium mb-2">Comments</h4>
            <div className="space-y-4 mb-4">
              {todo.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <MessageSquare className="h-4 w-4 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm">{comment.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(comment.createdAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeComment(comment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-0.5">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px]"
              />
              <Button variant="outline" className="shrink-0" onClick={addComment}>
                Add
              </Button>
            </div>
          </div>

          {todo.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due {format(todo.deadline, 'MMM d, yyyy')}</span>
            </div>
          )}

          <div className="px-1">
            <h4 className="text-sm font-medium mb-2">Due Date</h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !todo.deadline && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {todo.deadline ? (
                    format(todo.deadline, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={todo.deadline}
                  onSelect={(date) => {
                    if (date) {
                      updateTodo({ deadline: date });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 