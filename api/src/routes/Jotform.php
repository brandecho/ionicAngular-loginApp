<?php
declare(strict_types=1);

/**
 * POST /api/webhooks/jotform
 * JotForm posts each submission (a `rawRequest` JSON of answers keyed like
 * "q5_fullLegal"). We strip the "q<n>_" prefix and map by the field's internal
 * name — the same names in docs/MyVIPClubs_JotForm_Fields.docx. Verify the keys
 * against your first real submission and tweak if any q<n> differs.
 */
final class Jotform {
  public static function webhook(): void {
    $token = cfg('jotform_webhook_token', '');
    if ($token) {
      $got = $_GET['token'] ?? ($_SERVER['HTTP_X_WEBHOOK_TOKEN'] ?? '');
      if (!hash_equals($token, (string) $got)) Response::error('bad token', 401);
    }

    $raw = body();
    if (isset($raw['rawRequest']) && is_string($raw['rawRequest'])) {
      $j = json_decode($raw['rawRequest'], true);
      if (is_array($j)) $raw = $j;
    }
    $f = self::normalize($raw);

    $name = is_array($f['fullLegal'] ?? null) ? $f['fullLegal'] : [];
    $addr = is_array($f['homeAddress'] ?? null) ? $f['homeAddress'] : [];
    $ref = is_array($f['referringMembers'] ?? null) ? $f['referringMembers'] : [];

    $m = [
      'first_name' => self::str($name['first'] ?? null) ?? 'Unknown',
      'last_name' => self::str($name['last'] ?? null) ?? '',
      'preferred_name' => self::str($f['preferredName'] ?? null),
      'over_21' => self::yesNo($f['areYou'] ?? null),
      'email' => self::str($f['emailAddress'] ?? null) ?? '',
      'phone' => self::str($f['phone'] ?? $f['mobile'] ?? $f['cellPhone'] ?? null),
      'address_street1' => self::str($addr['addr_line1'] ?? null),
      'address_street2' => self::str($addr['addr_line2'] ?? null),
      'address_city' => self::str($addr['city'] ?? null),
      'address_state' => self::str($addr['state'] ?? null),
      'address_postal' => self::str($addr['postal'] ?? null),
      'linkedin_url' => self::str($f['linkedinProfile'] ?? null),
      'social_profile' => self::str($f['instagramOr'] ?? null),
      'relationship_status' => self::str($f['relationshipStatus'] ?? null),
      'how_heard' => self::str($f['howDid'] ?? null),
      'referral_first' => self::str($ref['first'] ?? null),
      'referral_last' => self::str($ref['last'] ?? null),
      'referral_vip_number' => self::str(is_string($f['referringMembers'] ?? null) ? $f['referringMembers'] : ($f['referringMembersVip'] ?? null)),
      'referral_relationship' => self::str($f['yourRelationship'] ?? null),
      'referral_known_duration' => self::str($f['howLong'] ?? null),
      'referral_knows_personally' => self::yesNo($f['doesThe'] ?? null),
      'employer' => self::str($f['currentEmployer'] ?? null),
      'industry' => self::str($f['industry'] ?? null),
      'job_title' => self::str($f['jobTitle'] ?? null),
      'is_business_owner' => self::yesNo($f['areYou43'] ?? null),
      'establishment_types' => self::jsonArr($f['whatTypes'] ?? null),
      'visit_frequency' => self::str($f['howOften'] ?? null),
      'visit_company' => self::str($f['doYou'] ?? null),
      'interested_events' => self::yesNo($f['areYou54'] ?? null),
      'interested_offers' => self::yesNo($f['areYou55'] ?? null),
      'favorite_foods' => self::str($f['favoriteFoods'] ?? null),
      'favorite_restaurants' => self::str($f['favoriteRestaurants'] ?? null),
      'preferred_beverages' => self::str($f['preferredBeverages'] ?? null),
      'dietary_restrictions' => self::str($f['dietaryRestrictions'] ?? null),
      'favorite_wine_spirits' => self::str($f['favoriteWine'] ?? null),
      'preferred_seating' => self::str($f['preferredSeating'] ?? null),
      'preferred_atmosphere' => self::str($f['preferredAtmosphere'] ?? null),
      'music' => self::str($f['music'] ?? null),
      'smoking' => self::str($f['smoking'] ?? null),
      'special_occasions' => self::jsonArr($f['typicalSpecial'] ?? null),
      'hospitality_details' => self::str($f['anyHospitality'] ?? null),
      'what_makes_vip' => self::str($f['whatMakes'] ?? null),
      'do_not_share' => self::str($f['areThere'] ?? null),
      'additional_notes' => self::str($f['optionalAdditional'] ?? null),
      'consent_share_with_venues' => self::yesNo($f['doYou70'] ?? null),
      'standards_ack' => self::jsonArr($f['pleaseAcknowledge'] ?? null) ? 1 : 0,
      'gratuity_agreed' => self::agree($f['iUnderstand'] ?? null),
      'privacy_consented' => self::jsonArr($f['pleaseAcknowledge81'] ?? null) ? 1 : 0,
      'authorize_verification' => self::yesNo($f['iAuthorize'] ?? null),
      'final_certification' => self::jsonArr($f['finalCertification'] ?? null) ? 1 : 0,
    ];

    $id = uuid4();
    $cols = array_keys($m);
    $sql = 'INSERT INTO members (id, application_status, ' . implode(', ', $cols) . ') ' .
           "VALUES (:id, 'pending', " . implode(', ', array_map(fn($c) => ":$c", $cols)) . ')';
    Db::run($sql, ['id' => $id] + $m);

    Db::run(
      "INSERT INTO notifications (id, audience_kind, audience_id, type, title, body, deep_link)
       VALUES (:id,'role','admin','application_received',:title,:body,'/admin')",
      ['id' => uuid4(), 'title' => 'New membership application',
       'body' => "{$m['first_name']} {$m['last_name']} applied. Referral: " . ($m['referral_first'] ?? '—') . '.']
    );

    Response::json(['ok' => true, 'memberId' => $id]);
  }

  // ---------- helpers ----------
  private static function normalize(array $raw): array {
    $out = [];
    foreach ($raw as $k => $v) {
      $out[preg_match('/^q\d+_(.+)$/', $k, $mm) ? $mm[1] : $k] = $v;
    }
    return $out;
  }
  private static function str($v): ?string {
    if ($v === null) return null;
    if (is_array($v)) $v = implode(', ', $v);
    $s = trim((string) $v);
    return $s === '' ? null : $s;
  }
  private static function yesNo($v): ?int {
    $s = strtolower(self::str($v) ?? '');
    if ($s === '') return null;
    return (str_starts_with($s, 'y') || $s === 'i agree') ? 1 : 0;
  }
  private static function agree($v): int {
    $s = strtolower(self::str($v) ?? '');
    return (str_contains($s, 'agree') && !str_contains($s, 'not')) ? 1 : 0;
  }
  private static function jsonArr($v): ?string {
    if ($v === null) return null;
    $arr = is_array($v) ? array_values($v) : [$v];
    $clean = array_values(array_filter(array_map(fn($x) => trim((string) $x), $arr), fn($x) => $x !== ''));
    return $clean ? json_encode($clean) : null;
  }
}
