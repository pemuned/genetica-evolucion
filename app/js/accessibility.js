'use strict';

const STORAGE_KEY = 'a11y-settings-v1';
const FONT_STEP = 0.1;
const FONT_MIN = 0.85;
const FONT_MAX = 1.35;
const BASE_FONT_SIZE = 16;

const defaultSettings = {
  fontScale: 1,
  highContrast: false,
};

let settings = { ...defaultSettings };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    settings = {
      ...defaultSettings,
      ...parsed,
      fontScale: clamp(Number(parsed.fontScale || 1), FONT_MIN, FONT_MAX),
    };
  } catch {
    settings = { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function updatePressedStates() {
  const contrastBtn = document.querySelector('[data-a11y-action="toggle-contrast"]');

  if (contrastBtn) contrastBtn.setAttribute('aria-pressed', String(settings.highContrast));
}

function announceStatus(message) {
  const statusEl = document.getElementById('a11y-status');
  if (!statusEl) return;
  statusEl.textContent = message;
}

function applySettings({ announce = false, message = '' } = {}) {
  document.documentElement.style.fontSize = `${BASE_FONT_SIZE * settings.fontScale}px`;
  document.body.classList.toggle('a11y-high-contrast', settings.highContrast);
  document.body.classList.remove('a11y-reduce-motion');
  updatePressedStates();

  if (announce && message) announceStatus(message);
}

function increaseFont() {
  settings.fontScale = clamp(settings.fontScale + FONT_STEP, FONT_MIN, FONT_MAX);
  applySettings({ announce: true, message: `Tamanio de letra ${Math.round(settings.fontScale * 100)} por ciento.` });
}

function decreaseFont() {
  settings.fontScale = clamp(settings.fontScale - FONT_STEP, FONT_MIN, FONT_MAX);
  applySettings({ announce: true, message: `Tamanio de letra ${Math.round(settings.fontScale * 100)} por ciento.` });
}

function toggleContrast() {
  settings.highContrast = !settings.highContrast;
  applySettings({ announce: true, message: settings.highContrast ? 'Alto contraste activado.' : 'Alto contraste desactivado.' });
}

function resetAccessibility() {
  settings = { ...defaultSettings };
  applySettings({ announce: true, message: 'Ajustes de accesibilidad restablecidos.' });
}

function handleAction(action) {
  switch (action) {
    case 'increase-font':
      increaseFont();
      break;
    case 'decrease-font':
      decreaseFont();
      break;
    case 'toggle-contrast':
      toggleContrast();
      break;
    case 'reset':
      resetAccessibility();
      break;
    default:
      return;
  }

  saveSettings();
}

function registerButtonEvents() {
  const toolbar = document.querySelector('.a11y-toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', (event) => {
    const target = event.target.closest('[data-a11y-action]');
    if (!target) return;
    handleAction(target.dataset.a11yAction);
  });
}

function registerKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (!event.altKey) return;

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      handleAction('increase-font');
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      handleAction('decrease-font');
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'c') {
      event.preventDefault();
      handleAction('toggle-contrast');
    } else if (key === '0') {
      event.preventDefault();
      handleAction('reset');
    }
  });
}

function initAccessibility() {
  loadSettings();
  applySettings();
  registerButtonEvents();
  registerKeyboardShortcuts();
}

document.addEventListener('DOMContentLoaded', initAccessibility);
