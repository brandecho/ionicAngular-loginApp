<?php
declare(strict_types=1);

final class Response {
  public static function cors(): void {
    $origins = cfg('cors_origins', []);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array('*', $origins, true)) {
      header('Access-Control-Allow-Origin: *');
    } elseif ($origin && in_array($origin, $origins, true)) {
      header('Access-Control-Allow-Origin: ' . $origin);
      header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
      http_response_code(204);
      exit;
    }
  }

  public static function json($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
  }

  public static function error(string $message, int $code = 400): void {
    self::json(['error' => $message], $code);
  }
}
