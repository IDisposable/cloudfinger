/**
 * A very simple check that a bearer token in the authorization header matches
 * a secret value stored in the environment var AUTH_TOKEN.
 *
 * Based on tsmith512/rnf-location-service and itty-router middleware examples.
 *
 * @param request (Request) inbound request passed in from itty-router
 * @param env (any) environment passed into CloudFlare worker
 * @returns (undefined | Response) Nothing or a 401 Unauthorized response
 */
export const authCheck = (request: Request, env: any): undefined | Response => {
  const authHeader = request.headers.get('Authorization');
  let error;

  if (authHeader) {
    const token = authHeader.split(' ').pop();

    if (token === env.AUTH_TOKEN) {
      // Returning undefined causes itty-router to proceed to the next handler.
      return;
    } else {
      error = 'Invalid bearer token';
    }
  } else {
    error = 'Missing bearer token';
  }

  // By default, stop request processing by returning a response.
  return new Response(
    JSON.stringify({
      success: false,
      errors: [error],
      messages: ['Authorization failure'],
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'text/json',
      },
    }
  );
};
