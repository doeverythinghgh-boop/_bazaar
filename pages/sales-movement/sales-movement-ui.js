/**
 * @file pages/sales-movement/sales-movement-ui.js
 * @description rendering logic for Sales Movement. Delegates HTML generation to sales-templates.js.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function salesMovement_buildOrderCard(order, role, cardIndex) {
    var productCount = order.order_items ? order.order_items.length : 0;
    var uniqueSellers = order.order_items
        ? new Set(order.order_items.map(function (item) { return item.seller_key; })).size
        : 0;

    var formattedDate = salesMovement_formatDate(order.created_at);
    var productNames = order.order_items
        ? order.order_items.map(function (item) { return item.product_name; }).filter(Boolean).join(", ")
        : "";
    var displayTitle = productNames
        ? (window.langu("sales_order_id") || "").split("#")[0].trim() + " - " + productNames
        : (window.langu("sales_order_id") || "").split("#")[0].trim();

    return salesMovement_tpl_OrderCard(order, role, cardIndex, formattedDate, displayTitle, productCount, uniqueSellers);
}

function salesMovement_displayGroupedOrders(groupedOrders) {
    try {
        var container = document.getElementById("salesMovement_ordersContainer");
        var rolePlan = salesMovement_getRolePlan();
        var totalOrders = rolePlan.reduce(function (sum, role) {
            return sum + ((groupedOrders[role] || []).length);
        }, 0);

        salesMovement_hideLoading();

        if (!container) return;

        if (totalOrders === 0) {
            container.innerHTML = salesMovement_tpl_EmptyState("fa-box-open", window.langu("sales_no_orders"));
            salesMovement_attachCardListeners();
            return;
        }

        var visibleRoles = rolePlan.filter(function (role) {
            return (groupedOrders[role] || []).length > 0;
        });
        var activeRole = visibleRoles[0] || rolePlan[0] || null;

        var tabsHtml = visibleRoles.map(function (role) {
            var definition = salesMovement_ROLE_DEFINITIONS[role];
            var count = (groupedOrders[role] || []).length;
            var title = salesMovement_getRoleTitle(role);
            return salesMovement_tpl_TabButton(role, activeRole, definition, count, title);
        }).join("");

        var sectionsHtml = rolePlan.map(function (role) {
            var orders = Array.isArray(groupedOrders[role]) ? groupedOrders[role] : [];
            var sortedOrders = orders.slice().sort(function (a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });

            var cardsHtml = sortedOrders.map(function (order, index) {
                return salesMovement_buildOrderCard(order, role, index);
            }).join("");

            return salesMovement_tpl_Section(role, activeRole, cardsHtml, sortedOrders.length, salesMovement_getSectionEmptyText(role));
        }).join("");

        container.innerHTML = `
            ${visibleRoles.length > 1 ? `<div id="salesMovement_tabsBar" class="salesMovement_tabsBar">${tabsHtml}</div>` : ""}
            ${sectionsHtml}
        `;

        salesMovement_attachTabListeners();
        salesMovement_attachCardListeners();
    } catch (salesMovement_error) {
        console.error("[SalesMovement] Display error:", salesMovement_error);
        var salesMovement_container = document.getElementById("salesMovement_ordersContainer");
        if (salesMovement_container) {
            salesMovement_container.innerHTML = salesMovement_tpl_EmptyState("fa-exclamation-triangle", window.langu("sales_error"));
        }
    }
}

function salesMovement_attachTabListeners() {
    var tabButtons = document.querySelectorAll(".salesMovement_tabButton");
    var roleSections = document.querySelectorAll(".salesMovement_roleSection");

    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var role = this.getAttribute("data-role-tab");
            if (!role) return;

            tabButtons.forEach(function (btn) {
                var isActive = btn === button;
                btn.classList.toggle("is-active", isActive);
                btn.setAttribute("aria-selected", isActive ? "true" : "false");
            });

            roleSections.forEach(function (section) {
                var isActive = section.getAttribute("data-role-panel") === role;
                section.classList.toggle("is-active", isActive);
                section.setAttribute("aria-hidden", isActive ? "false" : "true");
            });
        });
    });
}

function salesMovement_attachCardListeners() {
    var cards = document.querySelectorAll(".salesMovement_orderCard");
    cards.forEach(function (card) {
        card.addEventListener("click", async function () {
            var orderKey = this.getAttribute("data-order-key");
            var role = this.getAttribute("data-role-context");
            if (!orderKey || !role) return;

            try {
                Swal.fire({
                    title: window.langu("sales_updating_data_title"),
                    html: `<div style="font-size: 0.9em; opacity: 0.8;">${window.langu("sales_updating_data_text")}</div>`,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    buttonsStyling: false,
                    width: 320,
                    padding: "1.5rem",
                    didOpen: function () { Swal.showLoading(); },
                    customClass: {
                        popup: "swal-modern-mini-popup",
                        title: "swal-modern-mini-title",
                        htmlContainer: "swal-modern-mini-text"
                    }
                });

                await salesMovement_refreshOrderBeforeOpen(orderKey, role);

                Swal.close();

                LocalDBStorage.setItem("current_viewing_order_key", orderKey);
                LocalDBStorage.setItem(salesMovement_ROLE_STORAGE_KEY, role);
                LocalDBStorage.setItem("productKeyFromStepReview", "");
                window.location.href = `/orderStage/orderData/order-data.html?order_key=${orderKey}`;
            } catch (e) {
                console.error("[SalesMovement] Error navigating to order data page:", e);
                Swal.fire(window.langu("sales_error_title"), window.langu("sales_error_open_details"), "error");
            }
        });
    });
}

function salesMovement_showLoading() {
    try {
        var loader = document.getElementById("loader-container");
        var container = document.getElementById("salesMovement_ordersContainer");
        if (loader) loader.style.display = "block";
        if (container) container.style.display = "none";
    } catch (salesMovement_error) {
        console.error("Error showing loader:", salesMovement_error);
    }
}

function salesMovement_hideLoading() {
    try {
        var loader = document.getElementById("loader-container");
        var container = document.getElementById("salesMovement_ordersContainer");
        if (loader) loader.style.display = "none";
        if (container) container.style.display = "block";
    } catch (salesMovement_error) {
        console.error("Error hiding loader:", salesMovement_error);
    }
}
