import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'table-cell align-middle whitespace-nowrap rounded-md text-sm font-bold no-underline',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm',
        outline: 'border border-input bg-background shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm',
        link: 'text-primary underline-offset-4',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export { buttonVariants };
