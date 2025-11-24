/**
 * @fileoverview Dialog for leaving a collaborative word list
 *
 * This component provides options for users to leave a collaborative list:
 * - Leave and delete: Remove all data associated with the list
 * - Leave and keep copy: Create a personal copy before leaving
 */

import { useState } from 'react'
import { LogOut, Copy, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useLeaveCollaborativeList } from '@/hooks/useSharedLists'

interface LeaveCollaborativeListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sharedListId: string
  listName: string
}

type LeaveOption = 'delete' | 'keep-copy'

export function LeaveCollaborativeListDialog({
  open,
  onOpenChange,
  sharedListId,
  listName,
}: LeaveCollaborativeListDialogProps) {
  const [selectedOption, setSelectedOption] = useState<LeaveOption>('keep-copy')
  const leaveListMutation = useLeaveCollaborativeList()

  const handleLeave = async () => {
    try {
      await leaveListMutation.mutateAsync({
        sharedListId,
        keepCopy: selectedOption === 'keep-copy',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to leave collaborative list:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedOption('keep-copy')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Leave "{listName}"
          </DialogTitle>
          <DialogDescription>Choose what happens to this list when you leave</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Leave Options</Label>
            <div className="space-y-2">
              <div
                className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                  selectedOption === 'keep-copy' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedOption('keep-copy')}
              >
                <input
                  type="radio"
                  id="keep-copy"
                  name="leaveOption"
                  value="keep-copy"
                  checked={selectedOption === 'keep-copy'}
                  onChange={() => setSelectedOption('keep-copy')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="keep-copy"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Keep as personal copy
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Create a personal copy of the list with your progress, then leave the
                    collaborative list
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                  selectedOption === 'delete' ? 'border-destructive bg-destructive/5' : ''
                }`}
                onClick={() => setSelectedOption('delete')}
              >
                <input
                  type="radio"
                  id="delete"
                  name="leaveOption"
                  value="delete"
                  checked={selectedOption === 'delete'}
                  onChange={() => setSelectedOption('delete')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="delete"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Leave and delete
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Remove yourself from the list and delete all your progress data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleLeave}
            disabled={leaveListMutation.isPending}
            variant={selectedOption === 'delete' ? 'destructive' : 'default'}
          >
            {leaveListMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Leaving...
              </>
            ) : (
              'Leave List'
            )}
          </Button>
        </div>

        {leaveListMutation.error && (
          <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-md text-red-800 text-sm">
            Failed to leave the list. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
