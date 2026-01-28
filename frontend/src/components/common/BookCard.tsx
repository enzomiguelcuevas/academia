import React from 'react';
import { BookOpen, User, Calendar } from 'lucide-react';
import type { Book } from '@/types';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer dark:bg-gray-800"
      onClick={() => onClick(book)}
    >
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg dark:bg-gray-700">
          <BookOpen className="h-12 w-12 text-gray-400" />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          por {book.author}
        </p>
        
        {book.category && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full dark:bg-primary-900/30 dark:text-primary-300">
            {book.category.name}
          </span>
        )}
        
        {book.description && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {book.description}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(book.created_at).toLocaleDateString()}
          </div>
          {book.is_downloadable && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-300">
              Descargable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};