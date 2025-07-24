import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LocationStats } from '@/lib/api/dashboard'

interface LocationStatsCardProps {
  location: LocationStats
  isSelected?: boolean
  onClick?: () => void
}

export function LocationStatsCard({ location, isSelected, onClick }: LocationStatsCardProps) {
  const getStockBadgeVariant = (lowStockCount: number) => {
    if (lowStockCount === 0) return 'default'
    if (lowStockCount < 3) return 'secondary'
    return 'destructive'
  }

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{location.locationName}</span>
          <Badge variant="outline" className="text-xs">
            {location.locationCode}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Bottles</span>
          <span className="font-semibold">{location.bottleCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Value</span>
          <span className="font-semibold">${location.totalValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Low Stock</span>
          <Badge variant={getStockBadgeVariant(location.lowStockCount)}>
            {location.lowStockCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}