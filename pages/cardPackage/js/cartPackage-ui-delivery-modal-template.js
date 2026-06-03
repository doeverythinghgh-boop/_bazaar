/**
 * @file pages/cardPackage/js/cartPackage-ui-delivery-modal-template.js
 * @description HTML builders for delivery details modal.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function renderDeliveryDistanceBreakdown(breakdown) {
    if (!breakdown.distances || !breakdown.distances.length) return '';
    const segments = breakdown.distances;
    let segmentHTML = '<div style="padding: 8px 0;">';

    if (segments.length === 1) {
        segmentHTML += `<div class="delivery-row" style="margin-bottom: 8px;"><span style="flex: 1;">${window.langu('cart_delivery_segment_direct')}</span><span style="font-weight: bold; color: var(--primary-color);">${segments[0].toFixed(2)} كم</span></div>`;
    } else {
        segmentHTML += `<div class="delivery-row" style="margin-bottom: 8px;"><span style="flex: 1;">${window.langu('cart_delivery_segment_first')}</span><span style="font-weight: bold; color: var(--primary-color);">${segments[0].toFixed(2)} كم</span></div>`;
        for (let i = 1; i < segments.length - 1; i++) {
            segmentHTML += `<div class="delivery-row" style="margin-bottom: 8px;"><span style="flex: 1;">${window.langu('cart_delivery_segment_between').replace('{i}', i).replace('{j}', i + 1)}</span><span style="font-weight: bold; color: var(--primary-color);">${segments[i].toFixed(2)} كم</span></div>`;
        }
        segmentHTML += `<div class="delivery-row" style="margin-bottom: 8px;"><span style="flex: 1;">${window.langu('cart_delivery_segment_last')}</span><span style="font-weight: bold; color: var(--primary-color);">${segments[segments.length - 1].toFixed(2)} كم</span></div>`;
    }

    return segmentHTML + '</div>';
}

function renderDeliveryDetailsHtml(deliveryResult, metrics) {
    const breakdown = deliveryResult.costBreakdown;
    const totalDistance = deliveryResult.totalDistanceKm;
    const totalCost = deliveryResult.totalCost;
    const defaults = metrics.defaults;

    return `
        <div class="container-fluid">
            <h3 class="delivery-details-header">${window.langu('cart_delivery_details_title')}</h3>
            <div style="max-height: 50vh; overflow-y: auto; padding-right: 5px;">
                <div class="delivery-section delivery-section-stages">
                    <strong style="display: block; margin-bottom: 10px;">${window.langu('cart_delivery_stages')}</strong>
                    ${renderDeliveryDistanceBreakdown(breakdown)}
                    <hr style="margin: 10px 0; border: none; border-top: 1px dashed #ccc;">
                    <div class="delivery-row" style="margin-top: 10px;"><span style="flex: 1; font-weight: bold;">${window.langu('cart_delivery_total_dist')}</span><span style="font-weight: bold; color: #2196F3; font-size: 1.1rem;">${totalDistance.toFixed(2)} كم</span></div>
                    <div class="delivery-row-detail"><span class="delivery-label">${window.langu('cart_delivery_dist_cost').replace('{dist}', totalDistance.toFixed(2)).replace('{price}', defaults.price_per_km)}</span><span class="delivery-cost-minus">+${metrics.distanceCost.toFixed(2)} ${metrics.currency}</span></div>
                </div>
                <div class="delivery-section delivery-section-vehicle"><div class="delivery-row"><strong>${window.langu('cart_delivery_vehicle_label')}</strong><span>${breakdown.vehicleType === 'truck' ? window.langu('cart_delivery_vehicle_truck') : breakdown.vehicleType === 'car' ? window.langu('cart_delivery_vehicle_car') : window.langu('cart_delivery_vehicle_bike')}</span></div>${metrics.vehicleCost > 0 ? `<div class="delivery-row-detail"><span class="delivery-label">تكلفة إضافية (${(metrics.vehicleFactor * 100).toFixed(0)}%):</span><span class="delivery-cost-plus">+${metrics.vehicleCost.toFixed(2)} ${metrics.currency}</span></div>` : ''}</div>
                <div class="delivery-section delivery-section-value"><div class="delivery-row"><strong>${window.langu('cart_delivery_value_label')}</strong><span>${breakdown.orderValue.toFixed(2)} ${metrics.currency}</span></div>${metrics.orderValueFee > 0 ? `<div class="delivery-row-detail"><span class="delivery-label">رسوم طلب كبير (أكبر من أو يساوي ${defaults.high_order_value_threshold}):</span><span class="delivery-cost-plus">+${metrics.orderValueFee.toFixed(2)} ${metrics.currency}</span></div>` : `<div class="delivery-row-detail" style="color: #4caf50;">✓ لا توجد رسوم إضافية (الطلب أقل من ${defaults.high_order_value_threshold} ${metrics.currency})</div>`}</div>
                <div class="delivery-section delivery-section-weather"><div class="delivery-row"><strong>${window.langu('cart_delivery_weather_label')}</strong><span>${breakdown.weather === 'heavy_rain' ? window.langu('cart_delivery_weather_heavy') : breakdown.weather === 'light_rain' ? window.langu('cart_delivery_weather_light') : window.langu('cart_delivery_weather_normal')}</span></div>${metrics.weatherCost > 0 ? `<div class="delivery-row-detail"><span class="delivery-label">تكلفة إضافية (${(metrics.weatherFactor * 100).toFixed(0)}%):</span><span class="delivery-cost-plus">+${metrics.weatherCost.toFixed(2)} ${metrics.currency}</span></div>` : ''}</div>
                <div class="delivery-section delivery-section-location"><div class="delivery-row"><strong>${window.langu('cart_delivery_location_label')}</strong><span>${breakdown.location === 'outside_city' ? window.langu('cart_delivery_location_outside') : breakdown.location === 'suburbs' ? window.langu('cart_delivery_location_suburbs') : window.langu('cart_delivery_location_inside')}</span></div>${metrics.locationCost > 0 ? `<div class="delivery-row-detail"><span class="delivery-label">تكلفة إضافية (${(metrics.locationFactor * 100).toFixed(0)}%):</span><span class="delivery-cost-plus">+${metrics.locationCost.toFixed(2)} ${metrics.currency}</span></div>` : ''}</div>
                <div class="delivery-section delivery-section-eta"><div class="delivery-row"><strong>${window.langu('cart_delivery_speed_label')}</strong><span>${breakdown.etaType === 'instant' ? window.langu('cart_delivery_speed_instant') : breakdown.etaType === 'fast' ? window.langu('cart_delivery_speed_fast') : window.langu('cart_delivery_speed_normal')}</span></div>${metrics.etaCost > 0 ? `<div class="delivery-row-detail"><span class="delivery-label">تكلفة إضافية (${(metrics.etaFactor * 100).toFixed(0)}%):</span><span class="delivery-cost-plus">+${metrics.etaCost.toFixed(2)} ${metrics.currency}</span></div>` : ''}</div>
                ${breakdown.specialVehicle ? `<div class="delivery-section delivery-section-special"><div class="delivery-row"><strong>${window.langu('cart_delivery_special_label')}</strong><span>${window.langu('cart_delivery_special_yes')}</span></div><div class="delivery-row-detail"><span class="delivery-label">تكلفة إضافية (${(defaults.special_vehicle_factor * 100).toFixed(0)}%):</span><span class="delivery-cost-plus">+${metrics.specialVehicleCost.toFixed(2)} ${metrics.currency}</span></div></div>` : ''}
                <div class="delivery-section delivery-section-rating"><div class="delivery-row"><strong>${window.langu('cart_delivery_rating_label')}</strong><span>${window.langu('cart_delivery_stars').replace('{n}', breakdown.driverRating.toFixed(1))}</span></div>${metrics.ratingCost !== 0 ? `<div class="delivery-row-detail"><span class="delivery-label">${metrics.ratingCost > 0 ? 'رسوم إضافية' : 'خصم'} (${(metrics.driverRatingFactor * 100).toFixed(0)}%):</span><span style="font-weight: bold;" class="${metrics.ratingCost > 0 ? 'text-danger' : 'text-success'}">${metrics.ratingCost > 0 ? '+' : ''}${metrics.ratingCost.toFixed(2)} ${metrics.currency}</span></div>` : ''}</div>
                <div class="delivery-section delivery-section-base"><div class="delivery-row"><strong style="color: #f57c00;">${window.langu('cart_delivery_base_fee')}</strong><span style="font-weight: bold;">+${defaults.base_fee.toFixed(2)} ${metrics.currency}</span></div></div>
                ${metrics.discount > 0 ? `<div class="delivery-row" style="padding-top: 8px; border-top: 1px solid #fff59d;"><strong style="color: #388e3c;">${window.langu('cart_delivery_discount_label')} (للطلبات < ${defaults.discount_threshold} ${metrics.currency}):</strong><span class="delivery-cost-minus">-${metrics.discount.toFixed(2)} ${metrics.currency}</span></div>` : `<div style="padding-top: 8px; border-top: 1px solid #fff59d; color: #666; font-size: 0.9rem;">ℹ️ لا يوجد خصم (الطلب ≥ ${defaults.discount_threshold} ${metrics.currency})</div>`}
                <hr style="margin: 20px 0; border: none; border-top: 2px solid #e0e0e0;">
                <div class="delivery-section-total"><strong>${window.langu('cart_delivery_final_total').replace('{total}', totalCost.toFixed(2)).replace('{currency}', metrics.currency)}</strong></div>
            </div>
        </div>
    `;
}
