(function(){
  function $(id){return document.getElementById(id)}
  const sendBtn = $('signup');
  const emailInput = $('email');
  const appDiv = $('app');
  const authDiv = $('auth');
  const who = $('who');
  const signout = $('signout');
  const generateBtn = $('generate');
  const promptEl = $('prompt');
  const titleEl = $('title');
  const output = $('output');

  function saveToken(t){ localStorage.setItem('vellum_token', t) }
  function loadToken(){ return localStorage.getItem('vellum_token') }
  function clearToken(){ localStorage.removeItem('vellum_token') }

  async function api(path, opts = {}){
    const token = loadToken();
    const headers = opts.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, { ...opts, headers });
    return res;
  }

  sendBtn.addEventListener('click', async ()=>{
    const email = emailInput.value.trim();
    if (!email){ alert('enter email'); return }
    const res = await fetch('/api/send-magic-link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
    if (!res.ok){ alert('failed to send magic link'); return }
    alert('Magic link sent — check your email (link valid 30 minutes)');
  });

  function showApp(email){ authDiv.style.display='none'; appDiv.style.display='block'; who.textC
