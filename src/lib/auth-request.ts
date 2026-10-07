/** Use the configured origin with a native Request, preserving POST bodies. */
export function canonicalAuthRequest(
  request: Request,
  authUrl = process.env.AUTH_URL,
): Request {
  if (!authUrl) return request;
  const source = new URL(request.url);
  const target = new URL(authUrl);
  target.pathname = source.pathname;
  target.search = source.search;
  target.hash = "";
  return new Request(target, request);
}
