<?php
declare(strict_types=1);

/** Minimal self-contained HS256 JWT — no Composer dependency. */
final class Jwt {
  public static function sign(array $claims): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $claims['iat'] = time();
    $claims['exp'] = time() + (int) cfg('jwt_ttl', 604800);
    $segments = [self::b64(json_encode($header)), self::b64(json_encode($claims))];
    $signing = implode('.', $segments);
    $sig = hash_hmac('sha256', $signing, (string) cfg('jwt_secret'), true);
    $segments[] = self::b64($sig);
    return implode('.', $segments);
  }

  public static function verify(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = self::b64(hash_hmac('sha256', "$h.$p", (string) cfg('jwt_secret'), true));
    if (!hash_equals($expected, $s)) return null;
    $claims = json_decode(self::unb64($p), true);
    if (!is_array($claims)) return null;
    if (isset($claims['exp']) && time() >= $claims['exp']) return null;
    return $claims;
  }

  private static function b64(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
  }
  private static function unb64(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
  }
}
