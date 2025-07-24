/**
 * React Hook for RFID Scanner Integration
 * 
 * Provides a clean interface for React components to interact with
 * Zebra RFD40 RFID hardware, including connection management, tag scanning,
 * and real-time event handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getRFIDService, 
  isRFIDSupported, 
  type RFIDEvent, 
  type ScannedTag,
  type RFIDConnectionConfig 
} from '../lib/rfid/zebra-rfd40';

export interface RFIDScannerState {
  // Connection status
  isSupported: boolean;
  isInitialized: boolean;
  isConnected: boolean;
  isScanning: boolean;
  
  // Reader information
  batteryLevel: number;
  transport: string;
  lastError: string | null;
  
  // Scanning data
  scannedTags: ScannedTag[];
  lastScannedTag: string | null;
  scanCount: number;
  
  // Session management
  sessionId: string | null;
  sessionStartTime: Date | null;
}

export interface RFIDScannerActions {
  // Connection management
  initialize: (config?: Partial<RFIDConnectionConfig>) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Scanning operations
  startScanning: (sessionId?: string) => Promise<void>;
  stopScanning: () => Promise<void>;
  clearScannedTags: () => void;
  
  // Utility functions
  getBatteryLevel: () => Promise<number>;
  checkConnection: () => Promise<boolean>;
}

export interface UseRFIDScannerOptions {
  // Auto-initialize on mount
  autoInitialize?: boolean;
  
  // Auto-connect after initialization
  autoConnect?: boolean;
  
  // Filter duplicate tags within this time window (ms)
  duplicateFilterWindow?: number;
  
  // Maximum number of tags to keep in memory
  maxTagHistory?: number;
  
  // Custom event handlers
  onTagScanned?: (tag: ScannedTag) => void;
  onConnectionChanged?: (connected: boolean) => void;
  onError?: (error: string) => void;
  onBatteryLevelChanged?: (level: number) => void;
  
  // Connection configuration
  connectionConfig?: Partial<RFIDConnectionConfig>;
}

export interface UseRFIDScannerResult {
  state: RFIDScannerState;
  actions: RFIDScannerActions;
}

/**
 * Custom React hook for RFID scanner integration
 */
export function useRFIDScanner(options: UseRFIDScannerOptions = {}): UseRFIDScannerResult {
  const {
    autoInitialize = false,
    autoConnect = false,
    duplicateFilterWindow = 1000,
    maxTagHistory = 1000,
    connectionConfig
  } = options;

  // State management
  const [state, setState] = useState<RFIDScannerState>({
    isSupported: isRFIDSupported(),
    isInitialized: false,
    isConnected: false,
    isScanning: false,
    batteryLevel: 0,
    transport: 'usb',
    lastError: null,
    scannedTags: [],
    lastScannedTag: null,
    scanCount: 0,
    sessionId: null,
    sessionStartTime: null
  });

  // Refs for managing cleanup and avoiding stale closures
  const rfidServiceRef = useRef(getRFIDService());
  const duplicateFilterRef = useRef(new Map<string, number>());
  const optionsRef = useRef(options);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Initialize the RFID service
   */
  const initialize = useCallback(async (config?: Partial<RFIDConnectionConfig>) => {
    try {
      setState(prev => ({ ...prev, lastError: null }));
      
      const finalConfig = { ...connectionConfig, ...config };
      await rfidServiceRef.current.initialize(finalConfig);
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        transport: finalConfig?.transport || 'usb'
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize RFID reader';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, [connectionConfig]);

  /**
   * Connect to the RFID reader
   */
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, lastError: null }));
      
      if (!state.isInitialized) {
        await initialize();
      }
      
      await rfidServiceRef.current.connect();
      
      // Get initial battery level
      try {
        const batteryLevel = await rfidServiceRef.current.getBatteryLevel();
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          batteryLevel
        }));
      } catch (batteryError) {
        // Don't fail connection if battery level can't be read
        setState(prev => ({ ...prev, isConnected: true }));
      }
      
      optionsRef.current.onConnectionChanged?.(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to RFID reader';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, [state.isInitialized, initialize]);

  /**
   * Disconnect from the RFID reader
   */
  const disconnect = useCallback(async () => {
    try {
      await rfidServiceRef.current.disconnect();
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isScanning: false,
        sessionId: null,
        sessionStartTime: null
      }));
      optionsRef.current.onConnectionChanged?.(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect from RFID reader';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Start scanning for RFID tags
   */
  const startScanning = useCallback(async (sessionId?: string) => {
    try {
      setState(prev => ({ ...prev, lastError: null }));
      
      if (!state.isConnected) {
        throw new Error('RFID reader not connected');
      }
      
      await rfidServiceRef.current.startScanning(sessionId);
      
      setState(prev => ({ 
        ...prev, 
        isScanning: true,
        sessionId: sessionId || null,
        sessionStartTime: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, [state.isConnected]);

  /**
   * Stop scanning for RFID tags
   */
  const stopScanning = useCallback(async () => {
    try {
      await rfidServiceRef.current.stopScanning();
      setState(prev => ({ 
        ...prev, 
        isScanning: false,
        sessionId: null,
        sessionStartTime: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop scanning';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Clear scanned tags history
   */
  const clearScannedTags = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      scannedTags: [], 
      scanCount: 0, 
      lastScannedTag: null 
    }));
    duplicateFilterRef.current.clear();
  }, []);

  /**
   * Get current battery level
   */
  const getBatteryLevel = useCallback(async (): Promise<number> => {
    try {
      const level = await rfidServiceRef.current.getBatteryLevel();
      setState(prev => ({ ...prev, batteryLevel: level }));
      return level;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get battery level';
      optionsRef.current.onError?.(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Check connection status
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const status = rfidServiceRef.current.getStatus();
    setState(prev => ({ ...prev, isConnected: status.connected }));
    return status.connected;
  }, []);

  /**
   * Handle RFID events from the hardware
   */
  const handleRFIDEvent = useCallback((event: RFIDEvent) => {
    switch (event.type) {
      case 'tagRead':
        if (event.data.tag) {
          const now = Date.now();
          const tagId = event.data.tag;
          
          // Check for duplicate tags within the filter window
          const lastScanTime = duplicateFilterRef.current.get(tagId);
          if (lastScanTime && (now - lastScanTime) < duplicateFilterWindow) {
            return; // Skip duplicate
          }
          
          duplicateFilterRef.current.set(tagId, now);
          
          const scannedTag: ScannedTag = {
            rfidTag: tagId,
            rssi: event.data.rssi || -50,
            timestamp: new Date(event.data.timestamp || now),
            sessionId: state.sessionId || undefined
          };
          
          setState(prev => {
            const newTags = [scannedTag, ...prev.scannedTags].slice(0, maxTagHistory);
            return {
              ...prev,
              scannedTags: newTags,
              lastScannedTag: tagId,
              scanCount: prev.scanCount + 1
            };
          });
          
          optionsRef.current.onTagScanned?.(scannedTag);
        }
        break;
        
      case 'connectionChanged':
        const connected = event.data.connected === true;
        setState(prev => ({ 
          ...prev, 
          isConnected: connected,
          isScanning: connected ? prev.isScanning : false
        }));
        optionsRef.current.onConnectionChanged?.(connected);
        break;
        
      case 'batteryStatus':
        if (typeof event.data.batteryLevel === 'number') {
          setState(prev => ({ ...prev, batteryLevel: event.data.batteryLevel! }));
          optionsRef.current.onBatteryLevelChanged?.(event.data.batteryLevel);
        }
        break;
        
      case 'error':
        const errorMessage = event.data.errorMessage || 'Unknown RFID error';
        setState(prev => ({ ...prev, lastError: errorMessage }));
        optionsRef.current.onError?.(errorMessage);
        break;
    }
  }, [duplicateFilterWindow, maxTagHistory, state.sessionId]);

  /**
   * Setup event listeners and auto-initialization
   */
  useEffect(() => {
    const service = rfidServiceRef.current;
    
    // Add event listener
    service.addEventListener(handleRFIDEvent);
    
    // Auto-initialize if requested
    if (autoInitialize && state.isSupported && !state.isInitialized) {
      initialize().then(() => {
        if (autoConnect) {
          connect().catch(error => {
            console.warn('Auto-connect failed:', error);
          });
        }
      }).catch(error => {
        console.warn('Auto-initialization failed:', error);
      });
    }
    
    return () => {
      service.removeEventListener(handleRFIDEvent);
    };
  }, [autoInitialize, autoConnect, state.isSupported, state.isInitialized, handleRFIDEvent, initialize, connect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      const service = rfidServiceRef.current;
      
      // Stop scanning if active
      if (state.isScanning) {
        service.stopScanning().catch(console.warn);
      }
      
      // Disconnect if connected
      if (state.isConnected) {
        service.disconnect().catch(console.warn);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  /**
   * Actions object for the hook
   */
  const actions: RFIDScannerActions = {
    initialize,
    connect,
    disconnect,
    startScanning,
    stopScanning,
    clearScannedTags,
    getBatteryLevel,
    checkConnection
  };

  return {
    state,
    actions
  };
}