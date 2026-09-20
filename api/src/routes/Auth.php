<?php
declare(strict_types=1);

final class Auth {
  /** POST /api/auth/register — member sign-up. */
  public static function register(): void {
    $b = body();
    $name = trim($b['name'] ?? '');
    $email = trim($b['email'] ?? '');
    $phone = trim($b['phone'] ?? '');
    $password = (string) ($b['password'] ?? '');
    if ($name === '' || $email === '' || $password === '') {
      Response::error('name, email and password are required', 400);
    }
    if (Db::one('SELECT id FROM accounts WHERE email = :e', ['e' => $email])) {
      Response::error('email already registered', 409);
    }

    $parts = preg_split('/\s+/', $name, 2);
    $first = $parts[0];
    $last = $parts[1] ?? '';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $memberId = uuid4();
    Db::run(
      "INSERT INTO members (id, first_name, last_name, email, phone, application_status)
       VALUES (:id,:first,:last,:email,:phone,'pending')",
      ['id' => $memberId, 'first' => $first, 'last' => $last, 'email' => $email, 'phone' => $phone ?: null]
    );

    $accountId = uuid4();
    Db::run(
      "INSERT INTO accounts (id, role, name, email, phone, password_hash, member_id)
       VALUES (:id,'member',:name,:email,:phone,:hash,:mid)",
      ['id' => $accountId, 'name' => $name, 'email' => $email, 'phone' => $phone ?: null, 'hash' => $hash, 'mid' => $memberId]
    );

    $acct = Db::one('SELECT * FROM accounts WHERE id = :id', ['id' => $accountId]);
    Response::json(['token' => self::token($acct), 'account' => self::pub($acct)], 201);
  }

  /** POST /api/auth/login */
  public static function login(): void {
    $b = body();
    $email = trim($b['email'] ?? '');
    $password = (string) ($b['password'] ?? '');
    if ($email === '' || $password === '') Response::error('email and password required', 400);
    $acct = Db::one('SELECT * FROM accounts WHERE email = :e', ['e' => $email]);
    if (!$acct || !password_verify($password, $acct['password_hash'])) {
      Response::error('invalid credentials', 401);
    }
    Response::json(['token' => self::token($acct), 'account' => self::pub($acct)]);
  }

  private static function token(array $a): string {
    return Jwt::sign(['sub' => $a['id'], 'role' => $a['role'], 'memberId' => $a['member_id'], 'venueId' => $a['venue_id']]);
  }
  private static function pub(array $a): array {
    return ['id' => $a['id'], 'role' => $a['role'], 'name' => $a['name'], 'email' => $a['email'],
            'phone' => $a['phone'], 'venueId' => $a['venue_id'], 'memberId' => $a['member_id']];
  }
}
