/* Community is optional; no requests or uploads until configured. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  let api;
  try { api = new DoodlerSocialAPI(window.DOODLER_SOCIAL_CONFIG); }
  catch (error) { el('social-status').textContent = error.message; return; }
  if (!api.configured) return;
  const status = message => { el('social-status').textContent = message; };
  let feed = {}, offset = 0, busy = false;
  // Serialize actions to prevent double uploads and stale account/feed responses.
  async function run(task) {
    if (busy) return;
    busy = true;
    el('social-connected').setAttribute('aria-busy','true');
    el('social-connected').inert = true;
    status('불러오는 중…');
    try { await task(); }
    catch (error) {
      const message = error.message || '연결에 실패했습니다. 다시 시도하세요.';
      status(message);
      if (location.hash === '#profiles') el('profile-result-count').textContent = message;
    }
    finally {
      busy = false;
      el('social-connected').inert = false;
      el('social-connected').removeAttribute('aria-busy');
      // An expired/revoked session returns the UI to the logged-out state.
      if (!api.session && !el('social-member').hidden) {
        accountView(); el('social-artworks').replaceChildren(); el('social-profiles').replaceChildren();
        el('social-more').hidden = true;
        renderProfiles();
      }
    }
  }
  function button(label, task) {
    const node = document.createElement('button'); node.className = 'tool'; node.textContent = label;
    node.onclick = () => run(task); return node;
  }
  function localOptions() {
    const select = el('social-local'), value = select.value;
    select.replaceChildren(new Option('그림 선택',''));
    saved.forEach(entry => select.add(new Option(`${entry.day} · ${entry.title}`, String(entry.id))));
    if (saved.some(entry => String(entry.id) === value)) select.value = value;
  }
  function accountView() {
    const member = Boolean(api.session);
    el('social-auth').hidden = member; el('social-member').hidden = !member;
    el('social-mine').disabled = !member;
    el('social-identity').textContent = member ? api.session.user.email : '';
    localOptions();
  }
  async function loadProfile() {
    el('social-profile').reset();
    const [profile] = await api.myProfile();
    if (profile) for (const key of ['handle','display_name','bio']) el('social-profile').elements[key].value = profile[key];
  }
  async function loadAfterLogin() {
    const failures = [];
    try { await loadProfile(); } catch (error) { failures.push('프로필을 불러오지 못했습니다: ' + error.message); }
    feed = {};
    try { await loadFeed(); } catch (error) { failures.push('공개 그림을 불러오지 못했습니다: ' + error.message); }
    if (api.session) status('로그인했습니다. ' + (failures.join(' ') || '프로필을 저장한 뒤 그림을 업로드하세요.'));
    else status('로그인이 만료됐습니다. 다시 로그인하세요.');
    renderProfiles();
  }
  async function loadFeed(append = false) {
    const nextOffset = append ? offset : 0;
    const rows = await api.artworks({...feed,offset:nextOffset});
    const liked = api.session ? new Set((await api.myLikes()).map(row => row.artwork_id)) : new Set();
    const cards = await Promise.all(rows.map(async art => {
      const {article} = imageCard('', art.title, `${art.profiles?.display_name || ''} · ${art.drawing_day} · ${art.visibility === 'public' ? '전체 공개' : '나만 보기'}`);
      const img = article.querySelector('img'); img.removeAttribute('src');
      try { img.src = await api.imageURL(art.image_path); }
      catch { img.alt = art.title + ' · 이미지를 불러오지 못했습니다. 새로고침해 주세요.'; }
      const caption = document.createElement('p'); caption.className = 'art-caption'; caption.textContent = art.caption; article.append(caption);
      const actions = document.createElement('div'); actions.className = 'card-actions';
      const count = art.likes?.[0]?.count || 0;
      if (api.session && art.visibility === 'public') {
        const like = button(`${liked.has(art.id) ? '♥' : '♡'} ${count}`, async () => { await api.like(art.id,!liked.has(art.id)); await loadFeed(); status('좋아요를 반영했습니다.'); });
        like.setAttribute('aria-pressed',String(liked.has(art.id))); actions.append(like);
      } else { const label = document.createElement('span'); label.textContent = '♡ ' + count; actions.append(label); }
      if (art.owner_id === api.session?.user.id) {
        actions.append(button(art.visibility === 'public' ? '나만 보기로 변경' : '전체 공개로 변경', async () => {
          if (art.visibility !== 'public' && !window.confirm('이 그림과 메모를 누구나 볼 수 있도록 공개할까요?')) { status('공개를 취소했습니다.'); return; }
          await api.visibility(art.id,art.visibility === 'public' ? 'private' : 'public'); await loadFeed(); status('공개 범위를 변경했습니다.');
        }), button('클라우드에서 삭제', async () => {
          if (!window.confirm('클라우드 그림을 삭제할까요? 이 브라우저의 원본은 유지됩니다.')) { status('삭제를 취소했습니다.'); return; }
          await api.removeArtwork(art); await loadFeed(); status('클라우드 그림을 삭제했습니다.');
        }));
      }
      article.append(actions); return article;
    }));
    if (!append) el('social-artworks').replaceChildren();
    el('social-artworks').append(...cards);
    offset = nextOffset + rows.length;
    el('social-more').hidden = rows.length < 12;
    el('social-feed-label').textContent = (feed.mine ? '클라우드 내 그림' : feed.owner ? '선택한 사람의 공개 그림' : '공개 갤러리') + (offset ? ` · ${offset}장` : ' · 그림이 없습니다.');
  }
  el('social-auth').onsubmit = event => {
    event.preventDefault();
    const signup = event.submitter?.name === 'signup';
    const form = event.currentTarget, email = form.elements.email.value.trim(), password = form.elements.password.value;
    run(async () => {
      try { await (signup ? api.signUp(email,password) : api.signIn(email,password)); }
      finally { form.elements.password.value = ''; }
      accountView();
      if (api.session) await loadAfterLogin();
      else status('가입 요청을 보냈습니다. 이메일을 확인한 뒤 로그인하세요.');
    });
  };
  el('social-logout').onclick = () => run(async () => {
    try { await api.signOut(); }
    finally {
      accountView(); el('social-profile').reset(); el('social-artworks').replaceChildren(); el('social-profiles').replaceChildren(); el('social-more').hidden = true;
      feed = {}; offset = 0;
      renderProfiles();
    }
    await loadFeed(); status('로그아웃했습니다.');
  });
  el('social-profile').onsubmit = event => {
    event.preventDefault(); const form = event.currentTarget;
    run(async () => { await api.saveProfile({handle:form.elements.handle.value.trim(),display_name:form.elements.display_name.value.trim(),bio:form.elements.bio.value.trim()}); status('프로필을 저장했습니다.'); renderProfiles(); });
  };
  el('social-upload').onsubmit = event => {
    event.preventDefault();
    const entry = saved.find(item => String(item.id) === el('social-local').value), visibility = event.currentTarget.elements.visibility.value;
    run(async () => {
      if (!entry) throw Error('보관할 그림을 선택하세요.');
      await api.upload(entry,visibility); feed = {mine:true}; await loadFeed(); status('선택한 그림을 보관했습니다.');
    });
  };
  el('social-public').onclick = () => run(async () => { feed = {}; await loadFeed(); status('공개 그림을 불러왔습니다.'); });
  el('social-mine').onclick = () => run(async () => { feed = {mine:true}; await loadFeed(); status('클라우드 내 그림을 불러왔습니다.'); });
  el('social-refresh').onclick = () => run(async () => { await loadFeed(); status('새로고침했습니다.'); });
  el('social-more').onclick = () => run(async () => { await loadFeed(true); status('다음 그림을 불러왔습니다.'); });
  function remoteProfileCard(profile, follows) {
    const card = document.createElement('article'); card.className = 'profile-card';
    card.append(profileSummary({name:profile.display_name,handle:profile.handle,bio:profile.bio,tags:[]}));
    card.append(button('공개 그림 보기',async () => {
      // Route to the existing paginated gallery, without triggering its initial all-user load.
      opened = true; feed = {owner:profile.id}; location.hash = 'community';
      await loadFeed(); status('프로필의 공개 그림을 불러왔습니다.'); el('social-feed-label').scrollIntoView({block:'center'});
    }));
    if (api.session && profile.id !== api.session.user.id) {
      let following = follows.has(profile.id);
      const follow = button(following ? '팔로우 취소' : '팔로우',async () => {
        await api.follow(profile.id,!following); following = !following;
        follow.textContent = following ? '팔로우 취소' : '팔로우'; follow.setAttribute('aria-pressed',String(following)); status('팔로우를 반영했습니다.');
      });
      follow.setAttribute('aria-pressed',String(following)); card.append(follow);
    }
    return card;
  }
  async function searchProfiles(query, target) {
      const profiles = await api.profiles(query);
      const follows = api.session ? new Set((await api.myFollows()).map(row => row.following_id)) : new Set();
      // Ignore a response for a query edited while its request was in flight.
      if (target === 'profile-grid' && (el('profile-query').value.trim() !== query || location.hash !== '#profiles')) return null;
      el(target).replaceChildren(...profiles.map(profile => remoteProfileCard(profile,follows)));
      return profiles.length;
  }
  el('social-search').onsubmit = event => {
    event.preventDefault(); const query = event.currentTarget.elements.query.value;
    run(async () => { const count = await searchProfiles(query,'social-profiles'); status(`프로필 ${count}명을 찾았습니다.`); });
  };
  let profileSearchTimer;
  window.renderRemoteProfiles = () => {
    clearTimeout(profileSearchTimer);
    el('profile-grid').replaceChildren(); el('profile-detail').hidden = true; el('profile-empty').hidden = true;
    if (location.hash !== '#profiles') return;
    el('profile-result-count').textContent = '프로필을 찾는 중…';
    profileSearchTimer = setTimeout(() => {
      if (busy) { window.renderRemoteProfiles(); return; }
      const query = el('profile-query').value.trim();
      run(async () => {
        try {
          const count = await searchProfiles(query,'profile-grid');
          if (count === null) return;
          el('profile-result-count').textContent = `프로필 ${count}명 · 최대 30명`;
          el('profile-empty').hidden = count > 0;
          status(`프로필 ${count}명을 찾았습니다.`);
        } catch (error) { el('profile-result-count').textContent = '프로필을 불러오지 못했습니다. ' + error.message; throw error; }
      });
    },200);
  };
  el('profiles').querySelector('.badge').textContent = '프로필';
  el('profiles').querySelector('.preview-notice').textContent = '가입 후 프로필을 저장한 사람들을 찾을 수 있습니다. 아이디, 닉네임, 소개로 검색하세요.';
  el('profile-query').placeholder = '아이디, 닉네임, 관심 주제';
  el('profile-query').maxLength = 40;
  renderProfiles();
  window.addEventListener('hashchange',() => { if (location.hash === '#community') localOptions(); });
  // Confirmation links can return with a token fragment. Password login remains explicit.
  if (/^#(?:access_token|error)=/.test(location.hash)) {
    history.replaceState(null,'',location.pathname + location.search + '#community'); navigate();
  }
  el('social-connected').hidden = false; accountView();
  status('로그인하면 내 그림을 보관하고 좋아요와 팔로우를 사용할 수 있어요.');
  // Browse only on an explicit visit; configuration alone never uploads local data.
  let opened = false;
  function open() { if (!opened && location.hash === '#community') { opened = true; run(async () => { await loadFeed(); status('공개 그림을 불러왔습니다.'); }); } }
  window.addEventListener('hashchange',open); open();
})();
