<?php
declare(strict_types=1);

final class Admin {
  // Member columns an admin may edit.
  private const MEMBER_EDITABLE = [
    'first_name', 'last_name', 'preferred_name', 'email', 'phone', 'vip_number',
    'tier', 'application_status', 'over_21', 'relationship_status',
    'employer', 'industry', 'job_title', 'is_business_owner',
    'favorite_foods', 'favorite_restaurants', 'preferred_beverages', 'dietary_restrictions',
    'favorite_wine_spirits', 'preferred_seating', 'preferred_atmosphere', 'music', 'smoking',
    'special_occasions', 'hospitality_details', 'what_makes_vip', 'do_not_share',
    'additional_notes', 'consent_share_with_venues',
    'total_spent', 'total_tips', 'visits_this_year', 'member_since',
  ];
  private const VENUE_EDITABLE = [
    'name', 'type', 'address', 'neighborhood', 'city', 'lat', 'lng',
    'geofence_radius', 'tier_required', 'status',
  ];

  // ---------------- members ----------------
  public static function listMembers(): void {
    requireAdmin();
    $rows = Db::all(
      'SELECT id, first_name, last_name, email, phone, tier, application_status, member_since, created_at
       FROM members ORDER BY created_at DESC'
    );
    Response::json($rows);
  }

  public static function getMember(string $id): void {
    requireAdmin();
    $m = Db::one('SELECT * FROM members WHERE id = :id', ['id' => $id]);
    if (!$m) Response::error('not found', 404);
    Response::json($m);
  }

  public static function updateMember(string $id): void {
    requireAdmin();
    $b = body();
    $set = []; $params = ['id' => $id];
    foreach (self::MEMBER_EDITABLE as $c) {
      if (array_key_exists($c, $b)) { $set[] = "$c = :$c"; $params[$c] = $b[$c]; }
    }
    if (!$set) Response::error('no editable fields', 400);
    Db::run('UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id', $params);
    Response::json(Db::one('SELECT * FROM members WHERE id = :id', ['id' => $id]));
  }

  // ---------------- venues ----------------
  public static function listVenues(): void {
    requireAdmin();
    Response::json(Db::all('SELECT * FROM venues ORDER BY name'));
  }

  public static function createVenue(): void {
    requireAdmin();
    $b = body();
    if (empty($b['name'])) Response::error('name is required', 400);
    $id = uuid4();
    $cols = ['id' => $id];
    foreach (self::VENUE_EDITABLE as $c) {
      if (array_key_exists($c, $b)) $cols[$c] = $b[$c];
    }
    if (empty($cols['status'])) $cols['status'] = 'active';
    $names = array_keys($cols);
    $sql = 'INSERT INTO venues (' . implode(', ', $names) . ') VALUES (' .
           implode(', ', array_map(fn($c) => ":$c", $names)) . ')';
    Db::run($sql, $cols);
    Response::json(Db::one('SELECT * FROM venues WHERE id = :id', ['id' => $id]), 201);
  }

  public static function updateVenue(string $id): void {
    requireAdmin();
    $b = body();
    $set = []; $params = ['id' => $id];
    foreach (self::VENUE_EDITABLE as $c) {
      if (array_key_exists($c, $b)) { $set[] = "$c = :$c"; $params[$c] = $b[$c]; }
    }
    if (!$set) Response::error('no editable fields', 400);
    Db::run('UPDATE venues SET ' . implode(', ', $set) . ' WHERE id = :id', $params);
    Response::json(Db::one('SELECT * FROM venues WHERE id = :id', ['id' => $id]));
  }
}
