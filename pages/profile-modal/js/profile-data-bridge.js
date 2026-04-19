/**
 * @file pages/profile-modal/js/profile-data-bridge.js
 * @description Bridges UserService and RegisterState to prepopulate the Profile Wizard.
 */

window.ProfileDataBridge = (function () {
    'use strict';

    /**
     * Fetches the current logged-in user and populates RegisterState.
     * @returns {Promise<boolean>}
     */
    async function primeWizardState() {
        console.log("[ProfileDataBridge] Fetching user data for wizard...");

        if (!window.UserService || !window.RegisterState) {
            console.error("[ProfileDataBridge] Core services (UserService/RegisterState) missing!");
            return false;
        }

        const user = window.UserService.get();
        if (!user) {
            console.error("[ProfileDataBridge] No logged-in user found!");
            return false;
        }

        console.log("[ProfileDataBridge] Mapping user data to wizard fields:", user.username);

        try {
            // 1. Sync Roles/Account Type (Bitmask support)
            const roles = parseInt(user.account_type || 1, 10);
            if (typeof registerSetSelectedAccountType === 'function') {
                registerSetSelectedAccountType(roles);
            }

            // 2. Map Core Fields (Identity)
            // SANITIZATION: If username is just a phone number, treat it as empty for the UI
            const rawUsername = user.username || '';
            const isPhoneNumber = /^[0-9+ ]+$/.test(rawUsername) && rawUsername.length > 8;
            updateWizardField('username', isPhoneNumber ? '' : rawUsername);
            
            // Map Phones
            if (Array.isArray(user.phones) && user.phones.length) {
                // Seed the global entries that register-phone-helpers uses
                if (typeof registerCreatePhoneEntry === 'function') {
                    window.registerPhoneEntries = user.phones.map(p => {
                        const entry = registerCreatePhoneEntry(p);
                        // ENFORCE PARITY: Primary phone MUST have whatsapp enabled
                        if (entry.is_primary) entry.has_whatsapp = true;
                        return entry;
                    });
                }
                
                const primary = user.phones.find(p => p.is_primary)?.number || user.phone;
                updateWizardField('phone', primary);
                
                // Trigger an immediate render if the element exists
                if (typeof registerRenderPhones === 'function') registerRenderPhones();
            } else if (user.phone) {
                // Fallback for users with only the legacy single phone field
                if (typeof registerCreatePhoneEntry === 'function') {
                    const fallbackEntry = registerCreatePhoneEntry({ number: user.phone, is_primary: true });
                    fallbackEntry.has_whatsapp = true; // Primary must have WhatsApp
                    window.registerPhoneEntries = [fallbackEntry];
                }
                updateWizardField('phone', user.phone);
                if (typeof registerRenderPhones === 'function') registerRenderPhones();
            }

            // 3. Map Business Fields
            updateWizardField('businessName', user.business_name || '');
            updateWizardField('businessTagline', user.business_bio || '');
            
            // Map Delivery & Limit (Settings)
            if (user.settings) {
                try {
                    const settings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings;
                    updateWizardField('register_is-delivered', !!settings.isDelivered);
                    updateWizardField('register_limit-package', settings.limitPackage || 0);
                    // Also sync the native inputs since some logic reads them directly
                    const delInput = document.getElementById('register_is-delivered');
                    if (delInput) delInput.checked = !!settings.isDelivered;
                    const limitInput = document.getElementById('register_limit-package');
                    if (limitInput) limitInput.value = settings.limitPackage || 0;

                    // Rating Settings
                    updateWizardField('register_rating_enabled', settings.ratingEnabled !== false);
                    updateWizardField('register_product_rating_enabled', settings.productRatingEnabled !== false);
                    
                    const ratEn = document.getElementById('register_rating_enabled');
                    if (ratEn) ratEn.checked = settings.ratingEnabled !== false;
                    const pratEn = document.getElementById('register_product_rating_enabled');
                    if (pratEn) pratEn.checked = settings.productRatingEnabled !== false;

                    const ratMode = settings.ratingMode || 'stars_comments';
                    const pratMode = settings.productRatingMode || 'stars_comments';
                    
                    const ratModeInput = document.getElementById(`register_rating_mode_${ratMode}`);
                    if (ratModeInput) ratModeInput.checked = true;
                    const pratModeInput = document.getElementById(`register_product_rating_mode_${pratMode}`);
                    if (pratModeInput) pratModeInput.checked = true;

                } catch (e) {
                    console.warn("[ProfileDataBridge] Failed to parse settings", e);
                }
            }

            // 4. Map Images (Avatar & Covers)
            if (user.user_image) {
                try {
                    const imageData = typeof user.user_image === 'string' ? JSON.parse(user.user_image) : user.user_image;
                    if (imageData.avatar) {
                        const avatarEl = document.getElementById('register_avatar-preview');
                        if (avatarEl) {
                            avatarEl.src = imageData.avatar.startsWith('http') ? imageData.avatar : `/api/images/${imageData.avatar}`;
                            avatarEl.style.display = 'block';
                            const placeholder = document.getElementById('register_avatar-placeholder');
                            if (placeholder) placeholder.style.display = 'none';
                        }
                    }
                    if (Array.isArray(imageData.covers)) {
                        // We will let the specialized managers handle their own specialized UI later if needed,
                        // but we prime the window globals that they use.
                        window.registerPendingCovers = imageData.covers;
                        // Trigger a re-render of cover slots if the manager is found
                        if (typeof registerRenderCovers === 'function') registerRenderCovers();
                    }
                } catch (e) {
                    console.warn("[ProfileDataBridge] Failed to parse user_image", e);
                }
            }
            
            // For Categories (Json string -> parsed)
            if (user.business_category) {
                try {
                    const catData = typeof user.business_category === 'string' 
                        ? JSON.parse(user.business_category) 
                        : user.business_category;
                    // Categories logic usually relies on its own manager, we just prime the state
                    updateWizardField('categories', catData);
                } catch (e) {
                    console.warn("[ProfileDataBridge] Failed to parse business_category", e);
                }
            }

            // 4. Map Location & Address
            updateWizardField('address', user.address || '');
            updateWizardField('location', user.location || '');

            // 5. Map Social Links
            if (user.links) {
                try {
                    const linksData = typeof user.links === 'string' 
                        ? JSON.parse(user.links) 
                        : user.links;
                    updateWizardField('links', linksData);
                } catch (e) {
                    console.warn("[ProfileDataBridge] Failed to parse links", e);
                }
            }

            // 6. Security Fields (Leave password empty by default)
            updateWizardField('currentPassword', '');
            updateWizardField('password', '');
            updateWizardField('confirmPassword', '');

            // 7. Sync Wizard Meta
            if (typeof registerUpdateWizardTotalSteps === 'function') {
                registerUpdateWizardTotalSteps();
            }

            return true;
        } catch (error) {
            console.error("[ProfileDataBridge] Error durante data mapping:", error);
            return false;
        }
    }

    /**
     * Helper to update RegisterState atomically.
     */
    function updateWizardField(fieldId, value) {
        if (!window.RegisterState) return;
        
        // We set state to 'valid' for existing data to allow transition
        // except for passwords which are mandatory to leave empty/manage
        const fieldState = (value && fieldId !== 'password' && fieldId !== 'currentPassword') ? 'valid' : 'idle';
        
        window.RegisterState.updateField(fieldId, value, fieldState);
    }

    return {
        primeWizardState
    };
})();
