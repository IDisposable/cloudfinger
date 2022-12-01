export {};

declare global {
  // In wrangler.toml
  const CF_API_ENDPOINT: string;
  const WEBFINGER: KVNamespace;

  // In secrets
  const AUTH_TOKEN: string;
  const CF_ACCT_ID: string;
  const CF_API_TOKEN: string;
}
