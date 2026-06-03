/**
 * @file pages/sales-movement/sales-templates.js
 * @description Pure HTML template generators for Sales Movement page.
 * Separation of UI strings from logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function salesMovement_tpl_OrderCard(order, role, cardIndex, formattedDate, displayTitle, productCount, uniqueSellers) {
    return `
        <div id="salesMovement_orderCard_${role}_${cardIndex}" class="salesMovement_orderCard"
             data-order-key="${order.order_key}" data-role-context="${role}">
            <div id="salesMovement_cardHeader_${role}_${cardIndex}" class="salesMovement_cardHeader">
                <span id="salesMovement_cardIcon_${role}_${cardIndex}" class="salesMovement_cardIcon">
                    <i id="salesMovement_cardIconI_${role}_${cardIndex}" class="fas fa-clipboard-list"></i>
                </span>
                <div id="salesMovement_cardTitleWrapper_${role}_${cardIndex}" class="salesMovement_cardTitleWrapper">
                    <span id="salesMovement_cardTitle_${role}_${cardIndex}" class="salesMovement_cardTitle" title="${displayTitle}">${displayTitle}</span>
                    <span id="salesMovement_orderKey_${role}_${cardIndex}" class="salesMovement_orderKey">#${order.order_key}</span>
                </div>
            </div>
            <div id="salesMovement_cardBody_${role}_${cardIndex}" class="salesMovement_cardBody">
                <div id="salesMovement_cardInfo_date_${role}_${cardIndex}" class="salesMovement_cardInfo">
                    <span id="salesMovement_dateLabel_${role}_${cardIndex}">
                        <i id="salesMovement_dateIcon_${role}_${cardIndex}" class="fas fa-calendar-alt"></i> ${window.langu("sales_date")}
                    </span>
                    <span id="salesMovement_dateValue_${role}_${cardIndex}">${formattedDate}</span>
                </div>
                <div id="salesMovement_cardInfo_count_${role}_${cardIndex}" class="salesMovement_cardInfo">
                    <div id="salesMovement_infoRow_${role}_${cardIndex}" class="salesMovement_infoRow">
                        <span id="salesMovement_countLabel_${role}_${cardIndex}">
                            <i id="salesMovement_countIcon_${role}_${cardIndex}" class="fas fa-boxes"></i> ${window.langu("sales_items_count")}
                        </span>
                        <span id="salesMovement_countValue_${role}_${cardIndex}">${productCount}</span>
                        <span id="salesMovement_infoSeparator_${role}_${cardIndex}" class="salesMovement_infoSeparator">|</span>
                        <span id="salesMovement_sellersLabel_${role}_${cardIndex}">
                            <i id="salesMovement_sellersIcon_${role}_${cardIndex}" class="fas fa-store"></i> ${window.langu("sales_sellers_count")}
                        </span>
                        <span id="salesMovement_sellersValue_${role}_${cardIndex}">${uniqueSellers}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function salesMovement_tpl_EmptyState(icon, text) {
    return `
        <div id="salesMovement_emptyState" class="salesMovement_emptyState">
            <div id="salesMovement_emptyIcon" class="salesMovement_emptyIcon"><i id="salesMovement_emptyIconI" class="fas ${icon}"></i></div>
            <div id="salesMovement_emptyText" class="salesMovement_emptyText">${text}</div>
        </div>
    `;
}

function salesMovement_tpl_TabButton(role, activeRole, definition, count, title) {
    var isActive = role === activeRole;
    return `
        <button id="salesMovement_tabButton_${role}" type="button"
                class="salesMovement_tabButton${isActive ? " is-active" : ""}"
                data-role-tab="${role}"
                role="tab"
                aria-selected="${isActive ? "true" : "false"}"
                aria-controls="salesMovement_section_${role}">
            <span id="salesMovement_tabIcon_${role}" class="salesMovement_tabIcon"><i id="salesMovement_tabIconI_${role}" class="${definition.icon}"></i></span>
            <span id="salesMovement_tabLabel_${role}" class="salesMovement_tabLabel">${title}</span>
            <span id="salesMovement_tabCount_${role}" class="salesMovement_tabCount">${count}</span>
        </button>
    `;
}

function salesMovement_tpl_Section(role, activeRole, cardsHtml, sortedOrdersLength, emptyText) {
    var isActive = role === activeRole;
    return `
        <section id="salesMovement_section_${role}"
                 class="salesMovement_roleSection${isActive ? " is-active" : ""}"
                 data-role-panel="${role}"
                 role="tabpanel"
                 aria-hidden="${isActive ? "false" : "true"}">
            ${sortedOrdersLength > 0 ? `
                <div id="salesMovement_roleGrid_${role}" class="salesMovement_roleGrid">${cardsHtml}</div>
            ` : `
                <div id="salesMovement_sectionEmpty_${role}" class="salesMovement_sectionEmpty">${emptyText}</div>
            `}
        </section>
    `;
}
