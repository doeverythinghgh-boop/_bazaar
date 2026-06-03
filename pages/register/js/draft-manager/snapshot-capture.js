/**
 * @file pages/register/js/draft-manager/snapshot-capture.js
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

    window.DraftManagerInternals.captureSnapshot = function() {
        const fields = {};
        let savedCount = 0;

        console.log(` [Data Mirror] Capturing Form Snapshot by IDs...`);

        document.querySelectorAll('#register_form input[id], #register_form textarea[id], #register_form select[id]').forEach((element) => {
            if (!element.id || element.type === 'file' || element.dataset.phoneIndex != null) return;
            if (element.id === 'profile_current_password') return;

            let valueToSave;
            if (element.type === 'checkbox' || element.type === 'radio') {
                valueToSave = !!element.checked;
                fields[element.id] = valueToSave;
            } else {
                valueToSave = element.value;
                fields[element.id] = valueToSave;
            }

            savedCount++;
            const displayVal = (typeof valueToSave === 'boolean') ? valueToSave : (valueToSave ? `"${valueToSave}"` : '(Empty)');
            console.log(` ↳ Saved Field ID [${element.id}] = ${displayVal}`);
        });

        const selectedRoles = Array.from(document.querySelectorAll('.role-checkbox:checked')).map((input) => input.value);
        console.log(` ↳ Saved Roles = [${selectedRoles.join(', ')}]`);

        // 🛡️ Force sync phone entries directly from the live DOM just in case the memory array is stale
        if (Array.isArray(window.registerPhoneEntries)) {
            document.querySelectorAll('.register-phone-number-input').forEach((input) => {
                const index = parseInt(input.dataset.phoneIndex || "-1", 10);
                if (index >= 0 && window.registerPhoneEntries[index]) {
                    window.registerPhoneEntries[index].number = input.value;
                }
            });
        }

        const phoneEntries = Array.isArray(window.registerPhoneEntries) ? window.registerPhoneEntries : [];
        console.log(` ↳ Saved Phones (${phoneEntries.length} entries)`);
        phoneEntries.forEach((p, idx) => {
             console.log(` - Phone #${idx + 1}: ${p.number || '(Empty)'} [Primary: ${p.is_primary}]`);
        });

        const locations = Array.isArray(window.registerLocations) ? window.registerLocations : [];
        console.log(` ↳ Saved Locations (${locations.length} entries)`);

        console.log(` [Data Mirror] Snapshot Complete: ${savedCount} fields, ${selectedRoles.length} roles, ${phoneEntries.length} phones, ${locations.length} locations.`);

        return {
            fields,
            selectedRoles,
            phoneEntries,
            locations,
            currentStep: Number(window.regWizard?.currentStep || window.RegisterState?.currentStep || 1)
        };
    };
})();
