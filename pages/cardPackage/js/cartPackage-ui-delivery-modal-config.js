/**
 * @file pages/cardPackage/js/cartPackage-ui-delivery-modal-config.js
 * @description Config and math helpers for delivery details modal.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function getDeliveryDetailsDefaults(deliveryResult) {
    const fullConfig = deliveryResult.deliveryConfig || {};
    return fullConfig.defaults || {
        base_fee: 15,
        price_per_km: 5,
        high_order_value_threshold: 5000,
        high_order_fee: 20,
        discount_threshold: 200,
        discount_value: 5,
        special_vehicle_factor: 0.5,
        vehicle_factors: { bike: 0, car: 0.25, truck: 0.6 },
        weather_factors: { normal: 0, light_rain: 0.1, heavy_rain: 0.3 },
        location_factors: { city: 0, suburbs: 0.15, outside_city: 0.3 },
        eta_factors: { normal: 0, fast: 0.2, instant: 0.4 },
        driver_rating_config: {
            excellent_threshold: 4.5,
            excellent_discount: -0.05,
            good_threshold: 4.0,
            good_factor: 0,
            poor_factor: 0.1
        }
    };
}

function buildDeliveryDetailsMetrics(deliveryResult) {
    const breakdown = deliveryResult.costBreakdown;
    const defaults = getDeliveryDetailsDefaults(deliveryResult);
    const totalDistance = deliveryResult.totalDistanceKm;
    const distanceCost = totalDistance * defaults.price_per_km;
    const orderValueFee = breakdown.orderValue >= defaults.high_order_value_threshold ? defaults.high_order_fee : 0;
    const specialVehicleCost = breakdown.specialVehicle ? distanceCost * defaults.special_vehicle_factor : 0;
    const weatherFactor = (defaults.weather_factors && defaults.weather_factors[breakdown.weather]) || 0;
    const locationFactor = (defaults.location_factors && defaults.location_factors[breakdown.location]) || 0;
    const vehicleFactor = (defaults.vehicle_factors && defaults.vehicle_factors[breakdown.vehicleType]) || 0;
    const etaFactor = (defaults.eta_factors && defaults.eta_factors[breakdown.etaType]) || 0;

    let driverRatingFactor = 0;
    if (defaults.driver_rating_config) {
        if (breakdown.driverRating >= defaults.driver_rating_config.excellent_threshold) driverRatingFactor = defaults.driver_rating_config.excellent_discount;
        else if (breakdown.driverRating >= defaults.driver_rating_config.good_threshold) driverRatingFactor = defaults.driver_rating_config.good_factor;
        else driverRatingFactor = defaults.driver_rating_config.poor_factor;
    }

    return {
        defaults,
        distanceCost,
        orderValueFee,
        specialVehicleCost,
        weatherFactor,
        weatherCost: distanceCost * weatherFactor,
        locationFactor,
        locationCost: distanceCost * locationFactor,
        vehicleFactor,
        vehicleCost: distanceCost * vehicleFactor,
        driverRatingFactor,
        ratingCost: distanceCost * driverRatingFactor,
        etaFactor,
        etaCost: distanceCost * etaFactor,
        discount: breakdown.orderValue < defaults.discount_threshold ? defaults.discount_value : 0,
        currency: window.langu('cart_currency') || defaults.currency_symbol || 'EGP'
    };
}
