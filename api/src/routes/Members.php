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
