# CloudFinger <img src='./docs/cloudfinger.svg' title='CloudFinger Logo' width=150px height=75px />

## A WebFinger Responder

This is a webfinger service, intended to run locally or as a [Cloudflare Worker](https://developers.cloudflare.com/workers), consumes a list of mappings from an web identity to another identity as used by services like Mastodon.

The mappings are store in a [Cloudflare KV Store](https://developers.cloudflare.com/workers/runtime-apis/kv/) and should be manipulated via the [Cloudflare Dashboard](https://dash.cloudflare.com) (for now).

This service exposes a very simple (read-only) API and lacks a frontend. I will be adding the rest of the API next.

### Features

- Stores mappings as KV pairs, where the key the web identity like `idisposable@github365.com` and the value is the destination identity like `@idisposable@mastodon.world`. [Example](https://github365.com/.well-known/webfinger/?resource=acct:idisposable@github365.com)
- Exposes a public endpoint at `/.well-known/webfinger/` that acts like a normal webfinger server and responds to the normal `?resource=acct:identity` parameter.
- Returns a webidentity like any normal [Mastodon Identity](https://docs.joinmastodon.org/spec/webfinger/) server without the entire infrastructure of a Mastondon install.
- Exposes a public health endpoint at `/.well-known/webfinger/hello` that returns the worker name and version number
- Exposes a public status endpoint at `/.well-known/webfinger/status` that returns the number of mappings in the KV store
- Exposes a secured (via preshared auth token) API at `/api/` that current only allows `list`ing of the mappings (API to come https://github.com/IDisposable/cloudfinger/issues/2)

### Setup

- Clone this repository
- `npm install` to get all the packages installed
- Login to the [CloudFlare Dashboard](https://dash.cloudflare.com/)
- Do a `wrangler whomai` to ensure that wrangler has access to your CloudFlare account
- Create a _cloudfinger_ Worker (whether you intend to run locally or not)
- Randomly generate some Bearer token to secure the API, perhaps with something like `openssl rand -base64 32`. Make sure you keep this value somewhere safe as we need to pass it as a Bearer token for any API-secured calls
- `wrangler secret put AUTH_TOKEN` and paste in that freshly generated token
- `wrangler kv:namespace create webfinger` to create the KV namespace for the webfinger
- Update the `wrangler.toml` file to have your namespace mapping's ID and replace what's there with the id shown in the previous step _(Note: this isn't super secret, the ID is useless without the account ID)_
- Lookup your CloudFlare account ID (this is account-level, NOT domain-level) from the [Dashboard](./docs/account.png)
- `wrangler secret put CF_ACCT_ID` and paste in the ID from above to store the CloudFlare account id for the API
- Provision a Cloudflare API token to write to it
  - On the dashboard right side, just below the account number, click [API Tokens](./docs/api-tokens-1.png) or just <https://dash.cloudflare.com/profile/api-tokens>
  - Create a token:
    - _Either_ Quick start this [this URL](https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_kv_storage%22%2C%22type%22%3A%22edit%22%7D%5D&name=cloudfinger) to prefill the form this far (thanks to [James Ross @Cherry](https://github.com/Cherry) for this [URL generator](https://cfdata.lol/tools/api-token-url-generator/) tool.)
    - _Or_ By hand
      - Click [Create Token](./docs/api-tokens-2.png)
      - Scroll down to the _Custom token_ section and click [Get started](./docs/api-tokens-3.png)
      - Fill in the _Create Custom Token_ form:
        - Enter a name (for example _cloudfinger_)
        - In _Permissions_ section
          - Choose `Account`
          - Choose `Workers KV Storage`
          - Choose `Edit` to allow the API to update values
    - _continue either way_
    - In the _Account Resources_ section
      - Choose `Include`
      - Choose either `All Accounts` or the specific account you're building this worker for
    - In the _Client IP Address Filter_ section, just leave things blank (would be nice if CloudFlare would allow you to lock it down to **only** your IPs and the CloudFlare Worker IPs... but not yet)
    - Leave the _TTL_ section alone, we want the Token to last until revoked
  - Click [Continue to summary](./docs/api-tokens-4.png) to advance to the review screen
  - Click [Create token](./docs/api-tokens-5.png) to generte the token
  - Click [Copy](./docs/api-tokens-6.png) to get the token value on your clipboard _(Note: you can copy/paste the `curl` command shown to validate your token, but remember that shell histories will record that token in the clear, make sure you elide it from your `~/.zsh_history` or `~/.bash_history` or you're risking leaking the token)_
- `wrangler secret put CF_API_TOKEN` and the paste in the token from above
- That's the Wrangler [Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret), verify they have been setup with the right names (you won't be able to see the values, they're **secret**) with a `wrangler secret list` and you should see `AUTH_TOKEN`, `CF_ACCT_ID`, and `CF_API_TOKEN`
- Confirm in `wrangler.toml` that the default values are acceptable for: `CF_API_ENDDPOINT`, you can get the current version from the [Cloudflare API](https://developers.cloudflare.com/api) page, which was `https://api.cloudflare.com/client/v4` at the time this worker was developed
- Do a trial build with `npm run build`
- Deploy _cloudfinger_ to Workers with `npm run deploy` or use `npm run start`
  to run it locally.

### Usage

- Start with `npm run start` which will run the local version
- Press `b` to start a local browser against the wrangler-host (typically <http://127.0.0.1:8787> which will respond with a 404 `NO FOUND` message)
- Request `/.well-known/webfinger/hello` to get the current worker version
- Request `/.well-known/webfinger/status` to confirm that the CloudFlare API values are correct
- Request `/.well-known/webfinger/?resource=acct:foo` to verify webfinger requests are being accepted
- Request `/.well-known/webfinger/?resource=acct:your@example.org` (where you can replace with any KV value entered in either the CloudFlare web interface or via `wrangler kv:)
- Request `/api/list` to see the current list of key-value pairs in the bound KV namespace
  - When doing any API calls, [pass the Bearer token](./docs/api-sample.png) to authenticate requests

### Setting up production routes

- Go to the [Dashboard](https://dash.cloudflare.com/)
- Select `Workers` / `Overview` on the [left menu](./docs/routes-1.png)
- Select your _cloudfinger_ worker in the [right panel](./docs/routes-2.png)
- Click Routes _View_ in the _cloudfinger_ [info panel](./docs/routes-3.png)
- Click the _Add Route_ above the [routes list](./docs/routes-4.png) (you may have to scroll up a bit)
- Fill in the form with the domain(s) CloudFlare is handling
  - Fill in the _Route_ domain portion, for example `github365.com`
  - Append the `/.well-known/webfinger/*` suffix as required by the webfinger protocol
  - In the _Zone_, select the specific zone you want this route applied to (typically matches the domain prefix above)
  - Click the [Add Route](./docs/routes-5.png)
- Repeat above steps if you want to bind the same worker to multiple domains.

#### Known Limitations

- This ONLY provides the endpoint needed to handle the **webfinger** protocol using the standard protocol, it does NOT do anything or provide any actual Mastodon functionality
- There's no frontend
- I need to document how to setup the KV values from the command line and/or dashboard

#### Troubleshooting

- You may need to purge routes from CDN cache if a webfinger result does not take immediate effect.
- If you get an CloudFlare error, you can check the worker logs
- The examples in the documentation are for my actual live deploy so feel free to [finger this](https://github365.com/.well-known/webfinger/?resource=acct:idisposable@github365.com)
