<?php
declare(strict_types=1);

/** Sends SMS via the Twilio REST API (cURL) and logs to sms_outbox. */
final class Twilio {
  public static function send(string $to, string $body, ?string $relatedType = null): array {
    $id = uuid4();
    Db::run(
      'INSERT INTO sms_outbox (id, to_phone, body, related_type, status) VALUES (:id,:to,:body,:type,\'queued\')',
      ['id' => $id, 'to' => $to, 'body' => $body, 'type' => $relatedType]
    );

    $t = cfg('twilio', []);
    $sid = $t['account_sid'] ?? '';
    $tok = $t['auth_token'] ?? '';
    $svc = $t['messaging_service_sid'] ?? '';
    $from = $t['from_number'] ?? '';
    if (!$sid || !$tok || (!$svc && !$from)) {
      error_log("[twilio] not configured — logged only: $to :: $body");
      return ['id' => $id, 'status' => 'queued', 'sent' => false];
    }

    $fields = ['To' => $to, 'Body' => $body];
    if ($svc) $fields['MessagingServiceSid'] = $svc; else $fields['From'] = $from;

    $ch = curl_init("https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json");
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_USERPWD => "$sid:$tok",
      CURLOPT_POSTFIELDS => http_build_query($fields),
      CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($resp !== false && $http >= 200 && $http < 300) {
      $data = json_decode($resp, true) ?: [];
      Db::run('UPDATE sms_outbox SET status=\'sent\', provider_sid=:sid WHERE id=:id',
        ['sid' => $data['sid'] ?? null, 'id' => $id]);
      return ['id' => $id, 'status' => 'sent', 'sent' => true];
    }
    $msg = $err ?: ('Twilio HTTP ' . $http);
    Db::run('UPDATE sms_outbox SET status=\'failed\', error=:e WHERE id=:id',
      ['e' => substr($msg, 0, 240), 'id' => $id]);
    error_log("[twilio] send failed: $msg");
    return ['id' => $id, 'status' => 'failed', 'sent' => false, 'error' => $msg];
  }
}
