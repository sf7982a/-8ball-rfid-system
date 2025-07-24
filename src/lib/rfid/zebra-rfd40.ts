/**
 * Zebra RFD40 RFID Reader Integration Service
 * 
 * This service provides integration with Zebra RFD40 RFID readers through
 * the Enterprise Browser RFID API. It handles connection, tag reading, and
 * error management for real-time inventory scanning.
 * 
 * Requirements:
 * - Zebra Enterprise Browser 3.7.0.0 or later
 * - RFD40/RFD90 RFID sled or MC3300R device
 * - Proper RFID API permissions in Enterprise Browser config
 */

// Zebra RFID API types (based on Enterprise Browser documentation)
declare global {
  interface Window {
    EB: {
      RFID: {
        initialize: (callback: (result: any) => void) => void;
        connect: (connectionType: string, callback: (result: any) => void) => void;
        disconnect: (callback: (result: any) => void) => void;
        startInventory: (callback: (result: any) => void) => void;
        stopInventory: (callback: (result: any) => void) => void;
        setTagReportMode: (mode: string, callback: (result: any) => void) => void;
        setTriggerMode: (mode: string, callback: (result: any) => void) => void;
        getBatteryLevel: (callback: (result: any) => void) => void;
        getConnectionStatus: (callback: (result: any) => void) => void;
        setEventListener: (callback: (event: RFIDEvent) => void) => void;
        removeEventListener: () => void;
      };
    };
  }
}

export interface RFIDEvent {
  type: 'tagRead' | 'connectionChanged' | 'batteryStatus' | 'error';
  data: {
    tag?: string;
    rssi?: number;
    timestamp?: number;
    connected?: boolean;
    batteryLevel?: number;
    errorCode?: string;
    errorMessage?: string;
  };
}

export interface RFIDConnectionConfig {
  transport: 'usb' | 'bluetooth' | 'serial';
  autoReconnect: boolean;
  connectionTimeout: number;
  tagReportMode: 'immediate' | 'batch';
  triggerMode: 'manual' | 'auto';
}

export interface RFIDReaderStatus {
  connected: boolean;
  batteryLevel: number;
  scanning: boolean;
  transport: string;
  lastError?: string;
}

export interface ScannedTag {
  rfidTag: string;
  rssi: number;
  timestamp: Date;
  sessionId?: string;
}

export type RFIDEventCallback = (event: RFIDEvent) => void;

/**
 * Zebra RFD40 RFID Reader Service
 * 
 * Provides a clean, Promise-based interface to the Zebra Enterprise Browser
 * RFID API with real-time tag detection, connection management, and error handling.
 */
export class ZebraRFD40Service {
  private static instance: ZebraRFD40Service;
  private initialized = false;
  private connected = false;
  private scanning = false;
  private eventCallbacks: RFIDEventCallback[] = [];
  private config: RFIDConnectionConfig;
  private status: RFIDReaderStatus;
  private reconnectTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      transport: 'usb', // Default to USB connection
      autoReconnect: true,
      connectionTimeout: 10000,
      tagReportMode: 'immediate',
      triggerMode: 'manual'
    };

    this.status = {
      connected: false,
      batteryLevel: 0,
      scanning: false,
      transport: this.config.transport
    };
  }

  public static getInstance(): ZebraRFD40Service {
    if (!ZebraRFD40Service.instance) {
      ZebraRFD40Service.instance = new ZebraRFD40Service();
    }
    return ZebraRFD40Service.instance;
  }

  /**
   * Check if Zebra Enterprise Browser RFID API is available
   */
  public isApiAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.EB && 
           window.EB.RFID && 
           typeof window.EB.RFID.initialize === 'function';
  }

  /**
   * Initialize the RFID reader API
   */
  public async initialize(config?: Partial<RFIDConnectionConfig>): Promise<void> {
    if (!this.isApiAvailable()) {
      throw new Error('Zebra Enterprise Browser RFID API not available. Please ensure you are running in Enterprise Browser 3.7.0+ with RFID permissions.');
    }

    if (this.initialized) {
      return;
    }

    // Merge provided config with defaults
    this.config = { ...this.config, ...config };

    return new Promise((resolve, reject) => {
      window.EB.RFID.initialize((result) => {
        if (result.status === 'success') {
          this.initialized = true;
          this.setupEventListeners();
          resolve();
        } else {
          reject(new Error(`RFID initialization failed: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Connect to the RFID reader
   */
  public async connect(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      window.EB.RFID.connect(this.config.transport, (result) => {
        clearTimeout(timeout);
        
        if (result.status === 'success') {
          this.connected = true;
          this.status.connected = true;
          this.status.transport = this.config.transport;
          this.notifyStatusChange({ type: 'connectionChanged', data: { connected: true } });
          
          // Configure reader settings
          this.configureReader().then(() => {
            resolve();
          }).catch(reject);
        } else {
          this.status.lastError = result.message || 'Connection failed';
          reject(new Error(`RFID connection failed: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Disconnect from the RFID reader
   */
  public async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Stop scanning if active
    if (this.scanning) {
      await this.stopScanning();
    }

    return new Promise((resolve, reject) => {
      window.EB.RFID.disconnect((result) => {
        if (result.status === 'success') {
          this.connected = false;
          this.status.connected = false;
          this.notifyStatusChange({ type: 'connectionChanged', data: { connected: false } });
          resolve();
        } else {
          reject(new Error(`Disconnect failed: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Start RFID tag scanning
   */
  public async startScanning(sessionId?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('RFID reader not connected');
    }

    if (this.scanning) {
      return;
    }

    // Store session ID for tracking (could be used for logging)
    console.log('RFID scanning session started:', sessionId);

    return new Promise((resolve, reject) => {
      window.EB.RFID.startInventory((result) => {
        if (result.status === 'success') {
          this.scanning = true;
          this.status.scanning = true;
          resolve();
        } else {
          reject(new Error(`Failed to start scanning: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Stop RFID tag scanning
   */
  public async stopScanning(): Promise<void> {
    if (!this.scanning) {
      return;
    }

    return new Promise((resolve, reject) => {
      window.EB.RFID.stopInventory((result) => {
        if (result.status === 'success') {
          this.scanning = false;
          this.status.scanning = false;
          // Session ended
          console.log('RFID scanning session stopped');
          resolve();
        } else {
          reject(new Error(`Failed to stop scanning: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Get current reader status
   */
  public getStatus(): RFIDReaderStatus {
    return { ...this.status };
  }

  /**
   * Get battery level
   */
  public async getBatteryLevel(): Promise<number> {
    if (!this.connected) {
      throw new Error('RFID reader not connected');
    }

    return new Promise((resolve, reject) => {
      window.EB.RFID.getBatteryLevel((result) => {
        if (result.status === 'success') {
          const batteryLevel = result.batteryLevel || 0;
          this.status.batteryLevel = batteryLevel;
          resolve(batteryLevel);
        } else {
          reject(new Error(`Failed to get battery level: ${result.message || 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Add event listener for RFID events
   */
  public addEventListener(callback: RFIDEventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(callback: RFIDEventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Configure reader settings after connection
   */
  private async configureReader(): Promise<void> {
    const promises: Promise<void>[] = [];

    // Set tag report mode
    promises.push(new Promise((resolve, reject) => {
      window.EB.RFID.setTagReportMode(this.config.tagReportMode, (result) => {
        if (result.status === 'success') {
          resolve();
        } else {
          reject(new Error(`Failed to set tag report mode: ${result.message}`));
        }
      });
    }));

    // Set trigger mode
    promises.push(new Promise((resolve, reject) => {
      window.EB.RFID.setTriggerMode(this.config.triggerMode, (result) => {
        if (result.status === 'success') {
          resolve();
        } else {
          reject(new Error(`Failed to set trigger mode: ${result.message}`));
        }
      });
    }));

    await Promise.all(promises);
  }

  /**
   * Setup event listeners for RFID events
   */
  private setupEventListeners(): void {
    if (!window.EB.RFID.setEventListener) {
      console.warn('RFID event listener not supported in this version');
      return;
    }

    window.EB.RFID.setEventListener((event: any) => {
      // Process different event types
      let rfidEvent: RFIDEvent;

      switch (event.type) {
        case 'tag':
          rfidEvent = {
            type: 'tagRead',
            data: {
              tag: event.data.epc || event.data.tag,
              rssi: event.data.rssi || -50,
              timestamp: Date.now()
            }
          };
          break;

        case 'connection':
          this.connected = event.data.connected === true;
          this.status.connected = this.connected;
          rfidEvent = {
            type: 'connectionChanged',
            data: {
              connected: this.connected
            }
          };
          break;

        case 'battery':
          this.status.batteryLevel = event.data.level || 0;
          rfidEvent = {
            type: 'batteryStatus',
            data: {
              batteryLevel: this.status.batteryLevel
            }
          };
          break;

        case 'error':
          this.status.lastError = event.data.message || 'Unknown error';
          rfidEvent = {
            type: 'error',
            data: {
              errorCode: event.data.code,
              errorMessage: event.data.message
            }
          };
          break;

        default:
          return; // Ignore unknown event types
      }

      this.notifyStatusChange(rfidEvent);
    });
  }

  /**
   * Notify all registered callbacks of status changes
   */
  private notifyStatusChange(event: RFIDEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in RFID event callback:', error);
      }
    });
  }


  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (window.EB?.RFID?.removeEventListener) {
      window.EB.RFID.removeEventListener();
    }

    this.eventCallbacks = [];
    this.initialized = false;
    this.connected = false;
    this.scanning = false;
  }
}

/**
 * Factory function to get the singleton RFID service instance
 */
export const getRFIDService = (): ZebraRFD40Service => {
  return ZebraRFD40Service.getInstance();
};

/**
 * Helper function to check if the device supports RFID
 */
export const isRFIDSupported = (): boolean => {
  const service = getRFIDService();
  return service.isApiAvailable();
};