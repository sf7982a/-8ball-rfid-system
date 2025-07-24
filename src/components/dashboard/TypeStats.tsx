import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TypeStats as TypeStatsType } from '@/lib/api/dashboard'

interface TypeStatsProps {
  types: TypeStatsType[]
}

const typeColors: Record<string, string> = {
  vodka: 'bg-blue-100 text-blue-800 border-blue-200',
  whiskey: 'bg-amber-100 text-amber-800 border-amber-200',
  rum: 'bg-orange-100 text-orange-800 border-orange-200',
  gin: 'bg-green-100 text-green-800 border-green-200',
  tequila: 'bg-lime-100 text-lime-800 border-lime-200',
  brandy: 'bg-red-100 text-red-800 border-red-200',
  liqueur: 'bg-purple-100 text-purple-800 border-purple-200',
  wine: 'bg-rose-100 text-rose-800 border-rose-200',
  beer: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
}

export function TypeStats({ types }: TypeStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {types.map((type) => (
            <div key={type.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge 
                  variant="outline" 
                  className={`capitalize ${typeColors[type.type] || typeColors.other}`}
                >
                  {type.type}
                </Badge>
                <div>
                  <div className="font-semibold">{type.bottleCount} bottles</div>
                  <div className="text-sm text-muted-foreground">
                    {type.totalQuantity.toFixed(1)} units
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${type.totalValue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  ${(type.totalValue / type.bottleCount).toFixed(2)}/bottle
                </div>
              </div>
            </div>
          ))}
          {types.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No inventory data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}