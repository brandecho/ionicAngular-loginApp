<?php
declare(strict_types=1);

final class Venues {
  /** GET /api/venues — active venues. */
  public static function list(): void {
    Response::json(Db::all("SELECT * FROM venues WHERE status = 'active' ORDER BY name"));
  }

  /** GET /api/venues/{id} */
  public static function get(string $id): void {
    $v = Db::one('SELECT * FROM venues WHERE id = :id', ['id' => $id]);
    if (!$v) Response::error('not found', 404);
    Response::json($v);
  }

  /** POST /api/venues/{id}/request — current member requests access. */
  public static function request(string $id): void {
    $auth = requireAuth();
    if (empty($auth['memberId'])) Response::error('members only', 403);
    $venue = Db::one('SELECT * FROM venues WHERE id = :id', ['id' => $id]);
    if (!$venue) Response::error('venue not found', 404);

    $exists = Db::one('SELECT id FROM venue_requests WHERE member_id = :m AND venue_id = :v',
      ['m' => $auth['memberId'], 'v' => $id]);
    if ($exists) Response::json(['ok' => true, 'alreadyRequested' => true]);

    $b = body();
    Db::run(
      "INSERT INTO venue_requests (id, member_id, venue_id, status, note)
       VALUES (:id,:m,:v,'requested',:note)",
      ['id' => uuid4(), 'm' => $auth['memberId'], 'v' => $id, 'note' => $b['note'] ?? null]
    );

    $member = Db::one('SELECT first_name, last_name FROM members WHERE id = :id', ['id' => $auth['memberId']]);
    $who = trim(($member['first_name'] ?? '') . ' ' . ($member['last_name'] ?? ''));

    Db::run(
      "INSERT INTO notifications (id, audience_kind, audience_id, type, title, body, deep_link)
       VALUES (:id,'venue',:vid,'access_request',:title,:body,:link)",
      ['id' => uuid4(), 'vid' => $id, 'title' => 'New access request',
       'body' => "$who wants access to {$venue['name']}.", 'link' => "/venue-portal/$id"]
    );

    $admins = Db::all(
      "SELECT phone FROM accounts WHERE venue_id = :v AND role IN ('owner','manager') AND phone IS NOT NULL",
      ['v' => $id]
    );
    foreach ($admins as $a) {
      Twilio::send($a['phone'], "My VIP Clubs: $who requested access to {$venue['name']}. Review in the venue portal.", 'access_request');
    }

    Response::json(['ok' => true], 201);
  }
}
