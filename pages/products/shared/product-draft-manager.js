/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/products/shared/product-draft-manager.js
 * @description Centralized logic for managing persistent product drafts in LocalDBStorage.
 */

(function initProductDraftManager() {
    const LOG_PREFIX = '[ProductDraft]';

    const ProductDraftManager = {
        /**
         * Generates a unique key for the draft.
         */
        generateKey(providerKey, productKey, mainId, subId) {
            const safeProvider = String(providerKey || 'unknown');
            const safeProduct = String(productKey || 'new');
            const safeMain = String(mainId || '0');
            const safeSub = String(subId || '0');
            return `draft_${safeProvider}_${safeProduct}_${safeMain}_${safeSub}`;
        },

        /**
         * Saves draft data to LocalDBStorage with size protection.
         */
        saveDraft(key, data) {
            try {
                console.log(`${LOG_PREFIX} Attempting to save draft for key: ${key}`);

                // Deep copy to avoid mutating original
                const draftData = JSON.parse(JSON.stringify(data));

                // Estimate size for image protection (4MB limit)
                let draftString = JSON.stringify(draftData);
                if (draftString.length > 4000000) {
                    console.warn(`${LOG_PREFIX} Draft size exceeds 4MB. Removing images to protect storage.`);
                    draftData.images = []; // Drop images if too large
                    draftString = JSON.stringify(draftData);
                }

                LocalDBStorage.setItem(key, draftString);
                console.log(`${LOG_PREFIX} Draft saved successfully. Size: ${(draftString.length / 1024).toFixed(2)} KB`);
            } catch (error) {
                console.error(`${LOG_PREFIX} Error saving draft:`, error);
            }
        },

        /**
         * Loads draft data from LocalDBStorage.
         */
        loadDraft(key) {
            try {
                console.log(`${LOG_PREFIX} Checking for draft: ${key}`);
                const data = LocalDBStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    console.log(`${LOG_PREFIX} Draft found and loaded.`);
                    return parsed;
                }
            } catch (error) {
                console.error(`${LOG_PREFIX} Error loading draft:`, error);
            }
            return null;
        },

        /**
         * Deletes a specific draft.
         */
        clearDraft(key) {
            try {
                console.log(`${LOG_PREFIX} Clearing draft: ${key}`);
                LocalDBStorage.removeItem(key);
            } catch (error) {
                console.error(`${LOG_PREFIX} Error clearing draft:`, error);
            }
        },

        /**
         * Deep comparison to detect changes.
         */
        hasChanges(initial, current) {
            if (!initial || !current) return true;

            // Helper to clean object for comparison
            const clean = (obj) => {
                const c = JSON.parse(JSON.stringify(obj));
                // Ignore transient UI states
                delete c.lastSaved;
                return JSON.stringify(c);
            };

            const initialStr = clean(initial);
            const currentStr = clean(current);
            const changed = initialStr !== currentStr;

            if (changed) {
                console.log(`${LOG_PREFIX} Change detected in data.`);
            }
            return changed;
        },

        /**
         * Converts a File object to Base64.
         */
        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
    };

    window.ProductDraftManager = ProductDraftManager;
    console.log(`${LOG_PREFIX} Manager initialized.`);
})();
