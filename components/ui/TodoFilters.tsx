// components/TodoFilters.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X } from 'lucide-react';
import { Priority } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

interface TodoFiltersProps {
  onFilterChange: (filters: {
    search: string;
    priority: Priority | '';
    tags: string[];
  }) => void;
  availableTags: string[];
}

export function TodoFilters({ onFilterChange, availableTags }: TodoFiltersProps) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, priority, tags: selectedTags });
  };

  const handlePriorityChange = (value: Priority | '') => {
    setPriority(value);
    onFilterChange({ search, priority: value, tags: selectedTags });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    onFilterChange({ search, priority, tags: newTags });
  };

  const clearFilters = () => {
    setSearch('');
    setPriority('');
    setSelectedTags([]);
    onFilterChange({ search: '', priority: '', tags: [] });
  };

  const hasActiveFilters = search || priority || selectedTags.length > 0;

  return (
    <div className="flex flex-wrap gap-3 ease-in-out duration-300">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 rounded-full h-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
            onClick={() => handleSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Priority Filter */}
      <Select
        value={priority}
        onValueChange={(value) => handlePriorityChange(value as Priority | '')}
      >
        <SelectTrigger className="w-[140px] rounded-full h-9">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      {/* Tags Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full h-9"
          >
            Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-full">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-2">
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag}
                  </label>
                </div>
              ))}
              {availableTags.length === 0 && (
                <p className="text-sm text-muted-foreground py-1">No tags available</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground rounded-full h-9"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

