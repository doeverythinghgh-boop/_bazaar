/**
 * @file pages/cardPackage/js/cartPackage-api.js
 * @description Firestore service for cart package operations.
 * Handles order creation without the legacy HTTP order API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Creates a new order in Firestore.
 * @function createOrder
 * @param {object} orderData - An object containing all the data for the order to be created.
 * @param {string} orderData.order_key - The unique key generated for the order.
 * @param {string} orderData.user_key - The key of the user who placed the order.
 * @param {number} orderData.total_amount - The total amount of the order.
 * @param {Array<object>} orderData.items - An array of products included in the order.
 * @returns {Promise<Object>} - A Promise that resolves with the created order data object, or an error object if it fails.
 */
async function fetchFirestoreDeliveryRelations(db, sellerKeys) {
    const relationsBySeller = new Map();

    await Promise.all(sellerKeys.map(async (sellerKey) => {
        const snapshot = await db.collection('supplier_deliveries')
            .where('seller_key', '==', sellerKey)
            .get();

        const relations = [];
        snapshot.forEach((doc) => {
            const relation = doc.data() || {};
            const deliveryKey = relation.delivery_key || relation.deliveryKey || relation.user_key;
            if (!deliveryKey || relation.is_active === false || relation.isActive === false) return;
            relations.push({
                delivery_key: deliveryKey,
                delivery_name: relation.delivery_name || relation.username || relation.business_name || deliveryKey,
                delivery_phone: relation.delivery_phone || relation.phone || relation.primary_phone || "",
                delivery_location: relation.delivery_location || relation.location || relation.user_location || "",
                fcmToken: relation.fcmToken || relation.fcm_token || ""
            });
        });

        relationsBySeller.set(sellerKey, relations);
    }));

    return relationsBySeller;
}

async function createOrder(orderData) {
    try {
        console.log("[createOrder] Starting Firestore order creation process...");

        // 1. Ensure Firestore db is loaded and initialized
        if (typeof window.ensureFirestoreDb !== 'function') {
            throw new Error("ensureFirestoreDb function is not loaded/available");
        }
        console.log("[createOrder] Ensuring Firestore database connection...");
        const db = await window.ensureFirestoreDb();
        console.log("[createOrder] Firestore connection established.");

        // 2. Extract unique seller_keys from items
        const sellerKeys = [...new Set(orderData.items.map(item => item.seller_key))];
        console.log("[createOrder] Unique seller keys in order:", sellerKeys);

        // 3. Resolve active seller-delivery relations from Firestore.
        const relationsBySeller = await fetchFirestoreDeliveryRelations(db, sellerKeys);

        const timestamp = new Date().toISOString();
        const currentUser = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null) || {};
        const deliveryKeysSet = new Set();
        const orderItems = orderData.items.map(item => {
            const sellerIsDelivered = item.seller_is_delivered ?? item.sellerIsDelevred ?? item.isDelivered ?? 0;
            const supplierDelivery = Number(sellerIsDelivered) === 1
                ? []
                : (relationsBySeller.get(item.seller_key) || []);
            supplierDelivery.forEach((delivery) => {
                if (delivery.delivery_key) deliveryKeysSet.add(delivery.delivery_key);
            });

            return {
                product_key: item.product_key,
                quantity: parseInt(item.quantity) || 1,
                seller_key: item.seller_key,
                note: item.note || "",
                product_name: item.product_name || item.productName || "",
                catalog_product_price: parseFloat(item.catalog_product_price ?? item.product_price ?? item.price ?? 0) || 0,
                product_price: parseFloat(item.product_price ?? item.catalog_product_price ?? item.price ?? 0) || 0,
                original_price: parseFloat(item.original_price || 0) || 0,
                realPrice: item.realPrice ?? item.real_price ?? item.product_price ?? item.price ?? 0,
                image: item.image || "",
                seller_name: item.seller_name || item.sellerName || "",
                seller_phone: item.seller_phone || item.sellerPhone || "",
                seller_location: item.seller_location || "",
                seller_is_delivered: sellerIsDelivered,
                serviceType: item.serviceType ?? item.type ?? 0,
                heavyLoad: item.heavyLoad || item.heavy_load || 0,
                MainCategory: item.MainCategory || item.main_category_id || item.mainCategory || "",
                SubCategory: item.SubCategory || item.sub_category_id || item.subCategory || "",
                item_type: item.item_type || item.listing_type || "",
                car_key: item.car_key || "",
                real_estate_key: item.real_estate_key || "",
                is_car_listing: !!item.is_car_listing,
                is_real_estate_listing: !!item.is_real_estate_listing,
                is_pharmacy_product: !!item.is_pharmacy_product,
                pharmacy_seller_key: item.pharmacy_seller_key || "",
                supplier_delivery: supplierDelivery
            };
        });

        const deliveryKeys = Array.from(deliveryKeysSet);
        console.log("[createOrder] Active delivery keys assigned to order:", deliveryKeys);

        // 4. Construct the NoSQL order document matching the specified structure
        const firestoreOrderData = {
            order_key: orderData.order_key,
            user_key: orderData.user_key,
            user_name: currentUser.username || currentUser.name || currentUser.full_name || "",
            user_phone: currentUser.phone || currentUser.phoneNumber || "",
            user_address: currentUser.address || currentUser.user_address || "",
            user_location: currentUser.location || currentUser.user_location || "",
            user_platform: currentUser.platform || "web",
            user_fcm_token: currentUser.fcm_token || currentUser.fcmToken || "",
            total_amount: parseFloat(orderData.total_amount) || 0,
            orderType: orderData.orderType !== undefined ? orderData.orderType : 0,
            status_version: "2.1",
            current_step_id: "0",
            created_at: timestamp,
            status_last_updated: timestamp,
            seller_keys: sellerKeys,
            delivery_keys: deliveryKeys,
            order_items: orderItems,
            pharmacy_products: orderData.pharmacy_products || [],
            order_status: {
                step_id: "0",
                last_updated: timestamp,
                unavailable_product_keys: [],
                item_statuses: {}
            }
        };

        console.log("[createOrder] Document payload to save in Firestore:", firestoreOrderData);

        // 5. Write document directly to Firestore under orders collection
        await db.collection('orders').doc(orderData.order_key).set(firestoreOrderData);
        console.log(`[createOrder] Order ${orderData.order_key} written to Firestore successfully.`);

        // 6. Return response matching expected format
        return {
            success: true,
            order_key: orderData.order_key,
            order: firestoreOrderData
        };

    } catch (err) {
        console.error("[createOrder] Firestore order creation failed:", err);
        return {
            success: false,
            error: err.message || "Failed to create order in Firestore."
        };
    }
}
