// Dependency-free Chrome checks. Uses an isolated temporary browser profile.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const socialBrowser = require('./social-browser.cjs');
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'little-draw-tests-'));
const proc = spawn(browser, ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--allow-file-access-from-files', '--user-data-dir=' + profile], { stdio: 'ignore', windowsHide: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
// An unresolved WebSocket promise alone may let Node exit successfully without checks.
const watchdog = setTimeout(() => { console.error('Browser checks timed out before completion'); proc.kill(); process.exitCode = 1; socket?.close(); }, 60000);
async function main() {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await pause(100);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const pages = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
  socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; socket.onclose = () => reject(Error('Chrome disconnected before opening DevTools')); });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(Error(message.error.message)) : resolve(message.result);
    }
  };
  socket.onclose = () => { for (const request of pending.values()) request.reject(Error('Chrome disconnected during browser checks')); pending.clear(); };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const errors = [];
  await send('Runtime.enable');
  await send('Page.enable');
  // Keep offline checks deterministic even when the real project is configured.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(window,'DOODLER_SOCIAL_CONFIG',{value:{url:'',publishableKey:''},configurable:true});" });
  // Capture uncaught runtime errors in addition to the harness result.
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: name === 'mobile' });
    await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, 'smoke.html')).href });
    let result;
    for (let n = 0; n < 100; n++) {
      await pause(100);
      result = await evaluate("document.querySelector('#test-results')?.textContent");
      if (result) break;
    }
    if (!result?.startsWith('PASS')) throw Error(name + ': ' + result);
    console.log(name + ': ' + result.split('\n')[0]);
    await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, '..', 'index.html')).href });
    await pause(300);
    await evaluate("localStorage.clear(); saved=[]; resetCanvas(); renderMine(); location.hash='draw';");
    await pause(100);
    const dimensions = await evaluate('({width:innerWidth, content:document.documentElement.scrollWidth})');
    if (dimensions.width !== width || dimensions.content > width) throw Error(name + ' overflows: ' + JSON.stringify(dimensions));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, name + '.png'), Buffer.from(shot.data, 'base64'));
    const point = await evaluate('(()=>{const r=canvas.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
    if (name === 'mobile') {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 20, y: point.y + 20, id: 1 }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 20, y: point.y + 20, button: 'left', buttons: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + 20, y: point.y + 20, button: 'left', buttons: 0, clickCount: 1 });
    }
    if (!await evaluate("hasDrawing && !drawing && Boolean(readStore('jogak-draft',null))")) throw Error(name + ' native pointer input failed');
    console.log(name + ': native pointer and capture PASS');
    await evaluate('resetCanvas()');
    for (const page of ['profiles', 'community', 'about']) {
      await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '#' + page });
      await pause(200);
      const layout = await evaluate(`({visible:!document.querySelector('#${page}').hidden,width:innerWidth,content:document.documentElement.scrollWidth,headerTop:document.querySelector('.header').getBoundingClientRect().top})`);
      if (!layout.visible || layout.width !== width || layout.content > width || layout.headerTop < 0) throw Error(name + ' ' + page + ' route/layout failed');
      if (page === 'community') {
        if (!await evaluate("document.querySelector('#social-connected').hidden && document.querySelector('#social-status').textContent.includes('준비')")) throw Error('Unconfigured community should stay disabled');
      }
      const pageShot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, name + '-' + page + '.png'), Buffer.from(pageShot.data, 'base64'));
    }
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['https://example.supabase.co/*'] });
    const fixture = await send('Page.addScriptToEvaluateOnNewDocument', { source: socialBrowser.init });
    await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?social-test=' + name + '#community' });
    await pause(300);
    const socialChecks = await evaluate(socialBrowser.check);
    console.log(name + ': PASS ' + socialChecks + ' community UI checks (mock REST)');
    const socialShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, name + '-community-connected.png'), Buffer.from(socialShot.data, 'base64'));
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fixture.identifier });
  }
  if (errors.length) throw Error('Uncaught browser errors: ' + errors.join(', '));
  await send('Browser.close');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearTimeout(watchdog); socket?.close(); proc.kill(); });
