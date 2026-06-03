/**
 * @file orderStage/order-db-manager.js
 * @description LocalDB-backed order storage bridge.
 */

var ORDERS_STORE = "orders";

function orderNormalizeStatus(rawStatus, fallbackStep, fallbackUpdatedAt) {
    var defaults = {
        version: "2.1",
        step_id: String(fallbackStep ?? "0"),
        last_updated: fallbackUpdatedAt || new Date().toISOString(),
        unavailable_product_keys: [],
        item_statuses: {},
        step_dates: {}
    };

    if (!rawStatus) return defaults;
    if (typeof rawStatus === "object") return { ...defaults, ...rawStatus };
    if (typeof rawStatus !== "string") return defaults;

    try {
        var trimmed = rawStatus.trim();
        if (trimmed.startsWith("{")) return { ...defaults, ...JSON.parse(trimmed) };
    } catch (error) {
        console.error("[OrderDB] Failed to normalize order_status:", error);
    }

    return defaults;
}

function orderNormalizeItem(item) {
    if (!item || typeof item !== "object") return item;

    var price = item.catalog_product_price ?? item.product_price ?? item.price ?? item.pricePerItem ?? 0;
    var sellerLocation = item.seller_location || "";
    if (!sellerLocation && item.seller_lat && item.seller_lng) {
        sellerLocation = `${item.seller_lat},${item.seller_lng}`;
    }

    return {
        ...item,
        product_name: item.product_name || item.productName || item.name || item.product_key || "",
        productName: item.productName || item.product_name || item.name || item.product_key || "",
        catalog_product_price: parseFloat(price) || 0,
        product_price: parseFloat(item.product_price ?? price) || 0,
        original_price: parseFloat(item.original_price || 0) || 0,
        realPrice: item.realPrice ?? item.real_price ?? price,
        seller_name: item.seller_name || item.sellerName || item.seller_username || item.seller_key || "",
        seller_phone: item.seller_phone || item.sellerPhone || "",
        seller_location: sellerLocation,
        seller_is_delivered: item.seller_is_delivered ?? item.sellerIsDelevred ?? item.isDelivered ?? 0,
        serviceType: item.serviceType ?? item.type ?? 0,
        supplier_delivery: Array.isArray(item.supplier_delivery) ? item.supplier_delivery : []
    };
}

function orderNormalizeRecord(order) {
    if (!order || typeof order !== "object") return order;

    var timestamp = order.created_at || order.createdAt || order.status_last_updated || new Date().toISOString();
    var sourceItems = Array.isArray(order.order_items) ? order.order_items : [];
    var orderItems = sourceItems.map(orderNormalizeItem).filter(Boolean);
    var sellerKeys = Array.from(new Set([
        ...(Array.isArray(order.seller_keys) ? order.seller_keys : []),
        ...orderItems.map((item) => item && item.seller_key).filter(Boolean)
    ]));
    var deliveryKeys = Array.from(new Set([
        ...(Array.isArray(order.delivery_keys) ? order.delivery_keys : []),
        ...orderItems.flatMap((item) => (item.supplier_delivery || []).map((delivery) => delivery.delivery_key || delivery.deliveryKey || delivery.user_key)).filter(Boolean)
    ]));
    var status = orderNormalizeStatus(order.order_status, order.current_step_id, order.status_last_updated || timestamp);

    return {
        ...order,
        created_at: timestamp,
        status_last_updated: order.status_last_updated || status.last_updated || timestamp,
        current_step_id: String(order.current_step_id ?? status.step_id ?? "0"),
        seller_keys: sellerKeys,
        delivery_keys: deliveryKeys,
        order_items: orderItems,
        order_status: status
    };
}

async function orderInitDB() {
    await window.LocalDB.ready();
    return window.LocalDB;
}

async function orderSaveToLocalDB(order, roleContext) {
    await orderInitDB();
    var normalizedOrder = orderNormalizeRecord(order);
    var requestedRole = roleContext || normalizedOrder.role_context || "buyer";
    var resolvedRole = requestedRole === "merchant" ? "commercial" : requestedRole;
    var orderToSave = {
        ...normalizedOrder,
        storage_key: `${resolvedRole}::${normalizedOrder.order_key}`,
        role_context: resolvedRole,
        last_sync_at: new Date().toISOString()
    };

    await window.LocalDB.put(ORDERS_STORE, orderToSave);
    return orderToSave.storage_key;
}

async function orderGetLocal(role) {
    await orderInitDB();
    var normalizedRole = role === "merchant" ? "commercial" : role;
    var orders = await window.LocalDB.getAll(ORDERS_STORE);
    return orders
        .map(orderNormalizeRecord)
        .filter((order) => !normalizedRole || order.role_context === normalizedRole)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function orderGetLastTimestamp(role) {
    var orders = await orderGetLocal(role);
    if (orders.length === 0) return null;
    return orders[0].created_at;
}

async function orderGetByKey(orderKey, preferredRole) {
    await orderInitDB();
    var rolePreference = preferredRole || LocalDBStorage.getItem("current_viewing_order_role") || "";
    var matches = (await window.LocalDB.getAll(ORDERS_STORE))
        .map(orderNormalizeRecord)
        .filter((order) => String(order.order_key || "") === String(orderKey || ""));

    if (matches.length === 0) return null;
    if (rolePreference) {
        var roleMatch = matches.find((entry) => entry.role_context === rolePreference);
        if (roleMatch) return roleMatch;
    }

    return matches.sort((a, b) => new Date(b.last_sync_at || b.created_at) - new Date(a.last_sync_at || a.created_at))[0] || null;
}
