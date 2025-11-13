import * as React from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  const handleBackdropClick = () => {
    // Check if there's a custom onInteractOutside handler
    const interactOutsideHandler = (window as any).__dialogInteractOutside
    if (interactOutsideHandler) {
      const event = new Event('interact-outside')
      interactOutsideHandler(event)
      // Only close if event wasn't prevented
      if (!event.defaultPrevented) {
        onOpenChange(false)
      }
    } else {
      // Default behavior: always close
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onInteractOutside?: (e: Event) => void
}

export function DialogContent({ className, children, onInteractOutside, ...props }: DialogContentProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Store onInteractOutside callback in a ref so Dialog can access it
  React.useEffect(() => {
    if (onInteractOutside) {
      (window as any).__dialogInteractOutside = onInteractOutside
    }
    return () => {
      delete (window as any).__dialogInteractOutside
    }
  }, [onInteractOutside])

  return (
    <div
      className={cn(
        'relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
