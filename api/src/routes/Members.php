<?php
declare(strict_types=1);

final class Members {
  // Fields a member may edit on their own profile (Sections 5 & 6 + contact).
  private const EDITABLE = [
    'preferred_name', 'phone', 'linkedin_url', 'social_profile',
    'favorite_foods', 'favorite_restaurants', 'preferred_beverages', 'dietary_restrictions',
    'favorite_wine_spirits', 'preferred_seating', 'preferred_atmosphere', 'music', 'smoking',
    'special_occasions', 'hospitality_details', 'what_makes_vip', 'do_not_share',
    'additional_notes', 'consent_share_with_venues',
  ];

  /** GET /api/members/me */
  public static function me(): void {
    $auth = requireAuth();
    if (empty($auth['memberId'])) Response::error('no member profile', 404);
    $m = Db::one('SELECT * FROM members WHERE id = :id', ['id' => $auth['memberId']]);
    if (!$m) Response::error('not found', 404);
    Response::json($m);
  }

  /** PATCH /api/members/me */
  public static function update(): void {
    $auth = requireAuth();
    if (empty($auth['memberId'])) Response::error('no member profile', 404);
    $b = body();
    $set = [];
    $params = ['id' => $auth['memberId']];
    foreach (self::EDITABLE as $col) {
      if (array_key_exists($col, $b)) { $set[] = "$col = :$col"; $params[$col] = $b[$col]; }
    }
    if (!$set) Response::error('no editable fields', 400);
    Db::run('UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id', $params);
    Response::json(Db::one('SELECT * FROM members WHERE id = :id', ['id' => $auth['memberId']]));
  }
}
