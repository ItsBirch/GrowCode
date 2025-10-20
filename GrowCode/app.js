// Упрощённая локальная регистрация/вход для одностраничного сайта
(function(){
  const USERS_KEY = 'growcode_users_v1';
  const SESSION_KEY = 'growcode_session_v1'; // хранит id текущего пользователя

  // DOM элементы
  const authCard = document.getElementById('authCard');
  const authTitle = document.getElementById('authTitle');
  const authForm = document.getElementById('authForm');
  const authName = document.getElementById('authName');
  const authPassword = document.getElementById('authPassword');
  const showLoginBtn = document.getElementById('showLoginBtn');
  // unified auth elements
  const authSubmit = document.getElementById('authSubmit');

  // profileCard was removed in latest markup; use profileInfoWrapper
  const profileInfoWrapper = document.getElementById('profileInfoWrapper');
  const profileMainName = document.getElementById('profileMainName');
  const profileMainProgress = document.getElementById('profileMainProgress');
  const profileAvatarMain = document.getElementById('profileAvatarMain');
  const logoutBtn = document.getElementById('logoutBtn');

  // helpers
  function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }catch(e){return [];} }
  function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function getSession(){ return localStorage.getItem(SESSION_KEY); }
  function setSession(id){ if(id) localStorage.setItem(SESSION_KEY, id); else localStorage.removeItem(SESSION_KEY); }

  function findUserByName(name){ const users = loadUsers(); return users.find(u => u.name === name); }

  // UI
  function showAuth(){ document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active')); document.getElementById('profilePage').classList.add('active'); authCard.style.display='block'; if(profileInfoWrapper) profileInfoWrapper.style.display='flex'; authTitle.textContent='Зарегистрироваться'; authForm.querySelector('button[type="submit"]').textContent='Зарегистрироваться'; }
  function showLoginForm(){ authTitle.textContent='Войти'; authForm.querySelector('button[type="submit"]').textContent='Войти'; }
  function showProfile(user){ document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active')); document.getElementById('profilePage').classList.add('active'); authCard.style.display='none'; if(profileInfoWrapper) profileInfoWrapper.style.display='flex'; profileMainName.textContent = user.name; profileMainProgress.textContent = `Пройдено слайдов: ${user.progress || 0}/5`; if(profileAvatarMain){ profileAvatarMain.src = 'profil.png'; profileAvatarMain.style.display = 'block'; } }

  // unified auth: если пользователь существует и пароль совпадает — логин;
  // если пользователь существует и пароль НЕ совпадает — ошибка;
  // если пользователь не существует — создаём аккаунт и логиним.
  authForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = authName.value.trim();
    const pass = authPassword.value;
    if(!name || !pass) return alert('Введите имя и пароль');
    const users = loadUsers();
    const existing = users.find(u => u.name === name);
    if(existing){
      if(existing.password === pass){
        setSession(existing.id); showProfile(existing);
        try{ if(existing.progress && existing.progress>0 && window.showCourseSlide) window.showCourseSlide(existing.progress-1); }catch(e){}
      } else {
        return alert('Неверный пароль для этого имени');
      }
    } else {
      // create
      const user = { id: Date.now().toString(36), name, password: pass, progress: 0 };
      users.push(user); saveUsers(users); setSession(user.id); showProfile(user);
    }
    authName.value=''; authPassword.value='';
  });


  // logout with backup (allow restore)
  let lastSessionBackup = null;
  logoutBtn.addEventListener('click', ()=>{
    const sid = getSession(); if(sid) lastSessionBackup = sid;
    setSession(null);
    showAuth();
    const restoreArea = document.getElementById('restoreArea'); if(restoreArea) restoreArea.style.display = 'block';
  });

  // restore account button (if visible)
  const restoreAccountBtn = document.getElementById('restoreAccountBtn');
  if(restoreAccountBtn){
    restoreAccountBtn.addEventListener('click', ()=>{
      if(!lastSessionBackup) return alert('Нет доступного аккаунта для восстановления');
      const users = loadUsers(); const me = users.find(u=>u.id===lastSessionBackup);
      if(!me) return alert('Аккаунт больше недоступен');
      setSession(me.id); showProfile(me);
      const restoreArea = document.getElementById('restoreArea'); if(restoreArea) restoreArea.style.display = 'none';
    });
  }

  // update progress for current user (index is slide index starting from 0)
  function updateProgressForCurrent(slideIndex){
    const sessionId = getSession();
    if(!sessionId) return; // не залогинен
    const users = loadUsers();
    const me = users.find(u=>u.id===sessionId);
    if(!me) return;
      const value = Math.max(me.progress || 0, slideIndex + 1);
      if(value !== me.progress) { me.progress = value; saveUsers(users); }
  }

    // update progress only when user explicitly continues (we'll call this on Continue buttons)
    function advanceProgressTo(slideIndex) {
      const sessionId = getSession();
      if (!sessionId) return;
      const users = loadUsers();
      const me = users.find(u => u.id === sessionId);
      if (!me) return;
      const value = Math.max(me.progress || 0, slideIndex + 1);
      if (value !== me.progress) { me.progress = value; saveUsers(users); }
      // update visible profile progress
      try { if (document.getElementById('profileMainProgress')) document.getElementById('profileMainProgress').textContent = `Пройдено слайдов: ${me.progress}/5`; } catch (e) {}
    }

  // инициализация — если сессия есть, показываем профиль
  const sessionId = getSession();
  if(sessionId){
    const users = loadUsers();
    const me = users.find(u=>u.id===sessionId);
    if(me){ showProfile(me); try{ if(me.progress && me.progress>0 && window.showCourseSlide) window.showCourseSlide(me.progress-1); }catch(e){} } else { setSession(null); showAuth(); }
  } else {
    showAuth();
  }

  // --- UI behaviors: edit name, continue buttons, settings, delete account ---
  const editNameBtn = document.getElementById('editNameBtn');
   const editNameIcon = document.getElementById('editNameIcon');
  const editNameInput = document.getElementById('editNameInput');
  const saveNameBtn = document.getElementById('saveNameBtn');
  const cancelNameBtn = document.getElementById('cancelNameBtn');

  const optHints = document.getElementById('optHints');
   const optVolume = document.getElementById('optVolume');
  const optNotifications = document.getElementById('optNotifications');
  const optSound = document.getElementById('optSound');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  function refreshProfileView(){
    const sid = getSession(); if(!sid) return; const users = loadUsers(); const me = users.find(u=>u.id===sid); if(!me) return;
    profileMainName.textContent = me.name; profileMainProgress.textContent = `Пройдено слайдов: ${me.progress||0}/5`;
  }

  if(editNameBtn){
    editNameBtn.addEventListener('click', ()=>{
      editNameInput.value = profileMainName.textContent || '';
      editNameInput.style.display='inline-block'; saveNameBtn.style.display='inline-block'; cancelNameBtn.style.display='inline-block'; editNameBtn.style.display='none'; editNameInput.focus();
    });
  }
   if(editNameIcon){
     editNameIcon.addEventListener('click', ()=>{
       // show input and place blinking caret (we'll focus input)
       editNameInput.value = profileMainName.textContent || '';
       editNameInput.style.display='inline-block'; saveNameBtn.style.display='inline-block'; cancelNameBtn.style.display='inline-block'; if(editNameBtn) editNameBtn.style.display='none'; editNameInput.focus();
       const fake = document.getElementById('fakeCaret'); if(fake) fake.style.display = 'inline-block';
     });
   }
  if(cancelNameBtn){
    cancelNameBtn.addEventListener('click', ()=>{
      editNameInput.style.display='none'; saveNameBtn.style.display='none'; cancelNameBtn.style.display='none'; editNameBtn.style.display='inline-block';
      const fake = document.getElementById('fakeCaret'); if(fake) fake.style.display = 'none';
    });
  }
  if(saveNameBtn){
    saveNameBtn.addEventListener('click', ()=>{
      const newName = editNameInput.value.trim(); if(!newName) return alert('Имя не может быть пустым');
      const sid = getSession(); if(!sid) return alert('Нет сессии');
      const users = loadUsers(); const me = users.find(u=>u.id===sid); if(!me) return alert('Пользователь не найден');
      const other = users.find(u=>u.name === newName && u.id !== me.id);
      if(other) return alert('Пользователь с таким именем уже существует');
      // persist name change and update UI
      me.name = newName;
      saveUsers(users);
      editNameInput.style.display='none'; saveNameBtn.style.display='none'; cancelNameBtn.style.display='none'; if(editNameBtn) editNameBtn.style.display='inline-block';
      const fake = document.getElementById('fakeCaret'); if(fake) fake.style.display = 'none';
      // update displayed profile name(s)
      refreshProfileView();
      // also update auth form placeholder/value if visible
      try{ const an = document.getElementById('authName'); if(an) an.value = newName; }catch(e){}
    });
  }

  // Continue buttons: advance progress only when user clicks Continue
  document.addEventListener('click', (e)=>{
    const el = e.target;
    if(!el) return;
    if(el.classList && el.classList.contains('continue-btn')){
      const next = el.dataset.next;
      if(next === 'home'){ try{ if(window.showHomePage) window.showHomePage(); }catch(e){} }
      else {
        const idx = parseInt(next);
        if(!isNaN(idx)){
          try{ if(window.showCourseSlide) window.showCourseSlide(idx); }catch(e){}
          try{ if(window.__grow_auth && typeof window.__grow_auth.advanceProgressTo === 'function') window.__grow_auth.advanceProgressTo(idx); }catch(e){}
        }
      }
    }
     // hint buttons
     if(el.classList && el.classList.contains('hint-btn')){
       const hintText = el.dataset.hint || 'Подсказка';
       // find nearest page and show hint bubble
       const page = el.closest('.page');
       if(!page) return;
       // if user settings disable hints, ignore
       try{
         const sid = getSession(); if(sid){ const users = loadUsers(); const me = users.find(u=>u.id===sid); if(me && me.settings && me.settings.hints===false) return; }
       }catch(e){}
       // create bubble
       const bubble = document.createElement('div'); bubble.className='hint-bubble show'; const txt = document.createElement('div'); txt.className='hint-text'; txt.textContent = hintText; bubble.appendChild(txt);
       el.parentElement.appendChild(bubble);
       setTimeout(()=>{ bubble.remove(); }, 4200);
     }
  });

  // Settings: load/save per-user
   function loadUserSettingsIntoUI(){ const sid = getSession(); if(!sid) return; const users = loadUsers(); const me = users.find(u=>u.id===sid); if(!me) return; const s = me.settings || {}; if(optHints) optHints.checked = !!s.hints; if(optNotifications) optNotifications.checked = !!s.notifications; if(optSound) optSound.checked = !!s.sound; if(optVolume) optVolume.value = (s.volume!=null? s.volume: 0.6); }
   function saveUserSettingsFromUI(){ const sid = getSession(); if(!sid) return; const users = loadUsers(); const me = users.find(u=>u.id===sid); if(!me) return; me.settings = me.settings||{}; if(optHints) me.settings.hints = !!optHints.checked; if(optNotifications) me.settings.notifications = !!optNotifications.checked; if(optSound) me.settings.sound = !!optSound.checked; if(optVolume) me.settings.volume = parseFloat(optVolume.value); saveUsers(users); }
   [optHints, optNotifications, optSound, optVolume].forEach(inp=>{ if(inp) inp.addEventListener('change', saveUserSettingsFromUI); });
  // load settings initially if logged
  loadUserSettingsIntoUI();

  // delete account
  if(deleteAccountBtn){
    deleteAccountBtn.addEventListener('click', ()=>{
      if(!confirm('Вы уверены, что хотите безвозвратно удалить профиль?')) return;
      const sid = getSession(); if(!sid) return alert('Нет сессии');
      let users = loadUsers(); users = users.filter(u=>u.id !== sid); saveUsers(users); setSession(null); alert('Профиль удалён'); showAuth();
    });
  }

  // Audio: background music control (optional file 'bgm.mp3' in project)
  const audio = new Audio('bgm.mp3'); audio.loop = true; audio.volume = 0.6; let audioAvailable = true;
  audio.addEventListener('error', ()=>{ audioAvailable = false; });
  function applyAudioSettings(){
    try{
      const sid = getSession(); if(!sid) return;
      const users = loadUsers(); const me = users.find(u=>u.id===sid); if(!me) return; const s = me.settings || {};
      if(!audioAvailable) return;
      const enabled = !!(s.sound);
      audio.volume = (s.volume!=null? s.volume : 0.6);
      if(enabled){ audio.play().catch(()=>{}); } else { audio.pause(); audio.currentTime = 0; }
    }catch(e){}
  }

  // if sound checkbox changed, call apply
  if(optSound) optSound.addEventListener('change', ()=>{ saveUserSettingsFromUI(); applyAudioSettings(); });
  if(optVolume) optVolume.addEventListener('input', ()=>{ saveUserSettingsFromUI(); applyAudioSettings(); });

  // call on init
  try{ applyAudioSettings(); }catch(e){}

  // when showing profile, refresh view and settings
  const originalShowProfile = showProfile;
  showProfile = function(user){ originalShowProfile(user); refreshProfileView(); loadUserSettingsIntoUI(); };

  // expose for debugging и внешнего вызова
  window.__grow_auth = { loadUsers, saveUsers, getSession, setSession, updateProgressForCurrent, advanceProgressTo };

})();