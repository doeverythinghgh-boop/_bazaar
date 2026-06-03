/**
 * @file pages/cardPackage/js/deliveryService-route.js
 * @description Route optimization and segment-distance calculation for cart delivery.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function buildDeliverySegmentsInKm(officeLocation, customerLocation, optimalRoute, deliveryConfig) {
    const segmentsInKm = [];
    const degToKm = (deliveryConfig.defaults && deliveryConfig.defaults.deg_to_km_factor) || DEG_TO_KM_APPROX;

    console.log(" [Segments] Route :");

    if (optimalRoute.length > 0) {
        const distOfficeToFirst = calculateDistance(officeLocation, optimalRoute[0]);
        const km1 = distOfficeToFirst * degToKm;
        segmentsInKm.push(km1);
        console.log(` 1️⃣ (${officeLocation.lat}, ${officeLocation.lng}) \n ⬅️ : ${optimalRoute[0].name} (${optimalRoute[0].lat}, ${optimalRoute[0].lng}) \n : ${km1.toFixed(2)} `);

        for (let i = 0; i < optimalRoute.length - 1; i += 1) {
            const distBetweenSellers = calculateDistance(optimalRoute[i], optimalRoute[i + 1]);
            const kmMid = distBetweenSellers * degToKm;
            segmentsInKm.push(kmMid);
            console.log(` : ${optimalRoute[i].name} (${optimalRoute[i].lat}, ${optimalRoute[i].lng}) \n ⬅️ : ${optimalRoute[i + 1].name} (${optimalRoute[i + 1].lat}, ${optimalRoute[i + 1].lng}) \n : ${kmMid.toFixed(2)} `);
        }

        const distLastToCustomer = calculateDistance(optimalRoute[optimalRoute.length - 1], customerLocation);
        const kmLast = distLastToCustomer * degToKm;
        segmentsInKm.push(kmLast);
        console.log(` : ${optimalRoute[optimalRoute.length - 1].name} (${optimalRoute[optimalRoute.length - 1].lat}, ${optimalRoute[optimalRoute.length - 1].lng}) \n ⬅️ (${customerLocation.lat}, ${customerLocation.lng}) \n : ${kmLast.toFixed(2)} `);
    } else {
        const distDirect = calculateDistance(officeLocation, customerLocation);
        const kmDirect = distDirect * degToKm;
        segmentsInKm.push(kmDirect);
        console.log(` : (${officeLocation.lat}, ${officeLocation.lng}) \n ⬅️ (${customerLocation.lat}, ${customerLocation.lng}) \n : ${kmDirect.toFixed(2)} `);
    }

    const totalKm = segmentsInKm.reduce((sum, dist) => sum + dist, 0);
    console.log(` [Distance] : ${totalKm.toFixed(2)} ${segmentsInKm.length} .`);

    return segmentsInKm;
}

function resolveOptimalDeliveryRoute(officeLocation, customerLocation, sellerLocations) {
    if (typeof findShortestDeliveryRoute !== 'function') {
        throw new Error("findShortestDeliveryRoute not found. Ensure the smart delivery route modules are loaded.");
    }

    const optimizationResult = findShortestDeliveryRoute(officeLocation, customerLocation, sellerLocations);
    const optimalRoute = optimizationResult.route;

    console.log("️ [Optimization] Done Route successfully.");
    console.log(` [Route] : ${optimalRoute.map((merchant) => merchant.name).join(" ")}`);

    return optimalRoute;
}
