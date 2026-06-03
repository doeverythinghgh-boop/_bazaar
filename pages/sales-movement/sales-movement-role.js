/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
var salesMovement_ROLE_STORAGE_KEY = "current_viewing_order_role";

function salesMovement_unwrapApiPayload(payload) {
    if (
        payload &&
        typeof payload === "object" &&
        Object.prototype.hasOwnProperty.call(payload, "success") &&
        Object.prototype.hasOwnProperty.call(payload, "data") &&
        Object.prototype.hasOwnProperty.call(payload, "error")
    ) {
        if (payload.success === false) {
            throw new Error(payload?.error?.message || "API request failed");
        }
        return payload.data;
    }

    return payload;
}

var salesMovement_ROLE_DEFINITIONS = {
    buyer: {
        apiRole: "purchaser",
        icon: "fas fa-shopping-cart"
    },
    commercial: {
        apiRole: "commercial",
        icon: "fas fa-store"
    },
    delivery: {
        apiRole: "delivery",
        icon: "fas fa-truck"
    },
    admin: {
        apiRole: "admin",
        icon: "fas fa-user-gear"
    }
};

function salesMovement_getRoleTitle(role) {
    var titles = {
        buyer: window.langu("sales_role_buyer_title") || "Your Orders as Buyer",
        commercial: window.langu("sales_role_commercial_title") || "Your Orders as Merchant",
        delivery: window.langu("sales_role_delivery_title") || "Your Orders as Delivery",
        admin: window.langu("sales_role_admin_title") || "All Orders"
    };
    return titles[role] || role;
}

function salesMovement_getSectionEmptyText(role) {
    var messages = {
        buyer: window.langu("sales_empty_buyer") || "No buyer orders found.",
        commercial: window.langu("sales_empty_commercial") || "No service-provider orders found.",
        delivery: window.langu("sales_empty_delivery") || "No delivery orders found.",
        admin: window.langu("sales_empty_admin") || "No orders found."
    };
    return messages[role] || (window.langu("sales_no_orders") || "No orders found.");
}

function salesMovement_getCurrentUser() {
    return window.userSession || (typeof SessionManager !== "undefined" && SessionManager.getUser ? SessionManager.getUser() : null) || null;
}

function salesMovement_isAdminUser(user) {
    if (!user) return false;
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    return !!capabilities?.isAdmin;
}

function salesMovement_getRolePlan() {
    var user = salesMovement_getCurrentUser();
    if (!user) return [];

    var isImpersonating = !!LocalDBStorage.getItem("originalAdminSession");
    if (salesMovement_isAdminUser(user) || isImpersonating) {
        return ["admin"];
    }

    var capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    var roles = ["buyer"];

    if (capabilities?.isCommercial) {
        roles.push("commercial");
    }

    if (capabilities?.canDeliver) {
        roles.push("delivery");
    }

    return roles;
}

function salesMovement_formatDate(salesMovement_dateString) {
    try {
        var dateStr = salesMovement_dateString;
        if (dateStr && !dateStr.includes("Z") && !dateStr.includes("+")) {
            dateStr = dateStr.replace(" ", "T") + "Z";
        }

        var salesMovement_date = new Date(dateStr);

        if (isNaN(salesMovement_date.getTime())) {
            return new Date(salesMovement_dateString).toLocaleString(LocalDBStorage.getItem("app_language") === "en" ? "en-US" : "ar-EG");
        }

        return salesMovement_date.toLocaleString(LocalDBStorage.getItem("app_language") === "en" ? "en-US" : "ar-EG", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        });
    } catch (salesMovement_error) {
        console.error("Error formatting date:", salesMovement_error);
        return salesMovement_dateString;
    }
}
