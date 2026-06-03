/**
 * @file pages/register/js/locations/locations-ui.js
 * @description DOM rendering + binding for locations list.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
  "use strict";

  window.RegisterLocationsUI = window.RegisterLocationsUI || {};
  const api = window.RegisterLocationsUI;

  function shared() {
    return window.RegisterLocationsShared;
  }

  function state() {
    return window.RegisterLocationsState;
  }

  function draft() {
    return window.RegisterLocationsDraft;
  }

  function engine() {
    return window.RegisterLocationsEngine;
  }

  api.setAddButtonMode = function setAddButtonMode() {
    const addBtn = document.getElementById("reg-location-add-btn");
    if (!addBtn) return;
    const buttonText = window.langu("loc_btn_add_new") || "+ إضافة موقع جديد";
    addBtn.innerHTML = `<span id="reg-location-add-btn-label">${buttonText}</span>`;
    addBtn.dataset.mode = "add";
    addBtn.type = "button";
    addBtn.setAttribute("aria-label", buttonText);
  };

  api.render = function render() {
    state().ensureState();
    const els = shared().getEls();
    const container = document.getElementById("reg-locations-list");
    const counter = document.getElementById("reg-locations-counter");
    const addBtn = document.getElementById("reg-location-add-btn");
    const note = document.getElementById("reg-location-requirement-note");
    if (!container) return;

    const list = state().normalizeState();
    const active = state().getActiveLocation(list);
    if (active && !window.registerDraftNewLocation) {
      window.registerActiveLocationId = active.id;
      if (active.coords || active.address) {
        draft().setDraft({ coords: active.coords || "", address: active.address || "" });
      }
    }

    if (counter) counter.textContent = `${list.length}/${shared().MAX || 20}`;

    const mandatory = (typeof registerHasBusinessRole === "function") ? !!registerHasBusinessRole() : false;
    const hasBuyerRole = !!(typeof window.checkRole === "function" && window.checkRole(registerGetSelectedAccountType(), window.ACCOUNT_ROLES?.BUYER || 1));
    const multiLocationMode = mandatory && hasBuyerRole;
    if (note) {
      note.textContent = mandatory
        ? (multiLocationMode ? window.langu("loc_note_business_limit") : window.langu("loc_note_business_required"))
        : window.langu("loc_note_buyer_optional");
    }

    if (addBtn) {
      addBtn.disabled = list.length >= (shared().MAX || 20);
      api.setAddButtonMode();
    }

    container.innerHTML = "";
    if (!list.length) {
      const empty = document.createElement("div");
      empty.id = "reg-locations-empty";
      empty.className = "register_form-hint";
      empty.textContent = mandatory ? window.langu("loc_empty_business") : window.langu("loc_empty_buyer");
      container.appendChild(empty);
      return;
    }

    list.forEach((loc, index) => {
      const row = document.createElement("div");
      row.id = `reg-location-row-${index}`;
      row.className = "reg-location-row";
      row.dataset.locId = loc.id;
      if (loc.id === window.registerActiveLocationId) row.classList.add("is-active");

      const primary = document.createElement("input");
      primary.id = `reg-location-primary-radio-${index}`;
      primary.type = "radio";
      primary.name = "reg_location_primary";
      primary.checked = !!loc.is_primary;
      primary.addEventListener("change", () => engine().selectLocationById(loc.id));

      row.addEventListener("click", (e) => {
        if (!e.target.closest(".reg-location-action-btn") && !e.target.closest('input[type="radio"]')) {
          engine().selectLocationById(loc.id);
        }
      });

      const text = document.createElement("div");
      text.className = "reg-location-text";
      const title = document.createElement("div");
      title.className = "reg-location-address";
      title.textContent = loc.address || window.langu("loc_empty_address");
      text.appendChild(title);

      const actions = document.createElement("div");
      actions.className = "reg-location-actions";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "reg-location-action-btn danger";
      delBtn.innerHTML = `<i class="fas fa-trash-alt"></i> <span>${window.langu("loc_btn_delete")}</span>`;
      delBtn.addEventListener("click", () => {
        const next = list.filter((x) => x.id !== loc.id);
        if (next.length && !next.some((x) => x.is_primary)) next[0].is_primary = true;
        window.registerLocations = next;
        if (window.registerActiveLocationId === loc.id) {
          const fallback = next.find((x) => x.is_primary) || next[0] || null;
          window.registerActiveLocationId = fallback?.id || "";
          if (fallback) draft().setDraft({ coords: fallback.coords || "", address: fallback.address || "" });
          else draft().setDraft({ coords: "", address: "" });
        }
        api.render();
        if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
        if (typeof registerCheckCurrentStepVisibility === "function") {
          registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        }
      });

      actions.appendChild(delBtn);
      row.appendChild(primary);
      row.appendChild(text);
      row.appendChild(actions);
      container.appendChild(row);
    });

    // Sync block height per user request
    if (typeof api.syncBlockHeight === "function") {
      api.syncBlockHeight();
    }
  };

  /**
   * Dynamically synchronizes the height of #reg-location-address-block
   * to exactly match (Map + Address + First Location Item + internal overhead).
   * This implements the "Fixed Height Window" requested by the user.
   */
  api.syncBlockHeight = function syncBlockHeight() {
    const block = document.getElementById("reg-location-address-block");
    const map = document.getElementById("register_map-container");
    const addressGroup = document.getElementById("reg-address-group");
    const list = document.getElementById("reg-locations-list");

    // Internal elements that contribute to height but weren't explicitly listed
    const head = document.getElementById("reg-location-section-head");
    const actionsRow = document.getElementById("reg-location-actions-row");

    if (!block || !map || !addressGroup || !list) return;

    // 🛡️ Safety: If the block is hidden (display: none), offsetHeight will be 0.
    // Applying a 0px height constraint now would break it when it later becomes visible.
    const isHidden = block.offsetWidth === 0 && block.offsetHeight === 0;
    if (isHidden) return;

    // 1. Core requested components
    const mapHeight = map.parentElement?.offsetHeight || map.offsetHeight || 300;
    const addressHeight = addressGroup.offsetHeight || 0;

    // 2. First item height
    const firstItem = list.querySelector(".reg-location-row");
    const firstItemHeight = firstItem ? firstItem.offsetHeight : 0;

    // 3. Overhead components (Head, Actions, and Gaps/Paddings)
    const headHeight = head ? head.offsetHeight : 0;
    const actionsHeight = actionsRow ? actionsRow.offsetHeight : 0;

    // Calculate total padding of the block
    const blockStyle = window.getComputedStyle(block);
    const blockPadding = parseFloat(blockStyle.paddingTop || 0) + parseFloat(blockStyle.paddingBottom || 0);
    const blockGaps = 30;

    const targetHeight = mapHeight + addressHeight + firstItemHeight + headHeight + actionsHeight + blockPadding + blockGaps;

    if (targetHeight < 100) return;

    // 4. Force the height constraint as requested (min = max)
    block.style.minHeight = `${targetHeight}px`;
    block.style.maxHeight = `${targetHeight}px`;
    block.style.height = `${targetHeight}px`;

    // 5. Enable scrolling for the block itself so the list can expand beyond the first item
    block.style.overflowY = "auto";
    block.style.overflowX = "hidden";

    // Ensure internal list doesn't fight the block's scroll
    list.style.maxHeight = "none";
    list.style.overflowY = "visible";
    list.style.height = "auto";
  };

  api.bindUiOnce = function bindUiOnce() {
    const block = document.getElementById("reg-location-address-block");
    const addBtn = document.getElementById("reg-location-add-btn");
    const addressInput = document.getElementById("register_address");

    if (block && window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            api.syncBlockHeight();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(block);
    }

    if (addBtn && addBtn.dataset.bound !== "true") {
      addBtn.addEventListener("click", () => engine().createNewLocationDraft());
      addBtn.dataset.bound = "true";
    }

    if (addressInput && addressInput.dataset.bound !== "true") {
      addressInput.addEventListener("input", () => engine().handleDraftMutation());
      addressInput.dataset.bound = "true";
    }
  };
})();
