/**
 * Pushwoosh credentials. Fill these in from your Pushwoosh Control Panel.
 *  - appId:     Pushwoosh Application Code, e.g. "XXXXX-XXXXX"
 *  - projectId: (Android) your Firebase Sender ID / project number.
 *
 * These same values must also be set in `config.xml` (PW_APPID / PW_PROJECT_ID)
 * so the native side registers with the correct application.
 */
export const PUSHWOOSH_CONFIG = {
  appId: 'XXXXX-XXXXX',
  projectId: 'FIREBASE_SENDER_ID',
} as const;

/** Default geofence radius (meters) when a venue does not specify one. */
export const DEFAULT_GEOFENCE_RADIUS = 250;
