var salesMovement_STORAGE_KEY = 'sales_movement_user_type';
var salesMovement_radioButtons = document.querySelectorAll('input[name="salesMovement_userType"]');

// Function to fetch orders based on user type using Local DB and Sync Manager
async function salesMovement_fetchOrders(salesMovement_userType) {
    try {
        console.log(`[SalesMovement] Fetching for: ${salesMovement_userType}`);

        // 1. Try to load from Local DB first for instant UI
        const localOrders = await orderGetLocal(salesMovement_userType);
        if (localOrders && localOrders.length > 0) {
            console.log(`[SalesMovement] Found ${localOrders.length} orders in local DB.`);
            salesMovement_displayOrders(localOrders);
        } else {
            // Show loading only if no local data
            salesMovement_showLoading();
        }

        // 2. Run sync in background to get fresh data
        try {
            const newOrders = await OrderSyncManager.orderSync(salesMovement_userType);

            // 3. Re-load from local DB to get merged results (sorted and role-specific)
            const updatedOrders = await orderGetLocal(salesMovement_userType);
            salesMovement_displayOrders(updatedOrders);

        } catch (syncError) {
            console.error('[SalesMovement] Sync failed, showing local data only:', syncError);
            if (!localOrders || localOrders.length === 0) {
                salesMovement_hideLoading();
                // Show empty or error state if nothing to show
                salesMovement_displayOrders([]);
            }
        }

    } catch (salesMovement_error) {
        console.error('حدث خطأ في دالة fetchOrders:', salesMovement_error);
        salesMovement_hideLoading();
    }
}

// Function to display orders
function salesMovement_displayOrders(salesMovement_data) {
    try {
        const salesMovement_container = document.getElementById('salesMovement_ordersContainer');

        // Hide loading state
        salesMovement_hideLoading();

        // Check for data existence
        if (!salesMovement_data || salesMovement_data.length === 0) {
            salesMovement_container.innerHTML = `
                <div class="salesMovement_emptyState">
                    <div class="salesMovement_emptyIcon"><i class="fas fa-box-open"></i></div>
                    <div class="salesMovement_emptyText">${window.langu('sales_no_orders')}</div>
                </div>
            `;
            return;
        }

        // Sort orders by date (newest first)
        const salesMovement_sortedOrders = [...salesMovement_data].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        console.log('عرض الطلبات:', salesMovement_sortedOrders);

        // Create HTML for orders
        let salesMovement_cardsHTML = '';

        salesMovement_sortedOrders.forEach((salesMovement_order, salesMovement_index) => {
            const salesMovement_productCount = salesMovement_order.order_items ? salesMovement_order.order_items.length : 0;

            // حساب عدد البائعين الفريدين
            const salesMovement_uniqueSellers = salesMovement_order.order_items
                ? new Set(salesMovement_order.order_items.map(item => item.seller_key)).size
                : 0;

            const salesMovement_formattedDate = salesMovement_formatDate(salesMovement_order.created_at);
            const salesMovement_productNames = salesMovement_order.order_items
                ? salesMovement_order.order_items.map(item => item.product_name).filter(name => name).join(', ')
                : '';
            const salesMovement_displayTitle = salesMovement_productNames
                ? `${window.langu('sales_order_id').split('#')[0].trim()} - ${salesMovement_productNames}`
                : window.langu('sales_order_id').split('#')[0].trim();

            salesMovement_cardsHTML += `
                <div id="salesMovement_orderCard_${salesMovement_index}" class="salesMovement_orderCard" data-order-index="${salesMovement_index}">
                    <div id="salesMovement_cardHeader_${salesMovement_index}" class="salesMovement_cardHeader">
                        <span id="salesMovement_cardIcon_${salesMovement_index}" class="salesMovement_cardIcon"><i id="salesMovement_cardIconI_${salesMovement_index}" class="fas fa-clipboard-list"></i></span>
                        <div id="salesMovement_cardTitleWrapper_${salesMovement_index}" class="salesMovement_cardTitleWrapper">
                            <span id="salesMovement_cardTitle_${salesMovement_index}" class="salesMovement_cardTitle" title="${salesMovement_displayTitle}">${salesMovement_displayTitle}</span>
                            <span id="salesMovement_orderKey_${salesMovement_index}" class="salesMovement_orderKey">#${salesMovement_order.order_key}</span>
                        </div>
                    </div>
                    <div id="salesMovement_cardBody_${salesMovement_index}" class="salesMovement_cardBody">
                        <div id="salesMovement_cardInfo_date_${salesMovement_index}" class="salesMovement_cardInfo">
                            <span id="salesMovement_dateLabel_${salesMovement_index}"><i id="salesMovement_dateIcon_${salesMovement_index}" class="fas fa-calendar-alt"></i> ${window.langu('sales_date')}</span>
                            <span id="salesMovement_dateValue_${salesMovement_index}">${salesMovement_formattedDate}</span>
                        </div>
                        <div id="salesMovement_cardInfo_count_${salesMovement_index}" class="salesMovement_cardInfo">
                            <div class="salesMovement_infoRow">
                                <span id="salesMovement_countLabel_${salesMovement_index}"><i id="salesMovement_countIcon_${salesMovement_index}" class="fas fa-boxes"></i> ${window.langu('sales_items_count')}</span>
                                <span id="salesMovement_countValue_${salesMovement_index}">${salesMovement_productCount}</span>
                                <span class="salesMovement_infoSeparator">|</span>
                                <span id="salesMovement_sellersLabel_${salesMovement_index}"><i id="salesMovement_sellersIcon_${salesMovement_index}" class="fas fa-store"></i> ${window.langu('sales_sellers_count')}</span>
                                <span id="salesMovement_sellersValue_${salesMovement_index}">${salesMovement_uniqueSellers}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        salesMovement_container.innerHTML = salesMovement_cardsHTML;

        // Add event listeners to cards
        const salesMovement_cards = document.querySelectorAll('.salesMovement_orderCard');
        salesMovement_cards.forEach((salesMovement_card) => {
            salesMovement_card.addEventListener('click', async function () {
                try {
                    const salesMovement_orderIndex = parseInt(this.getAttribute('data-order-index'));
                    let salesMovement_orderData = salesMovement_sortedOrders[salesMovement_orderIndex];

                    if (!salesMovement_orderData) return;

                    // 0. Show loading state to user (Modern Mini Style)
                    Swal.fire({
                        title: 'جاري تحديث البيانات...',
                        html: '<div style="font-size: 0.9em; color: #666;">يتم جلب أحدث تفاصيل الطلب من السيرفر</div>',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        buttonsStyling: false,
                        width: '280px',
                        padding: '1.5em',
                        didOpen: () => Swal.showLoading(),
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text'
                        }
                    });

                    // 1. Fetch latest data from server
                    try {
                        const user = userSession;
                        const isAdmin = (user && typeof ADMIN_IDS !== "undefined" && ADMIN_IDS.includes(user.user_key));
                        const savedType = localStorage.getItem(salesMovement_STORAGE_KEY) || 'buyer';
                        const currentRole = isAdmin ? 'admin' : savedType;

                        // Map internal role to API role
                        let apiRole = 'purchaser';
                        if (currentRole === 'seller') apiRole = 'seller';
                        if (currentRole === 'delivery') apiRole = 'delivery';
                        if (currentRole === 'admin') apiRole = 'admin';

                        const url = `${baseURL}/api/user-all-orders?user_key=${user.user_key}&role=${apiRole}&order_key=${salesMovement_orderData.order_key}`;
                        const response = await fetch(url);

                        if (response.ok) {
                            const updatedOrders = await response.json();
                            if (updatedOrders && updatedOrders.length > 0) {
                                // 2. Update Local DB for persistence
                                await orderSaveToLocalDB(updatedOrders[0], currentRole);
                                console.log('[SalesMovement] Order data refreshed from server.');
                                salesMovement_orderData = updatedOrders[0];
                            }
                        }
                    } catch (fetchErr) {
                        console.warn('[SalesMovement] Failed to refresh order before opening, using cached data.', fetchErr);
                    }

                    // 3. Clear loading
                    Swal.close();

                    // 4. Save order key to localStorage for the next page
                    localStorage.setItem('current_viewing_order_key', salesMovement_orderData.order_key);
                    console.log(`[SalesMovement] Navigating to details for: ${salesMovement_orderData.order_key}`);

                    // 5. Clear stepper data to be safe
                    localStorage.setItem('productKeyFromStepReview', '');

                    // 6. Navigate to the new page using window.location.href
                    window.location.href = "/orderStage/orderData/order-data.html";

                } catch (e) {
                    console.error('[SalesMovement] Error navigating to order data page:', e);
                    Swal.fire('خطأ', 'تعذر فتح تفاصيل الطلب، يرجى المحاولة لاحقاً', 'error');
                }
            });
        });

    } catch (salesMovement_error) {
        console.error('حدث خطأ في دالة displayOrders:', salesMovement_error);
        const salesMovement_container = document.getElementById('salesMovement_ordersContainer');
        salesMovement_container.innerHTML = `
            <div class="salesMovement_emptyState">
                <div class="salesMovement_emptyIcon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="salesMovement_emptyText">${window.langu('sales_error')}</div>
            </div>
        `;
    }
}

// دالة لحفظ الاختيار في localStorage
function salesMovement_saveUserTypeSelection(salesMovement_userType) {
    try {
        localStorage.setItem(salesMovement_STORAGE_KEY, salesMovement_userType);
        console.log(`تم حفظ الاختيار: ${salesMovement_userType} `);
    } catch (salesMovement_error) {
        console.error('حدث خطأ في دالة saveUserTypeSelection:', salesMovement_error);
    }
}

// دالة لاستعادة الاختيار من localStorage وبدء الجلب
function salesMovement_loadUserTypeSelection() {
    try {
        const user = userSession;
        const isAdmin = (user && typeof ADMIN_IDS !== "undefined" && ADMIN_IDS.includes(user.user_key));
        const isImpersonating = localStorage.getItem("originalAdminSession");

        let salesMovement_typeToFetch = 'buyer'; // الافتراضي

        if (isAdmin || isImpersonating) {
            console.log('🔒 الوضع الإداري مفعل: فرض جلب جميع الطلبات.');
            salesMovement_typeToFetch = 'admin';
        } else {
            const savedType = localStorage.getItem(salesMovement_STORAGE_KEY);
            if (savedType) {
                console.log(`تم استعادة الاختيار المحفوظ من الإعدادات: ${savedType}`);
                salesMovement_typeToFetch = savedType;
            } else {
                console.log('لا يوجد اختيار محفوظ، استخدام الافتراضي (مشتري).');
            }
        }

        // جلب البيانات مباشرة
        salesMovement_fetchOrders(salesMovement_typeToFetch);

    } catch (salesMovement_error) {
        console.error('حدث خطأ في دالة loadUserTypeSelection:', salesMovement_error);
        // Fallback safety
        salesMovement_fetchOrders('buyer');
    }
}

// (تم إزالة مستمعي الراديو القديمة لأن العناصر تم حذفها)
// لا حاجة لـ salesMovement_radioButtons.forEach...

// زر التحديث (إذا كنت ترغب في إبقائه مخفياً أو قمت بنقله، تأكد من وجوده في HTML الجديد أو حذفه)
// في الخطة الحالية، قمنا بحذف الكونتينر بالكامل بما فيه زر التحديث.
// إذا أردت إعادة زر التحديث، يجب إضافته في مكان آخر في HTML.
// سأقوم بتعطيل الكود الخاص به لتجنب الأخطاء إذا لم يوجد العنصر.
var salesMovement_refreshBtn = document.getElementById('salesMovement_refreshButton');
if (salesMovement_refreshBtn) {
    salesMovement_refreshBtn.addEventListener('click', function () {
        try {
            // المنطق هنا يحتاج تعديل لقراءة النوع من التخزين لأن الراديو لم يعد موجوداً
            const user = userSession;
            const isAdmin = (user && typeof ADMIN_IDS !== "undefined" && ADMIN_IDS.includes(user.user_key));
            let type = isAdmin ? 'admin' : (localStorage.getItem(salesMovement_STORAGE_KEY) || 'buyer');

            console.log('🔄 تحديث البيانات يدويًا...');
            const icon = this.querySelector('.salesMovement_refreshIcon');
            if (icon) icon.style.transform = 'rotate(360deg)';

            salesMovement_fetchOrders(type);

            setTimeout(() => {
                if (icon) icon.style.transform = '';
            }, 500);

        } catch (error) {
            console.error('خطأ في زر التحديث:', error);
        }
    });
}

// [Standalone Fix] Initialization is now handled via DOMContentLoaded in the HTML file
// salesMovement_loadUserTypeSelection();

// دالة لتنسيق التاريخ بالعربية
function salesMovement_formatDate(salesMovement_dateString) {
    try {
        // Ensure the date string is treated as UTC if it comes from SQLite (standard 'YYYY-MM-DD HH:MM:SS')
        let dateStr = salesMovement_dateString;
        if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
            // Replace space with T and add Z to force UTC parsing
            dateStr = dateStr.replace(' ', 'T') + 'Z';
        }

        const salesMovement_date = new Date(dateStr);

        // Check validity
        if (isNaN(salesMovement_date.getTime())) {
            // Fallback to original string parsing if modification failed
            return new Date(salesMovement_dateString).toLocaleString('ar-EG');
        }

        return salesMovement_date.toLocaleString('ar-EG', {
            timeZone: 'Africa/Cairo', // Explicitly target Egypt time
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    } catch (salesMovement_error) {
        console.error('خطأ في تنسيق التاريخ:', salesMovement_error);
        return salesMovement_dateString;
    }
}

// [DEPRECATED] The old salesMovement_showOrderDetails function has been removed.
// The system now navigates directly to order-data.html instead of using an iframe.

// دالة لإظهار حالة التحميل
function salesMovement_showLoading() {
    try {
        const loader = document.getElementById('loader-container');
        const container = document.getElementById('salesMovement_ordersContainer');
        if (loader) loader.style.display = 'block';
        if (container) container.style.display = 'none';
    } catch (salesMovement_error) {
        console.error('خطأ في عرض حالة التحميل:', salesMovement_error);
    }
}

// دالة لإخفاء حالة التحميل
function salesMovement_hideLoading() {
    try {
        const loader = document.getElementById('loader-container');
        const container = document.getElementById('salesMovement_ordersContainer');
        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'block';
    } catch (salesMovement_error) {
        console.error('خطأ في إخفاء حالة التحميل:', salesMovement_error);
    }
}

// إغلاق النافذة المنبثقة
var salesMovement_closeModalBtn = document.getElementById('salesMovement_closeModal');
var salesMovement_modal = document.getElementById('salesMovement_orderModal');

if (salesMovement_closeModalBtn) {
    salesMovement_closeModalBtn.addEventListener('click', function () {
        salesMovement_modal.classList.remove('salesMovement_show');
    });
}

// إغلاق النافذة عند النقر خارجها - تم تعطيله بناءً على طلب المستخدم
// if (salesMovement_modal) {
//     salesMovement_modal.addEventListener('click', function (salesMovement_event) {
//         if (salesMovement_event.target === salesMovement_modal) {
//             salesMovement_modal.classList.remove('salesMovement_show');
//         }
//     });
// }

// ========================================
// مراقبة تغييرات localStorage للمفتاح productKeyFromStepReview
// ========================================

// متغير لمنع التنفيذ المتكرر
var salesMovement_isProcessingProductKey = false;

// دالة للتحقق من التغييرات
async function salesMovement_checkProductKeyChanges() {
    try {
        // منع التنفيذ المتكرر
        if (salesMovement_isProcessingProductKey) {
            return;
        }

        const salesMovement_currentProductKey = localStorage.getItem('productKeyFromStepReview');

        // التحقق من وجود قيمة صالحة
        if (salesMovement_currentProductKey !== null &&
            salesMovement_currentProductKey !== "" &&
            salesMovement_currentProductKey !== undefined) {

            console.log('🔔 تم اكتشاف قيمة productKeyFromStepReview:', salesMovement_currentProductKey);

            // تفعيل علامة المعالجة
            salesMovement_isProcessingProductKey = true;

            // مسح القيمة فوراً لمنع التكرار
            localStorage.setItem('productKeyFromStepReview', "");

            try {
                // جلب بيانات المنتج
                const salesMovement_response = await fetch(`${baseURL}/api/products?product_key=${salesMovement_currentProductKey}`);

                if (!salesMovement_response.ok) {
                    throw new Error(`HTTP error! status: ${salesMovement_response.status}`);
                }

                const product = await salesMovement_response.json();
                console.log('✅ تم جلب بيانات المنتج:', product);

                // تحضير بيانات المنتج
                const productDataForModal = mapProductData(product);

                // تحديث الجلسة وعرض المنتج باستخدام النظام الحديث
                loadProductView(productDataForModal, { showAddToCart: false });
                console.log('✅ تم استدعاء loadProductView بنجاح');

            } catch (fetchError) {
                console.error('❌ خطأ في جلب بيانات المنتج:', fetchError);
            } finally {
                // إعادة تعيين علامة المعالجة بعد ثانية واحدة
                setTimeout(() => {
                    salesMovement_isProcessingProductKey = false;
                }, 1000);
            }
        }
    } catch (salesMovement_error) {
        console.error('❌ خطأ في مراقبة productKeyFromStepReview:', salesMovement_error);
        salesMovement_isProcessingProductKey = false;
    }
}

// بدء المراقبة كل 100 ملي ثانية
var salesMovement_productKeyWatcher = setInterval(salesMovement_checkProductKeyChanges, 100);

// تنظيف المراقبة عند إغلاق الصفحة (اختياري)
window.addEventListener('beforeunload', function () {
    clearInterval(salesMovement_productKeyWatcher);
});

console.log('✅ تم تفعيل مراقبة productKeyFromStepReview في localStorage');
