"use strict";

const STORAGE_KEY = "a11y-settings-v1";
const FONT_STEP = 0.1;
const FONT_MIN = 0.85;
const FONT_MAX = 1.35;
const BASE_FONT_SIZE = 16;

const defaultSettings = {
  fontScale: 1,
  highContrast: false,
};

let settings = { ...defaultSettings };

function buildToolbarMarkup() {
  return `
    <section class="a11y-toolbar" aria-label="Barra de accesibilidad">
      <button class="a11y-btn" type="button" data-a11y-action="decrease-font" aria-label="Disminuir tamaño de letra"
        title="Texto más pequeño (Alt+-)">
        <span aria-hidden="true">A-</span>
      </button>
      <button class="a11y-btn" type="button" data-a11y-action="increase-font" aria-label="Aumentar tamaño de letra"
        title="Texto más grande (Alt++)">
        <span aria-hidden="true">A+</span>
      </button>
      <button class="a11y-btn" type="button" data-a11y-action="toggle-contrast" aria-pressed="false"
        aria-label="Activar alto contraste" title="Alto contraste (Alt+C)">
        <svg class="a11y-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" opacity="0.45" />
        </svg>
        <span class="a11y-label">Contraste</span>
      </button>
      <button class="a11y-btn" type="button" data-a11y-action="reset" aria-label="Restablecer accesibilidad"
        title="Restablecer (Alt+0)">
          <svg class="a11y-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" 
          stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier"> 
          <g clip-path="url(#clip0_429_11071)"> 
          <path d="M12 2.99982C16.9706 2.99982 21 7.02925 21 11.9998C21 16.9704 16.9706 20.9998 12 20.9998C7.02944 20.9998 3 16.9704 3 11.9998C3 9.17255 4.30367 6.64977 6.34267 4.99982" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M3 4.49982H7V8.49982" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path> </g> <defs> <clipPath id="clip0_429_11071"> <rect width="24" height="24" fill="white"></rect> </clipPath> </defs> </g></svg>
        <span class="a11y-label">Restablecer</span>
      </button>
      <p class="screen-reader-only" id="a11y-status" aria-live="polite"></p>
    </section>
  `;
}

function ensureToolbar() {
  const existingToolbar = document.querySelector(".a11y-toolbar");
  if (existingToolbar) return existingToolbar;

  document.body.insertAdjacentHTML("beforeend", buildToolbarMarkup());
  return document.querySelector(".a11y-toolbar");
}

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
  const contrastBtn = document.querySelector(
    '[data-a11y-action="toggle-contrast"]',
  );

  if (contrastBtn)
    contrastBtn.setAttribute("aria-pressed", String(settings.highContrast));
}

function announceStatus(message) {
  const statusEl = document.getElementById("a11y-status");
  if (!statusEl) return;
  statusEl.textContent = message;
}

function applySettings({ announce = false, message = "" } = {}) {
  document.documentElement.style.fontSize = `${BASE_FONT_SIZE * settings.fontScale}px`;
  document.body.classList.toggle("a11y-high-contrast", settings.highContrast);
  document.body.classList.remove("a11y-reduce-motion");
  updatePressedStates();

  if (announce && message) announceStatus(message);
}

function increaseFont() {
  settings.fontScale = clamp(
    settings.fontScale + FONT_STEP,
    FONT_MIN,
    FONT_MAX,
  );
  applySettings({
    announce: true,
    message: `Tamanio de letra ${Math.round(settings.fontScale * 100)} por ciento.`,
  });
}

function decreaseFont() {
  settings.fontScale = clamp(
    settings.fontScale - FONT_STEP,
    FONT_MIN,
    FONT_MAX,
  );
  applySettings({
    announce: true,
    message: `Tamanio de letra ${Math.round(settings.fontScale * 100)} por ciento.`,
  });
}

function toggleContrast() {
  settings.highContrast = !settings.highContrast;
  applySettings({
    announce: true,
    message: settings.highContrast
      ? "Alto contraste activado."
      : "Alto contraste desactivado.",
  });
}

function resetAccessibility() {
  settings = { ...defaultSettings };
  applySettings({
    announce: true,
    message: "Ajustes de accesibilidad restablecidos.",
  });
}

function handleAction(action) {
  switch (action) {
    case "increase-font":
      increaseFont();
      break;
    case "decrease-font":
      decreaseFont();
      break;
    case "toggle-contrast":
      toggleContrast();
      break;
    case "reset":
      resetAccessibility();
      break;
    default:
      return;
  }

  saveSettings();
}

function registerButtonEvents() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar) return;

  toolbar.addEventListener("click", (event) => {
    const target = event.target.closest("[data-a11y-action]");
    if (!target) return;
    handleAction(target.dataset.a11yAction);
  });
}

function registerKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (!event.altKey) return;

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      handleAction("increase-font");
      return;
    }

    if (event.key === "-") {
      event.preventDefault();
      handleAction("decrease-font");
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "c") {
      event.preventDefault();
      handleAction("toggle-contrast");
    } else if (key === "0") {
      event.preventDefault();
      handleAction("reset");
    }
  });
}

function initAccessibility() {
  ensureToolbar();
  loadSettings();
  applySettings();
  registerButtonEvents();
  registerKeyboardShortcuts();
}

document.addEventListener("DOMContentLoaded", initAccessibility);
