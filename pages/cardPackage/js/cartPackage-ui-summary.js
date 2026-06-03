/**
 * @file pages/cardPackage/js/cartPackage-ui-summary.js
 * @description UI logic for updating the cart summary.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Updates the cart summary section with the total item count, subtotal, savings, and final total.
 * Now calculates Smart Delivery cost asynchronously.
 * @async
 * @function cartPage_updateCartSummary
 * @returns {Promise<void>}
 */
async function cartPage_updateCartSummary() {
    try {
        const cartPage_itemCount = getCartItemCount();
        const cartPage_subtotal = getCartTotalPrice();
        const cartPage_savings = getCartTotalSavings();

        // 1. Load Config & Currency FIRST
        let currency = window.langu('cart_currency');
        let officeCoords = { lat: 29.968897130919654, lng: 32.53395080566407 }; // Fallback

        if (typeof loadDeliveryConfig === 'function') {
            try {
                const config = await loadDeliveryConfig();
                if (config && config.defaults) {
                    // Use translation system first, fallback to config only if translation fails
                    currency = window.langu('cart_currency') || config.defaults.currency_symbol || currency;
                    if (config.defaults.office_location) {
                        officeCoords = config.defaults.office_location;
                        console.log(" [Config] Done loading .");
                    }
                }
            } catch (e) {
                console.warn("Could not load delivery config, using fallbacks.", e);
            }
        }

        // Update basic values immediately
        document.getElementById('cartPage_itemCount').textContent = cartPage_itemCount;
        document.getElementById('cartPage_subtotal').textContent = cartPage_subtotal.toFixed(2) + ' ' + currency;
        document.getElementById('cartPage_savings').textContent = cartPage_savings.toFixed(2) + ' ' + currency;

        // Hide subtotal row if value is 0
        const subtotalRow = document.getElementById('cartPage_summaryRowSubtotal');
        if (subtotalRow) subtotalRow.style.display = cartPage_subtotal > 0 ? '' : 'none';

        // Hide savings row if value is 0
        const savingsRow = document.getElementById('cartPage_summaryRowSavings');
        if (savingsRow) savingsRow.style.display = cartPage_savings > 0 ? '' : 'none';

        // 🚛 Fixed Delivery Fee Logic
        const cart = getCart();
        const needsSystemDelivery = cart.some(item => parseInt(item.sellerIsDelevred || item.isDelivered) !== 1);

        const FIXED_DELIVERY_FEE = needsSystemDelivery ? 40 : 0;
        const fixedDeliveryRow = document.getElementById('cartPage_summaryRowFixedDelivery');
        const fixedDeliveryElement = document.getElementById('cartPage_fixedDeliveryFee');

        if (fixedDeliveryRow) {
            fixedDeliveryRow.style.display = needsSystemDelivery ? 'flex' : 'none';
        }
        if (fixedDeliveryElement) {
            fixedDeliveryElement.textContent = FIXED_DELIVERY_FEE.toFixed(2) + ' ' + currency;
        }

        // 🧠 Calculate Smart Delivery Cost
        const smartDeliveryRow = document.getElementById('cartPage_summaryRowSmartDelivery');
        const smartDeliveryElement = document.getElementById('cartPage_smartDeliveryFee');

        // Check for Admin
        const user = window.userSession;
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
        const isAdmin = !!capabilities?.isAdmin;

        if (smartDeliveryRow) {
            // Only show smart delivery to admin AND if there are items needing delivery
            smartDeliveryRow.style.display = (isAdmin && needsSystemDelivery) ? 'flex' : 'none';
        }

        // (Office coords already loaded above)

        // Get Customer Location from Session or use Default
        let customerCoords = { lat: 30.0500, lng: 31.2400 }; // Default fallback
        console.log(" [Debug] Check user :", window.userSession);

        if (window.userSession) {
            // Priority 1: Check if lat/lng exist as direct properties
            if (window.userSession.lat && window.userSession.lng) {
                customerCoords = {
                    lat: parseFloat(window.userSession.lat),
                    lng: parseFloat(window.userSession.lng)
                };
                console.log(" [Session] Done lat/lng .");
            }
            // Priority 2: Check standard 'location' field (handle Location or location)
            const locField = window.userSession.location || window.userSession.location;
            if (locField && String(locField).includes(',')) {
                const [lat, lng] = String(locField).split(',');
                customerCoords = {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                };
                console.log(" [Session] Done (Location/location).");
            } else {
                console.warn("️ [Session] Done !");
                console.log(" [Tip] Update ' ' .");
                console.log("️ [Session Debug]: Check Done :", {
                    "userSession.location": window.userSession.location,
                    "userSession.lat": window.userSession.lat,
                    "userSession.lng": window.userSession.lng,
                    "userSession.Address": window.userSession.Address,
                    "Raw Keys": Object.keys(window.userSession)
                });
            }
        }

        try {
            // Check if calculateCartDeliveryCost is available
            if (typeof calculateCartDeliveryCost === 'function') {
                const deliveryResult = await calculateCartDeliveryCost(officeCoords, customerCoords);

                if (deliveryResult && !deliveryResult.error) {
                    const smartFee = deliveryResult.totalCost;
                    smartDeliveryElement.textContent = smartFee.toFixed(2) + ' ' + window.langu('cart_currency');

                    // Store delivery details globally for the details button
                    window.lastDeliveryCalculation = deliveryResult;

                    // Show details button
                    const detailsBtn = document.getElementById('cartPage_deliveryDetailsBtn');
                    if (detailsBtn) {
                        detailsBtn.style.display = 'inline-block';
                        detailsBtn.onclick = () => showDeliveryDetails(deliveryResult);
                    }

                    // Final Total = Subtotal + Fixed Fee (35 EGP) for all users
                    const finalTotal = cartPage_subtotal + FIXED_DELIVERY_FEE;
                    document.getElementById('cartPage_total').textContent = finalTotal.toFixed(2) + ' ' + currency;
                    return;
                }
            }
        } catch (calcError) {
            console.error('Error calculating smart delivery:', calcError);
        }

        // Fallback or Non-Admin state: Final Total is always Subtotal + Fixed Fee
        if (smartDeliveryElement) smartDeliveryElement.textContent = window.langu('cart_not_available');
        const finalTotalFallback = cartPage_subtotal + FIXED_DELIVERY_FEE;
        document.getElementById('cartPage_total').textContent = finalTotalFallback.toFixed(2) + ' ' + currency;

    } catch (error) {
        console.error(' Error Update :', error);
    }
}
