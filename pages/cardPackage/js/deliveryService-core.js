/**
 * @file pages/cardPackage/js/deliveryService-core.js
 * @description Shared constants and result helpers for cart delivery calculation.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const DEG_TO_KM_APPROX = 111;

function createEmptyDeliveryResult(deliveryConfig = null) {
    return {
        totalCost: 0,
        totalDistanceKm: 0,
        optimalRoute: [],
        costBreakdown: null,
        deliveryConfig
    };
}

function createDeliveryErrorResult(error) {
    return {
        totalCost: 0,
        totalDistanceKm: 0,
        optimalRoute: [],
        error: error.message
    };
}
