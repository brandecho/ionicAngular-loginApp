<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

Response::cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
// normalize: strip a leading /api if present, trim slashes
$path = preg_replace('#^/api#', '', $uri);
$path = '/' . trim($path, '/');
$seg = $path === '/' ? [] : explode('/', trim($path, '/'));

try {
  // GET /api/health
  if ($method === 'GET' && $path === '/health') {
    try { Db::pdo()->query('SELECT 1'); Response::json(['ok' => true, 'db' => 'up']); }
    catch (Throwable $e) { Response::json(['ok' => false, 'db' => 'down', 'error' => $e->getMessage()], 500); }
  }

  // auth
  if ($path === '/auth/register' && $method === 'POST') Auth::register();
  if ($path === '/auth/login' && $method === 'POST') Auth::login();

  // members
  if ($path === '/members/me' && $method === 'GET') Members::me();
  if ($path === '/members/me' && $method === 'PATCH') Members::update();

  // venues
  if ($path === '/venues' && $method === 'GET') Venues::list();
  if (count($seg) === 2 && $seg[0] === 'venues' && $method === 'GET') Venues::get($seg[1]);
  if (count($seg) === 3 && $seg[0] === 'venues' && $seg[2] === 'request' && $method === 'POST') Venues::request($seg[1]);

  // jotform webhook
  if ($path === '/webhooks/jotform' && $method === 'POST') Jotform::webhook();

  Response::error('not found', 404);
} catch (Throwable $e) {
  error_log('[api] ' . $e->getMessage());
  Response::error('server error', 500);
}
