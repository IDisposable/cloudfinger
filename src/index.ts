import { Router } from 'itty-router';
import { Request } from '@cloudflare/workers-types';

import { authCheck } from './auth';
import { hello, finger, fourohfour, list, status } from './controller';

const router = Router();

// handle the routes required by the webfinger protocol RFC7033
// https://www.rfc-editor.org/rfc/rfc7033
router.get('/.well-known/webfinger/', (request: Request, env: any) =>
  finger(request, env)
);
router.get('/.well-known/webfinger/hello', hello);
router.get('/.well-known/webfinger/status', (request: Request, env: any) =>
  status(request, env)
);

// The API is NOT mapped under well-known, because we
// do not want to expose those APIs. We also require a
// bearer token for any API request
router.all('/api/*', authCheck);
router.get('/api/list', (request: Request, env: any) => list(request, env));

router.all('*', fourohfour);

export default {
  fetch: router.handle,
};
