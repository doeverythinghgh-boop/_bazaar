/**
 * @file orderStage/orderData/parts/commercial-partials/summary.js
 * @description Renders the product availability summary for the commercial provider.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Commercial_Summary = {
    render: function (orderData, statusObj, context = {}) {
        const currentUser = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null);
        const capabilities = typeof window.resolveUserCapabilities === 'function' ? window.resolveUserCapabilities(currentUser) : null;
        const isAuth = !!capabilities?.isAdmin;

        const simulatedSellerKey = context.simulatedSellerKey;
        const isSimulatingCommercial = context.isSimulating && context.activeOrderRole === 'commercial';
        const trueIsAdmin = context.trueIsAdmin || context.trueIsSuperAdmin;

        const myItems = (orderData.order_items || []).filter(item => {
            if (isSimulatingCommercial && simulatedSellerKey) return item.seller_key === simulatedSellerKey;
            return trueIsAdmin || item.seller_key === currentUser?.user_key;
        });

        const unavailableKeys = statusObj.unavailable_product_keys || [];
        const available = myItems.filter(it => !unavailableKeys.includes(it.product_key));
        const unavailable = myItems.filter(it => unavailableKeys.includes(it.product_key));

        return `
            <div id="order_seller_review_summary" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                ${available.map((it, idx) => `
                    <span id="order_seller_sum_avail_${idx}" style="font-size: 0.75em; background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 6px; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 4px; font-weight: 500;">
                        <i class="fas fa-check" style="font-size: 0.8em;"></i> ${it.product_name}
                    </span>
                `).join('')}
                ${unavailable.map((it, idx) => `
                    <span id="order_seller_sum_unavail_${idx}" style="font-size: 0.75em; background: #fef2f2; color: #991b1b; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; display: flex; align-items: center; gap: 4px; font-weight: 500; text-decoration: line-through; opacity: 0.75;">
                        <i class="fas fa-times" style="font-size: 0.8em;"></i> ${it.product_name}
                    </span>
                `).join('')}
            </div>
        `;
    }
};
