export type NotificationType =
  | 'staff_join_request' // -> venue: a staff member wants to join
  | 'staff_approved' // -> staff: your venue approved you
  | 'staff_declined' // -> staff: your request was declined
  | 'venue_pending_review' // -> platform admin: a new venue registered
  | 'venue_approved' // -> owner: your venue is live
  | 'venue_declined' // -> owner: your venue was declined
  | 'access_request' // -> venue: a member wants access
  | 'access_approved' // -> member: you're on the list
  | 'access_declined' // -> member: not right now
  | 'vip_arriving' // -> venue/staff: a VIP is inbound
  | 'table_request'; // -> venue: a member requested a table

/**
 * Who a notification is addressed to. Either a specific account, or every
 * account attached to a venue (owner + managers + staff), or a platform role.
 */
export type Audience =
  | { kind: 'account'; accountId: string }
  | { kind: 'venue'; venueId: string }
  | { kind: 'role'; role: 'admin' };

export interface AppNotification {
  id: string;
  audience: Audience;
  type: NotificationType;
  title: string;
  body: string;
  /** In-app route to open when tapped (the SMS short-link lands here too). */
  deepLink?: string;
  read: boolean;
  createdAt: number;
}

/**
 * A record of an SMS that WAS (or, in the interim, WOULD BE) sent via Twilio.
 * In Phase 2 the real send happens on the backend; this is the mock outbox so
 * the flow is visible today.
 */
export interface OutboxSms {
  id: string;
  to: string; // E.164 phone number
  body: string;
  relatedType: NotificationType;
  createdAt: number;
  status: 'queued' | 'sent' | 'failed';
}
