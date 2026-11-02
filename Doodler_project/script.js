 'use strict';
const $ = selector => document.querySelector(selector);
const canvas = $('#canvas'), ctx = canvas.getContext('2d');
const DURATION = 180;
const colors = ['#292b36','#6975e8','#f3b65b','#ed879b','#71b7a0','#b79bdb'];
const topics = [
 {id:'planet-garden', title:'다른 행성의 작은 정원', description:'다른 행성에 있는 정원을 그려보세요.'},
 {id:'cloud-house', title:'구름 위의 집', description:'구름 위에 집이 있다면 어떤 모습일까요?'},
 {id:'pocket-friend', title:'주머니 속 작은 친구', description:'주머니에 들어갈 만큼 작은 친구를 그려보세요.'},
 {id:'midnight-shop', title:'자정에만 열리는 가게', description:'자정에만 문을 여는 가게를 그려보세요.'},
 {id:'walking-cup', title:'산책하는 찻잔', description:'찻잔에 다리가 달렸다면 어디로 갈까요?'},
 {id:'sound-shape', title:'좋아하는 소리의 모양', description:'좋아하는 소리를 선과 색으로 표현해보세요.'},
 {id:'future-window', title:'내일로 향하는 창문', description:'내일 보고 싶은 풍경을 그려보세요.'}
];
function dayKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
function dailyTopic(day = dayKey()) { const index = Math.floor(Date.parse(day+'T00:00:00Z')/86400000); return topics[((index % topics.length)+topics.length)%topics.length]; }
function readStore(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function persist(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function validEntry(entry) { return entry && typeof entry==='object' && (typeof entry.id==='number'||typeof entry.id==='string') && typeof entry.image==='string' && /^data:image\/(png|jpeg|webp);base64,/.test(entry.image) && typeof entry.date==='string' && Number.isFinite(Date.parse(entry.date)); }
let saved = readStore('jogak-drawings',[]); saved = Array.isArray(saved) ? saved.filter(validEntry).map(entry=>({...entry,title:typeof entry.title==='string'?entry.title.slice(0,120):'나의 그림',caption:typeof entry.caption==='string'?entry.caption.slice(0,100):'',topicId:typeof entry.topicId==='string'?entry.topicId:'legacy-garden',mode:['daily','practice','variation'].includes(entry.mode)?entry.mode:'legacy',day:typeof entry.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(entry.day)?entry.day:dayKey(new Date(entry.date)),parentId:typeof entry.parentId==='number'||typeof entry.parentId==='string'?entry.parentId:null})).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)) : [];
let liked = readStore('jogak-likes',{}); if(!liked || typeof liked!=='object' || Array.isArray(liked)) liked={};
let color=colors[0], erasing=false, drawing=false, hasDrawing=false, pointerId=null;
let tool="brush", origin=null, shapeBase=null, shapeChanged=false, sprayId=null, redoHistory=[];
let previous, history=[], timerId=null, deadline=0, remaining=DURATION, toastId;
let session={day:dayKey(),topic:dailyTopic(),mode:'daily',parentId:null,constraint:''};
let pendingDelete=null, draftWarningShown=false;
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastId); toastId=setTimeout(()=>$('#toast').classList.remove('show'),3200); }
function updateTimer() { $('#timer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'); $('#timer').classList.toggle('urgent',remaining<=30); }
function tick() { remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000)); updateTimer(); if(!remaining) finish(true); }
function startTimer() { if(timerId) return; deadline=deadline || Date.now()+remaining*1000; timerId=setInterval(tick,200); }
const shapeTools = new Set(['line','circle','rectangle']);
function stopDrawing(event) {
  if(event && event.pointerId!==pointerId) return;
  if(drawing && shapeTools.has(tool) && shapeBase) {
    if(event?.type==='pointercancel' || !shapeChanged) {
      ctx.putImageData(shapeBase.pixels,0,0);hasDrawing=shapeBase.hasDrawing;history.pop();
      $('#canvas-hint').hidden=hasDrawing;
    }
  }
  clearInterval(sprayId);sprayId=null;
  const captured=pointerId;drawing=false;pointerId=null;shapeBase=null;origin=null;
  if(captured!==null && canvas.hasPointerCapture(captured))canvas.releasePointerCapture(captured);
}
function snapshot() { redoHistory=[];history.push({pixels:ctx.getImageData(0,0,canvas.width,canvas.height),hasDrawing});if(history.length>12)history.shift(); }
function selectTool(next) {
  stopDrawing();saveDraft();tool=next;erasing=next==='eraser';
  document.querySelectorAll('[data-tool]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tool===tool)));
  $('#eraser').setAttribute('aria-pressed',String(erasing));
  canvas.style.cursor=tool==='bucket'?'cell':'crosshair';
  $('#tool-help').textContent={brush:'끌어서 그리기',eraser:'끌어서 지우기',bucket:'영역을 눌러 채우기',spray:'누르거나 끌어서 분사',line:'시작점에서 끝점까지 끌기',circle:'중심에서 바깥으로 끌기',rectangle:'모서리에서 반대 모서리로 끌기'}[tool];
}
document.querySelectorAll('[data-tool]').forEach(button=>button.onclick=()=>selectTool(button.dataset.tool));
function removeDraft() { try { localStorage.removeItem('jogak-draft'); } catch {} }
function saveDraft() { if(!hasDrawing) {removeDraft();return;} const ok=persist('jogak-draft',{image:canvas.toDataURL(),session,deadline,caption:$('#caption').value}); if(!ok&&!draftWarningShown){draftWarningShown=true;toast('임시 저장에 실패했습니다. 그림을 완성한 뒤 내려받으세요.');} }
function updatePrompt() { $('#day-label').textContent=session.day.replaceAll('-','.'); $('#topic-title').textContent=session.topic.title; $('#prompt-title').textContent=session.topic.title; $('#prompt-description').textContent=session.topic.description; $('#mode-label').textContent=session.mode==='practice'?'연습':session.mode==='variation'?'조건 추가':'오늘의 주제'; $('#daily-mode').setAttribute('aria-pressed',String(session.mode==='daily'));$('#practice-mode').setAttribute('aria-pressed',String(session.mode==='practice')); $('#constraint').hidden=!session.constraint;$('#constraint').textContent=session.constraint; }
function resetCanvas() { stopDrawing(); clearInterval(timerId);timerId=null;deadline=0;remaining=DURATION;updateTimer();ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);hasDrawing=false;history=[];redoHistory=[];$('#canvas-hint').hidden=false;$('#caption').value='';session={day:dayKey(),topic:dailyTopic(),mode:'daily',parentId:null,constraint:''};removeDraft();updatePrompt();renderProgress(); }
function point(event) { const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height}; }
function stroke(from,to) { ctx.strokeStyle=erasing?'#fff':color;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Number($('#size').value)*(erasing?3:1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.beginPath();ctx.arc(to.x,to.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill(); }
function fillRegion(position) {
  const x=Math.max(0,Math.min(canvas.width-1,Math.floor(position.x)));
  const y=Math.max(0,Math.min(canvas.height-1,Math.floor(position.y)));
  const image=ctx.getImageData(0,0,canvas.width,canvas.height), data=image.data;
  const seed=y*canvas.width+x, offset=seed*4;
  const target=Array.from(data.slice(offset,offset+4));
  const replacement=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16),255];
  if(target.every((value,i)=>value===replacement[i]))return false;
  snapshot();
  const count=canvas.width*canvas.height, seen=new Uint8Array(count), queue=new Int32Array(count);
  let head=0,tail=1;queue[0]=seed;seen[seed]=1;
  const matches=index=>{const p=index*4;return Math.abs(data[p]-target[0])<=24&&Math.abs(data[p+1]-target[1])<=24&&Math.abs(data[p+2]-target[2])<=24&&Math.abs(data[p+3]-target[3])<=24;};
  const add=index=>{if(!seen[index]&&matches(index)){seen[index]=1;queue[tail++]=index;}};
  while(head<tail){const index=queue[head++],p=index*4;data[p]=replacement[0];data[p+1]=replacement[1];data[p+2]=replacement[2];data[p+3]=255;const col=index%canvas.width;if(col>0)add(index-1);if(col<canvas.width-1)add(index+1);if(index>=canvas.width)add(index-canvas.width);if(index<count-canvas.width)add(index+canvas.width);}
  ctx.putImageData(image,0,0);return true;
}
function spray(position) {
  ctx.fillStyle=color;const radius=Math.max(8,Number($('#size').value)*2.5);
  for(let i=0;i<24;i++){const angle=Math.random()*Math.PI*2,distance=Math.sqrt(Math.random())*radius;ctx.fillRect(position.x+Math.cos(angle)*distance,position.y+Math.sin(angle)*distance,1.5,1.5);}
}
function previewShape(end) {
  ctx.putImageData(shapeBase.pixels,0,0);
  const dx=end.x-origin.x,dy=end.y-origin.y;shapeChanged=Math.hypot(dx,dy)>=1;
  hasDrawing=shapeBase.hasDrawing||shapeChanged;$('#canvas-hint').hidden=hasDrawing;
  if(!shapeChanged)return;
  ctx.strokeStyle=color;ctx.lineWidth=Number($('#size').value);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  if(tool==='line'){ctx.moveTo(origin.x,origin.y);ctx.lineTo(end.x,end.y);}
  else if(tool==='circle')ctx.arc(origin.x,origin.y,Math.hypot(dx,dy),0,Math.PI*2);
  else ctx.rect(origin.x,origin.y,dx,dy);
  ctx.stroke();
}
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0||drawing)return;
  if(timerId&&Date.now()>=deadline){tick();return;}
  if(!deadline&&session.mode==='daily'){session.day=dayKey();session.topic=dailyTopic();updatePrompt();}
  if(erasing&&!hasDrawing)return;
  previous=point(event);
  if(tool==='bucket'){
    if(fillRegion(previous)){hasDrawing=true;$('#canvas-hint').hidden=true;startTimer();saveDraft();}
    return;
  }
  snapshot();drawing=true;pointerId=event.pointerId;canvas.setPointerCapture(pointerId);origin=previous;shapeChanged=false;
  if(shapeTools.has(tool))shapeBase=history[history.length-1];
  else {if(tool==='spray') {spray(previous);sprayId=setInterval(()=>{if(drawing)spray(previous);},40);}else stroke(previous,previous);hasDrawing=true;$('#canvas-hint').hidden=true;}
  startTimer();
});
canvas.addEventListener('pointermove',event=>{
  if(!drawing||event.pointerId!==pointerId)return;const next=point(event);
  if(shapeTools.has(tool))previewShape(next);
  else if(tool==='spray')spray(next);
  else stroke(previous,next);
  previous=next;
});
['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,event=>{
  if(event.pointerId!==pointerId)return;
  if(name==='pointerup'&&shapeTools.has(tool))previewShape(point(event));
  stopDrawing(event);saveDraft();
}));
colors.forEach((value,index)=>{const button=document.createElement('button');button.className='swatch';button.style.background=value;button.setAttribute('aria-label',['먹색','파란색','노란색','분홍색','초록색','보라색'][index]);button.setAttribute('aria-pressed',String(index===0));button.classList.toggle('selected',index===0);button.onclick=()=>{color=value;if(erasing)selectTool('brush');document.querySelectorAll('.swatch').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});};$('#colors').append(button);});
$('#eraser').onclick=()=>selectTool(erasing?'brush':'eraser');
$('#undo').onclick=()=>{stopDrawing();if(!history.length)return;redoHistory.push({pixels:ctx.getImageData(0,0,canvas.width,canvas.height),hasDrawing});const old=history.pop();ctx.putImageData(old.pixels,0,0);hasDrawing=old.hasDrawing;$('#canvas-hint').hidden=hasDrawing;saveDraft();};
$('#redo').onclick=()=>{stopDrawing();if(!redoHistory.length)return;history.push({pixels:ctx.getImageData(0,0,canvas.width,canvas.height),hasDrawing});const next=redoHistory.pop();ctx.putImageData(next.pixels,0,0);hasDrawing=next.hasDrawing;$('#canvas-hint').hidden=hasDrawing;saveDraft();};
$('#clear').onclick=()=>{if(hasDrawing)$('#confirm').showModal();};$('#cancel-clear').onclick=()=>$('#confirm').close();
$('#confirm-clear').onclick=()=>{stopDrawing();snapshot();ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);hasDrawing=false;$('#canvas-hint').hidden=false;$('#confirm').close();saveDraft();};
function switchMode(mode,parent=null) { if(hasDrawing||deadline){toast('현재 그림을 먼저 저장하세요.');return;} session={day:dayKey(),topic:parent?{id:parent.topicId||'legacy-garden',title:parent.title||'나만의 작은 정원',description:'원본 주제에 조건을 추가해 다시 그려보세요.'}:mode==='practice'?{id:'warmup',title:'자유 연습',description:'주제 없이 자유롭게 그려보세요.'}:dailyTopic(),mode,parentId:parent?parent.id:null,constraint:mode==='variation'?'조건: 세 가지 모양만 사용하기.':''};updatePrompt();location.hash='draw'; }
$('#daily-mode').onclick=()=>switchMode('daily');$('#practice-mode').onclick=()=>switchMode('practice');$('#variation').onclick=()=>switchMode('variation');$('#caption').addEventListener('input',saveDraft);
function finish(automatic=false) { stopDrawing(); if($('#confirm').open)$('#confirm').close();if(!hasDrawing){if(automatic)resetCanvas();toast('그림을 그린 뒤 저장하세요.');return;} const entry={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),image:canvas.toDataURL('image/png'),date:new Date().toISOString(),title:session.topic.title,topicId:session.topic.id,day:session.day,mode:session.mode,parentId:session.parentId,constraint:session.constraint,caption:$('#caption').value.trim()};saved.unshift(entry);const stored=persist('jogak-drawings',saved);resetCanvas();renderMine();location.hash='mine';toast(stored?(automatic?'시간이 끝나 그림을 저장했습니다.':'그림을 저장했습니다.'):'현재 탭에만 저장됐습니다. 새로고침 전에 그림을 내려받으세요.'); }
$('#finish').onclick=()=>finish();
function imageCard(image,title,meta) { const article=document.createElement('article');article.className='art-card';const img=document.createElement('img');img.src=image;img.alt=title;const info=document.createElement('div');info.className='card-info';const text=document.createElement('div');const heading=document.createElement('h2');heading.className='art-title';heading.textContent=title;const description=document.createElement('span');description.className='art-meta';description.textContent=meta;text.append(heading,description);info.append(text);article.append(img,info);return {article,info}; }
function illustration(index) { const palettes=[['#f3f2e5','#9ead88','#e1b87b'],['#f1ebdf','#86a69a','#d4998c'],['#edf1ea','#9ba8c1','#e4c36f'],['#f5eee9','#8ea77e','#cf9b86'],['#eef1e9','#748f76','#b6c294'],['#f0edf3','#a3af83','#c8a5b6']];const [bg,leaf,petal]=palettes[index];let content='';if(index===1){content=`<path d="M120 220L130 145H210L220 220Z" fill="${petal}"/><path d="M170 145V75M170 120Q110 90 130 60Q175 65 170 120M170 105Q230 70 220 45Q175 45 170 105" fill="${leaf}" stroke="${leaf}" stroke-width="5"/>`;}else if(index===4){content=`<path d="M50 230L140 70L220 230Z" fill="${leaf}"/><path d="M170 230L240 105L305 230Z" fill="${petal}"/><circle cx="270" cy="50" r="20" fill="#e4c888"/><path d="M145 220V245M240 218V245" stroke="#697660" stroke-width="6"/>`;}else{for(let j=0;j<3;j++){const x=95+j*75,y=85+(j%2)*30;content+=`<path d="M${x} 220Q${x-12} 155 ${x} ${y}" fill="none" stroke="${leaf}" stroke-width="5" stroke-linecap="round"/><ellipse cx="${x-14}" cy="175" rx="19" ry="9" transform="rotate(35 ${x-14} 175)" fill="${leaf}"/>`;for(let k=0;k<5;k++){let a=k*Math.PI*2/5;content+=`<circle cx="${x+Math.cos(a)*18}" cy="${y+Math.sin(a)*18}" r="14" fill="${petal}"/>`;}content+=`<circle cx="${x}" cy="${y}" r="10" fill="#f4e5ba"/>`;}}return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="270" viewBox="0 0 360 270"><rect width="360" height="270" fill="${bg}"/><ellipse cx="180" cy="233" rx="116" ry="8" fill="${leaf}" opacity=".16"/>${content}</svg>`); }
function renderGallery() {$('#gallery-grid').replaceChildren();const titles=['봄을 기다리는 꽃','창가의 초록 친구','작은 꽃들의 인사','햇살 한 스푼','정원 너머의 숲','보랏빛 오후'];titles.forEach((title,index)=>{const {article,info}=imageCard(illustration(index),title,`익명의 화가 ${index+1} · 오늘`);const button=document.createElement('button');button.className='like';function update(){button.setAttribute('aria-pressed',String(Boolean(liked[index])));button.setAttribute('aria-label',title+' 좋아요'+(liked[index]?' 취소':''));button.textContent=`${liked[index]?'♥':'♡'} ${[24,18,32,12,27,16][index]+(liked[index]?1:0)}`;}update();button.addEventListener('click',()=>{liked[index]=!liked[index];if(!persist('jogak-likes',liked))toast('좋아요 저장에 실패했습니다. 현재 탭에서만 반영됩니다.');update();});info.append(button);$('#gallery-grid').append(article);}); }

function renderProgress() { const complete=new Set(saved.filter(e=>e.mode==='daily'&&typeof e.day==='string').map(e=>e.day));$('#daily-status').textContent=complete.has(dayKey())?'오늘 완료 ✓':'오늘 미완료';const today=new Date(dayKey()+'T00:00:00Z');const monday=new Date(today);monday.setUTCDate(today.getUTCDate()-((today.getUTCDay()+6)%7));$('#week-days').replaceChildren();for(let i=0;i<7;i++){const date=new Date(monday);date.setUTCDate(monday.getUTCDate()+i);const key=date.toISOString().slice(0,10);const cell=document.createElement('div');cell.className='week-day'+(complete.has(key)?' complete':'')+(key===dayKey()?' today':'');cell.setAttribute('aria-label',key+(complete.has(key)?' 완료':' 미완료'));const label=document.createElement('span');label.textContent=['월','화','수','목','금','토','일'][i];const mark=document.createElement('strong');mark.textContent=complete.has(key)?'✓':String(date.getUTCDate());cell.append(label,mark);$('#week-days').append(cell);} }
function action(text,handler){const b=document.createElement('button');b.className='tool';b.textContent=text;b.onclick=handler;return b;}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
async function exportCard(entry){try{const img=new Image();img.src=entry.image;await img.decode();const output=document.createElement('canvas');output.width=1080;output.height=1000;const c=output.getContext('2d');c.fillStyle='#f5f5f3';c.fillRect(0,0,1080,1000);c.fillStyle='#202220';c.font='bold 28px sans-serif';c.fillText('낙서장  /  '+(entry.day||dayKey(new Date(entry.date))),48,62);c.drawImage(img,40,105,1000,680);c.font='bold 34px sans-serif';c.fillText(entry.title||'나의 그림',48,850,984);c.font='24px sans-serif';c.fillStyle='#656963';c.fillText(typeof entry.caption==='string'?entry.caption:'',48,900,984);c.font='18px sans-serif';c.fillText('3분 낙서',48,956);download(output.toDataURL('image/png'),'nakseojang-'+(entry.day||dayKey(new Date(entry.date)))+'-card.png');}catch{toast('파일 생성에 실패했습니다. 다시 시도하세요.');}}
function compare(entry){const parent=saved.find(e=>e.id===entry.parentId);if(!parent){toast('비교할 원본 그림이 없습니다.');return;}$('#compare-images').replaceChildren();[parent,entry].forEach((e,i)=>{const {article}=imageCard(e.image,i===0?'원본':'조건을 추가한 그림',e.title);$('#compare-images').append(article);});$('#compare-dialog').showModal();}
function renderMine(){const selected=$('#topic-filter').value;const available=new Map(saved.map(e=>[e.topicId||'legacy-garden',e.title||'나의 그림']));$('#topic-filter').replaceChildren(new Option('모든 주제','all'));available.forEach((title,id)=>$('#topic-filter').add(new Option(title,id)));$('#topic-filter').value=available.has(selected)?selected:'all';$('#mine-grid').replaceChildren();$('#count').textContent=saved.length+'장';const mode=$('#mode-filter').value,topic=$('#topic-filter').value;const entries=saved.filter(e=>(mode==='all'||(e.mode||'legacy')===mode)&&(topic==='all'||(e.topicId||'legacy-garden')===topic));$('#empty').hidden=entries.length>0;$('#empty h2').textContent=saved.length?'조건에 맞는 그림이 없습니다.':'저장한 그림이 없습니다.';let lastDay='';entries.forEach(entry=>{const date=dayKey(new Date(entry.date));if(date!==lastDay){const h=document.createElement('h2');h.className='journal-date';h.textContent=date.replaceAll('-',' / ');$('#mine-grid').append(h);lastDay=date;}const modes={daily:'오늘의 주제',practice:'연습',variation:'조건 추가'};const {article,info}=imageCard(entry.image,entry.title||'나의 그림',modes[entry.mode]||'이전 기록');if(typeof entry.caption==='string'&&entry.caption){const p=document.createElement('p');p.className='art-caption';p.textContent=entry.caption;article.append(p);}const actions=document.createElement('div');actions.className='card-actions';actions.append(action('그림 ↓',()=>download(entry.image,'nakseojang-'+date+'.png')),action('카드 ↓',()=>exportCard(entry)),action('조건 추가',()=>switchMode('variation',entry)));if(entry.parentId)actions.append(action('비교',()=>compare(entry)));actions.append(action('삭제',()=>{pendingDelete=entry.id;$('#delete-dialog').showModal();}));article.append(actions);$('#mine-grid').append(article);});renderProgress();}
$('#mode-filter').onchange=renderMine;$('#topic-filter').onchange=renderMine;$('#cancel-delete').onclick=()=>$('#delete-dialog').close();$('#confirm-delete').onclick=()=>{saved=saved.filter(e=>e.id!==pendingDelete);const stored=persist('jogak-drawings',saved);$('#delete-dialog').close();renderMine();toast(stored?'그림을 삭제했습니다.':'현재 탭에서 삭제했습니다. 브라우저 저장에는 실패했습니다.');};$('#close-compare').onclick=()=>$('#compare-dialog').close();
function navigate(){const name=['draw','gallery','mine','profiles','about'].includes(location.hash.slice(1))?location.hash.slice(1):'draw';stopDrawing();saveDraft();document.querySelectorAll('.page').forEach(page=>page.hidden=page.id!==name);document.querySelectorAll('[data-page]').forEach(link=>{link.classList.toggle('active',link.dataset.page===name);if(link.dataset.page===name)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});if(name==='mine')renderMine();if(name==='profiles')renderProfiles();window.scrollTo(0,0);requestAnimationFrame(()=>window.scrollTo(0,0));}
window.addEventListener('hashchange',navigate);window.addEventListener('pagehide',saveDraft);window.addEventListener('beforeunload',event=>{if(hasDrawing){saveDraft();event.preventDefault();event.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden)saveDraft();else if(timerId)tick();});
async function init(){const draft=readStore('jogak-draft',null);resetCanvas();renderGallery();renderMine();navigate();if(draft&&typeof draft.image==='string'&&/^data:image\/png;base64,/.test(draft.image)&&draft.session&&typeof draft.session.topic?.title==='string'&&typeof draft.session.topic?.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(draft.session.day)&&['daily','practice','variation'].includes(draft.session.mode)&&Number.isFinite(draft.deadline)&&draft.deadline>0){try{const img=new Image();img.src=draft.image;await img.decode();ctx.drawImage(img,0,0,canvas.width,canvas.height);session=draft.session;deadline=draft.deadline;hasDrawing=true;$('#canvas-hint').hidden=true;$('#caption').value=typeof draft.caption==='string'?draft.caption.slice(0,100):'';updatePrompt();remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));updateTimer();if(!remaining)finish(true);else{startTimer();saveDraft();toast('저장 중이던 그림을 복원했습니다.');}}catch{removeDraft();}}}
setInterval(()=>{if(!hasDrawing&&!deadline&&session.mode==='daily'&&session.day!==dayKey()){session.day=dayKey();session.topic=dailyTopic();updatePrompt();renderProgress();}},30000);

const exampleProfiles=[
 {id:'leaf',name:'풀잎',handle:'leaf_note',bio:'정원과 식물을 주로 그립니다.',tags:['정원','식물'],art:[0,1]},
 {id:'window',name:'창가',handle:'window_sketch',bio:'주변에서 본 풍경을 기록합니다.',tags:['풍경','일상'],art:[4,3]},
 {id:'violet',name:'보라',handle:'violet_draw',bio:'색과 모양을 바꿔가며 그립니다.',tags:['꽃','색'],art:[5,2]},
 {id:'line',name:'한줄',handle:'one_line',bio:'단순한 선으로 그리는 연습 중입니다.',tags:['선','연습'],art:[1,4]}
];
function profileSummary(profile){
  const wrap=document.createElement('div');wrap.className='profile-summary';
  const avatar=document.createElement('span');avatar.className='profile-avatar';avatar.textContent=profile.name.slice(0,1);avatar.setAttribute('aria-hidden','true');
  const text=document.createElement('div'),h=document.createElement('h2');h.textContent=profile.name;
  const handle=document.createElement('p');handle.className='profile-handle';handle.textContent='@'+profile.handle;
  const bio=document.createElement('p');bio.textContent=profile.bio;const tags=document.createElement('p');tags.className='profile-tags';tags.textContent=profile.tags.map(tag=>'#'+tag).join(' ');
  text.append(h,handle,bio,tags);wrap.append(avatar,text);return wrap;
}
function showProfile(profile){
  $('#profile-summary').replaceChildren(profileSummary(profile));$('#profile-artworks').replaceChildren();
  profile.art.forEach(index=>{const {article}=imageCard(illustration(index),'예시 그림 '+(index+1),profile.name+' · 예시');$('#profile-artworks').append(article);});
  $('#profile-detail').hidden=false;$('#close-profile').focus();$('#profile-detail').scrollIntoView({block:'start'});
}
function renderProfiles(){
  const query=$('#profile-query').value.trim().normalize('NFKC').toLocaleLowerCase('ko-KR');
  const matches=exampleProfiles.filter(profile=>[profile.name,profile.handle,profile.bio,...profile.tags].join(' ').normalize('NFKC').toLocaleLowerCase('ko-KR').includes(query));
  $('#profile-grid').replaceChildren();$('#profile-detail').hidden=true;$('#profile-empty').hidden=matches.length>0;
  $('#profile-result-count').textContent='예시 프로필 '+matches.length+'명';
  matches.forEach(profile=>{const article=document.createElement('article');article.className='profile-card';article.append(profileSummary(profile));article.append(action('프로필 보기',()=>showProfile(profile)));$('#profile-grid').append(article);});
}
$('#profile-search').addEventListener('submit',event=>{event.preventDefault();renderProfiles();});
$('#profile-query').addEventListener('input',renderProfiles);
$('#reset-search').onclick=()=>{$('#profile-query').value='';renderProfiles();$('#profile-query').focus();};
$('#close-profile').onclick=()=>{$('#profile-detail').hidden=true;$('#profile-query').focus();};
renderProfiles();

init();
