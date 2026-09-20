<?php
declare(strict_types=1);

final class Payments {
  /**
   * POST /api/payments/application/checkout
   * Starts the $25 fast-track fee payment. Returns a Stripe Checkout URL to
   * redirect to, or {configured:false} when Stripe keys aren't set yet.
   */
  public static function applicationCheckout(): void {
    $auth = requireAuth();
    $mid = $auth['memberId'] ?? '';
    if (!$mid) Response::error('members only', 403);

    if (!Stripe::configured()) {
      Response::json(['configured' => false], 200);
    }

    $member = Db::one('SELECT id, email, application_fee_paid FROM members WHERE id = :id', ['id' => $mid]);
    if (!$member) Response::error('not found', 404);
    if ((int) ($member['application_fee_paid'] ?? 0) === 1) {
      Response::json(['configured' => true, 'alreadyPaid' => true]);
    }

    try {
      $session = Stripe::createCheckoutSession($mid, (string) $member['email']);
    } catch (Throwable $e) {
      Response::error('payment setup failed: ' . $e->getMessage(), 502);
    }

    Db::run('UPDATE members SET stripe_checkout_id = :sid WHERE id = :id',
      ['sid' => $session['id'], 'id' => $mid]);
    Response::json(['configured' => true, 'url' => $session['url']]);
  }

  /**
   * POST /api/webhooks/stripe
   * Stripe calls this when a payment completes. Marks the fee paid.
   * (No auth — verified by Stripe signature instead.)
   */
  public static function stripeWebhook(): void {
    $payload = file_get_contents('php://input') ?: '';
    $sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    $event = Stripe::verifyWebhook($payload, $sig);
    if ($event === null) Response::error('invalid signature', 400);

    if (($event['type'] ?? '') === 'checkout.session.completed') {
      $session = $event['data']['object'] ?? [];
      $mid = $session['client_reference_id']
        ?? ($session['metadata']['member_id'] ?? '');
      $paid = ($session['payment_status'] ?? '') === 'paid';
      if ($mid && $paid) {
        Db::run(
          'UPDATE members SET application_fee_paid = 1, stripe_checkout_id = :sid WHERE id = :id',
          ['sid' => $session['id'] ?? null, 'id' => $mid]
        );
      }
    }
    Response::json(['received' => true]);
  }
}
