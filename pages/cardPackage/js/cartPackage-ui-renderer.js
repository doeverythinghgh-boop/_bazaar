/**
 * @file pages/cardPackage/js/cartPackage-ui-renderer.js
 * @description UI rendering logic for cart items.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Loads the cart items from local storage and renders them in the cart page.
 *   Updates the cart summary and handles empty cart state.
 * @async
 * @function cartPage_loadCart
 * @returns {Promise<void>}
 */
async function cartPage_loadCart() {
    try {
        const cartPage_cartItemsContainer = document.getElementById('cartPage_cartItemsContainer');
        const cartPage_emptyCart = document.getElementById('cartPage_emptyCart');
        const cartPage_cartSummary = document.getElementById('cartPage_cartSummary');

        // Ensure loader is visible when starting load (if not already handled by init)
        const loader = document.getElementById("loader-container");
        if (loader) loader.style.display = "block";

        // Load Global Config
        let config = {};
        let currency = window.langu('cart_currency');
        let placeholderImg = 'https://via.placeholder.com/120x120?text=No+Image';

        if (typeof loadDeliveryConfig === 'function') {
            try {
                config = await loadDeliveryConfig();
                if (config && config.defaults) {
                    // Use translation system first, fallback to config only if translation fails
                    currency = window.langu('cart_currency') || config.defaults.currency_symbol || currency;
                    placeholderImg = config.defaults.placeholder_image || placeholderImg;
                }
            } catch (e) { console.warn("Failed to load config in loadCart", e); }
        }

        // فحص دفاعي: إذا لم تكن العناصر موجودة، فهذا يعني أننا لسنا في صفحة السلة
        if (!cartPage_cartItemsContainer || !cartPage_emptyCart || !cartPage_cartSummary) {
            return;
        }

        const cartPage_cart = getCart();

        if (cartPage_cart.length === 0) {
            cartPage_cartItemsContainer.innerHTML = '';
            cartPage_emptyCart.style.display = 'block';
            cartPage_cartSummary.style.display = 'none';
            const layout = document.getElementById("cartPage_cartLayout");
            if (layout) layout.style.display = "none";
            // Hide Loader
            if (loader) loader.style.display = "none";
            return;
        }

        cartPage_emptyCart.style.display = 'none';
        cartPage_cartSummary.style.display = 'block';
        const layout = document.getElementById("cartPage_cartLayout");
        if (layout) layout.style.display = "grid";

        // Hide Loader
        if (loader) loader.style.display = "none";

        let cartPage_cartItemsHTML = '';

        cartPage_cart.forEach(cartPage_item => {
            const cartPage_discount = cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price
                ? Math.round(((cartPage_item.original_price - cartPage_item.price) / cartPage_item.original_price) * 100)
                : 0;

            const cartPage_savings = cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price
                ? (cartPage_item.original_price - cartPage_item.price) * cartPage_item.quantity
                : 0;

            cartPage_cartItemsHTML += `
                <table class="cartPage_cart-item" id="cartPage_cartItem-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">
                    <tbody>
                        <tr>
                            <td style="width: 120px;" id="cartPage_cartItemImage-${cartPage_item.product_key}">
                                <div class="cartPage_cart-item-image">
                                    <img id="cartPage_cartItemImg-${cartPage_item.product_key}" src="${cartPage_item.image || placeholderImg}" 
                                         alt="${cartPage_item.productName}">
                                </div>
                            </td>
                            <td id="cartPage_cartItemInfo-${cartPage_item.product_key}">
                                <div class="cartPage_cart-item-info">
                                    <h3 class="cartPage_cart-item-title" id="cartPage_cartItemTitle-${cartPage_item.product_key}">${cartPage_item.productName}</h3>
                                    <div class="cartPage_cart-item-price" id="cartPage_cartItemPriceContainer-${cartPage_item.product_key}">
                                        ${cartPage_item.price > 0 ? `<span class="cartPage_current-price" id="cartPage_currentPrice-${cartPage_item.product_key}">${cartPage_item.price.toFixed(2)} ${currency}</span>` : ''}
                                        ${cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price ?
                    `<span class="cartPage_original-price" id="cartPage_originalPrice-${cartPage_item.product_key}">${cartPage_item.original_price.toFixed(2)} ${currency}</span>` : ''}
                                        ${cartPage_discount > 0 ?
                    `<span class="cartPage_discount-badge" id="cartPage_discountBadge-${cartPage_item.product_key}">${window.langu('cart_discount_badge').replace('{n}', cartPage_discount)}</span>` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" id="cartPage_cartItemNoteContainer-${cartPage_item.product_key}" class="cartPage_note-cell">
                                <div class="cartPage_cart-item-note">
                                    <div class="cartPage_note-label" id="cartPage_noteLabel-${cartPage_item.product_key}">
                                        <i class="fas fa-sticky-note"></i>
                                        <span>${window.langu('cart_notes_label')}</span>
                                    </div>
                                    <div class="cartPage_note-text ${cartPage_item.note ? '' : 'empty'}" id="cartPage_noteText-${cartPage_item.product_key}">
                                        ${cartPage_item.note || window.langu('cart_no_notes')}
                                        <button class="cartPage_edit-note-btn" id="cartPage_editNoteBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td id="cartPage_quantityControls-${cartPage_item.product_key}">
                                <div class="cartPage_quantity-controls">
                                    <button class="cartPage_quantity-btn cartPage_minus" id="cartPage_decreaseQtyBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">-</button>
                                    <input type="number" class="cartPage_quantity-input no-voice" id="cartPage_quantityInput-${cartPage_item.product_key}"
                                           value="${cartPage_item.quantity}" min="1" 
                                           data-product-key="${cartPage_item.product_key}">
                                    <button class="cartPage_quantity-btn cartPage_plus" id="cartPage_increaseQtyBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">+</button>
                                </div>
                            </td>
                            <td id="cartPage_removeBtn-${cartPage_item.product_key}">
                                <button class="cartPage_remove-btn" data-product-key="${cartPage_item.product_key}">
                                    <i class="fas fa-trash"></i> ${window.langu('cart_delete_btn')}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        });

        cartPage_cartItemsContainer.innerHTML = cartPage_cartItemsHTML;
        await cartPage_updateCartSummary();
    } catch (error) {
        console.error(' Error loading :', error);
    }
}
