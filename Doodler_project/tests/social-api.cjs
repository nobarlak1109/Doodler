// Contract/failure checks; no live service, credentials, or uploads.
const {test} = require('node:test');
const assert = require('node:assert/strict');
require('../social-api.js');
const API = globalThis.DoodlerSocialAPI;
const owner = '11111111-1111-4111-8111-111111111111';
const cfg = {url:'https://example.supabase.co',publishableKey:'sb_publishable_example'};
const ok = (data, status=200) => new Response(JSON.stringify(data),{status});
const entry = {id:'local-1',image:'data:image/png;base64,iVBORw==',title:'garden',caption:'<hello>',topicId:'garden',day:'2026-11-09',mode:'daily'};
function client(handler) {
  const calls = [];
  const api = new API(cfg,async (url,options) => { calls.push({url,options}); return handler(url,options,calls); });
  api.setSession({access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:owner}});
  return {api,calls};
}
test('disabled configuration never calls the network',async () => {
  const api = new API({},() => { throw Error('unexpected network'); });
  await assert.rejects(api.profiles('leaf'),/준비/);
});
test('rejects secret keys and non-Supabase origins',() => {
  assert.throws(() => new API({...cfg,publishableKey:'sb_secret_bad'}));
  const jwt = 'e30.' + Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url') + '.sig';
  assert.throws(() => new API({...cfg,publishableKey:jwt}));
  assert.throws(() => new API({...cfg,url:'https://attacker.example'}));
});
test('private upload by default, owner path, plain captions and no overwrite',async () => {
  const {api,calls} = client(url => ok(url.includes('source_id=') ? [] : {}));
  await api.upload(entry);
  assert.equal(calls.length,3);
  assert.match(calls[1].url,new RegExp('/drawings/' + owner + '/[0-9a-f-]+.png$'));
  assert.equal(calls[1].options.body.type,'image/png');
  assert.equal(calls[1].options.headers['x-upsert'],undefined);
  const row = JSON.parse(calls[2].options.body);
  assert.equal(row.visibility,'private'); assert.equal(row.owner_id,owner); assert.equal(row.caption,'<hello>');
  assert.equal(calls[2].options.headers.Authorization,'Bearer access');
});
test('duplicate import and oversize images do not upload files',async () => {
  const {api,calls} = client(() => ok([{id:'existing'}]));
  await assert.rejects(api.upload(entry),/이미/);
  assert.equal(calls.length,1);
  await assert.rejects(api.upload({...entry,image:'data:image/png;base64,' + Buffer.alloc(2097153).toString('base64')}),/2MB/);
  assert.equal(calls.length,1);
});
test('metadata rejection cleans up uploaded image; network ambiguity keeps it',async () => {
  for (const ambiguous of [false,true]) {
    const {api,calls} = client((url,options) => {
      if (url.includes('source_id=')) return ok([]);
      if (url.endsWith('/rest/v1/artworks')) { if (ambiguous) throw Error('timeout'); return ok({message:'rejected'},403); }
      return ok({});
    });
    await assert.rejects(api.upload(entry));
    assert.equal(calls.filter(call => call.options.method === 'DELETE').length,ambiguous ? 0 : 1);
  }
});
test('expired concurrent requests share a single refresh and use new token',async () => {
  let refreshes = 0;
  const {api,calls} = client(async url => {
    if (url.includes('grant_type=refresh_token')) { refreshes++; await new Promise(resolve=>setTimeout(resolve,10)); return ok({access_token:'new',refresh_token:'next',expires_in:3600,user:{id:owner}}); }
    return ok([]);
  });
  api.session.expires_at = 0;
  await Promise.all([api.myProfile(),api.myLikes()]);
  assert.equal(refreshes,1);
  calls.filter(call => call.url.includes('/rest/')).forEach(call => assert.equal(call.options.headers.Authorization,'Bearer new'));
});
test('revoked authentication and failed logout clear session',async () => {
  const {api} = client(() => ok({message:'revoked'},401));
  await assert.rejects(api.myProfile()); assert.equal(api.session,null);
  api.setSession({access_token:'access',expires_in:3600,user:{id:owner}});
  await assert.rejects(api.signOut()); assert.equal(api.session,null);
});
test('anonymous requests do not send a publishable key as a bearer token',async () => {
  const calls = [];
  const api = new API(cfg,async (url,options) => {calls.push(options);return ok([]);});
  await api.artworks();
  assert.equal(calls[0].headers.Authorization,undefined);
  assert.equal(calls[0].headers.apikey,cfg.publishableKey);
  assert.throws(() => api.like('art',true),/로그인/);
});
test('search input cannot inject PostgREST operators',async () => {
  const {api,calls} = client(() => ok([]));
  await api.profiles('leaf),id.neq.secret');
  assert.match(decodeURIComponent(calls[0].url),/handle.ilike.\*leafidneqsecret\*/);
});
test('pagination and visibility filters stay explicit',async () => {
  const {api,calls} = client(() => ok([]));
  await api.artworks({offset:12}); await api.artworks({mine:true});
  assert.match(calls[0].url,/visibility=eq.public/); assert.match(calls[0].url,/offset=12/);
  assert.match(calls[1].url,new RegExp('owner_id=eq.'+owner));
});
test('delete hides metadata first, reports storage cleanup failure, rejects other owners',async () => {
  const {api,calls} = client(url => url.includes('/storage/') ? ok({message:'storage down'},503) : ok({}));
  await assert.rejects(api.removeArtwork({id:'art',owner_id:owner,image_path:owner+'/art.png'}),/파일 정리/);
  assert.match(calls[0].url,/rest\/v1\/artworks/);
  assert.match(calls[1].url,/storage\/v1\/object\/drawings/);
  await assert.rejects(api.removeArtwork({owner_id:'other'}),/내 그림/);
  assert.equal(calls.length,2);
});
