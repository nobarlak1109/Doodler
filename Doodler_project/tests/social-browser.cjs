// In-browser REST fixture; validates UI wiring, not Supabase's server policies.
exports.init = `(${function () {
  Object.defineProperty(window,'DOODLER_SOCIAL_CONFIG',{value:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},configurable:true});
  const owner = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const state = window.socialFixture = {requests:[],artworks:[],profiles:[],likes:[],follows:[],failUpload:false,failFeed:false};
  const stranger = {id:other,handle:'leaf',display_name:'풀잎',bio:'정원'};
  window.fetch = async (url, options = {}) => {
    state.requests.push(url);
    const u = new URL(url), path = u.pathname, method = options.method || 'GET';
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    let data = {};
    if (path.endsWith('/token')) data = {access_token:'fixture',refresh_token:'refresh',expires_in:3600,user:{id:owner,email:'test@example.com'}};
    else if (path.endsWith('/profiles')) {
      if (method === 'POST') state.profiles = [body];
      else {
        const term = (u.searchParams.get('or')?.match(/handle\.ilike\.\*([^*]*)\*/)?.[1] || '').toLowerCase();
        data = u.searchParams.has('id') ? state.profiles : [...state.profiles,stranger].filter(profile => [profile.handle,profile.display_name,profile.bio].join(' ').toLowerCase().includes(term));
      }
    } else if (path.endsWith('/artworks')) {
      if (method === 'POST') state.artworks.push({...body,image_path:owner+'/'+body.id+'.png',created_at:new Date().toISOString(),profiles:{display_name:'내 이름'},likes:[{count:0}]});
      else if (method === 'PATCH') state.artworks.find(art => 'eq.'+art.id === u.searchParams.get('id')).visibility = body.visibility;
      else if (method === 'GET') {
        const select = u.searchParams.get('select');
        if (select && (!select.includes('profiles!artworks_owner_id_fkey(') || !select.includes('likes!likes_artwork_id_fkey('))) return new Response(JSON.stringify({message:'Could not embed because more than one relationship was found'}),{status:300});
        if (select && state.failFeed) return new Response(JSON.stringify({message:'gallery unavailable'}),{status:503});
        data = state.artworks.filter(art => (!u.searchParams.has('source_id') || 'eq.'+art.source_id === u.searchParams.get('source_id')) && (!u.searchParams.has('owner_id') || 'eq.'+art.owner_id === u.searchParams.get('owner_id')) && (!u.searchParams.has('visibility') || art.visibility === 'public'));
      }
    } else if (path.endsWith('/likes')) {
      if (method === 'POST') state.likes.push(body);
      else if (method === 'DELETE') state.likes = [];
      else data = state.likes;
    } else if (path.endsWith('/follows')) {
      if (method === 'POST') state.follows.push(body);
      else if (method === 'DELETE') state.follows = [];
      else data = state.follows;
    } else if (path.includes('/object/sign/')) data = {signedURL:'/object/sign/fixture'};
    else if (path.includes('/object/drawings/') && state.failUpload) return new Response(JSON.stringify({message:'upload unavailable'}),{status:503});
    return new Response(JSON.stringify(data));
  };
}.toString()})();`;
exports.check = `(${async function () {
  let checks = 0;
  function assert(value,label) { if (!value) throw Error('Community: '+label); checks++; }
  const el = id => document.getElementById(id);
  async function wait() {
    for (let i=0;i<100;i++) { if (el('social-connected').getAttribute('aria-busy') !== 'true') return; await new Promise(resolve=>setTimeout(resolve,20)); }
    throw Error('Community UI action timed out');
  }
  await wait();
  // A queued hashchange can rebuild the selector; let route callbacks settle first.
  await new Promise(resolve => setTimeout(resolve,50));
  assert(location.hash === '#community' && !el('community').hidden && !el('social-connected').hidden && !el('social-auth').hidden,'configured guest screen');
  const auth = el('social-auth'); auth.elements.email.value = 'test@example.com'; auth.elements.password.value = 'password123';
  socialFixture.failFeed = true;
  auth.requestSubmit(); await wait();
  assert(!el('social-member').hidden && auth.elements.password.value === '', 'login and password clearing');
  assert(el('social-status').textContent.startsWith('로그인했습니다.') && el('social-status').textContent.includes('gallery unavailable'),'gallery failure does not disguise successful login');
  socialFixture.failFeed = false; el('social-refresh').click(); await wait();
  const profile = el('social-profile');
  profile.elements.handle.value = 'tester'; profile.elements.display_name.value = '내 이름'; profile.elements.bio.value = '<img src=x onerror=alert(1)>';
  profile.requestSubmit(); await wait();
  assert(socialFixture.profiles[0].display_name === '내 이름','profile saved');
  const c = document.createElement('canvas'); c.width=10; c.height=10;
  saved.push({id:'social-1',image:c.toDataURL(),title:'내 그림',caption:'<script>example</script>',topicId:'garden',mode:'daily',day:'2026-11-09'});
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  el('social-local').value = 'social-1';
  assert(el('social-upload').checkValidity(),'upload selection valid');
  el('social-upload').requestSubmit(); await wait();
  assert(socialFixture.artworks.length === 1 && socialFixture.artworks[0].visibility === 'private','explicit upload defaults private: '+el('social-status').textContent+' rows='+socialFixture.artworks.length);
  assert(el('social-artworks').textContent.includes('<script>example</script>') && !el('social-artworks').querySelector('script'),'caption rendered as plain text');
  el('social-public').click(); await wait();
  assert(el('social-artworks').children.length === 0,'private drawing excluded from public feed');
  el('social-mine').click(); await wait();
  const originalConfirm = window.confirm; window.confirm = () => true;
  [...el('social-artworks').querySelectorAll('button')].find(b => b.textContent === '전체 공개로 변경').click(); await wait();
  window.confirm = originalConfirm;
  assert(socialFixture.artworks[0].visibility === 'public','deliberate publication');
  el('social-public').click(); await wait();
  el('social-artworks').querySelector('button[aria-pressed]').click(); await wait();
  assert(socialFixture.likes.length === 1,'persistent like request');
  el('social-search').requestSubmit(); await wait();
  assert(!el('social-profiles').querySelector('img'),'profile text cannot inject markup');
  [...el('social-profiles').querySelectorAll('button')].find(b => b.textContent === '팔로우').click(); await wait();
  assert(socialFixture.follows.length === 1,'follow request');
  location.hash = 'profiles'; await new Promise(resolve => setTimeout(resolve,300)); await wait();
  assert(el('profile-grid').children.length === 2 && !el('profiles').querySelector('.preview-notice').textContent.includes('가상의'),'top profiles route uses real records');
  el('profile-query').value = 'leaf'; el('profile-query').dispatchEvent(new Event('input'));
  await new Promise(resolve => setTimeout(resolve,300)); await wait();
  assert(el('profile-grid').children.length === 1 && el('profile-grid').textContent.includes('@leaf'),'top profile search reaches backend');
  el('profile-grid').querySelector('button[aria-pressed]').click(); await wait();
  assert(socialFixture.follows.length === 0,'top profile follow control uses signed-in account');
  el('profile-grid').querySelector('button').click(); await new Promise(resolve => setTimeout(resolve,20)); await wait();
  assert(location.hash === '#community' && el('social-artworks').children.length === 0 && el('social-feed-label').textContent.includes('선택한 사람'),'top profile artwork button opens only selected owner');
  location.hash = 'profiles'; await new Promise(resolve => setTimeout(resolve,300)); await wait();
  el('profile-query').value = 'nobody'; el('profile-search').requestSubmit();
  await new Promise(resolve => setTimeout(resolve,300)); await wait();
  assert(!el('profile-empty').hidden && el('profile-grid').children.length === 0,'real profile empty state');
  el('reset-search').click(); await new Promise(resolve => setTimeout(resolve,300)); await wait();
  assert(el('profile-grid').children.length === 2,'real profile search reset');
  location.hash = 'community'; await new Promise(resolve => setTimeout(resolve,20));
  saved.push({...saved[saved.length-1],id:'social-2'}); window.dispatchEvent(new HashChangeEvent('hashchange'));
  el('social-local').value = 'social-2'; socialFixture.failUpload = true;
  el('social-upload').requestSubmit(); await wait();
  assert(el('social-status').textContent === 'upload unavailable' && saved.some(e => e.id === 'social-2'),'failed upload preserves local drawing');
  el('social-logout').click(); await wait();
  assert(el('social-member').hidden && !el('social-auth').hidden,'logout clears account screen');
  assert(!el('social-artworks').textContent.includes('나만 보기'),'logout clears private results');
  assert(document.documentElement.scrollWidth <= innerWidth,'configured layout fits viewport');
  return checks;
}.toString()})()`;
