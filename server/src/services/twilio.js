const config = require('../config');
const { query } = require('../db');

/**
 * Send an SMS via Twilio and log it to sms_outbox. When Twilio credentials are
 * not configured, the message is still recorded (status 'queued') so the flow
 * works in development without sending.
 *
 * Uses the Twilio REST API directly (Node 18+ global fetch) — no SDK dependency.
 */
async function sendSms(to, body, relatedType) {
  const rows = await query(
    'INSERT INTO sms_outbox (to_phone, body, related_type, status) VALUES (:to, :body, :type, :status)',
    { to, body, type: relatedType || null, status: 'queued' },
  );
  // Fetch the id we just inserted (UUID default) — look up by rowid is not
  // available, so re-select the most recent queued row for this number.
  const row = (await query(
    'SELECT id FROM sms_outbox WHERE to_phone = :to ORDER BY created_at DESC LIMIT 1',
    { to },
  ))[0];
  const id = row && row.id;

  const { accountSid, authToken, messagingServiceSid, fromNumber } = config.twilio;
  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    console.info(`[twilio] not configured — logged only: ${to} :: ${body}`);
    return { id, status: 'queued', sent: false };
  }

  const params = new URLSearchParams();
  params.set('To', to);
  params.set('Body', body);
  if (messagingServiceSid) params.set('MessagingServiceSid', messagingServiceSid);
  else params.set('From', fromNumber);

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || `Twilio ${resp.status}`);
    if (id) {
      await query('UPDATE sms_outbox SET status = :s, provider_sid = :sid WHERE id = :id', {
        s: 'sent',
        sid: data.sid || null,
        id,
      });
    }
    return { id, status: 'sent', sent: true, sid: data.sid };
  } catch (e) {
    console.warn('[twilio] send failed:', e.message);
    if (id) {
      await query('UPDATE sms_outbox SET status = :s, error = :err WHERE id = :id', {
        s: 'failed',
        err: String(e.message).slice(0, 240),
        id,
      });
    }
    return { id, status: 'failed', sent: false, error: e.message };
  }
}

module.exports = { sendSms };
