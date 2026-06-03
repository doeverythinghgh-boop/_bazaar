/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function(){
  "use strict";

  // العناصر
  const svgContainer = document.getElementById('svgContainer');
  const tableWrapper = document.getElementById('tableWrapper');
  const tableTitle = document.getElementById('tableTitle');
  const tableNote = document.getElementById('tableNote'); // May be null now
  const tabBtns = document.querySelectorAll('.tab-btn');

  /**
   * Loads local translations for this page and merges them into the global appTranslations.
   * This also calls the required loadIndexTranslations to satisfy security checks.
   */
  async function initTranslations() {
    try {
      // 1. Load global translations first (Required by build system)
      if (typeof window.loadIndexTranslations === 'function') {
        await window.loadIndexTranslations();
      }

      // 2. Load and merge local translations (Use specific filename to avoid collision)
      // We append a timestamp to avoid caching issues during development
      const response = await fetch('clothing-sizes-lang.json?t=' + Date.now());
      if (response.ok) {
        const localData = await response.json();

        // Ensure appTranslations exists
        window.appTranslations = window.appTranslations || {};

        // Merge keys explicitly
        // We use a loop to ensure we don't accidentally overwrite the whole object
        for (const key in localData) {
          window.appTranslations[key] = localData[key];
        }

        console.log(" [ClothingSizes] Local translations merged:", Object.keys(localData).length, "keys");
      } else {
        console.warn("️ [ClothingSizes] Local translation file not found.");
      }
    } catch (e) {
      console.error(" [ClothingSizes] Error initializing translations:", e);
    }

    // 3. Apply translations to data-lkey elements
    if (typeof window.applyAppTranslations === 'function') {
      window.applyAppTranslations();
    }
  }

  function onRowSelect(category, customValues) {
    if (window.SvgEngine && svgContainer) {
      window.SvgEngine.renderSVG(svgContainer, category, customValues);
    }
  }

  function updateCategory(category) {
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === category) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (window.TableManager) {
      window.TableManager.renderTable(tableWrapper, tableTitle, tableNote, category, onRowSelect);
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.tab;
      if (cat && window.dataMap[cat]) updateCategory(cat);
    });
  });

  // بدء التشغيل
  async function init() {
    // Wait for the DOM to be fully ready and any other scripts to load
    await initTranslations();

    // Final check: if keys are still showing, try re-applying translations after a short delay
    // This handles cases where some global script might have cleared appTranslations late
    setTimeout(() => {
        if (typeof window.applyAppTranslations === 'function') {
            window.applyAppTranslations();
        }
    }, 500);

    console.log(" [ClothingSizes] Encyclopedia initialized successfully.");
    updateCategory('men');
  }

  // If the document is already loaded, init immediately, otherwise wait for DOMContentLoaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
