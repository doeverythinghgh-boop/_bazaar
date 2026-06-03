/**
 * @file pages/productView/js/view_ui_purchase.js
 * @description Purchase actions and destructive admin actions for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function productView_setupQuantityControls(productData, dom) {
    try {
        const { decreaseBtn, increaseBtn, selectedQuantityInput } = dom;
        if (!decreaseBtn || !increaseBtn || !selectedQuantityInput) {
            window.ProductDebugConsole?.warn('productView-purchase', 'quantity-controls-missing-dom');
            return;
        }

        selectedQuantityInput.max = productData.availableQuantity;
        selectedQuantityInput.value = 1;
        window.ProductDebugConsole?.snapshot('productView-purchase', 'quantity-controls-ready', {
            productKey: productData?.product_key || null,
            maxQuantity: productData.availableQuantity
        });

        const quantityChangeHandler = () => {
            let quantity = parseInt(selectedQuantityInput.value, 10);
            const max = parseInt(selectedQuantityInput.max, 10);
            if (quantity < 1 || Number.isNaN(quantity)) selectedQuantityInput.value = 1;
            else if (quantity > max) selectedQuantityInput.value = max;

            window.ProductDebugConsole?.snapshot('productView-purchase', 'quantity-changed', {
                productKey: productData?.product_key || null,
                quantity: parseInt(selectedQuantityInput.value, 10)
            });
            productView_updateTotalPrice(productData, dom);
        };

        decreaseBtn.onclick = () => {
            if (parseInt(selectedQuantityInput.value, 10) > 1) {
                selectedQuantityInput.value = parseInt(selectedQuantityInput.value, 10) - 1;
                window.ProductDebugConsole?.log('productView-purchase', 'quantity-decrement', {
                    quantity: parseInt(selectedQuantityInput.value, 10)
                });
                productView_updateTotalPrice(productData, dom);
            }
        };

        increaseBtn.onclick = () => {
            const currentVal = parseInt(selectedQuantityInput.value, 10) || 1;
            let maxAttr = parseInt(selectedQuantityInput.max, 10);
            if (Number.isNaN(maxAttr) || maxAttr <= 0) maxAttr = 999;

            if (currentVal < maxAttr) {
                selectedQuantityInput.value = currentVal + 1;
                window.ProductDebugConsole?.log('productView-purchase', 'quantity-increment', {
                    quantity: parseInt(selectedQuantityInput.value, 10)
                });
                productView_updateTotalPrice(productData, dom);
            } else {
                window.ProductDebugConsole?.warn('productView-purchase', 'max-quantity-reached', {
                    quantity: currentVal,
                    maxAttr
                });
                Swal.fire({
                    text: window.langu('pv_max_quantity_reached'),
                    confirmButtonText: window.langu('alert_confirm_btn'),
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            }
        };

        selectedQuantityInput.onchange = quantityChangeHandler;
        selectedQuantityInput.onblur = quantityChangeHandler;
        productView_updateTotalPrice(productData, dom);
    } catch (error) {
        console.error('productView_setupQuantityControls - quantity controls error:', error);
        window.ProductDebugConsole?.error('productView-purchase', 'quantity-controls-error', {
            message: error?.message || String(error)
        });
    }
}

function productView_updateTotalPrice(productData, dom) {
    const { selectedQuantityInput, totalPriceEl, totalSavingsEl } = dom;
    if (!selectedQuantityInput || !totalPriceEl) {
        window.ProductDebugConsole?.warn('productView-purchase', 'update-total-price-missing-dom');
        return;
    }

    const quantity = parseInt(selectedQuantityInput.value, 10) || 1;
    const pricePerItem = parseFloat(productData.pricePerItem) || 0;
    const originalPrice = parseFloat(productData.original_price) || 0;
    const total = quantity * pricePerItem;

    totalPriceEl.textContent = `${productView_formatAmount(total)} ${window.langu('pv_currency_egp')}`;

    if (totalSavingsEl && originalPrice > pricePerItem) {
        const savings = (originalPrice - pricePerItem) * quantity;
        totalSavingsEl.textContent = `${window.langu('pv_savings_label')} ${productView_formatAmount(savings)} ${window.langu('pv_currency_egp')}`;
        totalSavingsEl.parentElement.style.display = 'flex';
        window.ProductDebugConsole?.snapshot('productView-purchase', 'total-updated', {
            quantity,
            total,
            savings
        });
    } else if (totalSavingsEl) {
        totalSavingsEl.parentElement.style.display = 'none';
        window.ProductDebugConsole?.snapshot('productView-purchase', 'total-updated', {
            quantity,
            total,
            savings: 0
        });
    }
}

function productView_setupAddToCart(productData, dom) {
    try {
        if (!dom.addToCartBtn) {
            window.ProductDebugConsole?.warn('productView-purchase', 'add-to-cart-button-missing');
            return;
        }

        dom.addToCartBtn.onclick = async () => {
            window.ProductDebugConsole?.log('productView-purchase', 'add-to-cart-clicked', {
                productKey: productData?.product_key || null
            });

            if (showLoginAlert()) {
                const quantity = parseInt(dom.selectedQuantityInput.value, 10);
                const productInfoForCart = {
                    product_key: productData.product_key,
                    productName: productData.productName,
                    price: productData.pricePerItem,
                    original_price: productData.original_price,
                    image: productData.imageSrc[0],
                    seller_key: productData.user_key,
                    sellerName: productData.seller_name || productData.sellerName || productData.seller_username || '',
                    sellerPhone: productData.seller_phone || productData.sellerPhone || '',
                    seller_location: productData.seller_location || '',
                    heavyLoad: productData.heavyLoad || 0,
                    sellerLimitPackage: productData.limitPackage || 0,
                    sellerIsDelevred: productData.isDelivered || 0,
                    serviceType: productData.serviceType ?? productData.type ?? 0,
                    realPrice: productData.realPrice ?? productData.pricePerItem,
                    product_price: productData.product_price ?? productData.pricePerItem
                };

                if (productData.seller_location && String(productData.seller_location).includes(',')) {
                    const [lat, lng] = String(productData.seller_location).split(',');
                    productInfoForCart.seller_lat = parseFloat(lat);
                    productInfoForCart.seller_lng = parseFloat(lng);
                    window.ProductDebugConsole?.snapshot('productView-purchase', 'seller-location-parsed', {
                        lat: productInfoForCart.seller_lat,
                        lng: productInfoForCart.seller_lng
                    });
                } else {
                    window.ProductDebugConsole?.warn('productView-purchase', 'seller-location-missing-or-invalid', {
                        rawLocation: productData.seller_location || null
                    });
                }

                window.ProductDebugConsole?.snapshot('productView-purchase', 'add-to-cart-payload', {
                    quantity,
                    productKey: productInfoForCart.product_key,
                    sellerKey: productInfoForCart.seller_key
                });
                addToCart(productInfoForCart, quantity);
                window.ProductDebugConsole?.log('productView-purchase', 'add-to-cart-dispatched', {
                    quantity,
                    productKey: productInfoForCart.product_key
                });
            } else {
                window.ProductDebugConsole?.warn('productView-purchase', 'add-to-cart-blocked-by-login');
            }
        };
    } catch (error) {
        console.error('productView_setupAddToCart - add to cart setup error:', error);
        window.ProductDebugConsole?.error('productView-purchase', 'add-to-cart-setup-error', {
            message: error?.message || String(error)
        });
    }
}

async function productView_handleDelete(productData) {
    if (!productData || !productData.product_key) {
        window.ProductDebugConsole?.warn('productView-purchase', 'delete-skipped-missing-product');
        return;
    }

    window.ProductDebugConsole?.log('productView-purchase', 'delete-start', {
        productKey: productData.product_key
    });

    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;

    const result = await Swal.fire({
        title: window.langu('gen_swal_title_confirm') || 'هل أنت متأكد؟',
        text: (window.langu('gen_swal_remove_text') || 'سيتم حذف {name} نهائيا').replace('{name}', productData.productName),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: window.langu('gen_swal_btn_yes_delete') || 'نعم، احذف',
        cancelButtonText: window.langu('gen_swal_btn_cancel') || 'إلغاء',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                if (typeof deleteProduct_ !== 'function') {
                    throw new Error('deleteProduct_ function not found');
                }

                const isPharmacyProduct = window.ProductPharmacyBridge?.isPharmacyProduct?.(productData) === true;
                const isSpecialtyProduct = window.ProductSpecialtyListingBridge?.isSpecialtyProduct?.(productData) === true;
                if (!isPharmacyProduct && !isSpecialtyProduct) {
                    const dbRes = await deleteProduct_(productData.product_key);
                    window.ProductDebugConsole?.snapshot('productView-purchase', 'delete-product-response', {
                        productKey: productData.product_key,
                        hasError: !!dbRes?.error
                    });
                    if (dbRes && dbRes.error) throw new Error(dbRes.error);
                }

                if (isPharmacyProduct && typeof window.ProductPharmacyBridge?.deleteMetadata === 'function') {
                    const pharmacyRes = await window.ProductPharmacyBridge.deleteMetadata(productData);
                    if (pharmacyRes && pharmacyRes.error) throw new Error(pharmacyRes.error);
                }
                if (isSpecialtyProduct && typeof window.ProductSpecialtyListingBridge?.deleteListing === 'function') {
                    const specialtyRes = await window.ProductSpecialtyListingBridge.deleteListing(productData);
                    if (specialtyRes && specialtyRes.error) throw new Error(specialtyRes.error);
                }

                if (productData.ImageName && typeof window.deleteFile2cf === 'function') {
                    const images = productData.ImageName.split(',').filter((item) => item.trim());
                    if (images.length > 0) {
                        window.ProductDebugConsole?.log('productView-purchase', 'delete-images-start', {
                            productKey: productData.product_key,
                            imageCount: images.length
                        });
                        const deleteResults = await Promise.allSettled(
                            images.map((img) => window.deleteFile2cf(img.trim()))
                        );
                        const failedCount = deleteResults.filter((item) => item.status === 'rejected').length;
                        if (failedCount > 0) {
                            window.ProductDebugConsole?.warn('productView-purchase', 'delete-images-partial-failure', {
                                productKey: productData.product_key,
                                failedCount
                            });
                        }
                        window.ProductDebugConsole?.log('productView-purchase', 'delete-images-complete', {
                            productKey: productData.product_key,
                            imageCount: images.length,
                            failedCount
                        });
                    }
                }

                return true;
            } catch (error) {
                window.ProductDebugConsole?.error('productView-purchase', 'delete-error', {
                    productKey: productData.product_key,
                    message: error?.message || String(error)
                });
                const errTemplate = L('port_delete_error', 'خطأ أثناء الحذف: {msg}');
                Swal.showValidationMessage(errTemplate.replace('{msg}', error.message));
                return false;
            }
        }
    });

    if (result.isConfirmed) {
        window.ProductDebugConsole?.log('productView-purchase', 'delete-confirmed', {
            productKey: productData.product_key
        });
        Swal.fire({
            title: L('port_delete_success_title', 'تم الحذف!'),
            text: L('port_delete_success_text', 'تم حذف المنتج بنجاح.'),
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'swal-modern-mini-popup' }
        });

        setTimeout(() => {
            if (window.history.length > 1) {
                window.ProductDebugConsole?.log('productView-purchase', 'delete-navigate-back');
                window.history.back();
            } else {
                window.ProductDebugConsole?.log('productView-purchase', 'delete-navigate-home');
                window.location.href = '/index.html';
            }
        }, 2000);
    } else {
        window.ProductDebugConsole?.log('productView-purchase', 'delete-cancelled', {
            productKey: productData.product_key
        });
    }
}
