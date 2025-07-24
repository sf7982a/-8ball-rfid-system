import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  X
} from 'lucide-react'
import { BOTTLE_TYPES, BOTTLE_SIZES, type BottleType, type BottleSize } from '../../types/inventory'

interface UnknownBottle {
  id: string
  rfidTag: string
  scannedAt: Date
}

interface ProductDetails {
  brand: string
  product: string
  type: BottleType
  size: BottleSize
  costPrice?: string
  retailPrice?: string
  notes?: string
}

interface UnknownRFIDModalProps {
  open: boolean
  onClose: () => void
  unknownBottles: UnknownBottle[]
  onConfirm: (_bottles: Array<UnknownBottle & ProductDetails>) => void
  loading?: boolean
}

export function UnknownRFIDModal({
  open,
  onClose,
  unknownBottles,
  onConfirm,
  loading = false
}: UnknownRFIDModalProps) {
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    brand: '',
    product: '',
    type: 'other' as BottleType,
    size: '750ml' as BottleSize,
    costPrice: '',
    retailPrice: '',
    notes: ''
  })

  const [individualBottles, setIndividualBottles] = useState<Array<UnknownBottle & ProductDetails>>([])
  const [mode, setMode] = useState<'bulk' | 'individual'>('bulk')
  const [error, setError] = useState<string | null>(null)

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setProductDetails({
        brand: '',
        product: '',
        type: 'other',
        size: '750ml',
        costPrice: '',
        retailPrice: '',
        notes: ''
      })
      setIndividualBottles([])
      setMode('bulk')
      setError(null)
    }
  }, [open])

  // Initialize individual bottles when switching modes
  useEffect(() => {
    if (mode === 'individual' && individualBottles.length === 0) {
      setIndividualBottles(
        unknownBottles.map(bottle => ({
          ...bottle,
          ...productDetails
        }))
      )
    }
  }, [mode, unknownBottles, productDetails, individualBottles.length])

  const handleBulkApply = () => {
    if (!productDetails.brand.trim() || !productDetails.product.trim()) {
      setError('Brand and Product are required')
      return
    }

    const processedBottles = unknownBottles.map(bottle => ({
      ...bottle,
      ...productDetails
    }))

    onConfirm(processedBottles)
  }

  const handleIndividualSave = () => {
    const hasEmptyFields = individualBottles.some(bottle => 
      !bottle.brand.trim() || !bottle.product.trim()
    )

    if (hasEmptyFields) {
      setError('All bottles must have Brand and Product filled')
      return
    }

    onConfirm(individualBottles)
  }

  const updateIndividualBottle = (index: number, updates: Partial<ProductDetails>) => {
    setIndividualBottles(prev =>
      prev.map((bottle, i) => i === index ? { ...bottle, ...updates } : bottle)
    )
  }

  const applyToAll = () => {
    setIndividualBottles(prev =>
      prev.map(bottle => ({ ...bottle, ...productDetails }))
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Unknown RFID Tags Detected
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {unknownBottles.length} Unknown Bottles
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    New inventory to be added
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'bulk' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('bulk')}
                  >
                    Bulk Entry
                  </Button>
                  <Button
                    variant={mode === 'individual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('individual')}
                  >
                    Individual Entry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Mode */}
          {mode === 'bulk' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bulk Product Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Apply the same details to all {unknownBottles.length} bottles
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Tito's"
                      value={productDetails.brand}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product">Product *</Label>
                    <Input
                      id="product"
                      placeholder="e.g., Handmade Vodka"
                      value={productDetails.product}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, product: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={productDetails.type} 
                      onValueChange={(value: BottleType) => 
                        setProductDetails(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Select 
                      value={productDetails.size} 
                      onValueChange={(value: BottleSize) => 
                        setProductDetails(prev => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={productDetails.costPrice}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, costPrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retailPrice">Retail Price</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={productDetails.retailPrice}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, retailPrice: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this product..."
                    value={productDetails.notes}
                    onChange={(e) => setProductDetails(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Mode */}
          {mode === 'individual' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Individual Bottle Details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure each bottle separately
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={applyToAll}>
                    Apply Template to All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Template */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium">Template (Apply to All)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <Input
                      placeholder="Brand"
                      value={productDetails.brand}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, brand: e.target.value }))}
                    />
                    <Input
                      placeholder="Product"
                      value={productDetails.product}
                      onChange={(e) => setProductDetails(prev => ({ ...prev, product: e.target.value }))}
                    />
                    <Select 
                      value={productDetails.type} 
                      onValueChange={(value: BottleType) => 
                        setProductDetails(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={productDetails.size} 
                      onValueChange={(value: BottleSize) => 
                        setProductDetails(prev => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Individual Bottles */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {individualBottles.map((bottle, index) => (
                    <div key={bottle.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {bottle.rfidTag}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Bottle {index + 1} of {individualBottles.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Input
                          placeholder="Brand *"
                          value={bottle.brand}
                          onChange={(e) => updateIndividualBottle(index, { brand: e.target.value })}
                        />
                        <Input
                          placeholder="Product *"
                          value={bottle.product}
                          onChange={(e) => updateIndividualBottle(index, { product: e.target.value })}
                        />
                        <Select 
                          value={bottle.type} 
                          onValueChange={(value: BottleType) => 
                            updateIndividualBottle(index, { type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BOTTLE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select 
                          value={bottle.size} 
                          onValueChange={(value: BottleSize) => 
                            updateIndividualBottle(index, { size: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BOTTLE_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={mode === 'bulk' ? handleBulkApply : handleIndividualSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Add {unknownBottles.length} Bottles to Inventory
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}