import * as React from 'react'
import { Button } from './button'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

interface AlertDialogTitleProps {
  children: React.ReactNode
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

interface AlertDialogFooterProps {
  children: React.ReactNode
}

interface AlertDialogActionProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'default' | 'destructive'
}

interface AlertDialogCancelProps {
  onClick?: () => void
  children: React.ReactNode
}

const AlertDialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          {/* Content will be rendered here */}
        </div>
      )}
    </AlertDialogContext.Provider>
  )
}

export function AlertDialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function AlertDialogContent({ children }: AlertDialogContentProps) {
  const { open } = React.useContext(AlertDialogContext)

  if (!open) return null

  return (
    <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
      {children}
    </div>
  )
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return <p className="text-sm text-muted-foreground mt-2">{children}</p>
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}

export function AlertDialogCancel({ onClick, children }: AlertDialogCancelProps) {
  const { setOpen } = React.useContext(AlertDialogContext)

  return (
    <Button
      variant="outline"
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
    >
      {children}
    </Button>
  )
}

export function AlertDialogAction({ onClick, children, variant = 'default' }: AlertDialogActionProps) {
  const { setOpen } = React.useContext(AlertDialogContext)

  return (
    <Button
      variant={variant}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
    >
      {children}
    </Button>
  )
}
