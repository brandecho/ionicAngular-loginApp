<?php
declare(strict_types=1);

/**
 * Minimal Stripe helper (no SDK) for the fast-track application fee.
 * Uses Stripe Checkout: we create a Checkout Session server-side and send the
 * applicant to Stripe's hosted payment page, so we never handle card data.
 */
final class Stripe {
  public static function configured(): bool {
    $s = cfg('stripe', []);
    return !empty($s['secret_key']);
  }

  /** Amount in the smallest currency unit (e.g. cents) for the app fee. */
  public static function priceCents(): int {
    return (int) (cfg('stripe', [])['price_cents'] ?? 2500);
  }

  /**
   * Create a Checkout Session for the application fee.
   * @return array{id:string,url:string}
   * @throws RuntimeException on API error.
   */
  public static function createCheckoutSession(string $memberId, string $email): array {
    $s = cfg('stripe', []);
    $currency = $s['currency'] ?? 'usd';
    $success = $s['success_url'] ?? '';
    $cancel = $s['cancel_url'] ?? '';

    // Flat POST body for Stripe's form-encoded API.
    $fields = [
      'mode' => 'payment',
      'success_url' => $success,
      'cancel_url' => $cancel,
      'client_reference_id' => $memberId,
      'customer_email' => $email,
      'metadata[member_id]' => $memberId,
      'line_items[0][quantity]' => '1',
      'line_items[0][price_data][currency]' => $currency,
      'line_items[0][price_data][unit_amount]' => (string) self::priceCents(),
      'line_items[0][price_data][product_data][name]' => 'My VIP Clubs — Fast-track application',
      'payment_intent_data[metadata][member_id]' => $memberId,
    ];

    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_USERPWD => $s['secret_key'] . ':',
      CURLOPT_POSTFIELDS => http_build_query($fields),
      CURLOPT_TIMEOUT => 20,
    ]);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($resp === false) throw new RuntimeException('Stripe unreachable: ' . $err);
    $data = json_decode($resp, true) ?: [];
    if ($http < 200 || $http >= 300 || empty($data['id']) || empty($data['url'])) {
      $msg = $data['error']['message'] ?? ('Stripe HTTP ' . $http);
      throw new RuntimeException($msg);
    }
    return ['id' => $data['id'], 'url' => $data['url']];
  }

  /**
   * Verify a Stripe webhook signature (t=,v1= scheme) against the raw body.
   * Returns the decoded event array, or null if verification fails.
   */
  public static function verifyWebhook(string $payload, string $sigHeader): ?array {
    $secret = cfg('stripe', [])['webhook_secret'] ?? '';
    if (!$secret || !$sigHeader) return null;

    $parts = [];
    foreach (explode(',', $sigHeader) as $kv) {
      $p = explode('=', trim($kv), 2);
      if (count($p) === 2) $parts[$p[0]][] = $p[1];
    }
    $t = $parts['t'][0] ?? '';
    $sigs = $parts['v1'] ?? [];
    if ($t === '' || !$sigs) return null;

    $expected = hash_hmac('sha256', $t . '.' . $payload, $secret);
    $ok = false;
    foreach ($sigs as $sig) {
      if (hash_equals($expected, $sig)) { $ok = true; break; }
    }
    if (!$ok) return null;

    $event = json_decode($payload, true);
    return is_array($event) ? $event : null;
  }
}
