'use client';

import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Priority, Tag } from '@/lib/db';
import { X } from 'lucide-react';
import { Badge } from './badge';

interface TodoFiltersProps {
  onFilterChange: (filters: {
    search: string;
    priority: Priority | '';
    tags: string[];
  }) => void;
  availableTags: Tag[];
}

type PriorityFilter = Priority | 'all';

const convertPriorityFilter = (priority: PriorityFilter): Priority | '' => {
  return priority === 'all' ? '' : priority;
};

export function TodoFilters({ onFilterChange, availableTags }: TodoFiltersProps) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      search: value,
      priority: convertPriorityFilter(priority),
      tags: selectedTags
    });
  };

  const handlePriorityChange = (value: PriorityFilter) => {
    setPriority(value);
    onFilterChange({
      search,
      priority: convertPriorityFilter(value),
      tags: selectedTags
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onFilterChange({
      search,
      priority: convertPriorityFilter(priority),
      tags: newTags
    });
  };

  const clearFilters = () => {
    setSearch('');
    setPriority('all');
    setSelectedTags([]);
    onFilterChange({ search: '', priority: '', tags: [] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search todos..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        <Select value={priority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {(search || priority !== 'all' || selectedTags.length > 0) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag.name)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 