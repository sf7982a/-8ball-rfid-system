import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { AlertCircle, Trash2 } from 'lucide-react'
import type { Location } from '../../types/inventory'

interface DeleteLocationDialogProps {
  location: Location | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  error: string | null
}

export function DeleteLocationDialog({
  location,
  open,
  onClose,
  onConfirm,
  isLoading,
  error
}: DeleteLocationDialogProps) {
  if (!location) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-2 border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Location
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{location.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-destructive/50 text-destructive dark:border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}