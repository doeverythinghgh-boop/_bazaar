/**
 * @file pages/register/js/register-phone-helpers.js
 * @description Phone list state, rendering, and duplication helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


let registerPhoneCheckAbortController = null;

function registerIsWhatsappPhoneVerificationEnabled() {
    return window.AppBehavior?.enableWhatsappPhoneVerification !== false;
}

async function registerCheckPhoneExists(normalizedPhone) {
    if (!normalizedPhone || normalizedPhone.replace(/\D/g, "").length < 12) {
        return false;
    }

    const cache = window.registerPhoneCheckCache;
    const inflight = window.registerPhoneCheckInflight;
    const now = Date.now();
    const cached = cache?.get(normalizedPhone);

    if (cached && now - cached.timestamp < 30000) {
        return cached.exists;
    }

    if (inflight?.has(normalizedPhone)) {
        return inflight.get(normalizedPhone);
    }

    try {
        if (registerPhoneCheckAbortController) {
            registerPhoneCheckAbortController.abort();
        }
        registerPhoneCheckAbortController = new AbortController();

        const request = apiFetch(`/api/users?phone=${encodeURIComponent(normalizedPhone)}&exists=1`, {
            signal: registerPhoneCheckAbortController.signal
        })
            .then((user) => {
                const exists = !!(user && !user.error && (user.exists === true || (user.phone && !user.error)));
                console.log(`[] ${normalizedPhone}: ${exists ? 'exists' : 'not found'}`);
                cache?.set(normalizedPhone, { exists, timestamp: Date.now() });
                inflight?.delete(normalizedPhone);
                return exists;
            })
            .catch((error) => {
                inflight?.delete(normalizedPhone);
                if (error.name === "AbortError") return null;
                console.warn("[Register] API request failed:", error);
                return null;
            });

        inflight?.set(normalizedPhone, request);
        const result = await request;
        return result === true;
    } catch (error) {
        if (error.name === "AbortError") return null;
        console.error("[Register] Phone existence check failed:", error);
        return null;
    }
}

function registerCreatePhoneEntry(entry = {}) {
    return window.UserPhoneUi?.createEntry
        ? window.UserPhoneUi.createEntry(entry)
        : {
            number: entry.number || "",
            is_primary: !!entry.is_primary,
            has_whatsapp: entry.has_whatsapp !== false
        };
}

function registerGetPhoneEntries() {
    const entries = Array.isArray(window.registerPhoneEntries) ? window.registerPhoneEntries : [];
    window.registerPhoneEntries = window.UserPhoneUi?.ensureEntries
        ? window.UserPhoneUi.ensureEntries(entries)
        : (entries.length ? entries : [registerCreatePhoneEntry({ is_primary: true, has_whatsapp: true })]);
    return window.registerPhoneEntries;
}

function registerSetPrimaryPhone(index) {
    const entries = registerGetPhoneEntries();
    if (window.UserPhoneUi?.setPrimary) {
        window.registerPhoneEntries = window.UserPhoneUi.setPrimary(entries, index);
    } else {
        entries.forEach((entry, i) => {
            entry.is_primary = (i === index);
        });
        window.registerPhoneEntries = entries;
    }
}

function registerRenderPhones() {
    const els = registerGetElements();

    // 🪞 DIAGNOSTIC MIRROR: Log if container is missing
    if (!els.phonesList) {
        console.log(` ️ [Data Mirror] Phone List Container: #register_phones_list (Not found in DOM)`);
        return;
    }

    const entries = registerGetPhoneEntries();

    // 🪞 DIAGNOSTIC MIRROR: Log phone restoration
    console.log(` [Data Mirror] Restoring Phones (${entries.length} entries)...`);
    entries.forEach((entry, idx) => {
        const status = els.phonesList ? '✅ (Rendered)' : '❌ (Failed)';
        const displayVal = entry.number ? `"${entry.number}"` : '(Empty)';
        const attrs = [
            entry.is_primary ? 'Primary' : '',
            entry.has_whatsapp ? 'WhatsApp' : ''
        ].filter(Boolean).join(', ');

        console.log(` ↳ Phone #${idx + 1}: ${displayVal} [${attrs}] -> #reg-phone-number-input-${idx} ${status}`, els.phonesList ? 'color: #27ae60;' : 'color: #e74c3c;');
    });

    if (window.UserPhoneUi?.render) {
        window.UserPhoneUi.render(els.phonesList, entries, {
            rowClass: "register-phone-row",
            numberInputClass: "register-phone-number-input",
            primaryInputClass: "register-phone-primary-input",
            whatsappInputClass: "register-phone-whatsapp-input",
            removeBtnClass: "register-phone-remove-btn",
            inputClass: "",
            primaryLabel: window.langu("profile_label_primary"),
            whatsappLabel: window.langu("profile_label_has_whatsapp"),
            numberPlaceholder: "+201001234567",
            errorNode: els.phoneError || null
        });
    }
}

function registerCollectPhones() {
    return window.UserPhoneUi?.collect
        ? window.UserPhoneUi.collect(registerGetPhoneEntries())
        : AuthValidators.validatePhonesList(registerGetPhoneEntries());
}

window.registerVerifiedPhones = window.registerVerifiedPhones || new Set();

async function registerPerformPhoneDuplicationCheck(normalized) {
    const els = registerGetElements();
    const fieldId = 'phone';
    if (!els.phoneError) return;

    // 🛡️ Only check if NOT already verified (prevents re-validation on back/skip)
    const safeCheck = AuthValidators.normalizePhone(normalized);
    if (window.registerVerifiedPhones && window.registerVerifiedPhones.has(safeCheck)) {
        if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'valid', 'register_phone_available');
        return;
    }

    // 🛡️ Only set to checking if the value actually changed to prevent flickering on revisit
    if (normalized && normalized.replace(/\D/g, "").length >= 12) {
        const currentState = window.RegisterState?.getField?.(fieldId);
        const isSameValue = (currentState?.value || "").trim() === (normalized || "").trim();

        if (currentState?.state !== 'valid') {
            const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_phone_verifying') : 'register_phone_verifying';
            if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'checking', errorMsg);
        }
    }

    let isVerified = false;
    try {
        const exists = normalized ? await registerCheckPhoneExists(normalized) : false;

        if (exists === null) {
            if (window.RegisterState) {
                const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('CONNECTION_FAILED') : 'CONNECTION_FAILED';
                window.RegisterState.updateField(fieldId, normalized, 'error', errorMsg);
            }
        } else if (exists) {
            if (window.RegisterState) {
                const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('PHONE_EXISTS') : 'PHONE_EXISTS';
                window.RegisterState.updateField(fieldId, normalized, 'invalid', errorMsg);
            }
        } else if (normalized && normalized.replace(/\D/g, "").length >= 12) {
            if (!registerIsWhatsappPhoneVerificationEnabled()) {
                const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_phone_available') : 'register_phone_available';
                if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'valid', errorMsg);
                const safeNormalized = AuthValidators.normalizePhone(normalized);
                window.registerVerifiedPhones.add(safeNormalized);
                return;
            }

            if (!window.startWhatsappVerificationFlow) {
                await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = '/pages/register/js/register-whatsapp-auth.js';
                    script.onload = resolve;
                    document.body.appendChild(script);
                });
            }

            isVerified = await window.startWhatsappVerificationFlow(normalized);

            if (isVerified) {
                const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_phone_available') : 'register_phone_available';
                if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'valid', errorMsg);

                // 🛡️ Ensure we add the most normalized version possible
                const safeNormalized = AuthValidators.normalizePhone(normalized);
                window.registerVerifiedPhones.add(safeNormalized);
            } else {
                const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_error_phone_required') : 'register_error_phone_required';
                if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'invalid', errorMsg);
            }
        } else {
            if (window.RegisterState) window.RegisterState.updateField(fieldId, normalized, 'idle');
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("[Register] Phone check aborted due to new input.");
            return;
        }
        console.warn("[Register] Live phone duplication check failed:", error);
        if (window.RegisterState) {
            const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('CONNECTION_FAILED') : 'CONNECTION_FAILED';
            window.RegisterState.updateField(fieldId, normalized, 'error', errorMsg);
        }
    } finally {
        if (typeof registerCheckCurrentStepVisibility === "function") {
            // 🚀 SMART NAVIGATION:
            // If phone was just verified, we don't want to "preserve" the current step anymore
            // We want to encourage moving to the next one (password).
            const isVerified = normalized && window.registerVerifiedPhones?.has(normalized);
            registerCheckCurrentStepVisibility({
                preserveReveal: true,
                preserveCurrentStep: !isVerified, // AUTO-ADVANCE if just verified!
                skipScroll: !isVerified
            });
        }
    }
}

/**
 * Retries the phone duplication check.
 */
function registerRetryPhoneCheck() {
    const entries = registerGetPhoneEntries();
    const primary = entries.find(e => e.is_primary);
    if (primary && primary.number) {
        registerPerformPhoneDuplicationCheck(primary.number);
    }
}
