/**
 * @file pages/cardPackage/js/deliveryService-main.js
 * @description Main orchestration for calculating cart delivery cost.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function calculateCartDeliveryCost(officeLocation, customerLocation, options = {}) {
    try {
        if (typeof loadDeliveryConfig !== 'function') {
            console.error("loadDeliveryConfig not found. Ensure deliveryConfigLoader.js is loaded.");
            throw new Error("Missing deliveryConfigLoader.js");
        }
        const deliveryConfig = await loadDeliveryConfig();

        if (typeof getCart !== 'function') {
            throw new Error("getCart function not found. Ensure cardPackage.js is loaded.");
        }

        const cart = getCart();
        console.log(" [DeliveryService] Starting ...");
        console.log(" [Debug] :", cart);

        if (!cart || cart.length === 0) {
            return createEmptyDeliveryResult(deliveryConfig);
        }

        const currency = window.langu('cart_currency') || (deliveryConfig.defaults && deliveryConfig.defaults.currency_symbol) || 'EGP';
        const cartContext = getDeliveryCartContext(cart, currency);
        const optimalRoute = resolveOptimalDeliveryRoute(officeLocation, customerLocation, cartContext.sellerLocations);
        const segmentsInKm = buildDeliverySegmentsInKm(officeLocation, customerLocation, optimalRoute, deliveryConfig);

        const defaults = deliveryConfig.defaults || {};
        let vehicleType = options.vehicleType || defaults.vehicle_type || 'bike';
        if (cartContext.requiresHeavyLoad) {
            vehicleType = 'truck';
        }

        const costParams = {
            distances: segmentsInKm,
            orderValue: cartContext.totalOrderValue,
            specialVehicle: cartContext.requiresHeavyLoad || options.specialVehicle || false,
            weather: options.weather || defaults.weather || 'normal',
            location: options.locationZone || defaults.location || 'city',
            vehicleType,
            driverRating: options.driverRating || defaults.driver_rating || 4.3,
            etaType: options.etaType || defaults.eta_type || 'normal'
        };

        console.log(" [Parameters] user :");
        console.log(` - status : ${costParams.weather}`);
        console.log(` - : ${costParams.location}`);
        console.log(` - : ${costParams.vehicleType}`);
        console.log(` - order (ETA): ${costParams.etaType}`);
        console.log(` - : ${costParams.driverRating} `);
        console.log(` - : ${costParams.specialVehicle ? '' : ''}`);
        console.log(` - order: ${costParams.orderValue.toFixed(2)} ${currency}`);

        if (typeof calculateDeliveryCost !== 'function') {
            throw new Error("calculateDeliveryCost not found. Ensure deliveryCostCalculator.js is loaded.");
        }

        const totalCost = calculateDeliveryCost(costParams, deliveryConfig);
        const totalDistanceKm = segmentsInKm.reduce((sum, dist) => sum + dist, 0);

        console.log(" [FinalCost] Done successfully!");
        console.log(` [Total] : ${totalCost.toFixed(2)} ${currency}`);

        return {
            totalCost: parseFloat(totalCost.toFixed(2)),
            totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
            optimalRoute,
            costBreakdown: costParams,
            deliveryConfig
        };
    } catch (error) {
        console.error("Error in calculateCartDeliveryCost:", error);
        return createDeliveryErrorResult(error);
    }
}
