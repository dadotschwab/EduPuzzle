import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] border-2 border-transparent hover:border-slate-900',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] border-2 border-transparent hover:border-slate-900',
        outline: 'border-2 border-slate-200 bg-background hover:bg-background hover:border-slate-900 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] border-2 border-transparent hover:border-slate-900',
        ghost: 'hover:bg-accent hover:text-accent-foreground border-2 border-transparent',
        link: 'text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:translate-x-0',
        gradient:
          'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] border-2 border-transparent hover:border-slate-900',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
