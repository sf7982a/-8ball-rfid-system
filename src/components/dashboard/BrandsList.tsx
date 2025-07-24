import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { BrandStats } from '@/lib/api/dashboard'

interface BrandsListProps {
  brands: BrandStats[]
}

export function BrandsList({ brands }: BrandsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBrands = brands.filter(brand =>
    brand.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Brands</CardTitle>
        <Input
          placeholder="Search brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredBrands.map((brand) => (
            <div key={brand.brand} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-semibold">{brand.brand}</div>
                <div className="text-sm text-muted-foreground">
                  {brand.bottleCount} bottles • ${brand.totalValue.toFixed(2)}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {brand.locations.map((location) => (
                    <Badge key={location.name} variant="outline" className="text-xs">
                      {location.name} ({location.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filteredBrands.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No brands found matching "{searchTerm}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}