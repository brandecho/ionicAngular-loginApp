<?php
declare(strict_types=1);

final class Members {
  // Fields a member may edit on their own profile.
  private const EDITABLE = [
    // Basic information & contact
    'first_name', 'last_name', 'preferred_name', 'email', 'phone',
    'address_street1', 'address_street2', 'address_city', 'address_state', 'address_postal',
    'linkedin_url', 'social_profile', 'relationship_status', 'how_heard',
    // Professional
    'employer', 'industry', 'job_title',
    // VIP preferences (Sections 5 & 6)
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
    $mid = $auth['memberId'];
    if (empty($mid)) Response::error('no member profile', 404);
    $b = body();

    // Email doubles as the login (accounts table), so validate it and keep
    // both tables in sync when it changes.
    if (array_key_exists('email', $b)) {
      $email = trim((string) $b['email']);
      if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('a valid email is required', 400);
      }
      $taken = Db::one(
        'SELECT id FROM accounts WHERE email = :e AND (member_id IS NULL OR member_id <> :mid)',
        ['e' => $email, 'mid' => $mid]
      );
      if ($taken) Response::error('that email is already in use', 409);
      Db::run('UPDATE accounts SET email = :e WHERE member_id = :mid', ['e' => $email, 'mid' => $mid]);
      $b['email'] = $email; // normalized value flows into members below
    }

    $set = [];
    $params = ['id' => $mid];
    foreach (self::EDITABLE as $col) {
      if (array_key_exists($col, $b)) { $set[] = "$col = :$col"; $params[$col] = $b[$col]; }
    }
    if (!$set) Response::error('no editable fields', 400);
    Db::run('UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id', $params);
    Response::json(Db::one('SELECT * FROM members WHERE id = :id', ['id' => $mid]));
  }

  // ---- membership application fields ----
  private const APP_TEXT = [
    'first_name', 'last_name', 'preferred_name', 'email', 'phone',
    'address_street1', 'address_street2', 'address_city', 'address_state', 'address_postal',
    'linkedin_url', 'social_profile', 'relationship_status', 'how_heard',
    'referral_first', 'referral_last', 'referral_vip_number', 'referral_relationship',
    'referral_known_duration',
    'employer', 'industry', 'job_title',
    'visit_frequency', 'visit_company',
    'favorite_foods', 'favorite_restaurants', 'preferred_beverages', 'dietary_restrictions',
    'favorite_wine_spirits', 'preferred_seating', 'preferred_atmosphere', 'music', 'smoking',
    'hospitality_details', 'what_makes_vip', 'do_not_share', 'additional_notes',
  ];
  private const APP_BOOL = [
    'over_21', 'is_business_owner', 'referral_knows_personally',
    'interested_events', 'interested_offers', 'consent_share_with_venues',
    'standards_ack', 'gratuity_agreed', 'privacy_consented',
    'authorize_verification', 'final_certification',
  ];
  private const APP_JSON = ['establishment_types', 'special_occasions'];

  /**
   * POST /api/members/me/application — submit the membership application.
   * Body carries the JotForm-style fields (snake_case) plus "plan"
   * ('free' | 'fast_track'). Stamps the submission date and keeps the member
   * 'pending' for admin review. The fast-track fee is handled separately via
   * Stripe (see Payments); this just records which plan was chosen.
   */
  public static function submitApplication(): void {
    $auth = requireAuth();
    $mid = $auth['memberId'] ?? '';
    if (!$mid) Response::error('no member profile', 404);
    $b = body();

    // Keep the login email in sync if it changed.
    if (array_key_exists('email', $b)) {
      $email = trim((string) $b['email']);
      if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('a valid email is required', 400);
      }
      $taken = Db::one(
        'SELECT id FROM accounts WHERE email = :e AND (member_id IS NULL OR member_id <> :mid)',
        ['e' => $email, 'mid' => $mid]
      );
      if ($taken) Response::error('that email is already in use', 409);
      Db::run('UPDATE accounts SET email = :e WHERE member_id = :mid', ['e' => $email, 'mid' => $mid]);
      $b['email'] = $email;
    }

    $set = [];
    $params = ['id' => $mid];
    foreach (self::APP_TEXT as $c) {
      if (array_key_exists($c, $b)) {
        $set[] = "$c = :$c";
        $params[$c] = ($b[$c] === '') ? null : $b[$c];
      }
    }
    foreach (self::APP_BOOL as $c) {
      if (array_key_exists($c, $b)) {
        $set[] = "$c = :$c";
        $params[$c] = self::truthy($b[$c]) ? 1 : 0;
      }
    }
    foreach (self::APP_JSON as $c) {
      if (array_key_exists($c, $b)) {
        $set[] = "$c = :$c";
        $v = $b[$c];
        $params[$c] = is_array($v)
          ? json_encode(array_values($v))
          : ((is_string($v) && $v !== '') ? $v : null);
      }
    }

    // Plan + submission stamp.
    $plan = ($b['plan'] ?? 'free') === 'fast_track' ? 'fast_track' : 'free';
    $set[] = 'application_plan = :plan';
    $params['plan'] = $plan;
    $set[] = "application_status = 'pending'";
    $set[] = 'application_date = :appdate';
    $params['appdate'] = date('Y-m-d');

    Db::run('UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id', $params);
    Response::json(Db::one('SELECT * FROM members WHERE id = :id', ['id' => $mid]));
  }

  private static function truthy($v): bool {
    return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'yes' || $v === 'on';
  }

  /**
   * POST /api/members/me/photo — upload or replace the member's profile photo.
   * Send as multipart/form-data with a file field named "photo".
   * The image is stored under public/uploads/members/ and served from the
   * subdomain root (e.g. https://api.myvipclubs.com/uploads/members/<id>.jpg),
   * and that public URL is saved to members.membership_photo_url.
   */
  public static function photo(): void {
    $auth = requireAuth();
    if (empty($auth['memberId'])) Response::error('no member profile', 404);
    $memberId = $auth['memberId'];

    $file = $_FILES['photo'] ?? null;
    if (!$file || !is_uploaded_file($file['tmp_name'] ?? '')) {
      Response::error('no file uploaded (use multipart field "photo")', 400);
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
      Response::error('upload failed (code ' . (int) $file['error'] . ')', 400);
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
      Response::error('image too large (max 5 MB)', 413);
    }

    // Confirm it is really an image and pick a safe extension from its type.
    $info = @getimagesize($file['tmp_name']);
    $mime = $info['mime'] ?? '';
    $extByMime = [
      'image/jpeg' => 'jpg',
      'image/png' => 'png',
      'image/webp' => 'webp',
      'image/gif' => 'gif',
    ];
    if (!isset($extByMime[$mime])) {
      Response::error('only JPG, PNG, WEBP or GIF images are allowed', 415);
    }
    $ext = $extByMime[$mime];

    $dir = __DIR__ . '/../../public/uploads/members';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
      Response::error('could not create uploads folder on server', 500);
    }

    // Drop any previous photo for this member (whatever extension it had).
    foreach (glob($dir . '/' . $memberId . '.*') ?: [] as $old) {
      @unlink($old);
    }

    $filename = $memberId . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
      Response::error('could not save the image on server', 500);
    }
    @chmod($dir . '/' . $filename, 0644);

    // Absolute, publicly reachable URL (needed by the app AND by Twilio MMS).
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'api.myvipclubs.com';
    $url = $scheme . '://' . $host . '/uploads/members/' . $filename . '?v=' . time();

    Db::run('UPDATE members SET membership_photo_url = :u WHERE id = :id',
      ['u' => $url, 'id' => $memberId]);
    Response::json(Db::one('SELECT * FROM members WHERE id = :id', ['id' => $memberId]));
  }
}
