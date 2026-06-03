/**
 * @file pages/ADMIN/adminPanel-search-state.js
 * @description Search cache and filter state for the admin panel.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


var allUsers_cache = [];
const ADMIN_ROLE_FILTER_DELIVERY = 64;
const ADMIN_ROLE_FILTER_ALL_BITS = 1 | 32 | ADMIN_ROLE_FILTER_DELIVERY;
var adminFilterState = {
    roleBits: ADMIN_ROLE_FILTER_ALL_BITS,
    adminOnly: false,
    recentCreatedDays: "",
    recentLoginDays: ""
};

const ADMIN_ROLE_FILTER_OPTIONS = [
    { value: 1, labelKey: "admin_filter_role_buyer", fallback: "Buyer", locked: true },
    { value: 32, labelKey: "admin_filter_role_provider", fallback: "merchant" },
    { value: ADMIN_ROLE_FILTER_DELIVERY, labelKey: "admin_filter_role_delivery", fallback: "Delivery Service" }
];

function resetAdminFilters() {
    adminFilterState = {
        roleBits: ADMIN_ROLE_FILTER_ALL_BITS,
        adminOnly: false,
        recentCreatedDays: "",
        recentLoginDays: ""
    };
}
