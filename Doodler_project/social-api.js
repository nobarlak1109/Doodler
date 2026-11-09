/* Optional Supabase REST adapter. No dependencies; sessions live in memory only. */
(() => {
  'use strict';
  class SocialAPI {
    constructor(config = {}, transport = globalThis.fetch.bind(globalThis)) {
      this.url = (config.url || '').replace(/\/$/, '');
      this.key = config.publishableKey || '';
      this.configured = Boolean(this.url && this.key);
      if (this.configured && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(this.url)) throw Error('Supabase 프로젝트 URL을 확인하세요.');
      if (this.key.startsWith('sb_secret_')) throw Error('공개 키만 사용할 수 있습니다.');
      // Reject legacy service-role JWTs before any network request.
      if (this.key.split('.').length === 3) {
        try { if (JSON.parse(atob(this.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role !== 'anon') throw Error('공개 anon 키만 사용할 수 있습니다.'); }
        catch { throw Error('공개 anon 키를 확인하세요.'); }
      }
      this.transport = transport;
      this.session = null;
      this.refreshing = null;
    }
    async request(path, { method = 'GET', body, headers = {}, raw = false, auth = true } = {}) {
      if (!this.configured) throw Error('커뮤니티 연결을 준비 중입니다.');
      if (auth && this.session && this.session.expires_at <= Date.now() + 30000) await this.refresh();
      const response = await this.transport(this.url + path, {
        method, headers: { apikey: this.key, ...(auth && this.session ? { Authorization: 'Bearer ' + this.session.access_token } : {}),
          ...(!raw && body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
        ...(body !== undefined ? { body: raw ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000)
      });
      const value = await response.text();
      let data; try { data = value ? JSON.parse(value) : null; } catch { data = null; }
      if (!response.ok) {
        if (response.status === 401 && auth) this.session = null;
        const error = Error(data?.msg || data?.message || data?.error_description || '요청에 실패했습니다. 다시 시도하세요.');
        error.status = response.status;
        throw error;
      }
      return data;
    }
    setSession(data) {
      this.session = data?.access_token ? { ...data, expires_at: Date.now() + data.expires_in * 1000 } : null;
    }
    async refresh() {
      if (!this.refreshing) this.refreshing = this.request('/auth/v1/token?grant_type=refresh_token', {
        method:'POST', body:{refresh_token:this.session.refresh_token}, auth:false
      }).then(data => this.setSession(data)).catch(error => { this.session = null; throw error; }).finally(() => { this.refreshing = null; });
      return this.refreshing;
    }
    requireUser() { if (!this.session?.user?.id) throw Error('먼저 로그인하세요.'); return this.session.user.id; }
    async signIn(email, password) {
      this.setSession(await this.request('/auth/v1/token?grant_type=password', { method:'POST', body:{email,password}, auth:false }));
    }
    async signUp(email, password) {
      const data = await this.request('/auth/v1/signup', {method:'POST',body:{email,password},auth:false});
      this.setSession(data);
    }
    async signOut() {
      try { if (this.session) await this.request('/auth/v1/logout', {method:'POST'}); }
      finally { this.session = null; }
    }
    async saveProfile({handle, display_name, bio}) {
      return this.request('/rest/v1/profiles?on_conflict=id', {method:'POST',headers:{Prefer:'resolution=merge-duplicates'},
        body:{id:this.requireUser(),handle,display_name,bio}});
    }
    myProfile() { return this.request('/rest/v1/profiles?id=eq.' + this.requireUser()); }
    profiles(query) {
      // Do not interpolate user input into PostgREST's filter grammar.
      const term = query.normalize('NFKC').replace(/[^\p{L}\p{N}_ -]/gu,'').slice(0,40);
      return this.request('/rest/v1/profiles?order=handle&limit=30&or=' + encodeURIComponent(`(handle.ilike.*${term}*,display_name.ilike.*${term}*,bio.ilike.*${term}*)`));
    }
    artworks({mine=false, owner=null, offset=0} = {}) {
      const filter = mine ? 'owner_id=eq.' + this.requireUser() : 'visibility=eq.public' + (owner ? '&owner_id=eq.' + encodeURIComponent(owner) : '');
      return this.request('/rest/v1/artworks?select=*,profiles!artworks_owner_id_fkey(display_name,handle),likes!likes_artwork_id_fkey(count)&' + filter + '&order=created_at.desc,id.desc&limit=12&offset=' + offset);
    }
    async imageURL(path) {
      const data = await this.request('/storage/v1/object/sign/drawings/' + path.split('/').map(encodeURIComponent).join('/'), {method:'POST',body:{expiresIn:60}});
      return this.url + '/storage/v1' + data.signedURL;
    }
    async upload(entry, visibility = 'private') {
      const owner = this.requireUser();
      if (!['private','public'].includes(visibility)) throw Error('공개 범위를 확인하세요.');
      if (!/^data:image\/png;base64,/.test(entry.image)) throw Error('PNG 그림만 저장할 수 있습니다.');
      const bytes = Uint8Array.from(atob(entry.image.split(',')[1]), c => c.charCodeAt(0));
      if (bytes.length > 2097152) throw Error('그림은 2MB 이하여야 합니다.');
      const source = String(entry.id);
      const existing = await this.request('/rest/v1/artworks?owner_id=eq.' + owner + '&source_id=eq.' + encodeURIComponent(source));
      if (existing.length) throw Error('이미 보관한 그림입니다. 클라우드 내 그림에서 공개 범위를 바꾸세요.');
      const id = crypto.randomUUID(), path = owner + '/' + id + '.png';
      await this.request('/storage/v1/object/drawings/' + path, {method:'POST',body:new Blob([bytes],{type:'image/png'}),raw:true,headers:{'Content-Type':'image/png'}});
      try {
        return await this.request('/rest/v1/artworks', {method:'POST',body:{id,owner_id:owner,source_id:source,title:entry.title,caption:entry.caption || '',
          topic_id:entry.topicId || 'legacy-garden',drawing_day:entry.day,mode:entry.mode || 'legacy',visibility}});
      } catch (error) {
        // A timeout may mean the insert committed: never delete its image in that case.
        if (error.status) await this.removeFile(path).catch(() => {});
        throw error;
      }
    }
    visibility(id, visibility) {
      return this.request('/rest/v1/artworks?id=eq.' + encodeURIComponent(id) + '&owner_id=eq.' + this.requireUser(), {method:'PATCH',body:{visibility}});
    }
    removeFile(path) { return this.request('/storage/v1/object/drawings', {method:'DELETE',body:{prefixes:[path]}}); }
    async removeArtwork(art) {
      const owner = this.requireUser();
      if (art.owner_id !== owner) throw Error('내 그림만 삭제할 수 있습니다.');
      await this.request('/rest/v1/artworks?id=eq.' + encodeURIComponent(art.id) + '&owner_id=eq.' + owner, {method:'DELETE'});
      try { await this.removeFile(art.image_path); }
      catch { throw Error('기록은 삭제됐지만 파일 정리가 남았습니다. 운영자에게 문의하세요.'); }
    }
    myLikes() { return this.request('/rest/v1/likes?user_id=eq.' + this.requireUser()); }
    myFollows() { return this.request('/rest/v1/follows?follower_id=eq.' + this.requireUser()); }
    like(id, enabled) {
      const user = this.requireUser();
      return enabled ? this.request('/rest/v1/likes', {method:'POST',body:{user_id:user,artwork_id:id},headers:{Prefer:'resolution=ignore-duplicates'}})
        : this.request('/rest/v1/likes?user_id=eq.' + user + '&artwork_id=eq.' + encodeURIComponent(id), {method:'DELETE'});
    }
    follow(id, enabled) {
      const user = this.requireUser();
      return enabled ? this.request('/rest/v1/follows', {method:'POST',body:{follower_id:user,following_id:id},headers:{Prefer:'resolution=ignore-duplicates'}})
        : this.request('/rest/v1/follows?follower_id=eq.' + user + '&following_id=eq.' + encodeURIComponent(id), {method:'DELETE'});
    }
  }
  globalThis.DoodlerSocialAPI = SocialAPI;
})();
