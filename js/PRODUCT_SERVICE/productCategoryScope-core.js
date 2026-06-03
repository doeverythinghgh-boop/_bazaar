/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file js/PRODUCT_SERVICE/productCategoryScope-core.js
 * @description Core helpers for user session and role resolution within category scope.
 */

(function () {
    'use strict';
    window.ProductCategoryScope = window.ProductCategoryScope || {};

    function getCurrentUser() {
        if (window.userSession) return window.userSession;
        if (typeof SessionManager !== 'undefined' && typeof SessionManager.getUser === 'function') {
            const sessionUser = SessionManager.getUser();
            if (sessionUser) return sessionUser;
        }
        try {
            const raw = LocalDBStorage.getItem('loggedInUser');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (error) {
            console.warn('[ProductCategoryScope] Failed to restore user from LocalDBStorage:', error);
        }
        return null;
    }

    function isSpecialUser(user) {
        if (!user) return false;
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
        if (capabilities?.isAdmin) return true;

        const systemRole = String(user.system_role || user.role || '').trim().toLowerCase();
        if (systemRole === 'admin' || systemRole === 'super_admin') {
            return true;
        }

        const runtimeAdminIds = Array.isArray(window.adminIds)
            ? window.adminIds
            : (Array.isArray(window.runtimeConfig?.auth?.adminIds) ? window.runtimeConfig.auth.adminIds : []);
        if (user?.user_key && runtimeAdminIds.map(String).includes(String(user.user_key))) {
            return true;
        }

        const accountType = Number(user.account_type);
        if (Number.isFinite(accountType) && accountType >= 32) {
            return true;
        }

        return false;
    }

    function normalizeFilterMap(raw) {
        if (typeof window.normalizeBusinessCategoryMap === 'function') {
            return window.normalizeBusinessCategoryMap(raw);
        }

        if (!raw) return {};
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (!trimmed) return {};
            if (!trimmed.startsWith('{')) {
                return { [String(trimmed)]: [] };
            }
            try {
                raw = JSON.parse(trimmed);
            } catch (error) {
                console.warn('[ProductCategoryScope] Failed to parse scoped filter JSON:', error);
                return {};
            }
        }

        const normalized = {};
        Object.entries(raw).forEach(([mainId, subIds]) => {
            const key = String(mainId);
            normalized[key] = Array.isArray(subIds) ? subIds.map(String) : [];
        });
        return normalized;
    }

    // Export internal helpers for other split files
    window.ProductCategoryScope.getCurrentUser = getCurrentUser;
    window.ProductCategoryScope.isSpecialUser = isSpecialUser;
    window.ProductCategoryScope.normalizeFilterMap = normalizeFilterMap;
})();
