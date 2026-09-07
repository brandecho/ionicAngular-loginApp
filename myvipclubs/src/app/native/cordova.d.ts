/**
 * Minimal ambient typings for the Cordova globals this app talks to.
 * These plugins only exist inside a Cordova build; on the web the objects are
 * undefined and every native call is guarded (see platform.ts).
 */

interface CordovaRequire {
  require(id: string): any;
}

interface PushwooshNotification {
  title?: string;
  message?: string;
  /** Custom JSON payload sent with the push (e.g. a deep link). */
  userdata?: any;
  /** True when the notification was tapped to open the app. */
  onStart?: boolean;
  foreground?: boolean;
  [key: string]: any;
}

interface PushwooshRegisterStatus {
  pushToken: string;
  [key: string]: any;
}

/** pushwoosh-cordova-plugin — PushNotification interface. */
interface PushwooshPlugin {
  onDeviceReady(config: { appid: string; projectid?: string; serviceName?: string }): void;
  registerDevice(
    success: (status: PushwooshRegisterStatus) => void,
    fail: (error: any) => void,
  ): void;
  unregisterDevice(success?: (t: any) => void, fail?: (e: any) => void): void;
  setUserId(userId: string): void;
  getPushToken(cb: (token: string) => void): void;
  /** Tags let the backend target a specific member. */
  setTags(tags: Record<string, any>, success?: () => void, fail?: (e: any) => void): void;
  /** Pushwoosh location-based "geozones". */
  startLocationTracking(): void;
  stopLocationTracking(): void;
  startGeoPushes?(): void;
  stopGeoPushes?(): void;
}

/** cordova-plugin-geofence — transition + geofence shapes. */
interface GeofenceTransition {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  transitionType: number; // 1 = ENTER, 2 = EXIT, 3 = BOTH
  notification?: {
    id?: number;
    title?: string;
    text?: string;
    data?: any;
    openAppOnClick?: boolean;
  };
}

interface GeofencePlugin {
  initialize(success?: () => void, error?: (e: any) => void): Promise<void>;
  addOrUpdate(geofences: GeofenceTransition | GeofenceTransition[]): Promise<void>;
  remove(id: string | string[]): Promise<void>;
  removeAll(): Promise<void>;
  getWatched(): Promise<string>;
  onTransitionReceived: (geofences: GeofenceTransition[]) => void;
  onNotificationClicked?: (notificationData: any) => void;
}

interface Window {
  cordova?: CordovaRequire & Record<string, any>;
  geofence?: GeofencePlugin;
  plugins?: {
    pushNotification?: PushwooshPlugin;
    [key: string]: any;
  };
  device?: { platform?: string; uuid?: string; [key: string]: any };
}

declare var cordova: (CordovaRequire & Record<string, any>) | undefined;
