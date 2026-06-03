/**
 * @file pages/register/js/register-delivery-partner-manager.js
 * @description Delivery method UI, provider picker, and supplier-delivery relation sync.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterDeliveryPartnerManager = (function () {
    "use strict";

    const PAGE_SIZE = 5;
    const PICKER_RETURN_KEY = "register_delivery_picker_return";
    const state = {
        providers: [],
        visibleCount: PAGE_SIZE,
        selected: null,
        loaded: false,
        loading: false,
        pickerOpen: false,
        restoreScheduled: false,
        navigatingToPortfolio: false,
        pageShowBound: false
    };

    function getCurrentSellerKey() {
        const user = window.UserService?.get?.() || window.userSession || {};
        const key = user.user_key || "";
        return key === "guest_user" ? "" : key;
    }

    function getMethod() {
        const checked = document.querySelector('input[name="register_delivery_method"]:checked');
        return checked?.value || "platform";
    }

    function getHiddenDeliveryInput() {
        return document.getElementById("register_is-delivered");
    }

    function getProviderInput() {
        return document.getElementById("register_delivery-provider-key");
    }

    function setSelectedProvider(provider) {
        state.selected = provider || null;
        const input = getProviderInput();
        if (input) input.value = provider?.deliveryKey || provider?.user_key || "";
        renderSelection();
        saveDraft();
        refreshValidation();
    }

    function saveDraft() {
        if (window.RegisterDraftManager?.saveDraft) window.RegisterDraftManager.saveDraft();
    }

    function saveDraftNow() {
        if (window.RegisterDraftManager?.saveNow) {
            window.RegisterDraftManager.saveNow();
        } else {
            saveDraft();
        }
    }

    function refreshValidation() {
        if (typeof registerCheckCurrentStepVisibility === "function") {
            registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        }
    }

    function syncMethodUi() {
        const method = getMethod();
        const isSelf = method === "self";
        const hidden = getHiddenDeliveryInput();
        if (hidden) hidden.value = isSelf ? "1" : "0";

        const panel = document.getElementById("reg-delivery-partner-panel");
        if (panel) panel.classList.toggle("is-hidden", isSelf);

        if (isSelf) {
            setSelectedProvider(null);
        } else {
            renderSelection();
        }
    }

    function renderSelection() {
        const el = document.getElementById("reg-delivery-partner-selected");
        const error = document.getElementById("reg-delivery-partner-error");
        if (!el) return;

        if (getMethod() === "self") {
            el.innerHTML = "";
            if (error) error.textContent = "";
            return;
        }

        if (state.selected) {
            // Try to get a better name from state.providers if it matches the key
            const key = state.selected.deliveryKey || state.selected.user_key || "";
            const matched = state.providers.find(p => (p.deliveryKey || p.user_key) === key);
            const name = matched?.username || state.selected.username || matched?.business_name || state.selected.business_name || key;

            el.innerHTML = `
                <button id="reg-delivery-selected-info-btn" type="button" class="reg-delivery-selected-info-btn">
                    <i class="fas fa-circle-check"></i>
                    <span>تم اختيار: ${escapeHtml(name)}</span>
                    <i class="fas fa-phone"></i>
                </button>
            `;
            bindSelectedInfoButton();
            if (error) error.textContent = "";
            return;
        }

        el.textContent = "لم يتم اختيار مقدم توصيل بعد";
    }

    function bindSelectedInfoButton() {
        const btn = document.getElementById("reg-delivery-selected-info-btn");
        if (!btn || btn.dataset.bound === "true") return;
        btn.addEventListener("click", showSelectedProviderPhones);
        btn.dataset.bound = "true";
    }

    function showSelectedProviderPhones() {
        const provider = state.selected;
        if (!provider) return;
        const name = provider.username || provider.business_name || provider.deliveryKey || "مقدم خدمة التوصيل";
        const phones = collectProviderPhones(provider);
        const phonesHtml = phones.length
            ? phones.map((phone) => `<a class="reg-delivery-phone-link" href="tel:${escapeHtml(phone)}"><i class="fas fa-phone"></i><span>${escapeHtml(phone)}</span></a>`).join("")
            : `<div class="reg-delivery-phone-empty">لا توجد أرقام هاتف محفوظة لهذا لمقدم خدمة.</div>`;

        Swal.fire({
            title: escapeHtml(name),
            html: `<div class="reg-delivery-phone-list">${phonesHtml}</div>`,
            width: "360px",
            showConfirmButton: true,
            confirmButtonText: "تم",
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    }

    function collectProviderPhones(provider) {
        const values = [];
        const add = (value) => {
            const raw = String(value || "").trim();
            if (raw && !values.includes(raw)) values.push(raw);
        };

        add(provider.phone);
        add(provider.primary_phone);
        if (Array.isArray(provider.phones)) {
            provider.phones.forEach((entry) => add(entry?.number || entry?.phone || entry));
        }
        return values;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeProvider(raw) {
        const deliveryKey = raw.delivery_key || raw.deliveryKey || raw.user_key || raw.userKey || "";
        return {
            ...raw,
            deliveryKey,
            username: raw.delivery_name || raw.username || raw.business_name || raw.businessName || deliveryKey,
            phone: raw.delivery_phone || raw.phone || raw.primary_phone || "",
            isActive: raw.is_active !== false && raw.isActive !== false
        };
    }

    async function ensureDb() {
        if (typeof window.ensureFirestoreDb !== "function") {
            throw new Error("ensureFirestoreDb function is not loaded/available");
        }
        return window.ensureFirestoreDb();
    }

    async function fetchJson(url, fallbackMessage) {
        if (typeof window.apiFetch === "function") {
            return window.apiFetch(url);
        }
        const response = await fetch(url);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(payload?.error || payload?.message || fallbackMessage);
        }
        return payload?.data ?? payload;
    }

    async function fetchDeliveryUsers() {
        const users = new Map();
        const list = await fetchJson("/api/users?mode=delivery_users&limit=200", "Failed to load delivery users");
        (Array.isArray(list) ? list : []).forEach((user) => {
            const deliveryKey = user.user_key || user.delivery_key;
            if (!deliveryKey) return;
            users.set(deliveryKey, normalizeProvider({
                ...user,
                delivery_key: deliveryKey,
                is_active: false
            }));
        });
        return users;
    }

    async function fetchSellerRelations(db, sellerKey) {
        const relations = [];
        if (!sellerKey) return relations;

        const snap = await db.collection("supplier_deliveries")
            .where("seller_key", "==", sellerKey)
            .get();
        snap.forEach((doc) => relations.push({ relationId: doc.id, ...doc.data() }));
        return relations;
    }

    function relationDocId(sellerKey, deliveryKey) {
        return `${sellerKey}__${deliveryKey}`;
    }

    async function loadProviders({ force = false } = {}) {
        if (state.loaded && !force) return state.providers;
        if (state.loading) return state.providers;

        state.loading = true;
        try {
            const sellerKey = getCurrentSellerKey();
            const db = await ensureDb();
            const users = await fetchDeliveryUsers();
            const relations = await fetchSellerRelations(db, sellerKey);

            relations.forEach((relation) => {
                const deliveryKey = relation.delivery_key || relation.deliveryKey || relation.user_key;
                if (!deliveryKey) return;
                const base = users.get(deliveryKey) || {};
                users.set(deliveryKey, normalizeProvider({
                    ...base,
                    ...relation,
                    delivery_key: deliveryKey
                }));
            });

            state.providers = Array.from(users.values()).filter((item) => item.deliveryKey);

            const active = state.providers.find((item) => item.isActive);
            if (active && !state.selected) {
                setSelectedProvider(active);
            }

            state.loaded = true;
            return state.providers;
        } finally {
            state.loading = false;
        }
    }

    function providerPortfolioUrl(provider) {
        return `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${encodeURIComponent(provider.deliveryKey)}`;
    }

    function serializePickerState() {
        return {
            mode: window.regWizard?.mode || "REGISTER",
            path: window.location.pathname,
            visibleCount: state.visibleCount,
            selected: state.selected,
            providers: state.providers.slice(0, Math.max(state.visibleCount, PAGE_SIZE)),
            loaded: state.loaded,
            providerKey: getProviderInput()?.value || "",
            method: getMethod(),
            currentStep: Number(window.regWizard?.currentStep || 1),
            revealedStepCount: Number(window.regWizard?.revealedStepCount || window.regWizard?.currentStep || 1),
            stepId: typeof registerGetCurrentStepDefinition === "function"
                ? (registerGetCurrentStepDefinition()?.id || "business")
                : "business",
            openedAt: Date.now()
        };
    }

    function savePickerReturnState() {
        try {
            LocalDBSession.setItem(PICKER_RETURN_KEY, JSON.stringify(serializePickerState()));
        } catch (error) {
            console.warn("[DeliveryPartner] Failed to save picker return state.", error);
        }
    }

    function loadPickerReturnState() {
        try {
            const raw = LocalDBSession.getItem(PICKER_RETURN_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn("[DeliveryPartner] Failed to read picker return state.", error);
            return null;
        }
    }

    function clearPickerReturnState() {
        try {
            LocalDBSession.removeItem(PICKER_RETURN_KEY);
        } catch { }
    }

    function renderProviderList() {
        const visible = state.providers.slice(0, state.visibleCount);
        const selectedKey = state.selected?.deliveryKey || "";

        const listHtml = visible.length
            ? visible.map((provider, index) => {
                const isSelected = selectedKey && provider.deliveryKey === selectedKey;
                const idBase = `reg-delivery-provider-${index}`;
                return `
                    <div id="${idBase}" class="modern-provider-card ${isSelected ? "is-active" : ""}">
                        <div id="${idBase}-main" class="modern-provider-main">
                            <div id="${idBase}-avatar" class="modern-provider-avatar">
                                <i id="${idBase}-avatar-icon" class="fas fa-truck-ramp-box"></i>
                            </div>
                            <div id="${idBase}-content" class="modern-provider-content">
                                <div id="${idBase}-name" class="modern-provider-name">${provider.username}</div>
                                <div id="${idBase}-status-inline" class="modern-provider-status-inline"></div>
                            </div>
                            <div id="${idBase}-actions" class="modern-provider-actions">
                                <button id="${idBase}-open" type="button" class="modern-action-icon-btn profile-btn" title="عرض الملف" data-open-key="${provider.deliveryKey}">
                                    <i class="fas fa-external-link-alt"></i>
                                </button>
                                <label class="toggle-switch" id="${idBase}-toggle-label">
                                    <input type="checkbox" id="${idBase}-input" data-delivery-key="${provider.deliveryKey}" ${isSelected ? "checked" : ""}>
                                    <span class="slider" id="${idBase}-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")
            : `<div class="modern-provider-empty">
                <i class="fas fa-folder-open"></i>
                <p>لا توجد نتائج متاحة لخدمات التوصيل الآن.</p>
               </div>`;

        const moreHtml = state.visibleCount < state.providers.length
            ? `<div class="modern-provider-more-wrapper">
                <button id="reg-delivery-provider-more" type="button" class="modern-load-more-btn">
                    <i class="fas fa-plus"></i> عرض المزيد من مقدمي الخدمة 
                </button>
               </div>`
            : "";

        return `
            <div id="reg-delivery-provider-container" class="modern-provider-container">
                <div id="reg-delivery-provider-list" class="modern-provider-list">
                    ${listHtml}
                </div>
                ${moreHtml}
            </div>
        `;
    }

    function bindModalEvents() {
        const list = document.getElementById("reg-delivery-provider-list");
        if (!list) return;

        list.addEventListener("click", (event) => {
            const checkBtn = event.target.closest("[data-delivery-key]");
            const openBtn = event.target.closest("[data-open-key]");

            if (checkBtn) {
                // Allow the default behavior for the checkbox to toggle visually,
                // but then enforce single-selection logic.
                const key = checkBtn.dataset.deliveryKey;
                const provider = state.providers.find((item) => item.deliveryKey === key);

                if (provider) {
                    setSelectedProvider(provider);

                    const htmlContainer = Swal.getHtmlContainer();
                    if (htmlContainer) {
                        const allInputs = htmlContainer.querySelectorAll(".toggle-switch input");
                        const allCards = htmlContainer.querySelectorAll(".modern-provider-card");

                        // Enforce single selection: uncheck everything except the clicked one
                        allInputs.forEach(input => {
                            if (input.dataset.deliveryKey !== key) {
                                input.checked = false;
                            } else {
                                input.checked = true; // Ensure the clicked one stays checked
                            }
                        });

                        // Update card active classes
                        allCards.forEach(card => {
                            const input = card.querySelector("input[data-delivery-key]");
                            if (input && input.dataset.deliveryKey === key) {
                                card.classList.add("is-active");
                            } else {
                                card.classList.remove("is-active");
                            }
                        });
                    }
                }
                return;
            }

            if (openBtn) {
                const key = openBtn.dataset.openKey;
                const provider = state.providers.find((item) => item.deliveryKey === key);
                if (provider) {
                    state.navigatingToPortfolio = true;
                    saveDraftNow();
                    savePickerReturnState();
                    window.location.href = providerPortfolioUrl(provider);
                }
            }
        });

        const more = document.getElementById("reg-delivery-provider-more");
        if (more) {
            more.addEventListener("click", () => {
                state.visibleCount += PAGE_SIZE;

                // Update DOM directly to prevent layout jumps
                const htmlContainer = Swal.getHtmlContainer();
                if (htmlContainer) {
                    htmlContainer.innerHTML = renderProviderList();
                    bindModalEvents();
                }
            });
        }
    }

    async function openPicker() {
        await loadProviders();
        state.visibleCount = Math.max(PAGE_SIZE, state.visibleCount || PAGE_SIZE);
        state.pickerOpen = true;

        const result = await Swal.fire({
            title: "اختيار مقدم خدمة التوصيل",
            html: renderProviderList(),
            width: "560px",
            showConfirmButton: true,
            confirmButtonText: "تم الحفظ",
            showCloseButton: true,
            customClass: {
                popup: "swal-table-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm",
                closeButton: "swal-modern-mini-close"
            },
            didOpen: bindModalEvents,
            preConfirm: () => {
                if (!state.selected) {
                    Swal.showValidationMessage("يرجى اختيار مقدم خدمة توصيل أولًا.");
                    return false;
                }
                return true;
            }
        });

        state.pickerOpen = false;
        if (state.navigatingToPortfolio) return;
        if (result.isConfirmed || result.dismiss) {
            clearPickerReturnState();
        }
    }

    function validate({ silent = false } = {}) {
        const method = getMethod();
        const ok = method === "self" || !!(getProviderInput()?.value || state.selected?.deliveryKey);
        const error = document.getElementById("reg-delivery-partner-error");
        if (!ok && !silent && error) {
            error.textContent = "يرجى اختيار مقدم خدمة توصيل واحد على الأقل.";
        }
        if (ok && error) error.textContent = "";
        return ok;
    }

    async function syncSellerRelation(sellerKey) {
        if (!sellerKey) return;
        const method = getMethod();
        const selectedKey = getProviderInput()?.value || state.selected?.deliveryKey || "";
        const db = await ensureDb();
        const existing = await fetchSellerRelations(db, sellerKey);

        const requests = [];
        existing.forEach((item) => {
            const key = item.delivery_key || item.userKey || item.deliveryKey;
            const isActive = item.is_active !== false && item.isActive !== false;
            if (key && (method === "self" || key !== selectedKey) && isActive) {
                requests.push(updateRelation(sellerKey, key, false));
            }
        });

        if (method === "platform") {
            if (!selectedKey) throw new Error("يرجى اختيار مقدم خدمة توصيل.");
            requests.push(updateRelation(sellerKey, selectedKey, true));
        }

        await Promise.all(requests);
        await verifySellerRelation(sellerKey, method, selectedKey);
    }

    async function updateRelation(sellerKey, deliveryKey, isActive) {
        const db = await ensureDb();
        const provider = state.providers.find((item) => item.deliveryKey === deliveryKey) || {};
        await db.collection("supplier_deliveries")
            .doc(relationDocId(sellerKey, deliveryKey))
            .set({
                seller_key: sellerKey,
                delivery_key: deliveryKey,
                delivery_name: provider.username || provider.business_name || deliveryKey,
                delivery_phone: provider.phone || provider.primary_phone || "",
                delivery_location: provider.location || provider.user_location || "",
                is_active: !!isActive,
                updated_at: new Date().toISOString()
            }, { merge: true });
    }

    async function verifySellerRelation(sellerKey, method, selectedKey) {
        if (method !== "platform") return true;
        const db = await ensureDb();
        const existing = await fetchSellerRelations(db, sellerKey);
        const linked = existing.some((item) => {
            const key = item.delivery_key || item.userKey || item.deliveryKey;
            return key === selectedKey && item.is_active !== false && item.isActive !== false;
        });
        if (!linked) {
            throw new Error("لم يتم تأكيد ربط مقدم خدمة التوصيل. حاول مرة أخرى.");
        }
        return true;
    }

    function restoreFromDom() {
        const selectedKey = getProviderInput()?.value || "";
        if (selectedKey && (!state.selected || (state.selected.deliveryKey || state.selected.user_key) !== selectedKey)) {
            const matched = state.providers.find(p => (p.deliveryKey || p.user_key) === selectedKey);
            state.selected = matched || { deliveryKey: selectedKey, username: selectedKey };
        }
        syncMethodUi();
    }

    function restorePickerIfNeeded() {
        if (state.restoreScheduled) return;
        const saved = loadPickerReturnState();
        if (!saved || saved.path !== window.location.pathname) return;

        state.restoreScheduled = true;
        state.navigatingToPortfolio = false;
        if (Array.isArray(saved.providers) && saved.providers.length) {
            state.providers = saved.providers.map(normalizeProvider).filter((item) => item.deliveryKey);
            state.loaded = !!state.providers.length;
        }
        if (saved.selected) state.selected = normalizeProvider(saved.selected);
        if (saved.providerKey && getProviderInput()) getProviderInput().value = saved.providerKey;
        if ((!state.selected || state.selected.username === state.selected.deliveryKey) && saved.providerKey) {
            const matchedProvider = state.providers.find((item) => item.deliveryKey === saved.providerKey);
            if (matchedProvider) state.selected = matchedProvider;
        }
        state.visibleCount = Math.max(PAGE_SIZE, Number(saved.visibleCount || PAGE_SIZE));
        restoreWizardPosition(saved);

        setTimeout(() => {
            openPicker().finally(() => {
                state.restoreScheduled = false;
            });
        }, 150);
    }

    function restoreWizardPosition(saved) {
        if (!window.regWizard) return;
        const businessStep = typeof registerResolveStepIndex === "function"
            ? registerResolveStepIndex(saved.stepId || "business")
            : null;
        const targetStep = Number(businessStep || saved.currentStep || window.regWizard.currentStep || 1);
        const safeStep = Math.max(1, Math.min(targetStep, Number(window.regWizard.totalSteps || targetStep)));
        window.regWizard.currentStep = safeStep;
        window.regWizard.revealedStepCount = Math.max(
            Number(window.regWizard.revealedStepCount || 1),
            Number(saved.revealedStepCount || safeStep),
            safeStep
        );
        if (window.RegisterState?.syncWizardState) {
            window.RegisterState.syncWizardState({
                currentStep: window.regWizard.currentStep,
                totalSteps: window.regWizard.totalSteps,
                isBusiness: window.regWizard.isBusinessAccount,
                mode: window.regWizard.mode
            });
        }
        if (typeof registerUpdateWizardUI === "function") {
            registerUpdateWizardUI(true);
        }
    }

    function bindPageShowRestoreOnce() {
        if (state.pageShowBound) return;
        window.addEventListener("pagehide", () => {
            if (!state.navigatingToPortfolio) return;
            saveDraftNow();
            savePickerReturnState();
        });
        window.addEventListener("pageshow", () => {
            if (!loadPickerReturnState()) return;
            setTimeout(restorePickerIfNeeded, 120);
        });
        state.pageShowBound = true;
    }

    function bindUiOnce() {
        bindPageShowRestoreOnce();

        document.querySelectorAll('input[name="register_delivery_method"]').forEach((radio) => {
            if (radio.dataset.deliveryMethodBound === "true") return;
            radio.addEventListener("change", () => {
                syncMethodUi();
                saveDraft();
                refreshValidation();
            });
            radio.dataset.deliveryMethodBound = "true";
        });

        const openBtn = document.getElementById("reg-delivery-partner-open-btn");
        if (openBtn && openBtn.dataset.bound !== "true") {
            openBtn.addEventListener("click", openPicker);
            openBtn.dataset.bound = "true";
        }

        restoreFromDom();
        restorePickerIfNeeded();

        if (window.regWizard?.mode === "PROFILE") {
            loadProviders().then(renderSelection).catch((error) => console.warn("[DeliveryPartner] Failed to load profile relations.", error));
        }
    }

    return {
        bindUiOnce,
        loadProviders,
        openPicker,
        validate,
        syncSellerRelation,
        setSelectedProvider,
        getMethod,
        renderSelection
    };
})();

