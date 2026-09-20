/**
 * App configuration.
 *
 * `apiBaseUrl` points the app at your LIVE backend on GoDaddy. It already
 * includes the trailing "/api".
 *
 * It uses https:// — so turn on the free SSL certificate for the subdomain
 * first (cPanel → Security → SSL/TLS Status → check api.myvipclubs.com →
 * Run AutoSSL). Give it a few minutes to issue.
 *
 * If SSL isn't active yet and you just want to test locally on your machine,
 * you can temporarily switch to the http:// line below.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.myvipclubs.com/api',
  // Temporary no-SSL fallback for local testing:
  // apiBaseUrl: 'http://api.myvipclubs.com/api',
};
