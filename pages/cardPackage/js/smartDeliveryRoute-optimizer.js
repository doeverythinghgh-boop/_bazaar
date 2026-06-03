/**
 * @file pages/cardPackage/js/smartDeliveryRoute-optimizer.js
 * @description Main shortest-route optimizer for smart delivery routing.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function findShortestDeliveryRoute(office, customer, merchants) {
    if (!merchants.length) {
        return {
            distance: calculateDistance(office, customer),
            route: []
        };
    }

    const permutations = generatePermutations(merchants);
    let shortestDistance = Infinity;
    let bestRoute = [];

    for (const path of permutations) {
        const distance = calculateRouteDistance(office, path, customer);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            bestRoute = path;
        }
    }

    return {
        distance: shortestDistance,
        route: bestRoute
    };
}
