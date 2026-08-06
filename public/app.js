(function(){
  async function $(id){return document.getElementById(id)}
  const sendBtn = await $('signup');
  const emailInput = await $('email');
  const appDiv = await $('app');
  const authDiv = await $('auth');
  const who = await $('who');
  const signout = await $('signout');
  const generateBtn = await $('generate');
  const promptEl = await $('prompt');
  const titleEl = await $('title');
  const output = await $('output');

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

  function showApp(email){ authDiv.style.display='none'; appDiv.style.display='block'; who.textContent = email }
  function showAuth(){ authDiv.style.display='block'; appDiv.style.display='none'; who.textContent = '' }

  signout.addEventListener('click', (e)=>{ e.preventDefault(); clearToken(); showAuth(); })

  generateBtn.addEventListener('click', async ()=>{
    output.textContent = 'Generating…';
    const prompt = promptEl.value.trim();
    const title = titleEl.value.trim();
    if (!prompt){ alert('enter a prompt'); return }
    const res = await api('/api/generate', { method:'POST', body: JSON.stringify({ prompt, title }) });
    if (res.status === 402){
      const j = await res.json();
      const url = j.purchase_url || (await (await fetch('/config')).json()).WHOP_PRODUCT_URL;
      output.textContent = 'Payment required. Please purchase: ' + url;
      return;
    }
    if (!res.ok){ output.textContent = 'Error: ' + (await res.text()); return }
    const j = await res.json();
    output.textContent = j.document.content || JSON.stringify(j.document, null, 2);
  });

  // If we have a token, show app
  (async ()=>{
    const token = loadToken();
    if (!token) return showAuth();
    try{
      const parts = token.split('.');
      if (parts.length===3){
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.email) return showApp(payload.email);
      }
    }catch(e){ console.warn(e) }
    showAuth();
  })();

})();
