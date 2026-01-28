import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  categories: Category[];
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  placeholder = 'Buscar libros...',
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          icon={<Search className="h-5 w-5" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <select
        value={selectedCategory || ''}
        onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};