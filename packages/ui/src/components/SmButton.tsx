import type { ButtonHTMLAttributes } from 'react';

interface SmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<NonNullable<SmButtonProps['variant']>, string> = {
  primary: 'btn-smartodo-primary',
  success: 'bg-green-500 text-white border-none hover:bg-green-600',
  danger: 'bg-red-500 text-white border-none hover:bg-red-600',
  warning: 'bg-orange-500 text-white border-none hover:bg-orange-600',
  info: 'bg-teal-400 text-white border-none hover:bg-teal-500',
  outline: 'border border-primary text-primary bg-transparent hover:bg-primary/5',
};

const SIZE_CLASSES: Record<NonNullable<SmButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export function SmButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: SmButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-150',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
