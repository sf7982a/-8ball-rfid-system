import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { 
  Scan, 
  Play, 
  Square, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Clock,
  Package,
  X,
  Wifi,
  WifiOff,
  Battery,
  Bluetooth,
  Usb
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BottleService, LocationService } from '../../lib/api/bottles'
import { ScanningService } from '../../lib/api/scanning'
import { UnknownRFIDModal } from '../../components/scan/UnknownRFIDModal'
import { RFIDStatusMonitor } from '../../components/scan/RFIDStatusMonitor'
import { RFIDErrorBoundary } from '../../components/scan/RFIDErrorBoundary'
import { useRFIDScanner } from '../../hooks/useRFIDScanner'
import type { BottleWithLocation, Location } from '../../types/inventory'
import type { ScannedTag } from '../../lib/rfid/zebra-rfd40'

interface ScannedBottle extends BottleWithLocation {
  scannedAt: Date
  isNew?: boolean
}

interface ScanSession {
  id: string
  startedAt: Date
  locationId: string
  scannedBottles: ScannedBottle[]
  isActive: boolean
}

export function ScanPage() {
  const { organization } = useAuth()
  
  // State
  const [session, setSession] = useState<ScanSession | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [availableBottles, setAvailableBottles] = useState<BottleWithLocation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [recentScan, setRecentScan] = useState(false) // For visual feedback
  const [unknownBottles, setUnknownBottles] = useState<Array<{id: string, rfidTag: string, scannedAt: Date}>>([])
  const [showUnknownModal, setShowUnknownModal] = useState(false)
  const [pendingUnknownBottles, setPendingUnknownBottles] = useState<Array<{id: string, rfidTag: string, scannedAt: Date}>>([])
  const [modalLoading, setModalLoading] = useState(false)
  
  // RFID Scanner Integration
  const { state: rfidState, actions: rfidActions } = useRFIDScanner({
    autoInitialize: true,
    duplicateFilterWindow: 2000, // 2 second duplicate filter
    maxTagHistory: 500,
    onTagScanned: handleTagScanned,
    onConnectionChanged: handleConnectionChanged,
    onError: handleRFIDError,
    onBatteryLevelChanged: handleBatteryLevelChanged,
    connectionConfig: {
      transport: 'usb',
      autoReconnect: true,
      tagReportMode: 'immediate',
      triggerMode: 'manual'
    }
  })

  // Load data on mount
  useEffect(() => {
    if (organization?.id) {
      loadLocationsAndBottles()
    }
  }, [organization?.id])

  const loadLocationsAndBottles = async () => {
    try {
      const [locationsData, bottlesResult] = await Promise.all([
        LocationService.getLocations(organization!.id),
        BottleService.getBottles(organization!.id, {}, { field: 'createdAt', direction: 'desc' }, 1, 100)
      ])
      setLocations(locationsData)
      setAvailableBottles(bottlesResult.bottles)
      
      // Auto-select first location if available
      if (locationsData.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locationsData[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    }
  }

  // Start scanning session
  const startSession = async () => {
    if (!selectedLocationId) {
      setError('Please select a location first')
      return
    }
    
    if (!rfidState.isSupported) {
      setError('RFID hardware not supported on this device')
      return
    }
    
    try {
      // Ensure RFID reader is connected
      if (!rfidState.isConnected) {
        await rfidActions.connect()
      }
      
      const sessionId = Date.now().toString()
      const newSession: ScanSession = {
        id: sessionId,
        startedAt: new Date(),
        locationId: selectedLocationId,
        scannedBottles: [],
        isActive: true
      }
      
      // Start RFID scanning
      await rfidActions.startScanning(sessionId)
      
      setSession(newSession)
      setError(null)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning session'
      setError(errorMessage)
    }
  }

  // Stop scanning session
  const stopSession = async () => {
    try {
      // Stop RFID scanning
      await rfidActions.stopScanning()
      
      if (session) {
        setSession({ ...session, isActive: false })
      }
    } catch (error) {
      console.warn('Error stopping RFID scanning:', error)
      // Still update session state even if stop fails
      if (session) {
        setSession({ ...session, isActive: false })
      }
    }
  }

  // RFID Event Handlers
  function handleTagScanned(scannedTag: ScannedTag) {
    if (!session) return
    
    // Check if this RFID tag corresponds to an existing bottle
    const existingBottle = availableBottles.find(bottle => bottle.rfidTag === scannedTag.rfidTag)
    
    if (existingBottle) {
      // Known bottle - add to scanned list if not already scanned
      const alreadyScanned = session.scannedBottles.some(b => b.id === existingBottle.id)
      
      if (!alreadyScanned) {
        const scannedBottle: ScannedBottle = {
          ...existingBottle,
          scannedAt: scannedTag.timestamp,
          isNew: false
        }
        
        setSession({
          ...session,
          scannedBottles: [...session.scannedBottles, scannedBottle]
        })
        
        // Visual feedback
        setRecentScan(true)
        setTimeout(() => setRecentScan(false), 500)
      }
    } else {
      // Unknown RFID tag - collect for bulk processing
      const unknownBottle = {
        id: `unknown-${Date.now()}-${scannedTag.rfidTag}`,
        rfidTag: scannedTag.rfidTag,
        scannedAt: scannedTag.timestamp
      }
      
      // Check if we already have this unknown tag
      const alreadyUnknown = unknownBottles.some(b => b.rfidTag === scannedTag.rfidTag)
      
      if (!alreadyUnknown) {
        setUnknownBottles(prev => [...prev, unknownBottle])
        
        // Visual feedback
        setRecentScan(true)
        setTimeout(() => setRecentScan(false), 500)
      }
    }
  }
  
  function handleConnectionChanged(connected: boolean) {
    if (!connected) {
      // Stop session if connection is lost during scanning
      if (session?.isActive) {
        setSession({ ...session, isActive: false })
      }
      setError('RFID reader connection lost')
    }
  }
  
  function handleRFIDError(error: string) {
    setError(`RFID Reader Error: ${error}`)
  }
  
  function handleBatteryLevelChanged(level: number) {
    // Battery level updates are handled in the hook state
    if (level < 20) {
      console.warn(`RFID reader battery low: ${level}%`)
    }
  }

  // Get current last scanned RFID from the hook state
  const lastScannedRFID = useMemo(() => {
    return rfidState.lastScannedTag
  }, [rfidState.lastScannedTag])

  // Keyboard shortcuts for hardware control
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (session?.isActive) {
          // Space bar can trigger manual scan if supported
          console.log('Manual scan triggered')
        } else if (selectedLocationId && rfidState.isConnected) {
          startSession()
        }
      }
      if (event.key === 'Escape' && rfidState.isScanning) {
        stopSession()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [session, rfidState.isScanning, rfidState.isConnected, selectedLocationId])

  // Remove bottle from scan batch
  const removeBottleFromBatch = (bottleId: string) => {
    if (!session) return
    
    setSession({
      ...session,
      scannedBottles: session.scannedBottles.filter(b => b.id !== bottleId)
    })
  }

  // Remove unknown bottle from batch
  const removeUnknownBottle = (bottleId: string) => {
    setUnknownBottles(prev => prev.filter(b => b.id !== bottleId))
  }

  // Handle unknown RFID bottles
  const handleUnknownBottles = () => {
    if (unknownBottles.length === 0) return
    
    setPendingUnknownBottles([...unknownBottles])
    setShowUnknownModal(true)
  }

  // Process unknown bottles with product details
  const handleUnknownBottlesConfirm = async (processedBottles: Array<any>) => {
    try {
      setModalLoading(true)
      
      // Create bottles in the backend using bulk creation for better performance
      const bottlesData = processedBottles.map(bottle => ({
        rfidTag: bottle.rfidTag,
        brand: bottle.brand,
        product: bottle.product,
        type: bottle.type,
        size: bottle.size,
        costPrice: bottle.costPrice || null,
        retailPrice: bottle.retailPrice || null,
        currentQuantity: '1.00',
        status: 'active',
        locationId: session?.locationId || null,
        metadata: { 
          notes: bottle.notes || null,
          bulkScanned: true,
          sessionId: session?.id,
          originalScannedAt: bottle.scannedAt
        }
      }))

      const createdBottles = await BottleService.createBottlesBulk(organization!.id, bottlesData)

      // Convert created bottles to ScannedBottle format
      const newScannedBottles = createdBottles.map(bottle => ({
        ...bottle,
        scannedAt: processedBottles.find(p => p.rfidTag === bottle.rfidTag)?.scannedAt || new Date(),
        isNew: true,
        location: session?.locationId ? locations.find(l => l.id === session.locationId) || null : null
      })) as ScannedBottle[]

      // Add to session
      if (session) {
        setSession({
          ...session,
          scannedBottles: [...session.scannedBottles, ...newScannedBottles]
        })
      }

      // Clear unknown bottles that were processed
      setUnknownBottles(prev => 
        prev.filter(unknown => 
          !processedBottles.some(processed => processed.id === unknown.id)
        )
      )

      // Refresh available bottles list
      await loadLocationsAndBottles()

      setShowUnknownModal(false)
      setPendingUnknownBottles([])
      
    } catch (err: any) {
      setError(err.message || 'Failed to create bottles in inventory')
    } finally {
      setModalLoading(false)
    }
  }

  // Confirm and save scan session
  const confirmSession = async () => {
    if (!session || session.scannedBottles.length === 0) return

    try {
      
      // Prepare scan data for service
      const scannedBottleData = session.scannedBottles.map(bottle => ({
        bottleId: bottle.id,
        rfidTag: bottle.rfidTag,
        isNew: bottle.isNew || false,
        scannedAt: bottle.scannedAt
      }))

      // Save session using ScanningService
      await ScanningService.completeSession(session.id, scannedBottleData)
      
      // Update bottle inventory based on scan results
      const inventoryResult = await ScanningService.updateBottleInventory(
        organization!.id,
        session.locationId,
        scannedBottleData
      )

      // Reset session and state
      setSession(null)
      setUnknownBottles([])
      setError(null)
      
      // Clear RFID scanner state
      rfidActions.clearScannedTags()
      
      // Stop RFID scanning when session is confirmed
      if (rfidState.isScanning) {
        await rfidActions.stopScanning()
      }
      
      // Refresh the bottles list to show newly added inventory
      await loadLocationsAndBottles()
      
      // Show success (in real app, would show toast notification)
      const newBottles = inventoryResult.newBottles
      const updatedBottles = inventoryResult.updatedBottles
      
      alert(`✅ Scan session completed successfully!
      
📦 Total bottles processed: ${session.scannedBottles.length}
🔄 Existing bottles updated: ${updatedBottles}
✨ New bottles added to inventory: ${newBottles}
📍 Location: ${selectedLocation?.name}

${newBottles > 0 ? 'New bottles are now available in your inventory system!' : ''}`)
      
    } catch (err: any) {
      setError(err.message || 'Failed to save session')
    }
  }

  // Get selected location name
  const selectedLocation = locations.find(l => l.id === selectedLocationId)
  const sessionDuration = session ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000) : 0

  return (
    <RFIDErrorBoundary onReset={() => {
      // Reset RFID scanner state on error boundary reset
      rfidActions.clearScannedTags()
      setSession(null)
      setUnknownBottles([])
      setError(null)
    }}>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">RFID Scanner</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bulk inventory scanning and management
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scanner Control */}
        <div className="lg:col-span-1 space-y-6">
          {/* RFID Status Monitor */}
          <RFIDStatusMonitor 
            rfidState={rfidState}
            rfidActions={rfidActions}
            showDiagnostics={true}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scanner Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Location Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Scan Location</label>
                <Select 
                  value={selectedLocationId} 
                  onValueChange={setSelectedLocationId}
                  disabled={!!session?.isActive}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RFID Reader Status */}
              <div className="space-y-3 mb-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connection:</span>
                  <div className="flex items-center gap-1">
                    {rfidState.isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Connected
                        </Badge>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <Badge variant="outline" className="text-red-700 border-red-300">
                          Disconnected
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Transport Type */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transport:</span>
                  <div className="flex items-center gap-1">
                    {rfidState.transport === 'usb' ? (
                      <Usb className="h-3 w-3" />
                    ) : rfidState.transport === 'bluetooth' ? (
                      <Bluetooth className="h-3 w-3" />
                    ) : (
                      <Wifi className="h-3 w-3" />
                    )}
                    <span className="text-xs font-mono">{rfidState.transport.toUpperCase()}</span>
                  </div>
                </div>
                
                {/* Battery Level */}
                {rfidState.isConnected && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Battery:</span>
                    <div className="flex items-center gap-1">
                      <Battery className={`h-3 w-3 ${
                        rfidState.batteryLevel > 50 ? 'text-green-500' :
                        rfidState.batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className="text-xs">{rfidState.batteryLevel}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Status */}
              <div className="text-center py-6">
                <div className={`mb-4 text-6xl transition-all duration-300 ${
                  rfidState.isScanning ? (recentScan ? 'text-blue-400 scale-110' : 'animate-pulse text-green-500') : 'text-gray-400'
                }`}>
                  <Scan className="h-16 w-16 mx-auto" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span>Status:</span>
                    {rfidState.isScanning ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        🟢 Scanning Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        🔴 Inactive
                      </Badge>
                    )}
                  </div>
                  
                  {lastScannedRFID && (
                    <p className="text-xs text-muted-foreground">
                      Last: {lastScannedRFID}
                    </p>
                  )}
                  
                  {session?.isActive && rfidState.isScanning && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Hardware scanning active - tags detected automatically
                    </p>
                  )}
                  
                  {!rfidState.isSupported && (
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ RFID hardware not detected - please use Zebra Enterprise Browser
                    </p>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="space-y-2 mt-6">
                  {!rfidState.isConnected && rfidState.isSupported ? (
                    <Button 
                      onClick={rfidActions.connect} 
                      className="w-full"
                      variant="outline"
                    >
                      <Wifi className="mr-2 h-4 w-4" />
                      Connect RFID Reader
                    </Button>
                  ) : null}
                  
                  {!session?.isActive ? (
                    <Button 
                      onClick={startSession} 
                      className="w-full"
                      disabled={!selectedLocationId || !rfidState.isConnected}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Scanning Session
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Scanning
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Stats & Scanned Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Session Stats */}
          {session && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold text-sm">{selectedLocation?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold text-sm">
                        {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Scanned</p>
                      <p className="font-semibold text-lg">{session.scannedBottles.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unknown</p>
                      <p className="font-semibold text-lg">
                        {unknownBottles.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Unknown Bottles - Bulk Inventory Addition */}
          {unknownBottles.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-yellow-800 dark:text-yellow-200">
                      Unknown RFID Tags ({unknownBottles.length})
                    </CardTitle>
                  </div>
                  <Button 
                    onClick={handleUnknownBottles}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add to Inventory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    These RFID tags were not found in your inventory. Add them as new bottles to complete your bulk scanning session.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {unknownBottles.map((bottle) => (
                      <div 
                        key={bottle.id}
                        className="flex items-center justify-between p-2 bg-background rounded border"
                      >
                        <span className="text-xs font-mono">{bottle.rfidTag}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeUnknownBottle(bottle.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scanned Bottles List */}
          {session && session.scannedBottles.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scanned Bottles ({session.scannedBottles.length})</CardTitle>
                  <Button 
                    onClick={confirmSession}
                    disabled={rfidState.isScanning}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm & Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {session.scannedBottles.map((bottle) => (
                    <div 
                      key={bottle.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-background px-2 py-1 rounded text-xs">
                            {bottle.rfidTag}
                          </span>
                          {bottle.isNew && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm font-medium">{bottle.brand} - {bottle.product}</p>
                          <p className="text-xs text-muted-foreground">
                            {bottle.type} • {bottle.size} • 
                            Scanned: {bottle.scannedAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeBottleFromBatch(bottle.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Getting Started */}
          {!session && (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Select a location and start your scanning session to begin bulk inventory operations.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Real-time RFID tag detection simulation</p>
                    <p>• Automatic bottle identification</p>
                    <p>• Location-based scanning sessions</p>
                    <p>• Integration with inventory system</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unknown RFID Modal */}
      <UnknownRFIDModal
        open={showUnknownModal}
        onClose={() => setShowUnknownModal(false)}
        unknownBottles={pendingUnknownBottles}
        onConfirm={handleUnknownBottlesConfirm}
        loading={modalLoading}
      />
      </div>
    </RFIDErrorBoundary>
  )
}