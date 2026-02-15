/**
 * @file orderStage/orderData/js/status-parser.js
 * @description Handles parsing and default structure of the Order Status JSON blob.
 *              Moved from generic tools.js to be part of the Order Stage domain.
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
    if (!rawValue || typeof rawValue !== "string" || rawValue.trim() === "") {
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
