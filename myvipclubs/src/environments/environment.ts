/**
 * App configuration.
 *
 * `apiBaseUrl` points the app at your LIVE backend on GoDaddy. It already
 * includes the trailing "/api".
 *
 * CURRENTLY USING http:// — SSL (AutoSSL) isn't active on the subdomain yet.
 * This works while you run the app locally at http://localhost. Once the free
 * SSL certificate is issued for api.myvipclubs.com (cPanel → Security →
 * SSL/TLS Status → check api.myvipclubs.com → Run AutoSSL), switch the active
 * line back to the https:// one below — you'll NEED https before hosting the
 * app itself on a secure (https) address, because browsers block an https page
 * from calling an http API.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://api.myvipclubs.com/api',
  // Secure URL to use once AutoSSL is active:
  // apiBaseUrl: 'https://api.myvipclubs.com/api',
};
