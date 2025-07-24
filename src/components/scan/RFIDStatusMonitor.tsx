/**
 * RFID Status Monitor Component
 * 
 * Displays comprehensive status information about the Zebra RFD40 RFID reader
 * including connection status, battery level, scanning state, and diagnostic info.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Bluetooth, 
  Usb, 
  Scan,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react'
import type { RFIDScannerState, RFIDScannerActions } from '../../hooks/useRFIDScanner'

interface RFIDStatusMonitorProps {
  rfidState: RFIDScannerState
  rfidActions: RFIDScannerActions
  className?: string
  showDiagnostics?: boolean
}

export function RFIDStatusMonitor({ 
  rfidState, 
  rfidActions, 
  className = '',
  showDiagnostics = false 
}: RFIDStatusMonitorProps) {
  const [connecting, setConnecting] = useState(false)
  const [refreshingBattery, setRefreshingBattery] = useState(false)

  /**
   * Handle manual connection
   */
  const handleConnect = async () => {
    try {
      setConnecting(true)
      await rfidActions.connect()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setConnecting(false)
    }
  }

  /**
   * Handle manual disconnection
   */
  const handleDisconnect = async () => {
    try {
      await rfidActions.disconnect()
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  /**
   * Refresh battery level
   */
  const handleRefreshBattery = async () => {
    try {
      setRefreshingBattery(true)
      await rfidActions.getBatteryLevel()
    } catch (error) {
      console.error('Failed to refresh battery level:', error)
    } finally {
      setRefreshingBattery(false)
    }
  }

  /**
   * Get connection status color and icon
   */
  const getConnectionStatus = () => {
    if (!rfidState.isSupported) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 border-gray-300',
        icon: AlertCircle,
        text: 'Not Supported',
        description: 'RFID hardware not detected'
      }
    }

    if (rfidState.isConnected) {
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100 border-green-300',
        icon: CheckCircle,
        text: 'Connected',
        description: 'RFID reader ready'
      }
    }

    if (connecting) {
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 border-blue-300',
        icon: Loader2,
        text: 'Connecting...',
        description: 'Establishing connection'
      }
    }

    return {
      color: 'text-red-700',
      bgColor: 'bg-red-100 border-red-300',
      icon: WifiOff,
      text: 'Disconnected',
      description: 'RFID reader not connected'
    }
  }

  /**
   * Get transport icon
   */
  const getTransportIcon = () => {
    switch (rfidState.transport) {
      case 'usb':
        return Usb
      case 'bluetooth':
        return Bluetooth
      default:
        return Wifi
    }
  }

  /**
   * Get battery status
   */
  const getBatteryStatus = () => {
    const level = rfidState.batteryLevel
    
    if (level >= 50) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        status: 'Good'
      }
    } else if (level >= 20) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        status: 'Low'
      }
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        status: 'Critical'
      }
    }
  }

  const connectionStatus = getConnectionStatus()
  const TransportIcon = getTransportIcon()
  const batteryStatus = getBatteryStatus()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scan className="h-5 w-5" />
          RFID Reader Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <connectionStatus.icon 
              className={`h-5 w-5 ${connectionStatus.color} ${connecting ? 'animate-spin' : ''}`}
            />
            <div>
              <p className="font-medium">{connectionStatus.text}</p>
              <p className="text-sm text-muted-foreground">{connectionStatus.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={connectionStatus.bgColor + ' ' + connectionStatus.color}>
            {connectionStatus.text}
          </Badge>
        </div>

        {/* Connection Controls */}
        {rfidState.isSupported && (
          <div className="flex gap-2">
            {!rfidState.isConnected ? (
              <Button 
                onClick={handleConnect}
                disabled={connecting}
                size="sm"
                className="flex-1"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
        )}

        {/* Hardware Details */}
        {rfidState.isConnected && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            
            {/* Transport Type */}
            <div className="flex items-center gap-2">
              <TransportIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Transport</p>
                <p className="text-xs text-muted-foreground uppercase">
                  {rfidState.transport}
                </p>
              </div>
            </div>

            {/* Battery Level */}
            <div className="flex items-center gap-2">
              <Battery className={`h-4 w-4 ${batteryStatus.color}`} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Battery</p>
                  <Button
                    onClick={handleRefreshBattery}
                    disabled={refreshingBattery}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshingBattery ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono">{rfidState.batteryLevel}%</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 ${batteryStatus.bgColor} ${batteryStatus.color}`}
                  >
                    {batteryStatus.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Status */}
        {rfidState.isConnected && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className={`h-4 w-4 ${rfidState.isScanning ? 'text-green-600 animate-pulse' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">Scanning Status</p>
                  <p className="text-xs text-muted-foreground">
                    {rfidState.isScanning ? 'Active - detecting tags' : 'Inactive'}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={rfidState.isScanning ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}
              >
                {rfidState.isScanning ? 'Scanning' : 'Standby'}
              </Badge>
            </div>
          </div>
        )}

        {/* Error Status */}
        {rfidState.lastError && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {rfidState.lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostics */}
        {showDiagnostics && rfidState.isConnected && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Diagnostics</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Tags Scanned:</span>
                <span className="ml-2 font-mono">{rfidState.scanCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Session:</span>
                <span className="ml-2 font-mono">
                  {rfidState.sessionId ? 'Active' : 'None'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Last Tag:</span>
                <span className="ml-2 font-mono text-xs">
                  {rfidState.lastScannedTag || 'None'}
                </span>
              </div>
              {rfidState.sessionStartTime && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Session Duration:</span>
                  <span className="ml-2 font-mono">
                    {Math.floor((Date.now() - rfidState.sessionStartTime.getTime()) / 1000)}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Not Supported Warning */}
        {!rfidState.isSupported && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>RFID hardware not detected.</strong>
              <br />
              Please ensure you are using Zebra Enterprise Browser 3.7+ on a device with RFD40/RFD90 sled or MC3300R.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}