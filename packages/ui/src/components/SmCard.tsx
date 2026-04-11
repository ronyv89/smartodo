import type { HTMLAttributes } from 'react';

interface SmCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function SmCard({ title, children, className = '', ...props }: SmCardProps) {
  return (
    <div className={['card-smartodo rounded-lg bg-white p-6', className].join(' ')} {...props}>
      {title !== undefined && title !== '' && (
        <h5 className="mb-4 text-lg font-semibold text-gray-800">{title}</h5>
      )}
      {children}
    </div>
  );
}
