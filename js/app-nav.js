/**
 * @file js/app-nav.js
 * @description Navigation management module for the Bazaar application.
 * Handles button clicks, page transitions, and active state management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @function setActiveButton
 * @description Sets the active class on the clicked button and removes it from others.
 * @param {HTMLElement} clickedBtn - The button that was clicked.
 * @returns {void}
 */
export const setActiveButton = (clickedBtn) => {
  const btnName = clickedBtn ? clickedBtn.id : 'none';
  console.log(`[Nav] Setting active button: ${btnName}`);
  var headerButtons = document.querySelectorAll(".index-header-login-btn");
  headerButtons.forEach(function (btn) {
    btn.classList.remove("active");
  });
  if (clickedBtn) {
    clickedBtn.classList.add("active");
  }
};

/**
 * @function navigateTo
 * @description Centralized navigation helper that supports history and Android lifecycle.
 */
export function navigateTo(url, descriptiveName) {
  console.log(`[Nav] Navigation trigger: ${descriptiveName || url}. Syncing history state.`);

  // Notify BridgeManager that we have navigated
  if (window.BridgeManager) {
    window.BridgeManager.updateBackState(true);
  }

  // Use location.href for full page loads as established in the project.
  window.location.href = url;
}

/**
 * @function handleHomeButtonClick
 * @description Handles the "Home" button click.
 */
export const handleHomeButtonClick = () => {
  navigateTo("/pages/home/home.html", "Home Page");
};

/**
 * @function handleLoginButtonClick
 * @description Handles the "Login" button click.
 */
export const handleLoginButtonClick = () => {
  try {
    var currentUser = typeof window.SessionManager !== 'undefined' ? window.SessionManager.getUser() : null;
    if (currentUser) {
      if (currentUser.user_key === "guest_user") {
        navigateTo("/pages/merchant-portfolio/merchant-portfolio.html?user_key=" + currentUser.user_key, "Guest Profile");
      } else {
        navigateTo("/pages/merchant-portfolio/merchant-portfolio.html?user_key=" + currentUser.user_key, "User Profile");
      }
    } else {
      navigateTo("/pages/login/login.html", "Login Page");
    }
  } catch (error) {
    console.error("[Nav] Error in login button handler:", error);
  }
};

/**
 * @function handleSearchButtonClick
 * @description Handles the "Search" button click.
 */
export const handleSearchButtonClick = () => {
  // Check if current page is search.html
  const isSearchPage = window.location.pathname.includes('search.html');

  if (isSearchPage) {
    navigateTo("/pages/search/search.html", "Search Page");
    return;
  }

  // ✅ NEW: If there is a saved state in LocalDBSession, go directly to search page
  const hasSavedState = LocalDBSession.getItem('search_page_state');
  if (hasSavedState) {
    console.info("[Nav] Saved search state found. Navigating directly to search.html");
    navigateTo("/pages/search/search.html", "Search Page");
    return;
  }

  // Determine current language
  const isAr = (window.app_language || 'ar') === 'ar';

  // Translation keys (with hardcoded fallbacks to ensure functionality)
  const title = isAr ? "ابحث داخل بازار السويس" : "Search Suez Bazaar";
  const placeholder = window.langu('search_modal_input_placeholder') || (isAr ? "اكتب اسم المنتج..." : "Type product name...");
  const searchBtnText = window.langu('search_modal_search_btn_aria') || (isAr ? "بحث" : "Search");
  const closeBtnText = window.langu('alert_close_btn') || (isAr ? "إغلاق" : "Close");
  const minLengthError = window.langu('search_modal_input_min_length_error') || (isAr ? "يرجى إدخال 3 أحرف على الأقل." : "Please enter at least 3 characters.");

  if (typeof Swal === 'undefined') {
    console.error("[Nav] Swal is missing. Cannot open search modal.");
    return;
  }

  Swal.fire({
    title: title,
    html: `
      <div style="padding: 0px;">
        <input type="text" id="search-modal-input" class="swal-modern-mini-input" 
               style="text-align: ${isAr ? 'right' : 'left'};" 
               placeholder="${placeholder}">
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="search-perform-search-btn" class="swal-modern-mini-confirm" style="flex: 1;">
            ${searchBtnText}
          </button>
          <button id="search-close-modal-btn" class="swal-modern-mini-cancel" style="flex: 1;">
            ${closeBtnText}
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: true,
    customClass: {
      popup: 'swal-modern-mini-popup',
      title: 'swal-modern-mini-title'
    },
    didOpen: () => {
      const input = document.getElementById('search-modal-input');
      const searchBtn = document.getElementById('search-perform-search-btn');
      const closeBtn = document.getElementById('search-close-modal-btn');

      if (input) input.focus();

      const executeSearch = () => {
        const query = input.value.trim();
        if (query.length < 3) {
          Swal.showValidationMessage(minLengthError);
          return;
        }
        LocalDBStorage.setItem('pendingSearchQuery', query);
        Swal.close();
        navigateTo("/pages/search/search.html", "Search Page");
      };

      if (searchBtn) searchBtn.addEventListener('click', executeSearch);
      if (closeBtn) closeBtn.addEventListener('click', () => Swal.close());
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') executeSearch();
        });
      }
    }
  });
};

/**
 * @function handleNotificationsButtonClick
 * @description Handles the "Notifications" button click.
 */
export const handleNotificationsButtonClick = () => {
  if (typeof window.showLoginAlert === 'function' && window.showLoginAlert()) {
    navigateTo("/notification/page/notifications.html", "Notifications Center");
  }
};

/**
 * @function handleCartButtonClick
 * @description Handles the "Cart" button click.
 */
export const handleCartButtonClick = () => {
  if (typeof window.showLoginAlert === 'function' && window.showLoginAlert()) {
    navigateTo("/pages/cardPackage/cardPackage.html", "Cart/Package Page");
  }
};

/**
 * @description Binds navigation handlers to DOM elements.
 * @function bindNavigationHandlers
 */
export const bindNavigationHandlers = () => {
  console.log("[Nav] Binding navigation listeners...");

  var loginBtn = document.getElementById("index-login-btn");
  if (loginBtn) loginBtn.addEventListener("click", handleLoginButtonClick);

  var homeBtn = document.getElementById("index-home-btn");
  if (homeBtn) homeBtn.addEventListener("click", handleHomeButtonClick);

  var searchBtn = document.getElementById("index-search-btn");
  if (searchBtn) searchBtn.addEventListener("click", handleSearchButtonClick);

  var salesBtn = document.getElementById("index-sales-movement-btn");
  if (salesBtn) {
    salesBtn.addEventListener("click", function () {
      if (typeof window.showLoginAlert === 'function' && window.showLoginAlert()) {
        navigateTo("/pages/sales-movement/sales-movement.html", "Sales Movement");
      }
    });
  }

  var notifBtn = document.getElementById("index-notifications-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", handleNotificationsButtonClick);
  }

  var cartBtn = document.getElementById("index-cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", handleCartButtonClick);
  }

  // Active state listener for visual feedback
  var headerButtons = document.querySelectorAll(".index-header-login-btn");
  headerButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActiveButton(this);
    });
  });
};

// Hybrid bridge
window.setActiveButton = setActiveButton;
window.navigateTo = navigateTo;
window.handleHomeButtonClick = handleHomeButtonClick;
window.handleLoginButtonClick = handleLoginButtonClick;
window.handleSearchButtonClick = handleSearchButtonClick;
window.handleNotificationsButtonClick = handleNotificationsButtonClick;
window.handleCartButtonClick = handleCartButtonClick;
window.bindNavigationHandlers = bindNavigationHandlers;

console.log("[ESM Load] app-nav.js: Hybrid bridge established.");
