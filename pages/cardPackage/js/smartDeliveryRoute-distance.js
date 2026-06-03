/**
 * @file pages/cardPackage/js/smartDeliveryRoute-distance.js
 * @description Distance and route helpers for smart delivery routing.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function calculateDistance(pointA, pointB) {
    const latDiff = pointB.lat - pointA.lat;
    const lngDiff = pointB.lng - pointA.lng;
    return Math.sqrt(latDiff ** 2 + lngDiff ** 2);
}

function calculateRouteDistance(office, sellersPath, customer) {
    let totalDistance = 0;
    totalDistance += calculateDistance(office, sellersPath[0]);

    for (let i = 0; i < sellersPath.length - 1; i++) {
        totalDistance += calculateDistance(
            sellersPath[i],
            sellersPath[i + 1]
        );
    }

    totalDistance += calculateDistance(
        sellersPath[sellersPath.length - 1],
        customer
    );

    return totalDistance;
}
