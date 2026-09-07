/**
 * Twilio configuration.
 *
 * SECURITY: Twilio's Auth Token is a secret and must NEVER ship in the app.
 * The real SMS send happens on YOUR backend, which holds the token and calls
 * Twilio. The client only calls `backendSendEndpoint` (Phase 2). Until that
 * endpoint exists, TwilioSmsChannel runs in `mock` mode and records what it
 * WOULD send into an in-app outbox so the flow is fully visible.
 *
 * Non-secret values (Account SID, Messaging Service SID, sender number) can
 * live here for reference, but the token stays server-side only.
 */
export const TWILIO_CONFIG = {
  mode: 'mock' as 'mock' | 'backend',

  // Your backend endpoint that proxies to Twilio (Phase 2). Example shape:
  //   POST { to: "+1305...", body: "..." }  ->  200 { sid }
  backendSendEndpoint: '', // e.g. 'https://api.myvipclubs.app/notifications/sms'

  // Reference only (non-secret). The Auth Token is NOT here on purpose.
  accountSid: '',
  messagingServiceSid: '', // recommended over a single "from" number
  fromNumber: '', // e.g. '+13055550123' if not using a Messaging Service

  // US SMS requires A2P 10DLC brand + campaign registration before sending.
  a2p10dlcRegistered: false,
} as const;
