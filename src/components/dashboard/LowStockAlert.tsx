import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { LowStockItem } from '@/lib/api/dashboard'

interface LowStockAlertProps {
  items: LowStockItem[]
}

const getStockLevel = (quantity: number) => {
  if (quantity <= 0.1) return { level: 'critical', variant: 'destructive' as const, color: 'text-red-600' }
  if (quantity <= 0.25) return { level: 'low', variant: 'secondary' as const, color: 'text-yellow-600' }
  return { level: 'ok', variant: 'default' as const, color: 'text-green-600' }
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  const criticalItems = items.filter(item => item.currentQuantity <= 0.1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Low Stock Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {criticalItems.length > 0 && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {criticalItems.length} bottles are critically low (≤10%)
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => {
            const stockInfo = getStockLevel(item.currentQuantity)
            return (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">{item.brand} {item.product}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.locationName} • {item.type}
                  </div>
                  {item.lastScanned && (
                    <div className="text-xs text-muted-foreground">
                      Last scanned: {item.lastScanned.toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={stockInfo.variant}>
                    {(item.currentQuantity * 100).toFixed(0)}%
                  </Badge>
                  <div className={`text-xs font-medium ${stockInfo.color}`}>
                    {stockInfo.level.toUpperCase()}
                  </div>
                </div>
              </div>
            )
          })}
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <div className="text-green-600 font-medium">✓ All bottles have sufficient stock</div>
              <div className="text-sm mt-1">No items below 25% capacity</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}