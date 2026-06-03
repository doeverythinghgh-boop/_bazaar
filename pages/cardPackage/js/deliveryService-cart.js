/**
 * @file pages/cardPackage/js/deliveryService-cart.js
 * @description Cart inspection and merchant extraction for delivery calculation.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function getDeliveryCartContext(cart, currency) {
    const sellerLocations = [];
    const processedSellerKeys = new Set();
    let totalOrderValue = 0;
    let requiresHeavyLoad = false;

    cart.forEach((item, index) => {
        totalOrderValue += (item.price * item.quantity);

        console.log(` [Inspection] Check product #${index + 1}: ${item.productName}`);
        console.log(` - seller_key: ${item.seller_key}`);
        console.log(` - seller_lat: ${item.seller_lat}`);
        console.log(` - seller_lng: ${item.seller_lng}`);
        console.log(` - heavyLoad: ${item.heavyLoad || item.heavy_load || 0} ${(item.heavyLoad || item.heavy_load) ? ' ( )' : '️ ( )'}`);

        if (item.heavy_load || item.heavyLoad || item.isHeavy) {
            requiresHeavyLoad = true;
        }

        if (item.seller_key && !processedSellerKeys.has(item.seller_key)) {
            const isSelfDelivering = parseInt(item.sellerIsDelevred || item.isDelivered) === 1;

            if (isSelfDelivering) {
                console.log(` [Self-Delivery] "${item.sellerName}" . Done .`);
            } else if (item.seller_lat && item.seller_lng) {
                sellerLocations.push({
                    lat: parseFloat(item.seller_lat),
                    lng: parseFloat(item.seller_lng),
                    id: item.seller_key,
                    name: item.sellerName || 'Unknown Merchant'
                });
                processedSellerKeys.add(item.seller_key);
            } else {
                console.warn(`️ [Warning] product "${item.productName}" !`);
            }
        }
    });

    console.log(` [Merchants] Done : ${sellerLocations.length}`);
    sellerLocations.forEach((merchant, index) => {
        console.log(` - ${index + 1}: ${merchant.name} | : (${merchant.lat}, ${merchant.lng})`);
    });
    console.log(` [OrderValue] : ${totalOrderValue.toFixed(2)} ${currency}`);
    if (requiresHeavyLoad) console.log("️ [HeavyLoad] Alert: Done Done .");

    return {
        sellerLocations,
        totalOrderValue,
        requiresHeavyLoad
    };
}
