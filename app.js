const SUPABASE_URL = 'https://kbrybzkdmcsokhfmnfzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticnliemtkbWNzb2toZm1uZnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODE1OTgsImV4cCI6MjEwNTU1NzU5OH0.RFB_BhuogBMNaO4XvIKjveyTxjAPxhqcozOimEUw7uo';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const el = {
  loading: document.getElementById('app-loading'),
  authScreen: document.getElementById('auth-screen'),
  appShell: document.getElementById('app-shell'),
  authTabs: document.querySelectorAll('.auth-tab'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  authError: document.getElementById('auth-error'),
  userEmail: document.getElementById('user-email'),
  logoutBtn: document.getElementById('logout-btn'),
  globalError: document.getElementById('global-error'),
};

function friendlyErrorMessage(error) {
  if (!error) return '';
  if (error instanceof TypeError || error.message === 'Failed to fetch') {
    return 'Service temporairement indisponible, réessaie dans quelques instants.';
  }
  const message = error.message || '';
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (message.includes('User already registered')) {
    return 'Un compte existe déjà avec cet e-mail.';
  }
  if (message.toLowerCase().includes('password')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  return message || 'Une erreur est survenue, réessaie.';
}

function showAuthError(message) {
  el.authError.textContent = message;
  el.authError.classList.toggle('hidden', !message);
}

function switchAuthTab(tab) {
  showAuthError('');
  el.authTabs.forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  el.loginForm.classList.toggle('hidden', tab !== 'login');
  el.signupForm.classList.toggle('hidden', tab !== 'signup');
}

el.authTabs.forEach((btn) => {
  btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
});

el.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showAuthError('');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showAuthError(friendlyErrorMessage(error));
  }
});

el.signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showAuthError('');
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (password.length < 8) {
    showAuthError('Le mot de passe doit contenir au moins 8 caractères.');
    return;
  }

  const { error } = await sb.auth.signUp({ email, password });
  if (error) {
    showAuthError(friendlyErrorMessage(error));
  }
});

el.logoutBtn.addEventListener('click', async () => {
  await sb.auth.signOut();
});

function showAuthScreen() {
  el.loading.classList.add('hidden');
  el.appShell.classList.add('hidden');
  el.authScreen.classList.remove('hidden');
  el.loginForm.reset();
  el.signupForm.reset();
  switchAuthTab('login');
}

function showAppShell(session) {
  el.loading.classList.add('hidden');
  el.authScreen.classList.add('hidden');
  el.appShell.classList.remove('hidden');
  el.userEmail.textContent = session.user.email;
}

async function init() {
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;

    if (data.session) {
      showAppShell(data.session);
    } else {
      showAuthScreen();
    }
  } catch (error) {
    el.loading.classList.add('hidden');
    el.globalError.textContent = friendlyErrorMessage(error);
    el.globalError.classList.remove('hidden');
  }
}

sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showAppShell(session);
  } else if (event === 'SIGNED_OUT') {
    showAuthScreen();
  }
});

init();
