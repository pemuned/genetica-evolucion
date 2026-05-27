/**
 * app.js — Section navigation for Genética y Evolución
 *
 * Handles sidebar nav button clicks: activates the clicked button
 * and reveals the matching content section.
 * On mobile, also manages the hamburger toggle.
 */

"use strict";

const NAV_BTN_SELECTOR = ".nav-btn";
const SECTION_SELECTOR = ".content-section";
const SIDEBAR_SELECTOR = ".sidebar";
const HAMBURGER_BTN_ID = "hamburger-btn";
const ACTIVE_CLASS = "active";
const VISIBLE_CLASS = "visible";
const NAV_OPEN_CLASS = "nav-open";
const ARIA_CURRENT = "aria-current";
const MAIN_CONTENT_ID = "main-content";
const MOBILE_BREAKPOINT = 768;

const SLIDER_ROOT_SELECTOR = ".prelab-slider";
const PRELAB_SLIDE_SELECTOR = ".prelab-slide";
const PRELAB_TAB_SELECTOR = ".prelab-tab-btn";
const PRELAB_PREV_SELECTOR = '[data-prelab-nav="prev"]';
const PRELAB_NEXT_SELECTOR = '[data-prelab-nav="next"]';
const SLIDER_NEXT_HINT_CLASS = "prelab-arrow-btn--hint";

/**
 * Show the section matching `targetId` and update nav button states.
 * @param {string}   targetId   - The `id` of the section to show.
 * @param {NodeList} navButtons - All nav buttons.
 * @param {NodeList} sections   - All content sections.
 */
function showSection(targetId, navButtons, sections) {
  navButtons.forEach((btn) => {
    const isTarget = btn.dataset.target === targetId;
    btn.classList.toggle(ACTIVE_CLASS, isTarget);
    if (isTarget) {
      btn.setAttribute(ARIA_CURRENT, "page");
    } else {
      btn.removeAttribute(ARIA_CURRENT);
    }
  });

  sections.forEach((section) => {
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
  hamburgerBtn.setAttribute("aria-expanded", "false");
  hamburgerBtn.setAttribute("aria-label", "Abrir menú");
}

/**
 * Bootstrap the navigation once the DOM is ready.
 */
function initNav() {
  const navButtons = document.querySelectorAll(NAV_BTN_SELECTOR);
  const sections = document.querySelectorAll(SECTION_SELECTOR);
  const sidebar = document.querySelector(SIDEBAR_SELECTOR);
  const hamburgerBtn = document.getElementById(HAMBURGER_BTN_ID);

  if (!navButtons.length || !sections.length) return;

  // Section switching
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
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
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle(NAV_OPEN_CLASS);
      hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
      hamburgerBtn.setAttribute(
        "aria-label",
        isOpen ? "Cerrar menú" : "Abrir menú",
      );
    });
  }
}

/**
 * Initialize a single subsection slider.
 * @param {Element} sliderRoot - Slider container element.
 */
function initSlider(sliderRoot) {
  const slides = Array.from(sliderRoot.querySelectorAll(PRELAB_SLIDE_SELECTOR));
  const tabs = Array.from(sliderRoot.querySelectorAll(PRELAB_TAB_SELECTOR));
  const prevBtn = sliderRoot.querySelector(PRELAB_PREV_SELECTOR);
  const nextBtn = sliderRoot.querySelector(PRELAB_NEXT_SELECTOR);
  const statusEl = sliderRoot.querySelector('[aria-live="polite"]');

  if (!slides.length || slides.length !== tabs.length || !prevBtn || !nextBtn)
    return;

  let currentIndex = tabs.findIndex((tab) =>
    tab.classList.contains("is-active"),
  );
  if (currentIndex < 0) currentIndex = 0;
  let hasStartedWithNext = false;

  const lastIndex = slides.length - 1;

  function updateSlider(index, { announce = true, focusTab = false } = {}) {
    currentIndex = Math.min(Math.max(index, 0), lastIndex);

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentIndex;
      slide.classList.toggle(VISIBLE_CLASS, isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === currentIndex;
      const isPrev = tabIndex === currentIndex - 1;
      const isNext = tabIndex === currentIndex + 1;
      tab.classList.toggle("is-active", isActive);
      tab.classList.toggle("is-prev", isPrev);
      tab.classList.toggle("is-next", isNext);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === lastIndex;

    if (!hasStartedWithNext && !nextBtn.disabled) {
      nextBtn.classList.add(SLIDER_NEXT_HINT_CLASS);
    } else {
      nextBtn.classList.remove(SLIDER_NEXT_HINT_CLASS);
    }

    if (focusTab) tabs[currentIndex].focus();

    if (announce && statusEl) {
      const tabLabel = tabs[currentIndex].textContent.trim();
      statusEl.textContent = `Subsección ${currentIndex + 1} de ${slides.length}: ${tabLabel}.`;
    }
  }

  tabs.forEach((tab, tabIndex) => {
    tab.addEventListener("click", () => {
      updateSlider(tabIndex, { announce: true });
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        updateSlider(tabIndex + 1, { announce: true, focusTab: true });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateSlider(tabIndex - 1, { announce: true, focusTab: true });
      } else if (event.key === "Home") {
        event.preventDefault();
        updateSlider(0, { announce: true, focusTab: true });
      } else if (event.key === "End") {
        event.preventDefault();
        updateSlider(lastIndex, { announce: true, focusTab: true });
      }
    });
  });

  prevBtn.addEventListener("click", () => {
    updateSlider(currentIndex - 1, { announce: true, focusTab: true });
  });

  nextBtn.addEventListener("click", () => {
    hasStartedWithNext = true;
    nextBtn.classList.remove(SLIDER_NEXT_HINT_CLASS);
    updateSlider(currentIndex + 1, { announce: true, focusTab: true });
  });

  updateSlider(currentIndex, { announce: false });
}

/**
 * Initialize internal subsection sliders.
 */
function initContentSliders() {
  const sliderRoots = Array.from(
    document.querySelectorAll(SLIDER_ROOT_SELECTOR),
  );
  sliderRoots.forEach(initSlider);
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initContentSliders();
});
