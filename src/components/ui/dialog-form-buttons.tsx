/**
 * @fileoverview Reusable dialog form buttons component
 *
 * Provides consistent Cancel/Submit button layout for all dialog forms
 *
 * @module components/ui/dialog-form-buttons
 */

import { Button } from '@/components/ui/button'

interface DialogFormButtonsProps {
  onCancel: () => void
  submitLabel?: string
  loadingLabel?: string
  isLoading?: boolean
  submitDisabled?: boolean
}

/**
 * Standard Cancel/Submit button layout for dialog forms
 */
export function DialogFormButtons({
  onCancel,
  submitLabel = 'Save',
  loadingLabel = 'Saving...',
  isLoading = false,
  submitDisabled = false,
}: DialogFormButtonsProps) {
  return (
    <div className="flex gap-2 justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading || submitDisabled}>
        {isLoading ? loadingLabel : submitLabel}
      </Button>
    </div>
  )
}
