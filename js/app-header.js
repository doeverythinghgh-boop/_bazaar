/**
 * @file js/app-header.js
 * @description Manages the application header injection and event binding across different pages.
 * @var AppHeader
 */

var AppHeader = {
  /**
   * @description Injects the header HTML into the specified target element and binds event listeners.
   * @function init
   * @param {string} targetId - The ID of the container element.
   * @param {string} [activeBtnId] - The ID of the button to be marked as active.
   * @async
   */
  init: async function (targetId, activeBtnId) {
    try {
      var container = document.getElementById(targetId);
      if (!container) {
        console.warn('[AppHeader] Target container not found:', targetId);
        return;
      }

      // Inject the template
      container.innerHTML = this.getTemplate();

      // Bind navigation handlers (from app-nav.js)
      if (typeof window.bindNavigationHandlers === 'function') {
        window.bindNavigationHandlers();
      } else {
        console.warn('[AppHeader] bindNavigationHandlers not found. Ensure app-nav.js is loaded.');
      }

      // Set active button
      if (activeBtnId) {
        var activeBtn = document.getElementById(activeBtnId);
        if (activeBtn && typeof window.setActiveButton === 'function') {
          window.setActiveButton(activeBtn);
        }
      }

      // Update badge if notifications logic is loaded
      if (typeof window.updateGlobalNotificationCount === 'function') {
        window.updateGlobalNotificationCount();
      }

      // Update cart badge if logic is loaded
      if (typeof updateCartBadge === 'function') {
        updateCartBadge();
      }

      // Refresh username display (from tools.js)
      if (typeof setUserNameInIndexBar === 'function') {
        setUserNameInIndexBar();
      }

    } catch (error) {
      console.error('[AppHeader] Initialization failed:', error);
    }
  },

  /**
   * @description Returns the standardized HTML template for the application header.
   * @function getTemplate
   * @returns {string} - The header HTML string.
   */
  getTemplate: function () {
    var l = window.langu || function (k) { return k; };

    return `
      <header class="index-app-header" id="index-app-header">
        <!-- زر تسجيل الدخول -->
        <button class="index-header-login-btn" id="index-login-btn">
          <i class="fas fa-user-circle index-user-icon" id="index-login-icon"></i>
          <span id="index-login-text" data-lkey="login_text">${l('login_text')}</span>
        </button>

        <!-- زر الرئيسية -->
        <button class="index-header-login-btn" id="index-home-btn">
          <i class="fas fa-home index-user-icon" id="index-home-icon"></i>
          <span id="index-home-text" data-lkey="home_text">${l('home_text')}</span>
        </button>

        <!-- زر البحث -->
        <button class="index-header-login-btn" id="index-search-btn">
          <i class="fas fa-search index-user-icon" id="index-search-icon"></i>
          <span id="index-search-text" data-lkey="search_text">${l('search_text')}</span>
        </button>

        <!-- زر الإشعارات -->
        <button class="index-header-login-btn" id="index-notifications-btn">
          <i class="fas fa-bell index-user-icon" id="index-notifications-icon"></i>
          <span class="cart-badge" id="notifications-badge">0</span>
          <span id="index-notifications-text" data-lkey="notifications_text">${l('notifications_text')}</span>
        </button>

        <!-- زر السلة -->
        <button class="index-header-login-btn" id="index-cart-btn">
          <i class="fas fa-shopping-cart index-user-icon" id="index-cart-icon"></i>
          <span id="index-cart-text" data-lkey="cart_text">${l('cart_text')}</span>
        </button>

        <!-- زر حركة المشتريات -->
        <button class="index-header-login-btn" id="index-sales-movement-btn">
          <i class="fas fa-history index-user-icon" id="index-sales-icon"></i>
          <span id="index-sales-text" data-lkey="sales_text">${l('sales_text')}</span>
        </button>
      </header>
    `;
  }
};
