/* istanbul ignore file */
import { Router } from 'itty-router';

import { authCheck } from './auth';
import { hello, finger, fourohfour, list, status } from './controller';

const router = Router();

// handle the routes required by the webfinger protocol RFC7033
// https://www.rfc-editor.org/rfc/rfc7033
router.get('/.well-known/webfinger/', finger);
router.get('/.well-known/webfinger/hello', hello);
router.get('/.well-known/webfinger/status', status);

// The API is NOT mapped under well-known, because we
// do not want to expose those APIs. We also require a
// bearer token for any API request
router.all('/api/*', authCheck);
router.get('/api/list', list);

router.all('*', fourohfour);

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(router.handle(event.request));
});

export {};
