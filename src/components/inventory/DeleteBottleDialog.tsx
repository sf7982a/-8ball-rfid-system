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
import { Loader2, AlertTriangle } from 'lucide-react'
import type { BottleWithLocation } from '../../types/inventory'

interface DeleteBottleDialogProps {
  bottle: BottleWithLocation | null
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function DeleteBottleDialog({
  bottle,
  open,
  onClose,
  onConfirm,
  isLoading = false,
  error
}: DeleteBottleDialogProps) {
  if (!bottle) return null

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      // Error handling is managed by parent component
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Bottle
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this bottle? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bottle details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">RFID Tag:</div>
              <div className="font-mono">{bottle.rfidTag}</div>
              
              <div className="text-muted-foreground">Brand:</div>
              <div className="font-medium">{bottle.brand}</div>
              
              <div className="text-muted-foreground">Product:</div>
              <div>{bottle.product}</div>
              
              <div className="text-muted-foreground">Type:</div>
              <div className="capitalize">{bottle.type}</div>
              
              <div className="text-muted-foreground">Size:</div>
              <div>{bottle.size}</div>
              
              <div className="text-muted-foreground">Status:</div>
              <div className="capitalize">{bottle.status}</div>
              
              {bottle.location && (
                <>
                  <div className="text-muted-foreground">Location:</div>
                  <div>{bottle.location.name}</div>
                </>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Bottle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}