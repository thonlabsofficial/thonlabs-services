import { cva } from 'class-variance-authority';

const textVariants = cva('font-sans text-zinc-800', {
  variants: {
    variant: {
      default: '',
      paragraph: 'leading-relaxed [&:not(:first-child)]:mt-5 mb-0',
      h1: 'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-zinc-50',
      h2: 'scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-zinc-50',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight text-zinc-50',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight text-zinc-50',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      inlineCode:
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
      code: 'font-code text-emerald-200 text-sm',
      paragraphEmail: 'leading-relaxed',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export { textVariants };
