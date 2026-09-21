const SUPABASE_URL = 'https://kbrybzkdmcsokhfmnfzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticnliemtkbWNzb2toZm1uZnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODE1OTgsImV4cCI6MjEwNTU1NzU5OH0.RFB_BhuogBMNaO4XvIKjveyTxjAPxhqcozOimEUw7uo';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
}

function showAppShell(session) {
  el.loading.classList.add('hidden');
  el.authScreen.classList.add('hidden');
  el.appShell.classList.remove('hidden');
  el.userEmail.textContent = session.user.email;
  state.session = session;
  loadData();
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
  return sb.storage.from('images').getPublicUrl(path).data.publicUrl;
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
        .from('images')
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
      await sb.storage.from('images').remove([previousIconPath]).catch(() => {});
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
      await sb.storage.from('images').remove([method.icon_path]).catch(() => {});
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
        .from('images')
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
        await sb.storage.from('images').remove([previousLogoPath]).catch(() => {});
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
      await sb.storage.from('images').remove([editingSubscription.logo_path]).catch(() => {});
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

init();
