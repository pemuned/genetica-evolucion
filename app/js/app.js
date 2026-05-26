/**
 * app.js — Section navigation for Genética y Evolución
 *
 * Handles sidebar nav button clicks: activates the clicked button
 * and reveals the matching content section.
 * On mobile, also manages the hamburger toggle.
 */

'use strict';

const NAV_BTN_SELECTOR     = '.nav-btn';
const SECTION_SELECTOR     = '.content-section';
const SIDEBAR_SELECTOR     = '.sidebar';
const HAMBURGER_BTN_ID     = 'hamburger-btn';
const ACTIVE_CLASS         = 'active';
const VISIBLE_CLASS        = 'visible';
const NAV_OPEN_CLASS       = 'nav-open';
const ARIA_CURRENT         = 'aria-current';
const MAIN_CONTENT_ID      = 'main-content';
const MOBILE_BREAKPOINT    = 768;

/**
 * Show the section matching `targetId` and update nav button states.
 * @param {string}   targetId   - The `id` of the section to show.
 * @param {NodeList} navButtons - All nav buttons.
 * @param {NodeList} sections   - All content sections.
 */
function showSection(targetId, navButtons, sections) {
  navButtons.forEach(btn => {
    const isTarget = btn.dataset.target === targetId;
    btn.classList.toggle(ACTIVE_CLASS, isTarget);
    if (isTarget) {
      btn.setAttribute(ARIA_CURRENT, 'page');
    } else {
      btn.removeAttribute(ARIA_CURRENT);
    }
  });

  sections.forEach(section => {
    section.classList.toggle(VISIBLE_CLASS, section.id === targetId);
  });

  // Scroll main content back to top on section switch
  const mainContent = document.getElementById(MAIN_CONTENT_ID);
  if (mainContent) mainContent.scrollTop = 0;
}

/**
 * Close the hamburger menu if we are in mobile viewport.
 * @param {Element} sidebar       - The sidebar element.
 * @param {Element} hamburgerBtn  - The hamburger button.
 */
function closeHamburgerMenu(sidebar, hamburgerBtn) {
  sidebar.classList.remove(NAV_OPEN_CLASS);
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.setAttribute('aria-label', 'Abrir menú');
}

/**
 * Bootstrap the navigation once the DOM is ready.
 */
function initNav() {
  const navButtons    = document.querySelectorAll(NAV_BTN_SELECTOR);
  const sections      = document.querySelectorAll(SECTION_SELECTOR);
  const sidebar       = document.querySelector(SIDEBAR_SELECTOR);
  const hamburgerBtn  = document.getElementById(HAMBURGER_BTN_ID);

  if (!navButtons.length || !sections.length) return;

  // Section switching
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;

      showSection(targetId, navButtons, sections);

      // Auto-close menu on mobile after selecting a section
      if (window.innerWidth <= MOBILE_BREAKPOINT && sidebar && hamburgerBtn) {
        closeHamburgerMenu(sidebar, hamburgerBtn);
      }
    });
  });

  // Hamburger toggle
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle(NAV_OPEN_CLASS);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
      hamburgerBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
  }
}

document.addEventListener('DOMContentLoaded', initNav);
