<?php
// Copy this file to config.php and fill in. config.php is git-ignored.
return [
  // Origins allowed to call the API (the app URLs). Use ['*'] to allow all.
  'cors_origins' => ['https://app.myvipclubs.com', 'http://localhost:4200'],

  // MySQL — your GoDaddy database
  'db' => [
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'name'     => 'myvipclubs',
    'user'     => 'myvipclubs',
    'password' => 'change-me',
  ],

  // Auth. Generate a long random secret, e.g.:  php -r "echo bin2hex(random_bytes(48));"
  'jwt_secret'  => 'change-me-to-a-long-random-string',
  'jwt_ttl'     => 60 * 60 * 24 * 7, // seconds (7 days)

  // Twilio (SMS). Leave blank to log-only without sending.
  'twilio' => [
    'account_sid'           => '',
    'auth_token'            => '',
    'messaging_service_sid' => '', // preferred
    'from_number'           => '', // or a single From number
  ],

  // Optional shared secret appended to the JotForm webhook URL (?token=...)
  'jotform_webhook_token' => '',
];
