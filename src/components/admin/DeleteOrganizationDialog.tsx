import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { type Organization as APIOrganization, type OrganizationStats } from '../../lib/api/organizations'
import {
  AlertTriangle,
  Building,
  Users,
  Database,
  Trash2
} from 'lucide-react'

type Organization = APIOrganization & OrganizationStats

interface DeleteOrganizationDialogProps {
  organization: Organization | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteOrganizationDialog({
  organization,
  open,
  onClose,
  onConfirm,
  isLoading = false
}: DeleteOrganizationDialogProps) {
  if (!organization) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'trial': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'suspended': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'premium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'basic': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'trial': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const hasData = organization.user_count > 0 || organization.bottles_tracked > 0 || organization.monthly_scans > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization Details */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{organization.name}</span>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(organization.status)}>
                  {organization.status}
                </Badge>
                <Badge className={getTierColor(organization.tier)}>
                  {organization.tier}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Users className="h-3 w-3" />
                  Users
                </div>
                <div className="font-medium">{organization.user_count}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Database className="h-3 w-3" />
                  Bottles
                </div>
                <div className="font-medium">{organization.bottles_tracked}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Building className="h-3 w-3" />
                  Scans
                </div>
                <div className="font-medium">{organization.monthly_scans.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Warning Messages */}
          <Alert className="border-destructive/50 text-destructive dark:border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This action cannot be undone.</strong> This will permanently delete the organization and all associated data.
            </AlertDescription>
          </Alert>

          {hasData && (
            <Alert className="border-orange-500/50 text-orange-400 dark:border-orange-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This organization contains active data:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  {organization.user_count > 0 && (
                    <li>{organization.user_count} user{organization.user_count !== 1 ? 's' : ''} will lose access</li>
                  )}
                  {organization.bottles_tracked > 0 && (
                    <li>{organization.bottles_tracked} tracked bottle{organization.bottles_tracked !== 1 ? 's' : ''} will be deleted</li>
                  )}
                  {organization.monthly_scans > 0 && (
                    <li>All scan history ({organization.monthly_scans.toLocaleString()} scans) will be lost</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation Text */}
          <div className="p-3 bg-muted/50 rounded border">
            <p className="text-sm text-muted-foreground">
              To confirm deletion, please verify you want to delete:
            </p>
            <p className="font-mono text-sm mt-1 font-medium">
              {organization.name} ({organization.slug})
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              'Deleting...'
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}