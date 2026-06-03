/**
 * @file orderStage/orderData/js/status-parser.js
 * @description Handles parsing and default structure of the Order Status JSON blob.
 *              Moved from generic tools.js to be part of the Order Stage domain.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Default component for the order status in the new JSON format.
 */
window.DEFAULT_ORDER_STATUS_JSON = {
    version: "2.0",
    step_id: "0",
    last_updated: new Date().toISOString(),
    unavailable_product_keys: [],
    item_statuses: {},
    step_dates: {}
};

/**
 * @description Parses the order status into a structured JSON object.
 *   Assumes data has been migrated to JSON via database-analysis script.
 * @function parseOrderStatus
 * @param {string | null | undefined} rawValue - JSON string stored in `order_status`.
 * @returns {object} - Standardized status object.
 */
window.parseOrderStatus = function (rawValue) {
    if (!rawValue) {
        return { ...window.DEFAULT_ORDER_STATUS_JSON };
    }

    if (typeof rawValue === "object") {
        return { ...window.DEFAULT_ORDER_STATUS_JSON, ...rawValue };
    }

    if (typeof rawValue !== "string" || rawValue.trim() === "") {
        return { ...window.DEFAULT_ORDER_STATUS_JSON };
    }

    try {
        const trimmed = rawValue.trim();
        if (trimmed.startsWith('{')) {
            return JSON.parse(trimmed);
        }
    } catch (e) {
        console.error("[StatusParser] JSON parse error:", e);
    }

    // Pure fallback for unexpected non-JSON data
    return { ...window.DEFAULT_ORDER_STATUS_JSON };
};
