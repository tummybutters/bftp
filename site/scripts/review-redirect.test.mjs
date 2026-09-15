import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewRedirect } from '../lib/review-redirect.ts';
const token = 'a'.repeat(32);
const destination = 'https://www.google.com/maps/place/Backflow+Test+Pros/';
const request = (method = 'GET') => new Request('https://www.backflowtestpros.com/r/' + token, { method });
test('valid redirect waits for tracker and is not cacheable', async () => {
  let recorded = false;
  const r = await reviewRedirect(request(), token, async (url, options) => {
    assert.equal(url, 'https://bftp.teamqortana.com/api/review-links/' + token);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.method, 'GET');
    recorded = true;
    return new Response(null, { headers: { location: destination } });
  });
  assert.equal(recorded, true);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), destination);
  assert.match(r.headers.get('cache-control'), /no-store/);
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
});
test('HEAD resolves without recording a click', async () => {
  const r = await reviewRedirect(request('HEAD'), token, async (_, opts) => {
    assert.equal(opts.method, 'HEAD');
    return new Response(null, { headers: { location: destination } });
  });
  assert.equal(r.status, 302);
  assert.equal(await r.text(), '');
});
test('invalid tokens never call backend', async () => {
  for (const bad of ['../foo', 'a', token + '?next=evil', 'é'.repeat(32)]) {
    const r = await reviewRedirect(request(), bad, async () => { throw new Error('must not call'); });
    assert.equal(r.status, 404);
  }
});
test('unknown token is not silently redirected', async () => {
  assert.equal((await reviewRedirect(request(), token, async () => new Response(null, { status: 404 }))).status, 404);
});
test('tracker outage, auth redirects and invalid destination fail closed', async () => {
  const results = [new Response(null, { status: 503 }), new Response(null, { status: 302, headers: { location: '/login' } }),
    ...['https://evil.com/', 'https://www.google.com.evil.com/maps/place/x', 'https://www.google.com/url?q=evil', 'http://www.google.com/maps/place/x', 'https://x@www.google.com/maps/place/x'].map(location => new Response(null, { headers: { location } }))];
  for (const result of results) assert.equal((await reviewRedirect(request(), token, async () => result)).status, 503);
  assert.equal((await reviewRedirect(request(), token, async () => { throw new Error('timeout'); })).status, 503);
});
test('preview headers forwarded without customer cookies or referrer', async () => {
  const r = new Request('https://www.backflowtestpros.com/r/' + token, { headers: { 'purpose': 'prefetch', 'cookie': 'secret', 'referer': 'https://private/' } });
  await reviewRedirect(r, token, async (_, opts) => {
    assert.equal(opts.headers.purpose, 'prefetch');
    assert.equal(opts.headers.cookie, undefined);
    assert.equal(opts.headers.referer, undefined);
    return new Response(null, { headers: { location: destination } });
  });
});
