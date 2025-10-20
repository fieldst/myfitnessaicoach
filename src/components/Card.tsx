import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
