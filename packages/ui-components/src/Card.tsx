import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4
        ${hover ? 'transition-shadow duration-300 hover:shadow-md cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
};
