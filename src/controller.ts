import { name, version } from '../package.json';

export const hello = async (request: Request): Promise<Response> => {
  return new Response(
    JSON.stringify({
      messages: [`${name} ${version}`],
      url: request.url,
    }),
    {
      headers: {
        'worker': `'${name} ${version}'`,
        'content-type': 'application/json',
      },
    }
  );
};

export const finger = async (request: Request): Promise<Response> => {
  const requestURL = new URL(request.url);
  const resourceKey = requestURL.searchParams.get('resource');

  if (resourceKey === null) {
    return new Response('No resource requested', { status: 400 });
  }

  const email = resourceKey.replace(/^(acct:)*@*/, '');
  const value = await WEBFINGER.get(email);

  if (value === null) {
    return new Response(`Not found: ${email}`, { status: 404 });
  }

  const resourceArray = value.split('@');
  if (resourceArray.length !== 3) {
    return new Response(`Invalid translation: ${value}`, { status: 404 });
  }

  // this should be blank const prefix = resourceArray[0];
  const username = resourceArray[1];
  const hostname = resourceArray[2];

  const jsonData = `{
      "subject":"acct:${email}",
      "aliases":[
        "https://${hostname}/@${username}",
        "https://${hostname}/users/${username}"
      ],
      "links":[
        {"rel":"http://webfinger.net/rel/profile-page","type":"text/html","href":"https://${hostname}/@${username}"},
        {"rel":"self","type":"application/activity+json","href":"https://${hostname}/users/${username}"},
        {"rel":"http://ostatus.org/schema/1.0/subscribe","template":"https://${hostname}/authorize_interaction?uri={uri}"}
      ]
    }`;

  return new Response(jsonData, {
    headers: {
      'worker': `'${name} ${version}'`,
      'content-type': 'application/jrd+json; charset=utf-8',
    },
  });
};

export const fourohfour = async (): Promise<Response> => {
  return new Response('NOT FOUND', { status: 404 });
};

export const status = async (): Promise<Response> => {
  let result: any = undefined;

  try {
    const list = await WEBFINGER.list();
    result = { identity_count: list?.keys?.length };
  } catch (err) {
    result = { error: err };
  }

  return new Response(
    JSON.stringify({
      result,
    }),
    {
      status: 200,
      headers: {
        'worker': `'${name} ${version}'`,
        'content-type': 'application/json',
      },
    }
  );
};

export const list = async (): Promise<Response> => {
  let result: any = undefined;
  try {
    const values = await WEBFINGER.list();
    result = { list: values };
  } catch (err) {
    result = { error: err };
  }

  return new Response(JSON.stringify(result), {
    headers: {
      'worker': `'${name} ${version}'`,
      'content-type': 'application/json',
    },
  });
};
