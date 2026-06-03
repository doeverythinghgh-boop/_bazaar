/**
 * @file notification/fcm-event-handlers-steps.js
 * @description Order step and sub-step notification event handlers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function notifyBuyerOnStepChange(buyerKey, stepId, stepName, orderId = '') {
    try {
        await window.loadNotificationMessages?.();
        const tokens = await window.getUsersTokens?.([buyerKey]);
        if (tokens?.length > 0) {
            const orderIdText = orderId ? ` Number #${orderId}` : '';
            let templatePath = `steps.${stepId}.buyer`;
            const msgs = window.notificationMessages;
            if (!(msgs && msgs.steps && msgs.steps[stepId] && msgs.steps[stepId].buyer)) {
                templatePath = 'steps.general_update.buyer';
            }
            const { title, body } = window.getMessageTemplate?.(templatePath, { orderIdText, stepName }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(tokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Step change buyer notification failed:', error);
    }
}

export async function notifyAdminOnStepChange(stepId, stepName, orderId = '', userName = '', actingUserId = '') {
    try {
        await window.loadNotificationMessages?.();
        const tokens = await window.getAdminTokens?.(actingUserId);
        if (tokens?.length > 0) {
            const orderIdText = orderId ? ` for order #${orderId}` : '';
            const userInfo = userName ? ` by ${userName}` : '';
            const { title, body } = window.getMessageTemplate?.('steps.general_update.admin', { stepName, orderIdText, userInfo }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(tokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Step change admin notification failed:', error);
    }
}

export async function notifyDeliveryOnStepChange(deliveryKeys, stepId, stepName, orderId = '') {
    if (!deliveryKeys || deliveryKeys.length === 0) return;
    try {
        await window.loadNotificationMessages?.();
        const tokens = await window.getUsersTokens?.(deliveryKeys);
        if (tokens?.length > 0) {
            const orderIdText = orderId ? ` #${orderId}` : '';
            let templatePath = `steps.${stepId}.delivery`;
            const msgs = window.notificationMessages;
            if (!(msgs && msgs.steps && msgs.steps[stepId] && msgs.steps[stepId].delivery)) {
                templatePath = 'steps.general_update.delivery';
            }
            const { title, body } = window.getMessageTemplate?.(templatePath, { orderIdText, stepName }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(tokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Step change delivery notification failed:', error);
    }
}

export async function notifySellerOnStepChange(sellerKeys, stepId, stepName, orderId = '') {
    if (!sellerKeys || sellerKeys.length === 0) return;
    try {
        await window.loadNotificationMessages?.();
        const tokens = await window.getUsersTokens?.(sellerKeys);
        if (tokens?.length > 0) {
            const orderIdText = orderId ? ` #${orderId}` : '';
            let templatePath = `steps.${stepId}.seller`;
            const msgs = window.notificationMessages;
            if (!(msgs && msgs.steps && msgs.steps[stepId] && msgs.steps[stepId].seller)) {
                templatePath = 'steps.general_update.seller';
            }
            const { title, body } = window.getMessageTemplate?.(templatePath, { orderIdText, stepName }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(tokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Step change merchant notification failed:', error);
    }
}

export async function notifyOnStepActivation({ stepId, stepName, buyerKey = '', sellerKeys = [], deliveryKeys = [], orderId = '', userName = '', actingUserId = '' }) {
    console.log(`[Notifications] Step activation: ${stepName}`);
    try {
        const promises = [];

        if (stepId === 'step-delivered') {
            const filteredSellers = sellerKeys.filter((key) => key !== actingUserId);
            if (filteredSellers.length > 0 && await window.shouldNotify?.(stepId, 'merchant')) {
                promises.push(notifySellerOnStepChange(filteredSellers, stepId, stepName, orderId));
            }
        } else {
            if (buyerKey && buyerKey !== actingUserId && await window.shouldNotify?.(stepId, 'buyer')) {
                promises.push(notifyBuyerOnStepChange(buyerKey, stepId, stepName, orderId));
            }
            if (await window.shouldNotify?.(stepId, 'admin')) {
                promises.push(notifyAdminOnStepChange(stepId, stepName, orderId, userName, actingUserId));
            }

            const filteredSellers = sellerKeys.filter((key) => key !== actingUserId);
            const filteredDelivery = deliveryKeys.filter((key) => key !== actingUserId);

            if (filteredSellers.length > 0 && await window.shouldNotify?.(stepId, 'merchant')) {
                promises.push(notifySellerOnStepChange(filteredSellers, stepId, stepName, orderId));
            }
            if (filteredDelivery.length > 0 && await window.shouldNotify?.(stepId, 'delivery')) {
                promises.push(notifyDeliveryOnStepChange(filteredDelivery, stepId, stepName, orderId));
            }
        }

        await Promise.all(promises);
    } catch (error) {
        console.error('[Notifications] Step activation process failed:', error);
    }
}

export async function notifyOnSubStepActivation({ stepId, stepName, buyerKey = '', sellerKeys = [], orderId = '', userName = '', actingUserId = '' }) {
    console.log(`[Notifications] Sub-step activation: ${stepName}`);
    try {
        const promises = [];
        const filteredSellers = sellerKeys.filter((key) => key !== actingUserId);
        await window.loadNotificationMessages?.();

        switch (stepId) {
            case 'step-cancelled':
                if (filteredSellers.length > 0 && await window.shouldNotify?.('step-cancelled', 'merchant')) {
                    promises.push(notifySellerOnStepChange(filteredSellers, stepId, stepName, orderId));
                }
                break;

            case 'step-rejected':
                if (buyerKey && buyerKey !== actingUserId && await window.shouldNotify?.('step-rejected', 'buyer')) {
                    const orderIdText = orderId ? ` Number #${orderId}` : '';
                    const { title, body } = window.getMessageTemplate?.('steps.step-rejected.buyer', { orderIdText }) || {};
                    const buyerTokens = await window.getUsersTokens?.([buyerKey]);
                    if (buyerTokens?.length > 0 && title && body) {
                        promises.push(window.sendNotificationsToTokens?.(buyerTokens, title, body));
                    }
                }
                if (await window.shouldNotify?.('step-rejected', 'admin')) {
                    promises.push(notifyAdminOnStepChange(stepId, stepName, orderId, userName));
                }
                if (filteredSellers.length > 0 && await window.shouldNotify?.('step-rejected', 'merchant')) {
                    promises.push(notifySellerOnStepChange(filteredSellers, stepId, stepName, orderId));
                }
                {
                    const deliveryKeysReject = await window.getActiveDeliveryKeysForSeller?.(filteredSellers[0] || '');
                    if (deliveryKeysReject?.length > 0 && await window.shouldNotify?.('step-rejected', 'delivery')) {
                        promises.push(notifyDeliveryOnStepChange(deliveryKeysReject, stepId, stepName, orderId));
                    }
                }
                break;

            case 'step-returned':
                if (filteredSellers.length > 0 && await window.shouldNotify?.('step-returned', 'merchant')) {
                    promises.push(notifySellerOnStepChange(filteredSellers, stepId, stepName, orderId));
                }
                if (await window.shouldNotify?.('step-returned', 'admin')) {
                    promises.push(notifyAdminOnStepChange(stepId, stepName, orderId, userName));
                }
                if (buyerKey && buyerKey !== actingUserId && await window.shouldNotify?.('step-returned', 'buyer')) {
                    promises.push(notifyBuyerOnStepChange(buyerKey, stepId, stepName, orderId));
                }
                {
                    const deliveryKeysReturn = await window.getActiveDeliveryKeysForSeller?.(filteredSellers[0] || '');
                    if (deliveryKeysReturn?.length > 0 && await window.shouldNotify?.('step-returned', 'delivery')) {
                        promises.push(notifyDeliveryOnStepChange(deliveryKeysReturn, stepId, stepName, orderId));
                    }
                }
                break;
        }

        await Promise.all(promises);
    } catch (error) {
        console.error('[Notifications] Sub-step activation process failed:', error);
    }
}

// Hybrid bridge
window.notifyBuyerOnStepChange = notifyBuyerOnStepChange;
window.notifyAdminOnStepChange = notifyAdminOnStepChange;
window.notifyDeliveryOnStepChange = notifyDeliveryOnStepChange;
window.notifySellerOnStepChange = notifySellerOnStepChange;
window.notifyOnStepActivation = notifyOnStepActivation;
window.notifyOnSubStepActivation = notifyOnSubStepActivation;

console.log("[ESM Load] fcm-event-handlers-steps.js: Hybrid bridge established.");
