const SUPABASE_URL = 'https://rwsfkihoudtfobeiumrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3c2ZraWhvdWR0Zm9iZWl1bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTM2NzQsImV4cCI6MjA5MjM2OTY3NH0._psSFL4bQI8nIoWxb1D9Qpfj3eVq56yV-Z3xUB6s9B4';
const STORAGE_BUCKET = 'ideel-images';

// ideel-like lives in the "ideel" schema of the shared aimeri-unique project
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'ideel' } });

const DEFAULT_LOGO_BG = '#F5F6F8';

const PALETTE = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#84CC16',
];

const state = {
  session: null,
  paymentMethods: [],
  subscriptions: [],
};

let selectedPaymentMethodId = null;
let addLogoBlob = null;
let addLogoType = null;
let removeLogoFlag = false;
let subLogoBgColor = null;
let editingSubscription = null;
let pmFormEditingId = null;
let pmFormColor = null;
let pmIconBlob = null;
let pmIconType = null;
let pmIconRemoveFlag = false;
let lastFocusedElement = null;
let displayPeriod = loadPeriodPref();

const PENCIL_SVG =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.5 1.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-8 8-3.5 1 1-3.5 8-8Z"/></svg>';
const TRASH_SVG =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 2h4a1 1 0 0 1 1 1v1h3v1.5H2V4h3V3a1 1 0 0 1 1-1Zm-2 4h8l-.6 8.2a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8L4 6Z"/></svg>';
const CHECK_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
const GRIP_SVG =
  '<svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden="true">' +
  '<circle cx="2" cy="2" r="1.4"/><circle cx="8" cy="2" r="1.4"/>' +
  '<circle cx="2" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/>' +
  '<circle cx="2" cy="14" r="1.4"/><circle cx="8" cy="14" r="1.4"/>' +
  '</svg>';

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

  subscriptionsLoading: document.getElementById('subscriptions-loading'),
  subscriptionsEmpty: document.getElementById('subscriptions-empty'),
  subscriptionsGrid: document.getElementById('subscriptions-grid'),
  subscriptionsCount: document.getElementById('subscriptions-count'),
  subscriptionsTotal: document.getElementById('subscriptions-total'),
  periodOptions: document.querySelectorAll('.period-option'),
  dndAnnouncer: document.getElementById('dnd-announcer'),
  toast: document.getElementById('toast'),

  addFab: document.getElementById('add-fab'),
  addModalOverlay: document.getElementById('add-modal-overlay'),
  addModal: document.querySelector('#add-modal-overlay .modal'),
  addModalTitle: document.getElementById('add-modal-title'),
  addModalClose: document.getElementById('add-modal-close'),
  addForm: document.getElementById('add-form'),
  addName: document.getElementById('add-name'),
  addLogoDropzone: document.getElementById('add-logo-dropzone'),
  addLogoInput: document.getElementById('add-logo-input'),
  addLogoPreview: document.getElementById('add-logo-preview'),
  addLogoRemoveBtn: document.getElementById('add-logo-remove-btn'),
  addLogoColorRow: document.getElementById('add-logo-color-row'),
  addLogoColorInput: document.getElementById('add-logo-color-input'),
  addLogoColorAuto: document.getElementById('add-logo-color-auto'),
  addPrice: document.getElementById('add-price'),
  addPriceAnnualHint: document.getElementById('add-price-annual-hint'),
  addFormError: document.getElementById('add-form-error'),
  addSubmitBtn: document.getElementById('add-submit-btn'),

  deleteZone: document.getElementById('delete-zone'),
  deleteSubBtn: document.getElementById('delete-sub-btn'),
  deleteConfirm: document.getElementById('delete-confirm'),
  deleteConfirmBtn: document.getElementById('delete-confirm-btn'),
  deleteCancelBtn: document.getElementById('delete-cancel-btn'),

  pmChip: document.getElementById('pm-chip'),
  pmChipSwatch: document.getElementById('pm-chip-swatch'),
  pmChipIcon: document.getElementById('pm-chip-icon'),
  pmChipLabel: document.getElementById('pm-chip-label'),
  pmChipRemove: document.getElementById('pm-chip-remove'),
  pmChipPalette: document.getElementById('pm-chip-palette'),
  pmInputWrap: document.getElementById('pm-input-wrap'),
  pmInput: document.getElementById('pm-input'),
  pmSuggestions: document.getElementById('pm-suggestions'),
  pmInlineError: document.getElementById('pm-inline-error'),

  pmForm: document.getElementById('pm-form'),
  pmFormTitle: document.getElementById('pm-form-title'),
  pmFormLabel: document.getElementById('pm-form-label'),
  pmFormDropzone: document.getElementById('pm-form-dropzone'),
  pmFormIconInput: document.getElementById('pm-form-icon-input'),
  pmFormIconPreview: document.getElementById('pm-form-icon-preview'),
  pmFormIconRemove: document.getElementById('pm-form-icon-remove'),
  pmFormPalette: document.getElementById('pm-form-palette'),
  pmFormError: document.getElementById('pm-form-error'),
  pmFormConfirm: document.getElementById('pm-form-confirm'),
  pmFormCancel: document.getElementById('pm-form-cancel'),

  navItems: document.querySelectorAll('.nav-item'),
  pageAbos: document.getElementById('page-abos'),
  pageBudgets: document.getElementById('page-budgets'),
};

const IMAGE_EXT_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};
const ALLOWED_IMAGE_TYPES = Object.keys(IMAGE_EXT_BY_TYPE);

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

function showGlobalError(message) {
  el.globalError.textContent = message;
  el.globalError.classList.toggle('hidden', !message);
}

// Auth ------------------------------------------------------------------

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
  state.session = null;
  state.paymentMethods = [];
  state.subscriptions = [];
  resetBudget();
}

function showAppShell(session) {
  el.loading.classList.add('hidden');
  el.authScreen.classList.add('hidden');
  el.appShell.classList.remove('hidden');
  el.userEmail.textContent = session.user.email;
  state.session = session;
  loadData();
  applyRoute();
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
    showGlobalError(friendlyErrorMessage(error));
  }
}

sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showAppShell(session);
  } else if (event === 'SIGNED_OUT') {
    showAuthScreen();
  }
});

// Data --------------------------------------------------------------

async function loadData() {
  showGlobalError('');
  el.subscriptionsLoading.classList.remove('hidden');
  el.subscriptionsEmpty.classList.add('hidden');
  el.subscriptionsGrid.innerHTML = '';

  try {
    const [methodsRes, subsRes] = await Promise.all([
      sb.from('payment_methods').select('*').order('created_at', { ascending: true }),
      sb.from('subscriptions').select('*').order('position', { ascending: true }),
    ]);
    if (methodsRes.error) throw methodsRes.error;
    if (subsRes.error) throw subsRes.error;

    state.paymentMethods = methodsRes.data;
    state.subscriptions = subsRes.data;
    el.subscriptionsLoading.classList.add('hidden');
    renderAll();
    if (currentPage === 'budgets') renderBudgetPage();
  } catch (error) {
    el.subscriptionsLoading.classList.add('hidden');
    showGlobalError(friendlyErrorMessage(error));
  }
}

// Formatting ----------------------------------------------------------

function toCents(price) {
  return Math.round(Number(price) * 100);
}

function priceDisplayParts(monthlyCents, period) {
  const cents = period === 'year' ? monthlyCents * 12 : monthlyCents;
  const suffix = period === 'year' ? '€/an' : '€/mois';
  const intPart = Math.floor(cents / 100);
  const centsPart = String(cents % 100).padStart(2, '0');
  return {
    intPart: intPart.toLocaleString('fr-FR'),
    rest: `,${centsPart}${suffix}`,
  };
}

function loadPeriodPref() {
  try {
    const saved = localStorage.getItem('ideel-like:period');
    if (saved === 'year' || saved === 'month') return saved;
  } catch (error) {
    // ignore storage access errors
  }
  return 'month';
}

function savePeriodPref(period) {
  try {
    localStorage.setItem('ideel-like:period', period);
  } catch (error) {
    // ignore storage access errors
  }
}

function pulsePrices() {
  document.querySelectorAll('.sub-price, .stats-total').forEach((elm) => {
    elm.classList.remove('price-pulse');
    void elm.offsetWidth;
    elm.classList.add('price-pulse');
  });
}

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getPublicUrl(path) {
  return sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function isColorDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// Rendering -------------------------------------------------------------

function renderAll() {
  renderHeaderStats();
  renderSubscriptions();
}

function renderHeaderStats() {
  const count = state.subscriptions.length;
  el.subscriptionsCount.textContent = `${count} abonnement${count === 1 ? '' : 's'}`;

  const totalMonthlyCents = state.subscriptions.reduce((sum, sub) => sum + toCents(sub.monthly_price), 0);
  const parts = priceDisplayParts(totalMonthlyCents, displayPeriod);
  el.subscriptionsTotal.innerHTML = '';
  el.subscriptionsTotal.appendChild(h('span', 'price-int', parts.intPart));
  el.subscriptionsTotal.appendChild(h('span', 'price-cents', parts.rest));
}

function updatePeriodToggleUI() {
  el.periodOptions.forEach((btn) => {
    const active = btn.dataset.period === displayPeriod;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  });
}

el.periodOptions.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.period === displayPeriod) return;
    displayPeriod = btn.dataset.period;
    savePeriodPref(displayPeriod);
    updatePeriodToggleUI();
    renderAll();
    pulsePrices();
  });
});

updatePeriodToggleUI();

const tagColorCache = new Map();

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.substr(i, 2), 16));
}

function mixHex(hexA, hexB, weightB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const mixed = a.map((v, i) => Math.round(v * (1 - weightB) + b[i] * weightB));
  return rgbToHex(mixed[0], mixed[1], mixed[2]);
}

function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const L1 = relLuminance(hexA);
  const L2 = relLuminance(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function deriveTagColors(baseHex) {
  const key = baseHex.toUpperCase();
  if (tagColorCache.has(key)) return tagColorCache.get(key);

  const bg = mixHex(key, '#FFFFFF', 0.82);
  let weight = 0.3;
  let fg = mixHex(key, '#000000', weight);
  while (contrastRatio(bg, fg) < 4.5 && weight < 0.9) {
    weight += 0.05;
    fg = mixHex(key, '#000000', weight);
  }

  const result = { bg, fg };
  tagColorCache.set(key, result);
  return result;
}

function pickColorForNewMethod() {
  const usage = new Map(PALETTE.map((c) => [c, 0]));
  state.paymentMethods.forEach((m) => {
    if (usage.has(m.color)) usage.set(m.color, usage.get(m.color) + 1);
  });
  const unused = PALETTE.find((c) => usage.get(c) === 0);
  if (unused) return unused;

  let best = PALETTE[0];
  let bestCount = Infinity;
  PALETTE.forEach((c) => {
    const n = usage.get(c);
    if (n < bestCount) {
      bestCount = n;
      best = c;
    }
  });
  return best;
}

function applyMethodTagStyle(pillEl, iconEl, method) {
  const { bg, fg } = deriveTagColors(method.color || PALETTE[0]);
  pillEl.style.backgroundColor = bg;
  pillEl.style.color = fg;
  iconEl.innerHTML = '';
  if (method.icon_path) {
    iconEl.style.backgroundColor = 'transparent';
    const img = document.createElement('img');
    img.src = getPublicUrl(method.icon_path);
    img.alt = '';
    iconEl.appendChild(img);
  } else {
    iconEl.style.backgroundColor = fg;
    iconEl.style.color = bg;
    iconEl.textContent = (method.label[0] || '?').toUpperCase();
  }
}

function createMethodTag(method) {
  const tag = h('span', 'method-tag');
  const icon = h('span', 'method-tag-icon');
  applyMethodTagStyle(tag, icon, method);
  tag.appendChild(icon);
  tag.appendChild(h('span', 'method-tag-label', method.label));
  return tag;
}

function renderColorPalette(container, currentColor, onPick) {
  container.innerHTML = '';
  PALETTE.forEach((color) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'color-dot' + (color === currentColor ? ' color-dot--selected' : '');
    dot.style.backgroundColor = color;
    dot.setAttribute('aria-label', `Couleur ${color}`);
    dot.addEventListener('click', () => onPick(color));
    container.appendChild(dot);
  });
}

function createSubscriptionCard(sub) {
  const card = h('article', 'sub-card');
  card.dataset.id = sub.id;

  const logoBox = h('div', 'sub-logo-box');
  let initialsEl = null;
  if (sub.logo_path) {
    const img = document.createElement('img');
    img.className = 'sub-logo-img';
    img.alt = '';
    img.src = getPublicUrl(sub.logo_path);
    logoBox.appendChild(img);
  } else {
    initialsEl = h('div', 'sub-logo-initials', initials(sub.name));
    logoBox.appendChild(initialsEl);
  }
  if (sub.logo_bg_color) {
    logoBox.style.backgroundColor = sub.logo_bg_color;
    if (initialsEl && isColorDark(sub.logo_bg_color)) {
      initialsEl.classList.add('sub-logo-initials--dark');
    }
  }

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'drag-handle';
  handle.dataset.id = sub.id;
  handle.setAttribute('aria-label', `Déplacer l'abonnement ${sub.name}`);
  handle.innerHTML = GRIP_SVG;
  handle.addEventListener('keydown', (event) => onHandleKeydown(event, sub.id));
  logoBox.appendChild(handle);

  card.appendChild(logoBox);

  const body = h('div', 'sub-body');
  body.appendChild(h('h3', 'sub-name', sub.name));

  const priceEl = h('p', 'sub-price');
  const parts = priceDisplayParts(toCents(sub.monthly_price), displayPeriod);
  priceEl.appendChild(h('span', 'price-int', parts.intPart));
  priceEl.appendChild(h('span', 'price-cents', parts.rest));
  body.appendChild(priceEl);

  const linkedMethod = state.paymentMethods.find((m) => m.id === sub.payment_method_id);
  if (linkedMethod) {
    body.appendChild(createMethodTag(linkedMethod));
  }

  const footer = h('div', 'sub-footer');
  const viewLink = document.createElement('a');
  viewLink.href = '#';
  viewLink.className = 'sub-view';
  viewLink.textContent = 'Voir >';
  viewLink.addEventListener('click', (event) => {
    event.preventDefault();
    openEditModal(sub);
  });
  footer.appendChild(viewLink);
  body.appendChild(footer);

  card.appendChild(body);
  return card;
}

function renderSubscriptions() {
  el.subscriptionsGrid.innerHTML = '';
  if (state.subscriptions.length === 0) {
    el.subscriptionsEmpty.classList.remove('hidden');
    return;
  }
  el.subscriptionsEmpty.classList.add('hidden');
  state.subscriptions.forEach((sub) => {
    el.subscriptionsGrid.appendChild(createSubscriptionCard(sub));
  });
}

// Drag & drop reordering --------------------------------------------------

let kbDrag = null;
let sortablePreviousOrder = null;
let toastTimer = null;

function announce(message) {
  el.dndAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    el.dndAnnouncer.textContent = message;
  });
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 4000);
}

async function persistOrder(previousOrder) {
  // A dedicated RPC touches only the position column, unlike resending full rows via
  // upsert, which would silently overwrite a name/price/logo change made concurrently
  // in another tab or device with stale local data.
  state.subscriptions = state.subscriptions.map((sub, idx) => ({ ...sub, position: idx }));
  const orderedIds = state.subscriptions.map((sub) => sub.id);
  try {
    const { error } = await sb.rpc('reorder_subscriptions', { ordered_ids: orderedIds });
    if (error) throw error;
    renderSubscriptions();
  } catch (error) {
    state.subscriptions = previousOrder;
    renderSubscriptions();
    showToast("Impossible d'enregistrer le nouvel ordre, abonnements restaurés.");
  }
}

function focusHandleFor(id) {
  const handle = el.subscriptionsGrid.querySelector(`.drag-handle[data-id="${id}"]`);
  if (handle) handle.focus();
}

function moveKb(delta, subId) {
  const newIndex = kbDrag.currentIndex + delta;
  if (newIndex < 0 || newIndex >= state.subscriptions.length) return;
  const arr = state.subscriptions;
  const [item] = arr.splice(kbDrag.currentIndex, 1);
  arr.splice(newIndex, 0, item);
  kbDrag.currentIndex = newIndex;
  renderSubscriptions();
  requestAnimationFrame(() => {
    const handle = el.subscriptionsGrid.querySelector(`.drag-handle[data-id="${subId}"]`);
    if (handle) {
      handle.classList.add('is-grabbed');
      handle.focus();
    }
  });
  announce(`Position ${newIndex + 1} sur ${arr.length}.`);
}

function onHandleKeydown(event, subId) {
  const isActivate = event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter';

  if (!kbDrag) {
    if (!isActivate) return;
    event.preventDefault();
    const idx = state.subscriptions.findIndex((s) => s.id === subId);
    if (idx === -1) return;
    kbDrag = { id: subId, originalIndex: idx, currentIndex: idx, previousOrder: [...state.subscriptions] };
    event.currentTarget.classList.add('is-grabbed');
    announce(
      `${state.subscriptions[idx].name} saisi. Position ${idx + 1} sur ${state.subscriptions.length}. ` +
        "Flèches pour déplacer, Espace pour déposer, Échap pour annuler."
    );
    return;
  }

  if (kbDrag.id !== subId) return;

  if (isActivate) {
    event.preventDefault();
    const sub = state.subscriptions[kbDrag.currentIndex];
    const previousOrder = kbDrag.previousOrder;
    kbDrag = null;
    announce(
      `${sub.name} déposé en position ${state.subscriptions.findIndex((s) => s.id === sub.id) + 1} sur ${state.subscriptions.length}.`
    );
    persistOrder(previousOrder).then(() => focusHandleFor(subId));
  } else if (event.key === 'Escape') {
    event.preventDefault();
    const arr = state.subscriptions;
    const [item] = arr.splice(kbDrag.currentIndex, 1);
    arr.splice(kbDrag.originalIndex, 0, item);
    kbDrag = null;
    renderSubscriptions();
    announce('Déplacement annulé.');
    requestAnimationFrame(() => focusHandleFor(subId));
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveKb(-1, subId);
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    moveKb(1, subId);
  }
}

if (window.Sortable) {
  Sortable.create(el.subscriptionsGrid, {
    handle: '.drag-handle',
    animation: 150,
    forceFallback: true,
    fallbackTolerance: 3,
    ghostClass: 'sub-card--ghost',
    chosenClass: 'sub-card--dragging',
    scroll: true,
    scrollSensitivity: 80,
    scrollSpeed: 15,
    onStart: () => {
      sortablePreviousOrder = [...state.subscriptions];
    },
    onEnd: () => {
      const ids = Array.from(el.subscriptionsGrid.children).map((c) => c.dataset.id);
      state.subscriptions = ids.map((id) => state.subscriptions.find((s) => s.id === id)).filter(Boolean);
      const previousOrder = sortablePreviousOrder;
      sortablePreviousOrder = null;
      persistOrder(previousOrder);
    },
  });
}

// Modal / accessibility --------------------------------------------------

function trapTabKey(container, event) {
  const focusable = Array.from(
    container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((elm) => !elm.disabled && elm.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openModal(overlayEl, containerEl) {
  lastFocusedElement = document.activeElement;
  overlayEl.classList.remove('hidden');
  const focusable = containerEl.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) focusable[0].focus();
}

function closeModalGeneric(overlayEl) {
  overlayEl.classList.add('hidden');
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !el.addModalOverlay.classList.contains('hidden')) {
    closeAddModal();
  }
});

el.addModalOverlay.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') trapTabKey(el.addModal, event);
});

el.addModalOverlay.addEventListener('click', (event) => {
  if (event.target === el.addModalOverlay) closeAddModal();
});

el.addModalClose.addEventListener('click', closeAddModal);
el.addFab.addEventListener('click', openAddModal);

// Image handling ------------------------------------------------------

function extForType(type) {
  return IMAGE_EXT_BY_TYPE[type] || 'png';
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function detectBgColorFromBitmap(bitmap) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const counts = new Map();
  let opaque = 0;
  let total = 0;

  function sample(x, y) {
    const idx = (y * size + x) * 4;
    total += 1;
    if (data[idx + 3] < 32) return;
    opaque += 1;
    const key = `${data[idx]},${data[idx + 1]},${data[idx + 2]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  for (let x = 0; x < size; x++) {
    sample(x, 0);
    sample(x, size - 1);
  }
  for (let y = 0; y < size; y++) {
    sample(0, y);
    sample(size - 1, y);
  }

  if (total === 0 || opaque / total < 0.5) return null;

  let bestKey = null;
  let bestCount = -1;
  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  });
  if (!bestKey) return null;
  const [r, g, b] = bestKey.split(',').map(Number);
  return rgbToHex(r, g, b);
}

async function detectLogoBgColor(file) {
  try {
    const bitmap = await createImageBitmap(file);
    return await detectBgColorFromBitmap(bitmap);
  } catch (error) {
    return null;
  }
}

async function detectLogoBgColorFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    return await detectBgColorFromBitmap(bitmap);
  } catch (error) {
    return null;
  }
}

async function processImageFile(file, maxDim) {
  if (file.type === 'image/svg+xml') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, targetW, targetH);
  return new Promise((resolve) => canvas.toBlob(resolve, file.type, 0.92));
}

function setupDropzone(zoneEl, inputEl, previewEl, maxDim, onProcessed) {
  const trigger = () => inputEl.click();
  zoneEl.addEventListener('click', trigger);
  zoneEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      trigger();
    }
  });
  zoneEl.addEventListener('dragover', (event) => {
    event.preventDefault();
    zoneEl.classList.add('dropzone-active');
  });
  zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('dropzone-active'));
  zoneEl.addEventListener('drop', (event) => {
    event.preventDefault();
    zoneEl.classList.remove('dropzone-active');
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  inputEl.addEventListener('change', () => {
    const file = inputEl.files && inputEl.files[0];
    if (file) handleFile(file);
  });

  async function handleFile(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
    const blob = await processImageFile(file, maxDim);
    previewEl.src = URL.createObjectURL(blob);
    previewEl.classList.remove('hidden');
    onProcessed(blob, file.type, file);
  }
}

function updateLogoColorUI() {
  const hasLogo = !el.addLogoPreview.classList.contains('hidden');
  el.addLogoColorRow.classList.toggle('hidden', !hasLogo);
  el.addLogoColorInput.value = subLogoBgColor || DEFAULT_LOGO_BG;
  el.addLogoColorAuto.classList.toggle('hidden', !hasLogo);
}

setupDropzone(el.addLogoDropzone, el.addLogoInput, el.addLogoPreview, 400, async (blob, type, file) => {
  addLogoBlob = blob;
  addLogoType = type;
  removeLogoFlag = false;
  el.addLogoRemoveBtn.classList.remove('hidden');
  subLogoBgColor = await detectLogoBgColor(file);
  updateLogoColorUI();
});

el.addLogoRemoveBtn.addEventListener('click', () => {
  addLogoBlob = null;
  addLogoType = null;
  removeLogoFlag = true;
  subLogoBgColor = null;
  el.addLogoPreview.classList.add('hidden');
  el.addLogoPreview.src = '';
  el.addLogoInput.value = '';
  el.addLogoRemoveBtn.classList.add('hidden');
  updateLogoColorUI();
});

el.addLogoColorInput.addEventListener('input', () => {
  subLogoBgColor = el.addLogoColorInput.value.toUpperCase();
});

el.addLogoColorAuto.addEventListener('click', async () => {
  let detected = null;
  if (addLogoBlob) {
    detected = await detectLogoBgColor(addLogoBlob);
  } else if (editingSubscription && editingSubscription.logo_path && !removeLogoFlag) {
    detected = await detectLogoBgColorFromUrl(getPublicUrl(editingSubscription.logo_path));
  }
  subLogoBgColor = detected;
  updateLogoColorUI();
});

setupDropzone(el.pmFormDropzone, el.pmFormIconInput, el.pmFormIconPreview, 64, (blob, type) => {
  pmIconBlob = blob;
  pmIconType = type;
  pmIconRemoveFlag = false;
  el.pmFormIconRemove.classList.remove('hidden');
});

el.pmFormIconRemove.addEventListener('click', () => {
  pmIconBlob = null;
  pmIconType = null;
  pmIconRemoveFlag = true;
  el.pmFormIconPreview.classList.add('hidden');
  el.pmFormIconPreview.src = '';
  el.pmFormIconRemove.classList.add('hidden');
});

// Payment method: tag field, autocomplete, inline create/edit/delete --------

function hasCardNumberLikeDigits(text) {
  return (text.match(/\d/g) || []).length >= 12;
}

function validatePaymentMethodLabel(label, excludeId) {
  if (!label) return 'Le libellé est obligatoire.';
  if (label.length > 40) return '40 caractères maximum.';
  if (hasCardNumberLikeDigits(label)) {
    return "Un libellé seulement, jamais un numéro de carte ou d'IBAN.";
  }
  const duplicate = state.paymentMethods.some(
    (m) => m.label.toLowerCase() === label.toLowerCase() && m.id !== excludeId
  );
  if (duplicate) return 'Un moyen de paiement avec ce libellé existe déjà.';
  return null;
}

function showPmInlineError(message) {
  el.pmInlineError.textContent = message;
  el.pmInlineError.classList.remove('hidden');
}

function hidePmInlineError() {
  el.pmInlineError.classList.add('hidden');
}

function selectPaymentMethod(method, opts = {}) {
  selectedPaymentMethodId = method.id;
  el.pmInputWrap.classList.add('hidden');
  el.pmSuggestions.classList.add('hidden');
  el.pmChipPalette.classList.add('hidden');
  el.pmInput.value = '';
  hidePmInlineError();
  el.pmChip.classList.remove('hidden');
  el.pmChipLabel.textContent = method.label;
  applyMethodTagStyle(el.pmChip, el.pmChipIcon, method);
  el.pmChipRemove.style.color = deriveTagColors(method.color || PALETTE[0]).fg;
  if (opts.animate) {
    el.pmChip.classList.remove('card-chip--confirm');
    void el.pmChip.offsetWidth;
    el.pmChip.classList.add('card-chip--confirm');
  }
}

function clearSelectedPaymentMethod() {
  selectedPaymentMethodId = null;
  el.pmChip.classList.add('hidden');
  el.pmChip.classList.remove('card-chip--confirm');
  el.pmChip.style.backgroundColor = '';
  el.pmChip.style.color = '';
  el.pmChipIcon.innerHTML = '';
  el.pmChipPalette.classList.add('hidden');
  el.pmInputWrap.classList.remove('hidden');
  el.pmInput.value = '';
  hidePmInlineError();
}

el.pmChipRemove.addEventListener('click', (event) => {
  event.stopPropagation();
  clearSelectedPaymentMethod();
});

el.pmChipSwatch.addEventListener('click', (event) => {
  event.stopPropagation();
  const method = state.paymentMethods.find((m) => m.id === selectedPaymentMethodId);
  if (!method) return;

  const isOpen = !el.pmChipPalette.classList.contains('hidden');
  if (isOpen) {
    el.pmChipPalette.classList.add('hidden');
    return;
  }

  renderColorPalette(el.pmChipPalette, method.color, async (color) => {
    await updatePaymentMethodColor(method, color);
    el.pmChipPalette.classList.add('hidden');
  });
  el.pmChipPalette.classList.remove('hidden');
});

async function updatePaymentMethodColor(method, color) {
  try {
    const { data, error } = await sb
      .from('payment_methods')
      .update({ color })
      .eq('id', method.id)
      .select()
      .single();
    if (error) throw error;

    const idx = state.paymentMethods.findIndex((m) => m.id === data.id);
    state.paymentMethods[idx] = data;
    if (selectedPaymentMethodId === data.id) {
      selectPaymentMethod(data);
    }
    renderAll();
    if (!el.pmSuggestions.classList.contains('hidden')) {
      renderSuggestions(el.pmInput.value);
    }
  } catch (error) {
    showPmInlineError(friendlyErrorMessage(error));
  }
}

function buildCreateOption(label) {
  const li = document.createElement('li');
  li.className = 'suggestion-create';
  li.setAttribute('role', 'option');
  li.appendChild(h('span', 'suggestion-create-text', `+ Créer « ${label} »`));
  li.appendChild(h('span', 'kbd-badge', 'Entrée ↵'));
  li.addEventListener('click', () => quickCreatePaymentMethod(label));
  return li;
}

function buildSuggestionRow(method, isExact) {
  const li = document.createElement('li');
  li.className = isExact ? 'suggestion-row suggestion-row--exact' : 'suggestion-row';
  li.setAttribute('role', 'option');

  const main = h('div', 'suggestion-main');
  main.appendChild(createMethodTag(method));
  main.addEventListener('click', () => selectPaymentMethod(method, { animate: true }));
  li.appendChild(main);

  const actions = h('div', 'suggestion-actions');

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'icon-btn';
  editBtn.setAttribute('aria-label', `Modifier ${method.label}`);
  editBtn.innerHTML = PENCIL_SVG;
  editBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    openEditPaymentMethodForm(method);
  });
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn';
  deleteBtn.setAttribute('aria-label', `Supprimer ${method.label}`);
  deleteBtn.innerHTML = TRASH_SVG;
  deleteBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    requestDeletePaymentMethod(method, li);
  });
  actions.appendChild(deleteBtn);

  li.appendChild(actions);
  return li;
}

function renderSuggestions(query) {
  const q = query.trim();
  const qLower = q.toLowerCase();
  el.pmSuggestions.innerHTML = '';

  const list = state.paymentMethods
    .filter((m) => !q || m.label.toLowerCase().includes(qLower))
    .sort((a, b) => {
      const aExact = a.label.toLowerCase() === qLower;
      const bExact = b.label.toLowerCase() === qLower;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return 0;
    });
  const hasExact = list.some((m) => m.label.toLowerCase() === qLower);

  if (q && !hasExact) {
    el.pmSuggestions.appendChild(buildCreateOption(q));
  }

  list.forEach((method) => {
    const isExact = method.label.toLowerCase() === qLower;
    el.pmSuggestions.appendChild(buildSuggestionRow(method, isExact));
  });

  el.pmSuggestions.classList.toggle('hidden', el.pmSuggestions.children.length === 0);
}

async function quickCreatePaymentMethod(label) {
  const validationError = validatePaymentMethodLabel(label, null);
  if (validationError) {
    showPmInlineError(validationError);
    return false;
  }
  try {
    const { data, error } = await sb
      .from('payment_methods')
      .insert({ id: crypto.randomUUID(), label, color: pickColorForNewMethod() })
      .select()
      .single();
    if (error) throw error;
    state.paymentMethods.push(data);
    selectPaymentMethod(data, { animate: true });
    return true;
  } catch (error) {
    showPmInlineError(friendlyErrorMessage(error));
    return false;
  }
}

function renderPmFormPalette() {
  renderColorPalette(el.pmFormPalette, pmFormColor, (color) => {
    pmFormColor = color;
    renderPmFormPalette();
  });
}

function openEditPaymentMethodForm(method) {
  pmFormEditingId = method.id;
  pmFormColor = method.color || PALETTE[0];
  pmIconBlob = null;
  pmIconType = null;
  pmIconRemoveFlag = false;

  el.pmInputWrap.classList.add('hidden');
  el.pmSuggestions.classList.add('hidden');
  el.pmForm.classList.remove('hidden');
  el.pmFormTitle.textContent = 'Modifier le moyen de paiement';
  el.pmFormLabel.value = method.label;
  el.pmFormError.classList.add('hidden');
  renderPmFormPalette();

  if (method.icon_path) {
    el.pmFormIconPreview.src = getPublicUrl(method.icon_path);
    el.pmFormIconPreview.classList.remove('hidden');
    el.pmFormIconRemove.classList.remove('hidden');
  } else {
    el.pmFormIconPreview.classList.add('hidden');
    el.pmFormIconPreview.src = '';
    el.pmFormIconRemove.classList.add('hidden');
  }
  el.pmFormLabel.focus();
}

function closePmForm() {
  el.pmForm.classList.add('hidden');
  el.pmInputWrap.classList.remove('hidden');
  pmFormEditingId = null;
  pmFormColor = null;
  el.pmInput.value = '';
}

el.pmFormCancel.addEventListener('click', closePmForm);

el.pmFormConfirm.addEventListener('click', async () => {
  if (!pmFormEditingId) return;
  const label = el.pmFormLabel.value.trim();
  el.pmFormError.classList.add('hidden');

  const validationError = validatePaymentMethodLabel(label, pmFormEditingId);
  if (validationError) {
    el.pmFormError.textContent = validationError;
    el.pmFormError.classList.remove('hidden');
    return;
  }

  el.pmFormConfirm.disabled = true;
  try {
    const method = state.paymentMethods.find((m) => m.id === pmFormEditingId);
    const previousIconPath = method.icon_path;
    let iconPath = previousIconPath;

    if (pmIconBlob) {
      iconPath = `${state.session.user.id}/payment-methods/${crypto.randomUUID()}.${extForType(pmIconType)}`;
      const { error: uploadError } = await sb.storage
        .from(STORAGE_BUCKET)
        .upload(iconPath, pmIconBlob, { contentType: pmIconType });
      if (uploadError) throw uploadError;
    } else if (pmIconRemoveFlag) {
      iconPath = null;
    }

    const { data, error } = await sb
      .from('payment_methods')
      .update({ label, icon_path: iconPath, color: pmFormColor })
      .eq('id', pmFormEditingId)
      .select()
      .single();
    if (error) throw error;

    if (previousIconPath && previousIconPath !== iconPath) {
      await sb.storage.from(STORAGE_BUCKET).remove([previousIconPath]).catch(() => {});
    }

    const idx = state.paymentMethods.findIndex((m) => m.id === data.id);
    state.paymentMethods[idx] = data;
    if (selectedPaymentMethodId === data.id) {
      selectPaymentMethod(data);
    }
    renderAll();
    closePmForm();
    renderSuggestions('');
  } catch (error) {
    el.pmFormError.textContent = friendlyErrorMessage(error);
    el.pmFormError.classList.remove('hidden');
  } finally {
    el.pmFormConfirm.disabled = false;
  }
});

function requestDeletePaymentMethod(method, rowEl) {
  const count = state.subscriptions.filter((s) => s.payment_method_id === method.id).length;
  const message =
    count === 0
      ? "Aucun abonnement ne l'utilise. Supprimer ce moyen de paiement ?"
      : `Utilisé par ${count} abonnement${count === 1 ? '' : 's'}, ils n'auront plus de moyen de paiement. Supprimer ?`;

  rowEl.innerHTML = '';
  rowEl.className = 'suggestion-confirm';
  rowEl.appendChild(h('p', 'suggestion-confirm-text', message));

  const actions = h('div', 'suggestion-confirm-actions');
  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn btn-danger btn-sm';
  confirmBtn.textContent = 'Supprimer';
  confirmBtn.addEventListener('click', () => deletePaymentMethod(method));

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-ghost btn-sm';
  cancelBtn.textContent = 'Annuler';
  cancelBtn.addEventListener('click', () => renderSuggestions(el.pmInput.value));

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  rowEl.appendChild(actions);
}

async function deletePaymentMethod(method) {
  try {
    const { error } = await sb.from('payment_methods').delete().eq('id', method.id);
    if (error) throw error;
    if (method.icon_path) {
      await sb.storage.from(STORAGE_BUCKET).remove([method.icon_path]).catch(() => {});
    }
    state.paymentMethods = state.paymentMethods.filter((m) => m.id !== method.id);
    state.subscriptions = state.subscriptions.map((s) =>
      s.payment_method_id === method.id ? { ...s, payment_method_id: null } : s
    );
    if (selectedPaymentMethodId === method.id) {
      clearSelectedPaymentMethod();
    }
    renderAll();
    renderSuggestions(el.pmInput.value);
  } catch (error) {
    showPmInlineError(friendlyErrorMessage(error));
  }
}

el.pmInput.addEventListener('input', () => renderSuggestions(el.pmInput.value));
el.pmInput.addEventListener('focus', () => renderSuggestions(el.pmInput.value));

el.pmInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const value = el.pmInput.value.trim();
    if (!value) return;
    const exact = state.paymentMethods.find((m) => m.label.toLowerCase() === value.toLowerCase());
    if (exact) {
      selectPaymentMethod(exact, { animate: true });
      return;
    }
    quickCreatePaymentMethod(value);
  } else if (event.key === 'Escape' && !el.pmSuggestions.classList.contains('hidden')) {
    event.stopPropagation();
    el.pmSuggestions.classList.add('hidden');
  }
});

document.addEventListener('mousedown', (event) => {
  if (event.target !== el.pmInput && !el.pmSuggestions.contains(event.target)) {
    el.pmSuggestions.classList.add('hidden');
  }
  if (event.target !== el.pmChipSwatch && !el.pmChipPalette.contains(event.target)) {
    el.pmChipPalette.classList.add('hidden');
  }
});

// Add/edit subscription form ----------------------------------------------

function parsePriceInput(raw) {
  const cleaned = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

function showAddFormError(message) {
  el.addFormError.textContent = message;
  el.addFormError.classList.remove('hidden');
}

function hideAddFormError() {
  el.addFormError.classList.add('hidden');
}

function updatePriceAnnualHint() {
  const value = parsePriceInput(el.addPrice.value);
  if (value === null) {
    el.addPriceAnnualHint.innerHTML = '&nbsp;';
    return;
  }
  const annualCents = Math.round(value * 100) * 12;
  const intPart = Math.floor(annualCents / 100).toLocaleString('fr-FR');
  const centsPart = String(annualCents % 100).padStart(2, '0');
  el.addPriceAnnualHint.textContent = `soit ${intPart},${centsPart} €/an`;
}

el.addPrice.addEventListener('input', updatePriceAnnualHint);

function resetAddForm() {
  el.addForm.reset();
  addLogoBlob = null;
  addLogoType = null;
  removeLogoFlag = false;
  subLogoBgColor = null;
  el.addLogoPreview.classList.add('hidden');
  el.addLogoPreview.src = '';
  el.addLogoRemoveBtn.classList.add('hidden');
  updateLogoColorUI();
  updatePriceAnnualHint();
  clearSelectedPaymentMethod();
  closePmForm();
  hideAddFormError();
  el.deleteConfirm.classList.add('hidden');
  el.deleteSubBtn.classList.remove('hidden');
}

function openAddModal() {
  editingSubscription = null;
  resetAddForm();
  el.addModalTitle.textContent = 'Ajouter un abonnement';
  el.addSubmitBtn.textContent = 'Ajouter';
  el.deleteZone.classList.add('hidden');
  openModal(el.addModalOverlay, el.addModal);
}

function openEditModal(sub) {
  editingSubscription = sub;
  resetAddForm();
  el.addModalTitle.textContent = 'Modifier l’abonnement';
  el.addSubmitBtn.textContent = 'Enregistrer';
  el.deleteZone.classList.remove('hidden');

  el.addName.value = sub.name;
  el.addPrice.value = Number(sub.monthly_price).toFixed(2);
  updatePriceAnnualHint();

  if (sub.logo_path) {
    el.addLogoPreview.src = getPublicUrl(sub.logo_path);
    el.addLogoPreview.classList.remove('hidden');
    el.addLogoRemoveBtn.classList.remove('hidden');
    subLogoBgColor = sub.logo_bg_color || null;
    updateLogoColorUI();
  }

  const linkedMethod = state.paymentMethods.find((m) => m.id === sub.payment_method_id);
  if (linkedMethod) {
    selectPaymentMethod(linkedMethod);
  }

  openModal(el.addModalOverlay, el.addModal);
}

function closeAddModal() {
  closeModalGeneric(el.addModalOverlay);
  editingSubscription = null;
}

el.addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAddFormError();

  const pendingPmText = el.pmInput.value.trim();
  if (pendingPmText) {
    const exact = state.paymentMethods.find((m) => m.label.toLowerCase() === pendingPmText.toLowerCase());
    if (exact) {
      selectPaymentMethod(exact);
    } else {
      const created = await quickCreatePaymentMethod(pendingPmText);
      if (!created) return;
    }
  }

  const name = el.addName.value.trim();
  if (!name) return showAddFormError('Le nom est obligatoire.');
  if (name.length > 60) return showAddFormError('60 caractères maximum.');

  const priceValue = parsePriceInput(el.addPrice.value);
  if (priceValue === null) {
    return showAddFormError('Le prix doit être un nombre supérieur à 0 (2 décimales max).');
  }

  el.addSubmitBtn.disabled = true;
  try {
    const previousLogoPath = editingSubscription ? editingSubscription.logo_path : null;
    let logoPath = previousLogoPath;

    if (addLogoBlob) {
      logoPath = `${state.session.user.id}/logos/${crypto.randomUUID()}.${extForType(addLogoType)}`;
      const { error: uploadError } = await sb.storage
        .from(STORAGE_BUCKET)
        .upload(logoPath, addLogoBlob, { contentType: addLogoType });
      if (uploadError) throw uploadError;
    } else if (removeLogoFlag) {
      logoPath = null;
    }

    const payload = {
      name,
      monthly_price: priceValue,
      logo_path: logoPath,
      logo_bg_color: logoPath ? subLogoBgColor : null,
      payment_method_id: selectedPaymentMethodId,
    };

    let saved;
    if (editingSubscription) {
      const { data, error } = await sb
        .from('subscriptions')
        .update(payload)
        .eq('id', editingSubscription.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
      if (previousLogoPath && previousLogoPath !== logoPath) {
        await sb.storage.from(STORAGE_BUCKET).remove([previousLogoPath]).catch(() => {});
      }
      const idx = state.subscriptions.findIndex((s) => s.id === saved.id);
      state.subscriptions[idx] = saved;
    } else {
      const nextPosition = state.subscriptions.length
        ? state.subscriptions[state.subscriptions.length - 1].position + 1
        : 0;
      const { data, error } = await sb
        .from('subscriptions')
        .insert({ id: crypto.randomUUID(), position: nextPosition, ...payload })
        .select()
        .single();
      if (error) throw error;
      saved = data;
      state.subscriptions.push(saved);
    }

    renderAll();
    closeAddModal();
  } catch (error) {
    showAddFormError(friendlyErrorMessage(error));
  } finally {
    el.addSubmitBtn.disabled = false;
  }
});

el.deleteSubBtn.addEventListener('click', () => {
  el.deleteSubBtn.classList.add('hidden');
  el.deleteConfirm.classList.remove('hidden');
});

el.deleteCancelBtn.addEventListener('click', () => {
  el.deleteConfirm.classList.add('hidden');
  el.deleteSubBtn.classList.remove('hidden');
});

el.deleteConfirmBtn.addEventListener('click', async () => {
  if (!editingSubscription) return;
  el.deleteConfirmBtn.disabled = true;
  try {
    const { error } = await sb.from('subscriptions').delete().eq('id', editingSubscription.id);
    if (error) throw error;
    if (editingSubscription.logo_path) {
      await sb.storage.from(STORAGE_BUCKET).remove([editingSubscription.logo_path]).catch(() => {});
    }
    state.subscriptions = state.subscriptions.filter((s) => s.id !== editingSubscription.id);
    renderAll();
    closeAddModal();
  } catch (error) {
    showAddFormError(friendlyErrorMessage(error));
    el.deleteConfirm.classList.add('hidden');
    el.deleteSubBtn.classList.remove('hidden');
  } finally {
    el.deleteConfirmBtn.disabled = false;
  }
});

// Navigation ----------------------------------------------------------------

const PAGES = ['abos', 'budgets'];
let currentPage = null;

function pageFromHash() {
  const page = location.hash.replace('#', '');
  return PAGES.includes(page) ? page : 'abos';
}

function applyRoute() {
  commitKeyboardDrag();
  currentPage = pageFromHash();
  el.navItems.forEach((item) => {
    const active = item.dataset.page === currentPage;
    item.classList.toggle('active', active);
    if (active) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
  el.pageAbos.classList.toggle('hidden', currentPage !== 'abos');
  el.pageBudgets.classList.toggle('hidden', currentPage !== 'budgets');
  el.addFab.classList.toggle('hidden', currentPage !== 'abos');
  document.documentElement.classList.toggle('is-budgets-page', currentPage === 'budgets');
  if (currentPage !== 'budgets') closeBudgetModal();
  document.title = currentPage === 'budgets' ? 'Mes budgets · Ideel-like' : 'Ideel-like';
  if (currentPage === 'budgets' && state.session) {
    if (budget.status === 'ready' && budget.userId === state.session.user.id) {
      renderBudgetPage();
    } else {
      loadBudget();
    }
  }
}

window.addEventListener('hashchange', applyRoute);

// Budgets: data & saving ------------------------------------------------------

const BUDGET_KINDS = ['income', 'investment', 'expense'];
const NBSP = '\xa0';
const BUDGET_SAVE_DELAY = 600;
const MAX_AMOUNT_CENTS = 9999999999; // numeric(10,2)

const budget = {
  status: 'idle', // idle | loading | ready | error
  userId: null,
  categories: [],
  entries: [],
  kind: loadBudgetKindPref(),
};

const bel = {
  error: document.getElementById('budget-error'),
  loading: document.getElementById('budget-loading'),
  content: document.getElementById('budget-content'),
  tabs: document.querySelectorAll('.budget-tab'),
  panel: document.getElementById('budget-panel'),
  summary: document.getElementById('budget-summary'),
};

function loadSubsListPref() {
  try {
    return localStorage.getItem('ideel-like:budget-subs-expanded') === '1';
  } catch (error) {
    return false;
  }
}

function saveSubsListPref(expanded) {
  try {
    localStorage.setItem('ideel-like:budget-subs-expanded', expanded ? '1' : '0');
  } catch (error) {
    // ignore storage access errors
  }
}

function loadBudgetKindPref() {
  try {
    const saved = localStorage.getItem('ideel-like:budget-kind');
    if (BUDGET_KINDS.includes(saved)) return saved;
  } catch (error) {
    // ignore storage access errors
  }
  return 'income';
}

function saveBudgetKindPref(kind) {
  try {
    localStorage.setItem('ideel-like:budget-kind', kind);
  } catch (error) {
    // ignore storage access errors
  }
}

function resetBudget() {
  pendingSaves.forEach((pending) => clearTimeout(pending.timer));
  pendingSaves.clear();
  writeChains.clear();
  bel.modalOverlay.classList.add('hidden');
  budget.status = 'idle';
  budget.userId = null;
  budget.categories = [];
  budget.entries = [];
}

async function loadBudget(force = false) {
  const userId = state.session.user.id;
  if (!force && budget.userId === userId && budget.status !== 'error') return;
  budget.userId = userId;
  budget.status = 'loading';
  renderBudgetPage();

  try {
    // creates the implicit income category and the "Abonnements" category on first use
    const { error: ensureError } = await sb.rpc('ensure_budget_defaults');
    if (ensureError) throw ensureError;
    const [catsRes, entriesRes] = await Promise.all([
      sb.from('budget_categories').select('*').order('position', { ascending: true }),
      sb.from('budget_entries').select('*').order('position', { ascending: true }),
    ]);
    if (catsRes.error) throw catsRes.error;
    if (entriesRes.error) throw entriesRes.error;
    if (budget.userId !== userId) return;

    budget.categories = catsRes.data;
    budget.entries = entriesRes.data;
    budget.status = 'ready';
    bel.error.classList.add('hidden');
  } catch (error) {
    if (budget.userId !== userId) return;
    budget.status = 'error';
    bel.error.textContent = friendlyErrorMessage(error);
    bel.error.classList.remove('hidden');
  }
  renderBudgetPage();
}

// Writes on the same row run one after the other (insert, then edits, then delete), so a slow
// request can't land after a newer one. Field edits are debounced and merged per row.
// waitFor lists other rows whose pending writes must land first (e.g. a new entry's category).
const writeChains = new Map();
const pendingSaves = new Map();
let budgetWritesInFlight = 0;

function queueWrite(id, task, waitFor = []) {
  budgetWritesInFlight += 1;
  const previous = Promise.all(
    [id, ...waitFor].map((key) => (writeChains.get(key) || Promise.resolve()).catch(() => {}))
  );
  const next = previous.then(task);
  writeChains.set(id, next);
  return next.catch(onBudgetWriteError).finally(() => {
    budgetWritesInFlight -= 1;
  });
}

function onBudgetWriteError() {
  showToast("Impossible d'enregistrer la modification, budgets rechargés.");
  if (state.session) loadBudget(true);
}

function scheduleSave(table, id, patch) {
  const key = `${table}:${id}`;
  const pending = pendingSaves.get(key) || { table, id, patch: {} };
  Object.assign(pending.patch, patch);
  clearTimeout(pending.timer);
  pending.timer = setTimeout(() => flushSave(key), BUDGET_SAVE_DELAY);
  pendingSaves.set(key, pending);
}

function flushSave(key) {
  const pending = pendingSaves.get(key);
  if (!pending) return;
  clearTimeout(pending.timer);
  pendingSaves.delete(key);
  queueWrite(pending.id, async () => {
    const { error } = await sb.from(pending.table).update(pending.patch).eq('id', pending.id);
    if (error) throw error;
    flashSaved(pending.table, pending.id, Object.keys(pending.patch));
  });
}

function restartAnimation(node, className) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

// Discreet confirmation once the server has accepted an autosave: a check that fades out,
// and a brief tint on the saved field(s)
function flashSaved(table, id, fields) {
  const container =
    table === 'budget_entries'
      ? bel.panel.querySelector(`.budget-row[data-id="${id}"]`)
      : bel.panel.querySelector(`.budget-card[data-category-id="${id}"] .budget-card-header`);
  if (!container) return;
  restartAnimation(container.querySelector('.save-check'), 'is-visible');
  fields.forEach((field) => restartAnimation(container.querySelector(`[data-field="${field}"]`), 'just-saved'));
}

function createSaveCheck() {
  const check = h('span', 'save-check');
  check.innerHTML = CHECK_SVG;
  check.title = 'Enregistré';
  return check;
}

function flushSavesFor(table, id) {
  flushSave(`${table}:${id}`);
}

function dropPendingSave(table, id) {
  const key = `${table}:${id}`;
  const pending = pendingSaves.get(key);
  if (pending) clearTimeout(pending.timer);
  pendingSaves.delete(key);
}

function flushAllSaves() {
  Array.from(pendingSaves.keys()).forEach(flushSave);
}

window.addEventListener('pagehide', flushAllSaves);
// leaving or reloading while writes are still queued would lose them: ask first
window.addEventListener('beforeunload', (event) => {
  flushAllSaves();
  if (budgetWritesInFlight > 0) {
    event.preventDefault();
    event.returnValue = '';
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushAllSaves();
});

function insertBudgetEntry(entry) {
  const row = {
    id: entry.id,
    category_id: entry.category_id,
    label: entry.label,
    monthly_amount: entry.monthly_amount,
    position: entry.position,
  };
  queueWrite(
    entry.id,
    async () => {
      const { error } = await sb.from('budget_entries').insert(row);
      if (error) throw error;
    },
    [entry.category_id]
  );
}

function insertBudgetCategory(category) {
  const row = {
    id: category.id,
    kind: category.kind,
    name: category.name,
    position: category.position,
  };
  queueWrite(category.id, async () => {
    const { error } = await sb.from('budget_categories').insert(row);
    if (error) throw error;
  });
}

// Budgets: helpers -----------------------------------------------------------

function categoriesOfKind(kind) {
  return budget.categories.filter((c) => c.kind === kind).sort((a, b) => a.position - b.position);
}

function entriesOf(categoryId) {
  return budget.entries.filter((e) => e.category_id === categoryId).sort((a, b) => a.position - b.position);
}

function nextPosition(items) {
  return items.length ? Math.max(...items.map((item) => item.position)) + 1 : 0;
}

function subscriptionsTotalCents() {
  return state.subscriptions.reduce((sum, sub) => sum + toCents(sub.monthly_price), 0);
}

// "Abonnements" mirrors ideel.subscriptions; other categories sum their entries
function categoryTotalCents(categoryId) {
  const category = budget.categories.find((c) => c.id === categoryId);
  if (category && category.is_auto_subscriptions) return subscriptionsTotalCents();
  return entriesOf(categoryId).reduce((sum, e) => sum + toCents(e.monthly_amount), 0);
}

// A disabled "Abonnements" category counts for nothing (only that category can be disabled)
function kindTotalCents(kind) {
  return categoriesOfKind(kind)
    .filter((c) => c.is_enabled)
    .reduce((sum, c) => sum + categoryTotalCents(c.id), 0);
}

function budgetTotals() {
  const income = kindTotalCents('income');
  const investment = kindTotalCents('investment');
  const expense = kindTotalCents('expense');
  return { income, investment, expense, available: income - expense - investment };
}

function formatPercent(ratio) {
  // typographic minus sign rather than a hyphen
  return `${Math.round(ratio * 100).toLocaleString('fr-FR').replace('-', '−')}${NBSP}%`;
}

// fr-FR groups digits with a narrow no-break space (U+202F), missing from Poppins
function formatEuros(cents) {
  return `${Math.round(cents / 100).toLocaleString('fr-FR').replace(/\s/g, NBSP)}${NBSP}€`;
}

function formatAmountInput(cents) {
  if (!cents) return '';
  return cents % 100 ? (cents / 100).toFixed(2).replace('.', ',') : String(cents / 100);
}

// Empty means 0; returns null when invalid (negative, more than 2 decimals, too large)
function parseAmountInput(raw) {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return cents > MAX_AMOUNT_CENTS ? null : cents;
}

function showActionToast(message, actionLabel, onAction) {
  el.toast.textContent = '';
  el.toast.appendChild(h('span', null, message));
  const action = h('button', 'toast-action', actionLabel);
  action.type = 'button';
  action.addEventListener('click', () => {
    clearTimeout(toastTimer);
    el.toast.classList.add('hidden');
    onAction();
  });
  el.toast.appendChild(action);
  el.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 6000);
}

// Totals, synthesis and chart are refreshed on every change, without re-rendering the inputs;
// while a line or a category is being dragged, they wait for the drop
function onBudgetChanged() {
  if (budgetDrag.active) {
    budgetDrag.changePending = true;
    return;
  }
  bel.panel.querySelectorAll('.budget-cat-total').forEach((node) => {
    node.textContent = formatEuros(categoryTotalCents(node.dataset.categoryId));
  });
  renderBudgetSummary();
  scheduleChartRender();
}

function strong(text, className) {
  return h('strong', className ? `summary-value ${className}` : 'summary-value', text);
}

function renderBudgetSummary() {
  const totals = budgetTotals();
  const parts = [];
  const text = (t) => parts.push(document.createTextNode(t));
  bel.summary.innerHTML = '';

  const empty = !totals.income && !totals.investment && !totals.expense;
  bel.summary.classList.toggle('hidden', empty);
  if (empty) return;

  // percentages make no sense without incomes: dashes instead
  const dash = '–';
  const rate = totals.income ? formatPercent(totals.investment / totals.income) : dash;
  const possible = totals.income ? formatPercent((totals.investment + totals.available) / totals.income) : dash;

  text('Ton taux d’épargne est de ');
  parts.push(strong(rate));
  text(' (taux d’épargne possible : ');
  parts.push(strong(possible));
  text('). Tu as un revenu total de ');
  parts.push(strong(formatEuros(totals.income)));
  text(', des dépenses de ');
  parts.push(strong(formatEuros(totals.expense)));
  text(' et tu investis ');
  parts.push(strong(formatEuros(totals.investment)));
  if (totals.available < 0) {
    text(' tous les mois, il te manque ');
    parts.push(strong(formatEuros(-totals.available), 'summary-negative'));
    text(' chaque mois.');
  } else {
    text(' tous les mois, il te reste ');
    parts.push(strong(formatEuros(totals.available), totals.available > 0 ? 'summary-positive' : ''));
    text(' disponible.');
  }

  const p = h('p', 'budget-summary-text');
  parts.forEach((part) => p.appendChild(part));
  bel.summary.appendChild(p);
}

// Budgets: rendering ----------------------------------------------------------

function renderBudgetPage() {
  bel.loading.classList.toggle('hidden', budget.status !== 'loading');
  bel.content.classList.toggle('hidden', budget.status !== 'ready');
  if (budget.status !== 'ready') return;
  renderBudgetTabs();
  renderBudgetPanel();
  renderBudgetSummary();
  scheduleChartRender();
}

function renderBudgetTabs() {
  bel.tabs.forEach((tab) => {
    const active = tab.dataset.kind === budget.kind;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) bel.panel.setAttribute('aria-labelledby', tab.id);
  });
}

function selectBudgetKind(kind, focusTab = false) {
  commitKeyboardDrag();
  budget.kind = kind;
  saveBudgetKindPref(kind);
  renderBudgetTabs();
  renderBudgetPanel();
  if (focusTab) document.getElementById(`budget-tab-${kind}`).focus();
}

bel.tabs.forEach((tab) => {
  tab.addEventListener('click', () => selectBudgetKind(tab.dataset.kind));
  tab.addEventListener('keydown', (event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const idx = BUDGET_KINDS.indexOf(budget.kind);
    selectBudgetKind(BUDGET_KINDS[(idx + delta + BUDGET_KINDS.length) % BUDGET_KINDS.length], true);
  });
});

function renderBudgetPanel() {
  // never rebuild the DOM under a pointer drag; done on drop instead
  if (budgetDrag.pointer) {
    budgetDrag.renderPending = true;
    return;
  }
  destroyBudgetSortables();
  bel.panel.innerHTML = '';
  if (budget.kind === 'income') {
    const income = categoriesOfKind('income')[0];
    if (income) bel.panel.appendChild(createIncomeCard(income));
    createRowSortables();
    return;
  }

  const categories = categoriesOfKind(budget.kind);
  if (!categories.some((c) => !c.is_auto_subscriptions)) {
    bel.panel.appendChild(
      h(
        'p',
        'budget-empty-hint',
        budget.kind === 'investment'
          ? 'Crée ta première catégorie d’investissement, par exemple Bourse ou Épargne.'
          : 'Crée ta première catégorie de dépenses, par exemple Logement ou Vie quotidienne.'
      )
    );
  }
  const cards = h('div', 'budget-cards');
  categories.forEach((category) => {
    cards.appendChild(
      category.is_auto_subscriptions ? createAutoSubscriptionsCard(category) : createCategoryCard(category)
    );
  });
  bel.panel.appendChild(cards);

  const addCategory = h('button', 'budget-add budget-add-category', '+ Ajouter une catégorie');
  addCategory.type = 'button';
  addCategory.addEventListener('click', () => addBudgetCategory(budget.kind));
  bel.panel.appendChild(addCategory);

  createRowSortables();
  createCategorySortable(cards);
}

function createTotalEl(categoryId) {
  const total = h('span', 'budget-cat-total', formatEuros(categoryTotalCents(categoryId)));
  total.dataset.categoryId = categoryId;
  return total;
}

function createRowsBlock(category, addLabel) {
  const fragment = document.createDocumentFragment();
  const rows = h('div', 'budget-rows is-sortable');
  rows.dataset.categoryId = category.id;
  entriesOf(category.id).forEach((entry) => rows.appendChild(createEntryRow(entry)));
  fragment.appendChild(rows);

  const add = h('button', 'budget-add', addLabel);
  add.type = 'button';
  add.dataset.addFor = category.id;
  add.addEventListener('click', () => addBudgetEntry(category));
  fragment.appendChild(add);
  return fragment;
}

function createIncomeCard(category) {
  const card = h('section', 'budget-card');
  card.dataset.categoryId = category.id;
  const header = h('header', 'budget-card-header');
  header.appendChild(h('h2', 'budget-card-title', 'Sources de revenus'));
  header.appendChild(createTotalEl(category.id));
  card.appendChild(header);
  card.appendChild(createRowsBlock(category, '+ Ajouter une source de revenu'));
  return card;
}

function createCategoryCard(category) {
  const card = h('section', 'budget-card');
  card.dataset.categoryId = category.id;

  const header = h('header', 'budget-card-header');
  header.appendChild(createCategoryHandle(category));
  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'budget-input budget-cat-name';
  name.value = category.name;
  name.maxLength = 60;
  name.dataset.field = 'name';
  name.setAttribute('aria-label', 'Nom de la catégorie');
  name.addEventListener('input', () => {
    const value = name.value.trim();
    name.classList.toggle('is-invalid', !value);
    name.setAttribute('aria-invalid', String(!value));
    if (!value) return;
    category.name = value;
    scheduleSave('budget_categories', category.id, { name: value });
    onBudgetChanged();
  });
  name.addEventListener('blur', () => {
    name.value = category.name;
    name.classList.remove('is-invalid');
    name.removeAttribute('aria-invalid');
    flushSavesFor('budget_categories', category.id);
  });
  name.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      name.blur();
    }
  });
  header.appendChild(name);
  header.appendChild(createSaveCheck());
  header.appendChild(createTotalEl(category.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'row-delete';
  deleteBtn.setAttribute('aria-label', `Supprimer la catégorie ${category.name}`);
  deleteBtn.innerHTML = TRASH_SVG;
  deleteBtn.addEventListener('click', () => toggleCategoryConfirm(card, category, true));
  header.appendChild(deleteBtn);
  card.appendChild(header);

  const confirm = h('div', 'budget-confirm hidden');
  card.appendChild(confirm);

  card.appendChild(
    createRowsBlock(category, category.kind === 'investment' ? '+ Ajouter un investissement' : '+ Ajouter une dépense')
  );
  return card;
}

// Read-only mirror of "Mes abos"; the switch excludes it from the expenses and the chart
function createAutoSubscriptionsCard(category) {
  const card = h('section', 'budget-card budget-card--auto');
  card.dataset.categoryId = category.id;
  card.classList.toggle('is-disabled', !category.is_enabled);

  const header = h('header', 'budget-card-header');
  header.appendChild(createCategoryHandle(category));
  header.appendChild(h('h2', 'budget-card-title', category.name));
  header.appendChild(createSaveCheck());
  header.appendChild(createTotalEl(category.id));

  const toggle = h('label', 'switch');
  toggle.title = 'Compter les abonnements dans les dépenses';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('role', 'switch');
  input.checked = category.is_enabled;
  input.setAttribute('aria-label', 'Compter les abonnements dans les dépenses');
  input.addEventListener('change', () => {
    category.is_enabled = input.checked;
    card.classList.toggle('is-disabled', !category.is_enabled);
    note.replaceWith((note = createAutoNote(category)));
    scheduleSave('budget_categories', category.id, { is_enabled: category.is_enabled });
    flushSavesFor('budget_categories', category.id);
    onBudgetChanged();
  });
  toggle.appendChild(input);
  toggle.appendChild(h('span', 'switch-track'));
  header.appendChild(toggle);
  card.appendChild(header);

  // the detailed list is folded by default; the choice is remembered in this browser
  const details = h('div', 'budget-auto-details');
  details.id = 'budget-auto-details';
  const listToggle = h('button', 'budget-add budget-auto-toggle');
  listToggle.type = 'button';
  listToggle.setAttribute('aria-controls', details.id);
  const applyExpanded = (expanded) => {
    details.classList.toggle('hidden', !expanded);
    listToggle.textContent = expanded ? 'Masquer la liste' : 'Voir la liste';
    listToggle.setAttribute('aria-expanded', String(expanded));
  };
  listToggle.addEventListener('click', () => {
    const expanded = details.classList.contains('hidden');
    saveSubsListPref(expanded);
    applyExpanded(expanded);
  });
  applyExpanded(loadSubsListPref());

  let note = createAutoNote(category);
  details.appendChild(note);

  const rows = h('div', 'budget-rows');
  if (state.subscriptions.length === 0) {
    rows.appendChild(h('p', 'budget-auto-empty', 'Aucun abonnement dans Mes abos pour l’instant.'));
  }
  state.subscriptions.forEach((sub) => {
    const row = h('div', 'budget-row budget-row--readonly');
    // its lines can't be dragged: an empty slot keeps them aligned with the others
    row.appendChild(h('span', 'budget-handle-spacer'));
    row.appendChild(h('span', 'budget-readonly budget-row-label', sub.name));
    const amountField = h('span', 'budget-amount-field');
    amountField.appendChild(h('span', 'budget-readonly budget-row-amount', formatAmountInput(toCents(sub.monthly_price)) || '0'));
    amountField.appendChild(h('span', 'budget-euro', '€'));
    row.appendChild(amountField);
    // keeps the amounts aligned with the editable rows (check + trash columns)
    row.appendChild(h('span', 'budget-row-spacer'));
    rows.appendChild(row);
  });
  details.appendChild(rows);
  card.appendChild(details);
  card.appendChild(listToggle);
  return card;
}

function createAutoNote(category) {
  const note = h('p', 'budget-auto-note');
  note.appendChild(document.createTextNode(category.is_enabled ? 'Synchronisé avec ' : 'Non comptés dans tes dépenses · synchronisés avec '));
  const link = document.createElement('a');
  link.href = '#abos';
  link.textContent = 'Mes abos';
  note.appendChild(link);
  return note;
}

function toggleCategoryConfirm(card, category, open) {
  const confirm = card.querySelector('.budget-confirm');
  confirm.innerHTML = '';
  confirm.classList.toggle('hidden', !open);
  if (!open) {
    card.querySelector('.budget-card-header .row-delete').focus();
    return;
  }

  const count = entriesOf(category.id).length;
  const lines = count === 0 ? '(vide)' : `et ses ${count} ligne${count === 1 ? '' : 's'}`;
  confirm.appendChild(h('p', null, `Supprimer « ${category.name} » ${lines} ?`));

  const confirmBtn = h('button', 'btn btn-danger btn-sm', 'Supprimer');
  confirmBtn.type = 'button';
  confirmBtn.addEventListener('click', () => deleteBudgetCategory(category));
  const cancelBtn = h('button', 'btn btn-ghost btn-sm', 'Annuler');
  cancelBtn.type = 'button';
  cancelBtn.addEventListener('click', () => toggleCategoryConfirm(card, category, false));
  confirm.appendChild(confirmBtn);
  confirm.appendChild(cancelBtn);
  cancelBtn.focus();
}

function createEntryRow(entry) {
  const row = h('div', 'budget-row');
  row.dataset.id = entry.id;
  const isIncome = budget.categories.some((c) => c.id === entry.category_id && c.kind === 'income');

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'drag-handle budget-handle budget-row-handle';
  handle.setAttribute('aria-label', `Déplacer ${entry.label || 'la ligne'}`);
  handle.innerHTML = GRIP_SVG;
  handle.addEventListener('keydown', (event) => onBudgetHandleKeydown(event, 'entry', entry.id));
  row.appendChild(handle);

  const label = document.createElement('input');
  label.type = 'text';
  label.className = 'budget-input budget-row-label';
  label.value = entry.label;
  label.maxLength = 80;
  label.placeholder = isIncome ? 'ex. Salaire' : 'Libellé';
  label.dataset.field = 'label';
  label.setAttribute('aria-label', 'Libellé');
  label.addEventListener('input', () => {
    entry.label = label.value;
    scheduleSave('budget_entries', entry.id, { label: entry.label });
    onBudgetChanged();
  });
  label.addEventListener('blur', () => flushSavesFor('budget_entries', entry.id));
  label.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      amount.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      label.blur();
    }
  });
  row.appendChild(label);

  const amountField = h('span', 'budget-amount-field');
  const amount = document.createElement('input');
  amount.type = 'text';
  amount.inputMode = 'decimal';
  amount.className = 'budget-input budget-row-amount';
  amount.value = formatAmountInput(toCents(entry.monthly_amount));
  amount.placeholder = '0';
  amount.dataset.field = 'monthly_amount';
  amount.setAttribute('aria-label', 'Montant mensuel en euros');
  amount.addEventListener('input', () => {
    const cents = parseAmountInput(amount.value);
    const invalid = cents === null;
    amount.classList.toggle('is-invalid', invalid);
    amount.setAttribute('aria-invalid', String(invalid));
    if (invalid) return;
    entry.monthly_amount = cents / 100;
    scheduleSave('budget_entries', entry.id, { monthly_amount: entry.monthly_amount });
    onBudgetChanged();
  });
  amount.addEventListener('blur', () => {
    // an invalid value is dropped and the last valid amount comes back
    amount.value = formatAmountInput(toCents(entry.monthly_amount));
    amount.classList.remove('is-invalid');
    amount.removeAttribute('aria-invalid');
    flushSavesFor('budget_entries', entry.id);
  });
  amount.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      amount.blur();
    }
  });
  amountField.appendChild(amount);
  amountField.appendChild(h('span', 'budget-euro', '€'));
  row.appendChild(amountField);
  row.appendChild(createSaveCheck());

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'row-delete';
  deleteBtn.setAttribute('aria-label', `Supprimer ${entry.label || 'la ligne'}`);
  deleteBtn.innerHTML = TRASH_SVG;
  deleteBtn.addEventListener('click', () => deleteBudgetEntry(entry));
  row.appendChild(deleteBtn);

  return row;
}

// Budgets: actions --------------------------------------------------------------

function focusInPanel(selector, select = false) {
  const node = bel.panel.querySelector(selector);
  if (!node) return;
  node.focus();
  if (select && node.select) node.select();
}

function addBudgetEntry(category) {
  const entry = {
    id: crypto.randomUUID(),
    category_id: category.id,
    label: '',
    monthly_amount: 0,
    position: nextPosition(entriesOf(category.id)),
  };
  budget.entries.push(entry);
  insertBudgetEntry(entry);
  renderBudgetPanel();
  onBudgetChanged();
  focusInPanel(`.budget-row[data-id="${entry.id}"] .budget-row-label`);
}

function addBudgetCategory(kind) {
  const category = {
    id: crypto.randomUUID(),
    kind,
    name: 'Nouvelle catégorie',
    position: nextPosition(categoriesOfKind(kind)),
    is_auto_subscriptions: false,
    is_enabled: true,
  };
  budget.categories.push(category);
  insertBudgetCategory(category);
  renderBudgetPanel();
  onBudgetChanged();
  focusInPanel(`.budget-card[data-category-id="${category.id}"] .budget-cat-name`, true);
}

function deleteBudgetEntry(entry) {
  dropPendingSave('budget_entries', entry.id);
  budget.entries = budget.entries.filter((e) => e.id !== entry.id);
  queueWrite(entry.id, async () => {
    const { error } = await sb.from('budget_entries').delete().eq('id', entry.id);
    if (error) throw error;
  });
  renderBudgetPanel();
  onBudgetChanged();
  focusInPanel(`[data-add-for="${entry.category_id}"]`);

  showActionToast(`« ${entry.label || 'Ligne sans libellé'} » supprimée.`, 'Annuler', () => {
    if (!budget.categories.some((c) => c.id === entry.category_id)) return;
    budget.entries.push(entry);
    insertBudgetEntry(entry);
    renderBudgetPanel();
    onBudgetChanged();
  });
}

function deleteBudgetCategory(category) {
  const entries = entriesOf(category.id);
  entries.forEach((e) => dropPendingSave('budget_entries', e.id));
  dropPendingSave('budget_categories', category.id);
  budget.entries = budget.entries.filter((e) => e.category_id !== category.id);
  budget.categories = budget.categories.filter((c) => c.id !== category.id);
  // its entries go with it (on delete cascade), once their own pending writes have landed
  queueWrite(
    category.id,
    async () => {
      const { error } = await sb.from('budget_categories').delete().eq('id', category.id);
      if (error) throw error;
    },
    entries.map((e) => e.id)
  );
  renderBudgetPanel();
  onBudgetChanged();
  focusInPanel('.budget-add-category');
}

// Budgets: drag & drop -----------------------------------------------------------

// pointer: a Sortable drag is in progress (the panel DOM must not be rebuilt)
// active: any drag, pointer or keyboard (summary and chart wait for the drop)
const budgetDrag = { pointer: false, active: false, changePending: false, renderPending: false };
let budgetSortables = [];
let kbBudgetDrag = null;

const BUDGET_SORTABLE_OPTIONS = {
  animation: 150,
  forceFallback: true,
  fallbackTolerance: 3,
  scroll: true,
  scrollSensitivity: 80,
  scrollSpeed: 15,
};

function destroyBudgetSortables() {
  budgetSortables.forEach((sortable) => sortable.destroy());
  budgetSortables = [];
}

function startPointerDrag(type) {
  budgetDrag.pointer = true;
  budgetDrag.active = true;
  bel.panel.classList.add(type === 'entry' ? 'is-dragging-row' : 'is-dragging-card');
}

function endPointerDrag(changed) {
  budgetDrag.pointer = false;
  budgetDrag.active = false;
  budgetDrag.lastEnd = Date.now();
  bel.panel.classList.remove('is-dragging-row', 'is-dragging-card');
  const recompute = changed || budgetDrag.changePending;
  const rerender = changed || budgetDrag.renderPending;
  budgetDrag.changePending = false;
  budgetDrag.renderPending = false;
  // let Sortable finish its own cleanup before the panel is rebuilt
  setTimeout(() => {
    if (rerender) renderBudgetPanel();
    if (recompute) onBudgetChanged();
  }, 0);
}

// Lines move within their category or to another category of the same kind; the read-only
// "Abonnements" list is not a Sortable, so nothing can be dropped into it nor taken out.
function createRowSortables() {
  if (!window.Sortable) return;
  bel.panel.querySelectorAll('.budget-rows.is-sortable').forEach((container) => {
    budgetSortables.push(
      Sortable.create(container, {
        ...BUDGET_SORTABLE_OPTIONS,
        group: `budget-entries-${budget.kind}`,
        handle: '.budget-row-handle',
        draggable: '.budget-row',
        ghostClass: 'budget-row--ghost',
        chosenClass: 'budget-row--dragging',
        onStart: () => startPointerDrag('entry'),
        onEnd: onRowDrop,
      })
    );
  });
}

function createCategorySortable(cards) {
  if (!window.Sortable) return;
  budgetSortables.push(
    Sortable.create(cards, {
      ...BUDGET_SORTABLE_OPTIONS,
      handle: '.budget-cat-handle',
      draggable: '.budget-card',
      ghostClass: 'budget-card--ghost',
      chosenClass: 'budget-card--dragging',
      onStart: () => startPointerDrag('category'),
      onEnd: (evt) => {
        const changed = evt.oldIndex !== evt.newIndex;
        if (changed) {
          const ids = Array.from(cards.children).map((card) => card.dataset.categoryId);
          ids.forEach((id, index) => {
            budget.categories.find((c) => c.id === id).position = index;
          });
          persistCategoryOrder(ids);
        }
        endPointerDrag(changed);
      },
    })
  );
}

function onRowDrop(evt) {
  const fromId = evt.from.dataset.categoryId;
  const toId = evt.to.dataset.categoryId;
  const changed = fromId !== toId || evt.oldIndex !== evt.newIndex;
  if (changed) {
    [evt.from, evt.to].forEach((container) => {
      container.querySelectorAll('.budget-row').forEach((row, index) => {
        const entry = budget.entries.find((e) => e.id === row.dataset.id);
        entry.category_id = container.dataset.categoryId;
        entry.position = index;
      });
    });
    persistEntryOrder(fromId === toId ? [toId] : [toId, fromId]);
  }
  endPointerDrag(changed);
}

// All order writes go through one chain (a line moved twice can't land in the wrong
// category), each after the pending writes of the rows it lists (e.g. a brand new line).
function persistEntryOrder(categoryIds) {
  categoryIds.forEach((categoryId) => {
    const ids = entriesOf(categoryId).map((e) => e.id);
    queueWrite(
      'order',
      async () => {
        const { error } = await sb.rpc('reorder_budget_entries', {
          target_category_id: categoryId,
          ordered_ids: ids,
        });
        if (error) throw error;
      },
      [categoryId, ...ids]
    );
  });
}

function persistCategoryOrder(ids) {
  queueWrite(
    'order',
    async () => {
      const { error } = await sb.rpc('reorder_budget_categories', { ordered_ids: ids });
      if (error) throw error;
    },
    ids
  );
}

function createCategoryHandle(category) {
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'drag-handle budget-handle budget-cat-handle';
  handle.setAttribute('aria-label', `Déplacer la catégorie ${category.name}`);
  handle.innerHTML = GRIP_SVG;
  handle.addEventListener('keydown', (event) => onBudgetHandleKeydown(event, 'category', category.id));
  return handle;
}

// Keyboard: Space/Enter to grab, arrows to move, Space/Enter to drop, Escape to cancel.
// A line moved past the top or the bottom of its category goes on to the neighbouring one.

function budgetAnnounce(message) {
  const announcer = document.getElementById('budget-announcer');
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

function reindex(list) {
  list.forEach((item, index) => {
    item.position = index;
  });
}

function categoryOf(categoryId) {
  return budget.categories.find((c) => c.id === categoryId);
}

function entryName(entry) {
  return entry.label.trim() || 'Ligne sans libellé';
}

function describeEntryPosition(entry) {
  const list = entriesOf(entry.category_id);
  const category = categoryOf(entry.category_id);
  return `Position ${list.indexOf(entry) + 1} sur ${list.length} dans « ${category.name} ».`;
}

function describeCategoryPosition(category) {
  const list = categoriesOfKind(category.kind);
  return `Position ${list.indexOf(category) + 1} sur ${list.length}.`;
}

function moveEntryByKeyboard(entry, delta) {
  const list = entriesOf(entry.category_id);
  const index = list.indexOf(entry);
  const target = index + delta;
  if (target >= 0 && target < list.length) {
    list.splice(index, 1);
    list.splice(target, 0, entry);
    reindex(list);
    return true;
  }
  const kind = categoryOf(entry.category_id).kind;
  const categories = categoriesOfKind(kind).filter((c) => !c.is_auto_subscriptions);
  const next = categories[categories.findIndex((c) => c.id === entry.category_id) + delta];
  if (!next) return false;
  list.splice(index, 1);
  reindex(list);
  const nextList = entriesOf(next.id);
  entry.category_id = next.id;
  if (delta < 0) {
    nextList.push(entry);
  } else {
    nextList.unshift(entry);
  }
  reindex(nextList);
  return true;
}

function moveCategoryByKeyboard(category, delta) {
  const list = categoriesOfKind(category.kind);
  const index = list.indexOf(category);
  const target = index + delta;
  if (target < 0 || target >= list.length) return false;
  list.splice(index, 1);
  list.splice(target, 0, category);
  reindex(list);
  return true;
}

function focusGrabbedHandle() {
  if (!kbBudgetDrag) return;
  const selector =
    kbBudgetDrag.type === 'entry'
      ? `.budget-row[data-id="${kbBudgetDrag.id}"] .budget-row-handle`
      : `.budget-card[data-category-id="${kbBudgetDrag.id}"] .budget-cat-handle`;
  const handle = bel.panel.querySelector(selector);
  if (!handle) return;
  handle.classList.add('is-grabbed');
  handle.focus();
}

function snapshotOrder() {
  return {
    entries: budget.entries.map((e) => [e, e.category_id, e.position]),
    categories: budget.categories.map((c) => [c, c.position]),
  };
}

function restoreOrder(snapshot) {
  snapshot.entries.forEach(([e, categoryId, position]) => {
    e.category_id = categoryId;
    e.position = position;
  });
  snapshot.categories.forEach(([c, position]) => {
    c.position = position;
  });
}

function onBudgetHandleKeydown(event, type, id) {
  const isActivate = event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter';

  if (!kbBudgetDrag) {
    if (!isActivate) return;
    event.preventDefault();
    const item = type === 'entry' ? budget.entries.find((e) => e.id === id) : categoryOf(id);
    kbBudgetDrag = { type, id, from: type === 'entry' ? item.category_id : null, snapshot: snapshotOrder() };
    budgetDrag.active = true;
    event.currentTarget.classList.add('is-grabbed');
    const name = type === 'entry' ? entryName(item) : item.name;
    budgetAnnounce(
      `${name} saisi. ${type === 'entry' ? describeEntryPosition(item) : describeCategoryPosition(item)} ` +
        'Flèches pour déplacer, Espace pour déposer, Échap pour annuler.'
    );
    return;
  }
  if (kbBudgetDrag.id !== id) return;

  if (isActivate) {
    event.preventDefault();
    commitKeyboardDrag(true);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    const { snapshot } = kbBudgetDrag;
    restoreOrder(snapshot);
    finishKeyboardDrag(id, type, false, true);
    budgetAnnounce('Déplacement annulé.');
  } else if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const delta = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1;
    if (type === 'entry') {
      const entry = budget.entries.find((e) => e.id === id);
      if (!moveEntryByKeyboard(entry, delta)) return;
      renderBudgetPanel();
      focusGrabbedHandle();
      budgetAnnounce(describeEntryPosition(entry));
    } else {
      const category = categoryOf(id);
      if (!moveCategoryByKeyboard(category, delta)) return;
      renderBudgetPanel();
      focusGrabbedHandle();
      budgetAnnounce(describeCategoryPosition(category));
    }
  }
}

// Drops a keyboard drag in place (Space, or leaving the panel, a tab or the page)
function commitKeyboardDrag(announceDrop = false) {
  if (!kbBudgetDrag) return;
  const { type, id, from, snapshot } = kbBudgetDrag;
  const changed =
    snapshot.entries.some(([e, categoryId, position]) => e.category_id !== categoryId || e.position !== position) ||
    snapshot.categories.some(([c, position]) => c.position !== position);
  if (changed && type === 'entry') {
    const entry = budget.entries.find((e) => e.id === id);
    persistEntryOrder(entry.category_id === from ? [from] : [entry.category_id, from]);
  } else if (changed) {
    persistCategoryOrder(categoriesOfKind(categoryOf(id).kind).map((c) => c.id));
  }
  if (announceDrop) {
    const item = type === 'entry' ? budget.entries.find((e) => e.id === id) : categoryOf(id);
    budgetAnnounce(
      `${type === 'entry' ? entryName(item) : item.name} déposé. ` +
        (type === 'entry' ? describeEntryPosition(item) : describeCategoryPosition(item))
    );
  }
  finishKeyboardDrag(id, type, changed, announceDrop);
}

function finishKeyboardDrag(id, type, changed, refocus) {
  kbBudgetDrag = null;
  budgetDrag.active = false;
  const recompute = changed || budgetDrag.changePending;
  budgetDrag.changePending = false;
  renderBudgetPanel();
  if (recompute) onBudgetChanged();
  const selector =
    type === 'entry'
      ? `.budget-row[data-id="${id}"] .budget-row-handle`
      : `.budget-card[data-category-id="${id}"] .budget-cat-handle`;
  const handle = bel.panel.querySelector(selector);
  if (refocus && handle) handle.focus();
}

// a click anywhere else drops the line or category where it is
document.addEventListener('pointerdown', (event) => {
  if (kbBudgetDrag && !event.target.closest('.budget-handle')) commitKeyboardDrag();
});

// Budgets: Sankey chart ---------------------------------------------------------

// Loaded on the first visit of "Mes budgets" only, so "Mes abos" doesn't pay for them
const D3_SCRIPTS = [
  {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js',
    integrity: 'sha512-vc58qvvBdrDR4etbxMdlTt4GBQk1qjvyORR2nrsPsFPyrs+/u5c3+1Ct6upOgdZoIl7eq6k3a1UPDSNAQi/32A==',
  },
  {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/d3-sankey/0.12.3/d3-sankey.min.js',
    integrity: 'sha512-KK15oKpabNDaLpWinMtNfTqy/V7pzlc2FRG174PfASes7RRx6TAsua8HJdRTKo8+BLvPBKNIkL7kXWcz5HoqqA==',
  },
];

const SANKEY_COLORS = {
  income: '#A9CBEF',
  budget: '#8DB8E8',
  investment: '#C8B6EC',
  available: '#D5DBE3',
  deficit: '#F4B4B4',
};
// peach, pink, sea green, blue, lilac, then lighter variants
const SANKEY_EXPENSE_COLORS = ['#FFCBA6', '#F7B8CF', '#A8E2CF', '#B7D3F4', '#E3C7F0', '#FFE0C2', '#FAD3E2', '#CBEFE3'];

const CHART_MIN_WIDTH = 760;
const PILL_HEIGHT = 22;
const PILL_PADDING_X = 8;
const LABEL_MAX_CHARS = 26;
const CHART_EMPTY_TEXT =
  'Saisis tes revenus, tes investissements et tes dépenses dans les paramètres du budget : ' +
  'ta synthèse et ton diagramme des flux apparaîtront ici.';

Object.assign(bel, {
  chart: document.getElementById('budget-chart'),
  chartEmpty: document.getElementById('budget-chart-empty'),
  chartEmptyText: document.getElementById('budget-chart-empty-text'),
  chartEmptyBtn: document.getElementById('budget-empty-settings-btn'),
  settingsBtn: document.getElementById('budget-settings-btn'),
  modalOverlay: document.getElementById('budget-modal-overlay'),
  modal: document.querySelector('#budget-modal-overlay .modal'),
  modalClose: document.getElementById('budget-modal-close'),
  chartScroll: document.getElementById('budget-chart-scroll'),
  chartCanvas: document.getElementById('budget-chart-canvas'),
  chartTooltip: document.getElementById('budget-chart-tooltip'),
});

let d3Promise = null;
let chartFrame = null;
let measureCtx = null;

function loadScript({ src, integrity }) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Échec du chargement de ${src}`));
    document.head.appendChild(script);
  });
}

function loadD3() {
  if (window.d3 && window.d3.sankey) return Promise.resolve();
  if (!d3Promise) {
    // d3-sankey's UMD build extends the global d3, so it must come second
    d3Promise = D3_SCRIPTS.reduce((chain, script) => chain.then(() => loadScript(script)), Promise.resolve())
      .then(() => document.fonts.ready)
      .catch((error) => {
        d3Promise = null;
        throw error;
      });
  }
  return d3Promise;
}

function scheduleChartRender() {
  if (chartFrame) return;
  chartFrame = requestAnimationFrame(() => {
    chartFrame = null;
    renderBudgetChart();
  });
}

if (window.ResizeObserver) {
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width && width !== lastWidth) {
      lastWidth = width;
      scheduleChartRender();
    }
  }).observe(bel.chart);
}

function positiveEntries(categoryId) {
  return entriesOf(categoryId).filter((e) => toCents(e.monthly_amount) > 0);
}

// incomes → Budget → investments / expense categories / available → lines.
// A disabled "Abonnements" category is left out, and when spending exceeds incomes an
// "À financer" source makes up the difference so that the flows stay balanced.
function buildSankeyData() {
  const totals = budgetTotals();
  const nodes = [];
  const links = [];
  const addNode = (id, label, amount, color, depth) => nodes.push({ id, label, amount, color, col: depth });
  const addLink = (source, target, value) => links.push({ source, target, value });
  const entryLabel = (e) => e.label.trim() || 'Sans libellé';

  categoriesOfKind('income').forEach((category) => {
    positiveEntries(category.id).forEach((e) => {
      addNode(`e:${e.id}`, entryLabel(e), toCents(e.monthly_amount), SANKEY_COLORS.income, 0);
      addLink(`e:${e.id}`, 'budget', toCents(e.monthly_amount));
    });
  });
  if (totals.available < 0) {
    addNode('deficit', 'À financer', -totals.available, SANKEY_COLORS.deficit, 0);
    addLink('deficit', 'budget', -totals.available);
  }
  addNode('budget', 'Budget', totals.income, SANKEY_COLORS.budget, 1);

  if (totals.investment > 0) {
    addNode('investments', 'Investissements mensuels', totals.investment, SANKEY_COLORS.investment, 2);
    addLink('budget', 'investments', totals.investment);
    categoriesOfKind('investment').forEach((category) => {
      positiveEntries(category.id).forEach((e) => {
        addNode(`e:${e.id}`, entryLabel(e), toCents(e.monthly_amount), SANKEY_COLORS.investment, 3);
        addLink('investments', `e:${e.id}`, toCents(e.monthly_amount));
      });
    });
  }

  categoriesOfKind('expense')
    .filter((category) => category.is_enabled && categoryTotalCents(category.id) > 0)
    .forEach((category, index) => {
      const color = SANKEY_EXPENSE_COLORS[index % SANKEY_EXPENSE_COLORS.length];
      addNode(`c:${category.id}`, category.name, categoryTotalCents(category.id), color, 2);
      addLink('budget', `c:${category.id}`, categoryTotalCents(category.id));
      // "Abonnements" stays a single flow
      if (category.is_auto_subscriptions) return;
      positiveEntries(category.id).forEach((e) => {
        addNode(`e:${e.id}`, entryLabel(e), toCents(e.monthly_amount), color, 3);
        addLink(`c:${category.id}`, `e:${e.id}`, toCents(e.monthly_amount));
      });
    });

  if (totals.available > 0) {
    addNode('available', 'Disponible', totals.available, SANKEY_COLORS.available, 2);
    addLink('budget', 'available', totals.available);
  }

  return { nodes, links, totals };
}

function truncateLabel(text) {
  return text.length > LABEL_MAX_CHARS ? `${text.slice(0, LABEL_MAX_CHARS - 1).trimEnd()}…` : text;
}

function measureText(text, weight) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${weight} 12px Poppins, sans-serif`;
  return measureCtx.measureText(text).width;
}

function labelParts(node) {
  const labelName = `${truncateLabel(node.label)} : `;
  const labelAmount = formatEuros(node.amount);
  const labelWidth = measureText(labelName, 500) + measureText(labelAmount, 700) + PILL_PADDING_X * 2;
  return { labelName, labelAmount, labelWidth };
}

async function renderBudgetChart() {
  if (budget.status !== 'ready' || currentPage !== 'budgets') return;
  const data = buildSankeyData();
  const hasData = data.links.some((l) => l.value > 0);
  bel.chartEmptyText.textContent = CHART_EMPTY_TEXT;
  bel.chartEmptyBtn.classList.remove('hidden');
  bel.chartEmpty.classList.toggle('hidden', hasData);
  bel.chartScroll.classList.toggle('hidden', !hasData);
  hideChartTooltip();
  if (!hasData) {
    bel.chart.classList.remove('is-scrollable');
    bel.chartCanvas.innerHTML = '';
    return;
  }

  try {
    await loadD3();
  } catch (error) {
    bel.chartEmptyText.textContent = 'Impossible de charger le diagramme, réessaie un peu plus tard.';
    bel.chartEmptyBtn.classList.add('hidden');
    bel.chartEmpty.classList.remove('hidden');
    bel.chartScroll.classList.add('hidden');
    return;
  }
  if (budget.status !== 'ready' || currentPage !== 'budgets' || !bel.chartScroll.clientWidth) return;
  // rebuilt: the data may have changed while d3 was loading
  drawSankey(buildSankeyData());
}

function drawSankey({ nodes, links, totals }) {
  const d3 = window.d3;
  nodes.forEach((node) => Object.assign(node, labelParts(node)));

  // Labels: first column on the left of its nodes, last column on the right, middle columns
  // centred on theirs. Columns are spaced so that neighbouring labels never meet horizontally.
  const lastCol = Math.max(...nodes.map((n) => n.col));
  const maxWidth = (col) => Math.max(0, ...nodes.filter((n) => n.col === col).map((n) => n.labelWidth));
  const half = (col) => (col === 0 || col === lastCol ? 0 : maxWidth(col) / 2);
  let spacing = 150;
  for (let col = 0; col < lastCol; col += 1) {
    spacing = Math.max(spacing, half(col) + half(col + 1) + 24);
  }
  const left = maxWidth(0) + 10;
  const right = maxWidth(lastCol) + 10;
  const width = Math.max(CHART_MIN_WIDTH, bel.chartScroll.clientWidth, left + right + spacing * lastCol);
  const maxPerColumn = Math.max(...d3.rollup(nodes, (v) => v.length, (n) => n.col).values());
  // with a reasonable number of lines, spacing the nodes by a label's height shows every label;
  // beyond that the chart stays compact and the thinnest flows' labels wait for a hover
  const nodePadding = maxPerColumn <= 16 ? PILL_HEIGHT + 6 : 12;
  const height = Math.max(260, maxPerColumn * (nodePadding + 10) + 140);

  const graph = d3
    .sankey()
    .nodeId((d) => d.id)
    .nodeAlign(d3.sankeyLeft)
    // nodes and links keep the order of the panels (input order), no automatic sorting
    .nodeSort(null)
    .linkSort(null)
    .nodeWidth(10)
    .nodePadding(nodePadding)
    .extent([
      [left, 10],
      [width - right, height - 10],
    ])({ nodes, links: links.map((l) => ({ ...l })) });

  const percentOfIncome = (value) => (totals.income ? ` · ${formatPercent(value / totals.income)} des revenus` : '');
  const linkColor = (l) => (l.target.id === 'budget' ? l.source.color : l.source.id === 'budget' ? l.target.color : l.source.color);
  const linkText = (l) => `${l.source.label} → ${l.target.label} : ${formatEuros(l.value)}${percentOfIncome(l.value)}`;

  const svg = d3
    .create('svg')
    .attr('class', 'sankey')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr(
      'aria-label',
      `Flux mensuels : ${formatEuros(totals.income)} de revenus, ${formatEuros(totals.expense)} de dépenses, ` +
        `${formatEuros(totals.investment)} investis.`
    );

  const linkSel = svg
    .append('g')
    .attr('fill', 'none')
    .selectAll('path')
    .data(graph.links)
    .join('path')
    .attr('class', 'sankey-link')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke', linkColor)
    .attr('stroke-width', (l) => Math.max(1.5, l.width))
    .attr('tabindex', 0)
    .attr('aria-label', linkText);

  const nodeSel = svg
    .append('g')
    .selectAll('rect')
    .data(graph.nodes)
    .join('rect')
    .attr('class', 'sankey-node')
    .attr('x', (n) => n.x0)
    .attr('y', (n) => n.y0)
    .attr('width', (n) => n.x1 - n.x0)
    .attr('height', (n) => Math.max(1, n.y1 - n.y0))
    .attr('rx', 2)
    .attr('fill', (n) => d3.color(n.color).darker(0.4));

  const labelSel = svg
    .append('g')
    .selectAll('g')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'sankey-label')
    .attr('transform', (n) => {
      const cy = (n.y0 + n.y1) / 2 - PILL_HEIGHT / 2;
      if (n.depth === 0) return `translate(${n.x0 - 6 - n.labelWidth},${cy})`;
      if (n.depth === lastCol) return `translate(${n.x1 + 6},${cy})`;
      return `translate(${(n.x0 + n.x1) / 2 - n.labelWidth / 2},${cy})`;
    });
  labelSel
    .append('rect')
    .attr('class', 'sankey-pill')
    .attr('width', (n) => n.labelWidth)
    .attr('height', PILL_HEIGHT)
    .attr('rx', PILL_HEIGHT / 2);
  const text = labelSel
    .append('text')
    .attr('x', PILL_PADDING_X)
    .attr('y', PILL_HEIGHT / 2)
    .attr('dy', '0.35em');
  text.append('tspan').text((n) => n.labelName);
  text.append('tspan').attr('class', 'sankey-amount').text((n) => n.labelAmount);

  // Vertical collisions, column by column: the biggest flows keep their label, the others
  // only show on hover
  d3.group(graph.nodes, (n) => n.depth).forEach((columnNodes) => {
    const kept = [];
    [...columnNodes]
      .sort((a, b) => b.value - a.value)
      .forEach((n) => {
        const cy = (n.y0 + n.y1) / 2;
        n.labelHidden = kept.some((y) => Math.abs(y - cy) < PILL_HEIGHT + 2);
        if (!n.labelHidden) kept.push(cy);
      });
  });
  labelSel.classed('is-hidden', (n) => n.labelHidden);

  function highlight(activeLinks, activeNodes) {
    svg.classed('has-highlight', true);
    linkSel.classed('is-active', (l) => activeLinks.includes(l));
    labelSel.classed('is-revealed', (n) => activeNodes.includes(n));
    labelSel.filter((n) => activeNodes.includes(n)).raise();
  }

  function clear() {
    svg.classed('has-highlight', false);
    linkSel.classed('is-active', false);
    labelSel.classed('is-revealed', false);
    hideChartTooltip();
  }

  linkSel
    .on('pointerenter', (event, l) => {
      highlight([l], [l.source, l.target]);
      showChartTooltip(linkText(l), event);
    })
    .on('pointermove', (event, l) => showChartTooltip(linkText(l), event))
    .on('pointerleave', (event) => {
      // a tap keeps the tooltip until the next tap elsewhere
      if (event.pointerType !== 'touch') clear();
    })
    .on('focus', (event, l) => {
      highlight([l], [l.source, l.target]);
      showChartTooltip(linkText(l), null, (l.source.x1 + l.target.x0) / 2, (l.y0 + l.y1) / 2);
    })
    .on('blur', clear);

  const nodeHover = (event, n) => {
    const connected = [...n.sourceLinks, ...n.targetLinks];
    highlight(connected, [n]);
    showChartTooltip(`${n.label} : ${formatEuros(n.amount)}${percentOfIncome(n.amount)}`, event);
  };
  nodeSel.on('pointerenter', nodeHover).on('pointermove', nodeHover).on('pointerleave', (event) => {
    if (event.pointerType !== 'touch') clear();
  });
  labelSel.on('pointerenter', nodeHover).on('pointerleave', (event) => {
    if (event.pointerType !== 'touch') clear();
  });
  svg.on('pointerdown', (event) => {
    if (event.target === svg.node()) clear();
  });

  bel.chartCanvas.innerHTML = '';
  bel.chartCanvas.appendChild(svg.node());
  bel.chart.classList.toggle('is-scrollable', bel.chartScroll.scrollWidth > bel.chartScroll.clientWidth + 1);
}

// Budgets: settings modal -----------------------------------------------------------

const toastHome = { parent: el.toast.parentNode, next: el.toast.nextSibling };
let budgetOverlayPointerDown = false;

function openBudgetModal() {
  if (budget.status !== 'ready') return;
  renderBudgetTabs();
  renderBudgetPanel();
  // the undo toast must stay reachable from inside the dialog
  bel.modal.appendChild(el.toast);
  openModal(bel.modalOverlay, bel.modal);
}

function closeBudgetModal() {
  if (bel.modalOverlay.classList.contains('hidden')) return;
  commitKeyboardDrag();
  if (bel.modal.contains(document.activeElement)) document.activeElement.blur();
  flushAllSaves();
  toastHome.parent.insertBefore(el.toast, toastHome.next);
  closeModalGeneric(bel.modalOverlay);
}

bel.settingsBtn.addEventListener('click', openBudgetModal);
bel.chartEmptyBtn.addEventListener('click', openBudgetModal);
bel.modalClose.addEventListener('click', closeBudgetModal);

bel.modalOverlay.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') trapTabKey(bel.modal, event);
});

// only a click that starts and ends on the backdrop closes it (not the end of a drag
// or of a text selection that wandered outside the dialog)
bel.modalOverlay.addEventListener('pointerdown', (event) => {
  budgetOverlayPointerDown = event.target === bel.modalOverlay;
});
bel.modalOverlay.addEventListener('click', (event) => {
  if (event.target === bel.modalOverlay && budgetOverlayPointerDown) closeBudgetModal();
});

// fields and keyboard drags handle their own Escape first (preventDefault)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !event.defaultPrevented && !bel.modalOverlay.classList.contains('hidden')) {
    closeBudgetModal();
  }
});

function showChartTooltip(text, event, x, y) {
  const box = bel.chartScroll.getBoundingClientRect();
  const px = event ? event.clientX - box.left + bel.chartScroll.scrollLeft : x;
  const py = event ? event.clientY - box.top : y;
  bel.chartTooltip.textContent = text;
  bel.chartTooltip.classList.remove('hidden');
  const tipWidth = bel.chartTooltip.offsetWidth;
  const maxLeft = bel.chartScroll.scrollLeft + bel.chartScroll.clientWidth - tipWidth - 8;
  bel.chartTooltip.style.left = `${Math.max(bel.chartScroll.scrollLeft + 8, Math.min(px + 14, maxLeft))}px`;
  bel.chartTooltip.style.top = `${Math.max(4, py + 14)}px`;
}

function hideChartTooltip() {
  bel.chartTooltip.classList.add('hidden');
}

init();
