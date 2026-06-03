/**
 * @file pages/register/js/draft-manager/orchestrator.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    'use strict';
    window.DraftManagerInternals = window.DraftManagerInternals || {};

    window.DraftManagerInternals.applyCompleteSnapshot = function(snapshot) {
        window.DraftManagerInternals.applySnapshotFields(snapshot);
        window.DraftManagerInternals.applyStateFallbackFields();

        if (Array.isArray(snapshot.phoneEntries) && snapshot.phoneEntries.length) {
            window.registerPhoneEntries = snapshot.phoneEntries;
        }
        if (typeof registerRenderPhones === 'function') {
            registerRenderPhones(true);
        }

        if (Array.isArray(snapshot.locations) && snapshot.locations.length > 0) {
            const currentLocations = Array.isArray(window.registerLocations) ? window.registerLocations : [];
            const shouldApplySnapshotLocations =
                window.regWizard?.mode !== "PROFILE"
                || snapshot.locations.length > 0
                || currentLocations.length === 0;

            if (shouldApplySnapshotLocations) {
                console.log(` [Data Mirror] Restoring Locations (${snapshot.locations.length} entries)...`);
                snapshot.locations.forEach((loc, idx) => {
                    const status = window.registerLocationsApi?.render ? '✅ (Rendered)' : '❌ (Failed)';
                    const isPrimary = loc.is_primary ? 'Primary' : 'Secondary';
                    console.log(` ↳ Location #${idx + 1}: [${isPrimary}] ${loc.label || 'Unnamed'} -> ${status}`, window.registerLocationsApi?.render ? 'color: #27ae60;' : 'color: #e74c3c;');
                });
                window.registerLocations = snapshot.locations;
                window.DraftManagerInternals.restorePrimaryLocationDraft(snapshot.locations);
                if (window.registerLocationsApi?.render) window.registerLocationsApi.render();
            }
        } else {
            // Fallback to global saved location if draft is empty
            if (typeof registerRestoreSavedLocation === 'function') {
                console.log(` [DraftManager] No locations in snapshot. Falling back to global saved location...`);
                registerRestoreSavedLocation();
            }
        }

        // 🎨 UI Manifestation: Adopt the "Perfect Restore" logic from profile-modal
        window.DraftManagerInternals.syncSnapshotWidgets(snapshot);

        if (window.RegisterUxEngine) {
            console.log(` [DraftManager] Orchestrating UX synchronization (Profile-Modal Style)...`);
            if (typeof window.RegisterUxEngine.syncFieldValues === 'function') {
                window.RegisterUxEngine.syncFieldValues();
            }
            // Identity validation must happen before syncStepUI to ensure "valid" states are ready for Progressive Reveal
            window.DraftManagerInternals.syncIdentityValidationAfterRestore();

            if (typeof window.RegisterUxEngine.syncStepUI === 'function') {
                window.RegisterUxEngine.syncStepUI();
            }
        } else {
            window.DraftManagerInternals.syncIdentityValidationAfterRestore();
        }

        if (window.regWizard) {
            const total = Number(window.regWizard.totalSteps || window.RegisterState?.getFullState?.()?.totalSteps || 1);
            const targetStep = Number(snapshot.currentStep || window.RegisterState?.currentStep || 1);
            window.regWizard.currentStep = Math.max(1, Math.min(targetStep, Math.max(1, total)));
            window.regWizard.revealedStepCount = Math.max(window.regWizard.revealedStepCount || 1, window.regWizard.currentStep);
        }
    };

    window.DraftManagerInternals.restoreRolesAndStepDom = async function(snapshot) {
        if (!Array.isArray(snapshot?.selectedRoles)) return false;

        console.log(` [DraftRestoreDiag] Restoring roles before fields: (${snapshot.selectedRoles.join(', ')})`);
        document.querySelectorAll('.role-checkbox').forEach((checkbox) => {
            if (checkbox.disabled) return;
            checkbox.checked = snapshot.selectedRoles.includes(checkbox.value);
        });

        let roleSyncPromise = null;
        if (typeof registerUpdateRoleDescription === 'function') {
            roleSyncPromise = registerUpdateRoleDescription();
        }

        if (roleSyncPromise && typeof roleSyncPromise.then === "function") {
            console.log("[DraftRestoreDiag] Waiting for role-driven step reload before applying fields.");
            await roleSyncPromise;
        } else if (window.regWizard?.pendingStepReloadPromise && typeof window.regWizard.pendingStepReloadPromise.then === "function") {
            console.log("[DraftRestoreDiag] Waiting for pending step reload before applying fields.");
            await window.regWizard.pendingStepReloadPromise;
        }

        let activeSteps = (typeof registerGetActiveWizardSteps === 'function') ? registerGetActiveWizardSteps() : [];
        let renderedSteps = document.querySelectorAll('.reg-step');
        console.log(`[DraftRestoreDiag] Step DOM check after role sync: Active=${activeSteps.length}, Rendered=${renderedSteps.length}`);

        if (activeSteps.length !== renderedSteps.length && window.RegisterLoader?.loadSteps) {
            console.warn(`[DraftRestoreDiag] Step mismatch remains (${renderedSteps.length} rendered vs ${activeSteps.length} active). Forcing one more reload before field restore.`);
            await window.RegisterLoader.loadSteps();
        }

        if (typeof registerRefreshDynamicStepBindings === 'function') {
            registerRefreshDynamicStepBindings();
        } else if (typeof registerSetupStepBehaviors === 'function') {
            registerSetupStepBehaviors();
        }

        activeSteps = (typeof registerGetActiveWizardSteps === 'function') ? registerGetActiveWizardSteps() : [];
        renderedSteps = document.querySelectorAll('.reg-step');
        console.log(`[DraftRestoreDiag] Step DOM ready for field restore: Active=${activeSteps.length}, Rendered=${renderedSteps.length}`);
        return true;
    };

    window.DraftManagerInternals.restoreSnapshot = async function(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            if (window.regWizard && window.RegisterState?.currentStep) {
                window.regWizard.currentStep = window.RegisterState.currentStep;
                if (typeof registerUpdateWizardUI === 'function') registerUpdateWizardUI(true);
            }
            return;
        }

        await window.DraftManagerInternals.restoreRolesAndStepDom(snapshot);
        console.log("[DraftRestoreDiag] Applying snapshot after step DOM is stable.");
        window.DraftManagerInternals.applyCompleteSnapshot(snapshot);
        await window.DraftManagerInternals.runSequentialRestoration();
        return;
    };

    window.DraftManagerInternals.restoreSavedDraft = async function(options = {}) {
        const draft = window.DraftManagerInternals.loadDraft();
        if (draft && window.RegisterState) {
            if (draft.mode === (window.regWizard?.mode || 'REGISTER') || options.force) {
                window.DraftManagerInternals.sanitizeDraft(draft);
                console.log(` [DraftManager] Restoring saved session for ${draft.mode}... `);
                window.RegisterState.restoreFromData(draft.state);
                await window.DraftManagerInternals.restoreSnapshot(draft.snapshot || null);
                if (!options.skipBanner) window.DraftManagerInternals.showRecoverBanner();
                return true;
            }
        }
        return false;
    };
})();
