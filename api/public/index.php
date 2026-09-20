<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

Response::cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Work whether the app is served from the web root (docroot = public, the
// production setup) or from a subfolder like /MyVIPClubs/api/public (handy for
// local MAMP without changing the Document Root). Strip the folder index.php
// lives in, then an optional leading /api.
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
if ($scriptDir !== '' && str_starts_with($uriPath, $scriptDir)) {
  $uriPath = substr($uriPath, strlen($scriptDir));
}
$path = preg_replace('#^/api#', '', $uriPath);
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
  if ($path === '/members/me/photo' && $method === 'POST') Members::photo();

  // venues
  if ($path === '/venues' && $method === 'GET') Venues::list();
  if (count($seg) === 2 && $seg[0] === 'venues' && $method === 'GET') Venues::get($seg[1]);
  if (count($seg) === 3 && $seg[0] === 'venues' && $seg[2] === 'request' && $method === 'POST') Venues::request($seg[1]);

  // jotform webhook
  if ($path === '/webhooks/jotform' && $method === 'POST') Jotform::webhook();

  // ---- admin (admin role required) ----
  if ($path === '/admin/members' && $method === 'GET') Admin::listMembers();
  if (count($seg) === 3 && $seg[0] === 'admin' && $seg[1] === 'members' && $method === 'GET') Admin::getMember($seg[2]);
  if (count($seg) === 3 && $seg[0] === 'admin' && $seg[1] === 'members' && $method === 'PATCH') Admin::updateMember($seg[2]);
  if ($path === '/admin/venues' && $method === 'GET') Admin::listVenues();
  if ($path === '/admin/venues' && $method === 'POST') Admin::createVenue();
  if (count($seg) === 3 && $seg[0] === 'admin' && $seg[1] === 'venues' && $method === 'PATCH') Admin::updateVenue($seg[2]);

  Response::error('not found', 404);
} catch (Throwable $e) {
  error_log('[api] ' . $e->getMessage());
  Response::error('server error', 500);
}
