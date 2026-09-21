const SUPABASE_URL = 'https://kbrybzkdmcsokhfmnfzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticnliemtkbWNzb2toZm1uZnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODE1OTgsImV4cCI6MjEwNTU1NzU5OH0.RFB_BhuogBMNaO4XvIKjveyTxjAPxhqcozOimEUw7uo';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  session: null,
  cards: [],
  subscriptions: [],
};

let selectedCardId = null;
let addLogoBlob = null;
let addLogoType = null;
let newCardIconBlob = null;
let newCardIconType = null;
let lastFocusedElement = null;

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

  addFab: document.getElementById('add-fab'),
  addModalOverlay: document.getElementById('add-modal-overlay'),
  addModal: document.querySelector('#add-modal-overlay .modal'),
  addModalClose: document.getElementById('add-modal-close'),
  addForm: document.getElementById('add-form'),
  addName: document.getElementById('add-name'),
  addLogoDropzone: document.getElementById('add-logo-dropzone'),
  addLogoInput: document.getElementById('add-logo-input'),
  addLogoPreview: document.getElementById('add-logo-preview'),
  addPrice: document.getElementById('add-price'),
  addFormError: document.getElementById('add-form-error'),
  addSubmitBtn: document.getElementById('add-submit-btn'),

  addCardChip: document.getElementById('add-card-chip'),
  addCardChipIcon: document.getElementById('add-card-chip-icon'),
  addCardChipLabel: document.getElementById('add-card-chip-label'),
  addCardChipRemove: document.getElementById('add-card-chip-remove'),
  addCardInputWrap: document.getElementById('add-card-input-wrap'),
  addCardInput: document.getElementById('add-card-input'),
  addCardSuggestions: document.getElementById('add-card-suggestions'),

  newCardForm: document.getElementById('new-card-form'),
  newCardLabel: document.getElementById('new-card-label'),
  newCardDropzone: document.getElementById('new-card-dropzone'),
  newCardIconInput: document.getElementById('new-card-icon-input'),
  newCardIconPreview: document.getElementById('new-card-icon-preview'),
  newCardError: document.getElementById('new-card-error'),
  newCardConfirm: document.getElementById('new-card-confirm'),
  newCardCancel: document.getElementById('new-card-cancel'),
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
  state.cards = [];
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
    const [cardsRes, subsRes] = await Promise.all([
      sb.from('payment_cards').select('*').order('created_at', { ascending: true }),
      sb.from('subscriptions').select('*').order('created_at', { ascending: true }),
    ]);
    if (cardsRes.error) throw cardsRes.error;
    if (subsRes.error) throw subsRes.error;

    state.cards = cardsRes.data;
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

function formatPriceParts(price) {
  const cents = toCents(price);
  const intPart = Math.floor(cents / 100);
  const centsPart = String(cents % 100).padStart(2, '0');
  return {
    intPart: intPart.toLocaleString('fr-FR'),
    rest: `,${centsPart}€/mois`,
  };
}

function formatEuroFromCents(cents) {
  const intPart = Math.floor(cents / 100);
  const centsPart = String(cents % 100).padStart(2, '0');
  return `${intPart.toLocaleString('fr-FR')},${centsPart}€/mois`;
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

// Rendering -------------------------------------------------------------

function renderAll() {
  renderHeaderStats();
  renderSubscriptions();
}

function renderHeaderStats() {
  const count = state.subscriptions.length;
  el.subscriptionsCount.textContent = `${count} abonnement${count === 1 ? '' : 's'}`;

  const totalCents = state.subscriptions.reduce((sum, sub) => sum + toCents(sub.monthly_price), 0);
  el.subscriptionsTotal.textContent = formatEuroFromCents(totalCents);
}

function createCardPill(card) {
  const pill = h('span', 'card-pill');
  const iconWrap = h('span', 'card-pill-icon');
  if (card.icon_path) {
    const img = document.createElement('img');
    img.src = getPublicUrl(card.icon_path);
    img.alt = '';
    iconWrap.appendChild(img);
  } else {
    iconWrap.textContent = (card.label[0] || '?').toUpperCase();
  }
  pill.appendChild(iconWrap);
  pill.appendChild(h('span', '', card.label));
  return pill;
}

function createSubscriptionCard(sub) {
  const card = h('article', 'sub-card');
  card.dataset.id = sub.id;

  const logoBox = h('div', 'sub-logo-box');
  if (sub.logo_path) {
    const img = document.createElement('img');
    img.className = 'sub-logo-img';
    img.alt = '';
    img.src = getPublicUrl(sub.logo_path);
    logoBox.appendChild(img);
  } else {
    logoBox.appendChild(h('div', 'sub-logo-initials', initials(sub.name)));
  }
  card.appendChild(logoBox);

  const body = h('div', 'sub-body');
  body.appendChild(h('h3', 'sub-name', sub.name));

  const linkedCard = state.cards.find((c) => c.id === sub.payment_card_id);
  if (linkedCard) {
    body.appendChild(createCardPill(linkedCard));
  }

  const footer = h('div', 'sub-footer');
  const priceEl = h('p', 'sub-price');
  const parts = formatPriceParts(sub.monthly_price);
  priceEl.appendChild(h('span', 'price-int', parts.intPart));
  priceEl.appendChild(h('span', 'price-cents', parts.rest));
  footer.appendChild(priceEl);

  const viewLink = document.createElement('a');
  viewLink.href = '#';
  viewLink.className = 'sub-view';
  viewLink.textContent = 'Voir >';
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

// Add form: image handling ------------------------------------------------

function extForType(type) {
  return IMAGE_EXT_BY_TYPE[type] || 'png';
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
    onProcessed(blob, file.type);
  }
}

setupDropzone(el.addLogoDropzone, el.addLogoInput, el.addLogoPreview, 400, (blob, type) => {
  addLogoBlob = blob;
  addLogoType = type;
});

setupDropzone(el.newCardDropzone, el.newCardIconInput, el.newCardIconPreview, 64, (blob, type) => {
  newCardIconBlob = blob;
  newCardIconType = type;
});

// Add form: card tag field ------------------------------------------------

function hasCardNumberLikeDigits(text) {
  return (text.match(/\d/g) || []).length >= 12;
}

function renderCardSuggestions(query) {
  const q = query.trim().toLowerCase();
  el.addCardSuggestions.innerHTML = '';
  if (!q) {
    el.addCardSuggestions.classList.add('hidden');
    return;
  }
  const matches = state.cards.filter((c) => c.label.toLowerCase().includes(q));
  if (matches.length === 0) {
    el.addCardSuggestions.classList.add('hidden');
    return;
  }
  matches.forEach((card) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    const iconWrap = h('span', 'card-pill-icon');
    if (card.icon_path) {
      const img = document.createElement('img');
      img.src = getPublicUrl(card.icon_path);
      img.alt = '';
      iconWrap.appendChild(img);
    } else {
      iconWrap.textContent = (card.label[0] || '?').toUpperCase();
    }
    li.appendChild(iconWrap);
    li.appendChild(h('span', '', card.label));
    li.addEventListener('click', () => selectCard(card));
    el.addCardSuggestions.appendChild(li);
  });
  el.addCardSuggestions.classList.remove('hidden');
}

function selectCard(card) {
  selectedCardId = card.id;
  el.addCardInputWrap.classList.add('hidden');
  el.addCardSuggestions.classList.add('hidden');
  el.addCardInput.value = '';
  el.addCardChip.classList.remove('hidden');
  el.addCardChipLabel.textContent = card.label;
  el.addCardChipIcon.innerHTML = '';
  if (card.icon_path) {
    const img = document.createElement('img');
    img.src = getPublicUrl(card.icon_path);
    img.alt = '';
    el.addCardChipIcon.appendChild(img);
  } else {
    el.addCardChipIcon.textContent = (card.label[0] || '?').toUpperCase();
  }
}

function clearSelectedCard() {
  selectedCardId = null;
  el.addCardChip.classList.add('hidden');
  el.addCardChipIcon.innerHTML = '';
  el.addCardInputWrap.classList.remove('hidden');
  el.addCardInput.value = '';
}

el.addCardChipRemove.addEventListener('click', clearSelectedCard);

el.addCardInput.addEventListener('input', () => renderCardSuggestions(el.addCardInput.value));

el.addCardInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const value = el.addCardInput.value.trim();
    if (!value) return;
    const exact = state.cards.find((c) => c.label.toLowerCase() === value.toLowerCase());
    if (exact) {
      selectCard(exact);
      return;
    }
    openNewCardForm(value);
  } else if (event.key === 'Escape') {
    el.addCardSuggestions.classList.add('hidden');
  }
});

document.addEventListener('click', (event) => {
  if (event.target !== el.addCardInput && !el.addCardSuggestions.contains(event.target)) {
    el.addCardSuggestions.classList.add('hidden');
  }
});

function showNewCardError(message) {
  el.newCardError.textContent = message;
  el.newCardError.classList.remove('hidden');
}

function openNewCardForm(label) {
  el.addCardInputWrap.classList.add('hidden');
  el.addCardSuggestions.classList.add('hidden');
  el.newCardForm.classList.remove('hidden');
  el.newCardLabel.value = label;
  el.newCardError.classList.add('hidden');
  newCardIconBlob = null;
  newCardIconType = null;
  el.newCardIconPreview.classList.add('hidden');
  el.newCardIconPreview.src = '';
  el.newCardLabel.focus();
}

function closeNewCardForm() {
  el.newCardForm.classList.add('hidden');
  el.addCardInputWrap.classList.remove('hidden');
  el.addCardInput.value = '';
}

el.newCardCancel.addEventListener('click', closeNewCardForm);

el.newCardConfirm.addEventListener('click', async () => {
  const label = el.newCardLabel.value.trim();
  el.newCardError.classList.add('hidden');

  if (!label) return showNewCardError('Le libellé est obligatoire.');
  if (label.length > 40) return showNewCardError('40 caractères maximum.');
  if (hasCardNumberLikeDigits(label)) {
    return showNewCardError('Un libellé seulement, jamais le numéro de carte.');
  }
  if (state.cards.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
    return showNewCardError('Une CB avec ce libellé existe déjà.');
  }

  el.newCardConfirm.disabled = true;
  try {
    let iconPath = null;
    if (newCardIconBlob) {
      iconPath = `${state.session.user.id}/cards/${crypto.randomUUID()}.${extForType(newCardIconType)}`;
      const { error: uploadError } = await sb.storage
        .from('images')
        .upload(iconPath, newCardIconBlob, { contentType: newCardIconType });
      if (uploadError) throw uploadError;
    }

    const { data, error } = await sb
      .from('payment_cards')
      .insert({ id: crypto.randomUUID(), label, icon_path: iconPath })
      .select()
      .single();
    if (error) throw error;

    state.cards.push(data);
    closeNewCardForm();
    selectCard(data);
  } catch (error) {
    showNewCardError(friendlyErrorMessage(error));
  } finally {
    el.newCardConfirm.disabled = false;
  }
});

// Add form: submit --------------------------------------------------------

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

function resetAddForm() {
  el.addForm.reset();
  addLogoBlob = null;
  addLogoType = null;
  el.addLogoPreview.classList.add('hidden');
  el.addLogoPreview.src = '';
  clearSelectedCard();
  closeNewCardForm();
  hideAddFormError();
}

function openAddModal() {
  resetAddForm();
  openModal(el.addModalOverlay, el.addModal);
}

function closeAddModal() {
  closeModalGeneric(el.addModalOverlay);
}

el.addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAddFormError();

  const name = el.addName.value.trim();
  if (!name) return showAddFormError('Le nom est obligatoire.');
  if (name.length > 60) return showAddFormError('60 caractères maximum.');

  const priceValue = parsePriceInput(el.addPrice.value);
  if (priceValue === null) {
    return showAddFormError('Le prix doit être un nombre supérieur à 0 (2 décimales max).');
  }

  el.addSubmitBtn.disabled = true;
  try {
    let logoPath = null;
    if (addLogoBlob) {
      logoPath = `${state.session.user.id}/logos/${crypto.randomUUID()}.${extForType(addLogoType)}`;
      const { error: uploadError } = await sb.storage
        .from('images')
        .upload(logoPath, addLogoBlob, { contentType: addLogoType });
      if (uploadError) throw uploadError;
    }

    const { data, error } = await sb
      .from('subscriptions')
      .insert({
        id: crypto.randomUUID(),
        name,
        monthly_price: priceValue,
        logo_path: logoPath,
        payment_card_id: selectedCardId,
      })
      .select()
      .single();
    if (error) throw error;

    state.subscriptions.push(data);
    renderAll();
    closeAddModal();
  } catch (error) {
    showAddFormError(friendlyErrorMessage(error));
  } finally {
    el.addSubmitBtn.disabled = false;
  }
});

init();
