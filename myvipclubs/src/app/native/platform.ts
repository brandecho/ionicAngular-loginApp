/**
 * Small helpers to detect a Cordova runtime and await `deviceready`.
 * On the web `isCordova()` is false and `whenDeviceReady()` never resolves,
 * so callers simply skip native work in the browser.
 */

export function isCordova(): boolean {
  return typeof window !== 'undefined' && !!(window as any).cordova;
}

let deviceReadyPromise: Promise<void> | null = null;

export function whenDeviceReady(): Promise<void> {
  if (!isCordova()) {
    // Never resolves on the web — native init is simply skipped.
    return new Promise<void>(() => {});
  }
  if (!deviceReadyPromise) {
    deviceReadyPromise = new Promise<void>((resolve) => {
      document.addEventListener('deviceready', () => resolve(), false);
    });
  }
  return deviceReadyPromise;
}

/** Access the Pushwoosh plugin, or null when not running in Cordova. */
export function getPushwoosh(): PushwooshPlugin | null {
  if (!isCordova()) return null;
  const w = window as any;
  try {
    // Preferred: cordova.require. Falls back to window.plugins.pushNotification.
    if (w.cordova?.require) {
      return w.cordova.require('pushwoosh-cordova-plugin.PushNotification');
    }
  } catch {
    /* fall through */
  }
  return w.plugins?.pushNotification ?? null;
}

/** Access the geofence plugin, or null when not running in Cordova. */
export function getGeofence(): GeofencePlugin | null {
  if (!isCordova()) return null;
  return (window as any).geofence ?? null;
}
