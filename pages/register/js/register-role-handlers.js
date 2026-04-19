/**
 * @file pages/register/js/register-role-handlers.js
 * @description Logic for role selection, dynamic descriptions, and the roles modal.
 */

/**
 * Updates the dynamic role description and synchronizes wizard steps.
 */
function registerUpdateRoleDescription() {
    const roles = registerGetSelectedAccountType();

    // ✅ ALWAYS Sync Wizard Steps first
    if (typeof registerUpdateWizardTotalSteps === 'function') {
        registerUpdateWizardTotalSteps();
    }

    const els = registerGetElements();

    // UI elements are optional in the new design
    const descBox = els.roleDescription;
    const descIcon = document.getElementById("reg-desc-role-icon");
    const descText = document.getElementById("reg-desc-role-text");

    if (descBox && descIcon && descText) {
        let iconClass = window.ROLE_ICONS?.COMBINATIONS?.[roles]
            || (roles === (window.ACCOUNT_ROLES?.BUYER || 1)
                ? (window.ROLE_ICONS?.BUYER || "fas fa-user-check")
                : null)
            || window.ROLE_ICONS?.COMBINATIONS?.FALLBACK
            || "fas fa-user-check";

        const text = typeof window.getRoleDescriptionText === 'function'
            ? window.getRoleDescriptionText(roles)
            : (window.langu("role_desc_fallback"));

        // Apply animation re-trigger
        descBox.style.animation = 'none';
        descBox.offsetHeight; /* trigger reflow */
        descBox.style.animation = null;

        descText.textContent = text;
        descIcon.className = iconClass;
        descBox.classList.add('visible');
    }
}

/**
 * Sets the checkboxes based on a bitmask value.
 * @param {number} bitmask 
 */
function registerSetSelectedAccountType(bitmask) {
    const roleCheckboxes = document.querySelectorAll('.role-checkbox');
    const targetBitmask = parseInt(bitmask || 1, 10);

    roleCheckboxes.forEach((chk) => {
        const val = parseInt(chk.value, 10);
        if (val === 1) {
            // Buyer is usually always on or part of the mask
            chk.checked = (targetBitmask & 1) === 1;
        } else {
            chk.checked = (targetBitmask & val) === val;
        }
    });

    // Update the UI description and step visibility
    registerUpdateRoleDescription();
}

/**
 * Keeps backward compatibility for any legacy callers that may still invoke
 * the old modal entry point after the UI was moved inline.
 */
function registerShowRolesModal() {
    const rolesGroup = document.getElementById("reg-roles-group");
    if (!rolesGroup) return;

    const firstInteractiveRole = rolesGroup.querySelector('.role-checkbox:not([disabled])');
    if (typeof firstInteractiveRole?.focus === 'function') {
        firstInteractiveRole.focus({ preventScroll: false });
    }
}
