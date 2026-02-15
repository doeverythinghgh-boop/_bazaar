/**
 * @file pages/register/register.js
 * @description Handles new user registration functionality, including form validation, password confirmation, and serial number generation for user keys.
 */

// [Immediate Check] Redirect to dashboard if user is already logged in.
(function () {
  var currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
  if (currentUser) {
    console.log("[Register] User already logged in, redirecting to dashboard.");
    window.location.href = "/pages/user-dashboard.html";
    return;
  }
})();

var register_form = document.getElementById("register_form");
var register_username = document.getElementById("register_username");
var register_phone = document.getElementById("register_phone");
var register_password = document.getElementById("register_password");
var register_address = document.getElementById("register_address");

// ✅ NEW: Avatar & Business Variables
var register_pendingAvatar = null;
var register_avatarInput = document.getElementById("register_avatar-input");
var register_avatarTrigger = document.getElementById("register_avatar-trigger");
var register_avatarPreview = document.getElementById("register_avatar-preview");
var register_avatarPlaceholder = document.getElementById("register_avatar-placeholder");
var register_avatarPickBtn = document.getElementById("register_avatar-pick-btn");
var register_avatarCameraBtn = document.getElementById("register_avatar-camera-btn");

// register_is_business_cb removed
var register_businessFields = document.getElementById("register_business_fields_container");
var register_businessName = document.getElementById("register_business_name");
var register_businessCategory = document.getElementById("register_business_category");
var register_businessBio = document.getElementById("register_business_bio");
var register_businessWhatsapp = document.getElementById("register_business_whatsapp");

// ✅ NEW: Avatar Selection Handlers
async function register_handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    AuthUI.showLoading(window.langu("profile_verifying") || "جاري التحميل...");
    const compressed = await compressImage(file, 400, 400, 0.7);
    AuthUI.close();

    register_pendingAvatar = compressed;
    if (register_avatarPreview) {
      register_avatarPreview.src = URL.createObjectURL(compressed);
      register_avatarPreview.style.display = "block";
      if (register_avatarPlaceholder) register_avatarPlaceholder.style.display = "none";
    }
  } catch (err) {
    console.error("[Register] Avatar error:", err);
    AuthUI.showError(window.langu("gen_swal_error_title"), window.langu("gen_err_compression"));
  }
}

async function register_handleCameraTrigger() {
  try {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = "image/*";
    tempInput.setAttribute("capture", "user");
    tempInput.style.display = "none";
    document.body.appendChild(tempInput);

    tempInput.addEventListener("change", async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await register_handleAvatarChange({ target: e.target });
      }
      if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
    });

    setTimeout(() => tempInput.click(), 100);
  } catch (err) {
    console.error("[Register] Camera trigger error:", err);
  }
}

// ✅ NEW: Avatar Selection Listeners
if (register_avatarPickBtn) register_avatarPickBtn.addEventListener("click", () => register_avatarInput && register_avatarInput.click());
if (register_avatarCameraBtn) register_avatarCameraBtn.addEventListener("click", register_handleCameraTrigger);
if (register_avatarTrigger) register_avatarTrigger.addEventListener("click", () => register_avatarInput && register_avatarInput.click());
if (register_avatarInput) register_avatarInput.addEventListener("change", register_handleAvatarChange);

// ✅ NEW: Business Toggle Listeners
// Business toggle listener removed

// Clear input fields on page load to ensure they are always empty.
if (register_username) register_username.value = "";
if (register_phone) register_phone.value = "";
if (register_password) register_password.value = "";
if (register_address) register_address.value = "";


// Add input event listener to sanitize phone number in real-time.
if (register_phone) {
  register_phone.addEventListener("input", function (e) {
    e.target.value = AuthValidators.normalizePhone(e.target.value);
  });
}

// ✅ NEW: Tabs Logic
const register_tabBtns = document.querySelectorAll('.register_tab-btn');
const register_tabContents = document.querySelectorAll('.register_tab-content');

register_tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Deactivate all
    register_tabBtns.forEach(b => b.classList.remove('active'));
    register_tabContents.forEach(c => {
      c.classList.remove('active');
      // IMPORTANT: Hide map iframe in hidden tabs to prevent repaint glitches? No need if display:none.
    });

    // Activate clicked
    btn.classList.add('active');
    const targetTabId = btn.getAttribute('data-tab');
    document.getElementById(`register-tab-${targetTabId}`).classList.add('active');
  });
});

// ✅ NEW: Auto-check business checkbox if business tab is clicked (Optional UX)
// Or better: Let user explicitly check it inside the tab.
// In Profile Modal, "Business Data" tab implies business features.
// Let's ensure the form submission logic respects the fields regardless of which tab is OPEN, 
// BUT we must ensure the checkbox is checked if user fills business data?
// User request: "Exactly as in profile-modal.html"
// In Profile Modal, there is NO checkbox "Is this a business account?". The tab existence implies it.
// However, register.html has a backend flag `is_seller` or similar derived from business data presence?
// Actually `register_newUser.business_name` handles it.
// The checkbox `register_is_business_cb` was used to show/hide fields.
// Since we now show fields in a tab, we should probably auto-check the checkbox when user types in business fields 
// OR just rely on data presence in backend.
// Let's keep the checkbox for explicit "I am a business" intent, but maybe hide it and auto-set it?
// Simpler: Keep checkbox visible in Business Tab as "Enable Business Account" toggle.

// Override old toggle logic: make sure fields are visible if tab is active (CSS handles this via !important)
// But we still need the checkbox state for `register_isBusinessCb.checked` in submit handler.


// --- Seller Options Logic ---
var register_sellerOptionsBtn = document.getElementById("register_seller-options-btn");
var register_isDeliveredInput = document.getElementById("register_is-delivered");
var register_limitPackageInput = document.getElementById("register_limit-package");

if (register_sellerOptionsBtn) {
  register_sellerOptionsBtn.addEventListener("click", async () => {
    var { value: formValues } = await Swal.fire({
      title: window.langu("register_seller_settings_title"),
      html: `
        <div style="font-family: 'Tajawal', sans-serif;">
          <div class="register-modal-section">
            <label class="register-modal-label">
              <i class="fas fa-truck-moving" style="color: #10b981;"></i> ${window.langu("register_delivery_question")}
            </label>
            <select id="swal_is-delivered" class="swal2-input register-modal-input">
              <option value="0" ${register_isDeliveredInput.value == "0" ? "selected" : ""}>${window.langu("register_delivery_no")}</option>
              <option value="1" ${register_isDeliveredInput.value == "1" ? "selected" : ""}>${window.langu("register_delivery_yes")}</option>
            </select>
          </div>
          <div class="register-modal-section" style="margin-bottom: 0;">
            <label class="register-modal-label">
              <i class="fas fa-hand-holding-usd" style="color: #10b981;"></i> ${window.langu("register_min_order_question")}
            </label>
            <select id="swal_has-limit" class="swal2-input register-modal-input">
              <option value="no" ${register_limitPackageInput.value == "0" ? "selected" : ""}>${window.langu("register_min_order_no")}</option>
              <option value="yes" ${register_limitPackageInput.value != "0" ? "selected" : ""}>${window.langu("register_min_order_yes")}</option>
            </select>
            <div id="swal_limit-container" style="margin-top: 15px; display: ${register_limitPackageInput.value != "0" ? "block" : "none"};">
              <label class="register-modal-sublabel">${window.langu("register_min_order_value_label")}</label>
              <input type="number" id="swal_limit-value" class="swal2-input register-modal-input" value="${register_limitPackageInput.value}" placeholder="${window.langu("register_min_order_placeholder")}">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: window.langu("register_save_settings_btn"),
      cancelButtonText: window.langu("alert_cancel_btn"),
      buttonsStyling: false,
      customClass: {
        popup: 'swal-modern-mini-popup',
        title: 'swal-modern-mini-title',
        htmlContainer: 'swal-modern-mini-text',
        confirmButton: 'swal-modern-mini-confirm',
        cancelButton: 'swal-modern-mini-cancel'
      },
      didOpen: () => {
        var hasLimitSelect = document.getElementById("swal_has-limit");
        var limitContainer = document.getElementById("swal_limit-container");
        hasLimitSelect.addEventListener("change", (e) => {
          limitContainer.style.display = e.target.value === "yes" ? "block" : "none";
        });
      },
      preConfirm: () => {
        var isDelivered = document.getElementById("swal_is-delivered").value;
        var hasLimit = document.getElementById("swal_has-limit").value;
        var limitValue = document.getElementById("swal_limit-value").value;

        if (hasLimit === "yes" && (!limitValue || limitValue <= 0)) {
          Swal.showValidationMessage(window.langu("register_invalid_min_order"));
          return false;
        }

        return {
          isDelivered: parseInt(isDelivered),
          limitPackage: hasLimit === "yes" ? parseFloat(limitValue) : 0
        };
      }
    });

    if (formValues) {
      register_isDeliveredInput.value = formValues.isDelivered;
      register_limitPackageInput.value = formValues.limitPackage;

      // Update UI feedback on the button
      const isSet = (formValues.isDelivered === 1 || formValues.limitPackage > 0);
      const statusText = isSet ? ` ${window.langu("register_seller_options_set")}` : ` ${window.langu("register_seller_options_none")}`;
      register_sellerOptionsBtn.innerHTML = `<i class="fas fa-store"></i> ${window.langu("register_seller_options_btn")}${statusText}`;

      // Remove hardcoded colors, use a data attribute or class
      register_sellerOptionsBtn.setAttribute('data-status', isSet ? 'set' : 'none');
      // Legacy style cleanup if present
      register_sellerOptionsBtn.style.background = '';
      register_sellerOptionsBtn.style.borderStyle = isSet ? "solid" : "dashed";
    }
  });
}

// Embedded Map Message Listener
var handleRegisterMessage = (event) => {
  var mapStatus = document.getElementById("register_map-status");
  var mapError = document.getElementById("register_map-error");
  var coordsInput = document.getElementById("register_coords");

  if (event.data && event.data.type === 'LOCATION_SELECTED') {
    var coords = event.data.coordinates;
    console.log("[Register] Received coordinates from map:", coords);
    if (coordsInput) coordsInput.value = coords;

    if (mapStatus) {
      // Use class for success color instead of hardcoded hex
      mapStatus.classList.add('status-success');
      mapStatus.style.color = ''; // clear inline
      mapStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${window.langu("register_map_success")}`;
      mapStatus.style.display = "block";
    }
    if (mapError) mapError.style.display = "none";

  } else if (event.data && event.data.type === 'LOCATION_RESET') {
    if (coordsInput) coordsInput.value = "";
    if (mapStatus) {
      mapStatus.style.display = "none";
      mapStatus.innerHTML = "";
    }
    if (mapError) mapError.style.display = "none";
  }
};
window.addEventListener('message', handleRegisterMessage);

if (register_form) {
  register_form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // 1. Validation
    let register_isValid = true;
    AuthUI.clearFieldValidationMsg(register_username);
    AuthUI.clearFieldValidationMsg(register_phone);
    AuthUI.clearFieldValidationMsg(register_password);
    AuthUI.clearFieldValidationMsg(register_address);

    // Clear Map Errors
    var mapError = document.getElementById("register_map-error");
    if (mapError) mapError.style.display = "none";

    // Validate Username
    var usernameValidation = AuthValidators.validateUsername(register_username.value.trim());
    if (!usernameValidation.isValid) {
      AuthUI.showFieldValidationMsg(register_username, usernameValidation.message);
      register_isValid = false;
    }

    // Validate Phone
    var normalizedPhone = AuthValidators.normalizePhone(register_phone.value.trim());
    var phoneValidation = AuthValidators.validatePhone(normalizedPhone);
    if (!phoneValidation.isValid) {
      AuthUI.showFieldValidationMsg(register_phone, phoneValidation.message);
      register_isValid = false;
    }

    // Validate Password
    var passwordValidation = AuthValidators.validatePassword(register_password.value.trim());
    if (!passwordValidation.isValid) {
      AuthUI.showFieldValidationMsg(register_password, passwordValidation.message);
      register_isValid = false;
    }

    // Mandatory Location Validation
    var coordsValue = document.getElementById("register_coords")?.value || "";
    if (!coordsValue) {
      if (mapError) {
        mapError.textContent = window.langu("register_map_mandatory_error");
        mapError.style.display = "block";
        mapError.style.color = "#dc2626";
        mapError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      register_isValid = false;
    }

    // Validate Address Detail
    var addressValidation = AuthValidators.validateAddress(register_address.value.trim(), !!coordsValue);
    if (!addressValidation.isValid) {
      AuthUI.showFieldValidationMsg(register_address, addressValidation.message);
      register_isValid = false;
    }

    if (!register_isValid) return;

    // 2. Password Confirmation
    var { value: register_confirmedPassword } = await Swal.fire({
      customClass: {
        popup: 'swal-modern-mini-popup',
        title: 'swal-modern-mini-title',
        htmlContainer: 'swal-modern-mini-text',
        confirmButton: 'swal-modern-mini-confirm',
        cancelButton: 'swal-modern-mini-cancel'
      },
      html: `
        <div class="confirm-pw-header">
          <div class="confirm-pw-icon-wrapper">
            <i class="fas fa-key"></i>
          </div>
          <h3 class="confirm-pw-title">${window.langu("register_confirm_identity_title")}</h3>
        </div>
        <div class="confirm-pw-body">
          <p>${window.langu("register_confirm_identity_text")}</p>
          <div class="modern-pw-input-group">
            <input type="password" id="register_swal-confirm-password" placeholder="${window.langu("register_password_placeholder")}">
            <i class="fa fa-eye modern-pw-toggle" id="register_swal-toggle-confirm-password"></i>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: window.langu("register_confirm_account_btn"),
      cancelButtonText: window.langu("alert_cancel_btn"),
      buttonsStyling: false,
      didOpen: () => {
        var confirmInput = document.getElementById("register_swal-confirm-password");
        var toggleIcon = document.getElementById("register_swal-toggle-confirm-password");
        if (confirmInput) confirmInput.focus();
        if (toggleIcon && confirmInput) {
          toggleIcon.addEventListener("click", () => {
            var isPassword = confirmInput.type === "password";
            confirmInput.type = isPassword ? "text" : "password";
            toggleIcon.classList.toggle("fa-eye");
            toggleIcon.classList.toggle("fa-eye-slash");
          });
        }
      },
      preConfirm: () => {
        var confirmValue = document.getElementById("register_swal-confirm-password").value;
        if (!confirmValue) {
          Swal.showValidationMessage(window.langu("register_error_no_password"));
          return false;
        }
        if (confirmValue !== register_password.value) {
          Swal.showValidationMessage(window.langu("register_error_password_mismatch"));
          return false;
        }
        return confirmValue;
      },
    });


    if (!register_confirmedPassword) return;

    // 3. Create User
    var register_userKey = generateSerial();
    var register_newUser = {
      username: register_username.value.trim(),
      phone: normalizedPhone,
      user_key: register_userKey,
      password: register_password.value,
      address: register_address.value.trim(),
      location: document.getElementById("register_coords")?.value || "",
      isDelivered: parseInt(register_isDeliveredInput.value),
      limitPackage: parseFloat(register_limitPackageInput.value),
    };

    // Add Business Fields if category is selected (implies business intent)
    if (register_businessCategory.value) {
      register_newUser.business_name = register_businessName.value.trim();
      register_newUser.business_category = register_businessCategory.value;
      register_newUser.business_bio = register_businessBio.value.trim();
      register_newUser.business_whatsapp = register_businessWhatsapp.value.trim();

      // Collect Sub-Categories
      const selectedSubCats = [];
      document.querySelectorAll('input[name="register_business-sub-cat"]:checked').forEach(cb => {
        selectedSubCats.push(cb.value);
      });
      register_newUser.business_sub_categories = selectedSubCats.join(",");
    }

    // 4. Submit
    AuthUI.showLoading(window.langu("register_creating_account"));

    try {
      // ✅ Handle Avatar Upload FIRST
      if (register_pendingAvatar) {
        const fileName = `avatar_${register_userKey}_${Date.now()}.webp`;
        const uploadResult = await uploadFile2cf(register_pendingAvatar, fileName);
        if (uploadResult) {
          register_newUser.user_image = fileName;
        }
      }

      var register_result = await addUser(register_newUser);
      AuthUI.close();

      if (register_result && register_result.message) {
        // Success
        var register_loggedInUserData = {
          username: register_newUser.username,
          phone: register_newUser.phone,
          user_key: register_newUser.user_key,
          Address: register_newUser.address,
          location: register_newUser.location,
          isDelivered: register_newUser.isDelivered,
          limitPackage: register_newUser.limitPackage,
          user_image: register_newUser.user_image || null,
          business_name: register_newUser.business_name || "",
          business_category: register_newUser.business_category || "",
          business_bio: register_newUser.business_bio || "",
          business_whatsapp: register_newUser.business_whatsapp || "",
          is_seller: 0,
        };

        // Use SessionManager (no auto redirect, we handle it)
        await SessionManager.login(register_loggedInUserData, false);

        // Success UI
        Swal.fire({
          title: window.langu("register_success_title"),
          html: `
            <p style="font-size: 1rem; color: #666;">${window.langu("register_success_subtitle")}</p>
            <div style="text-align: right; margin-top: 15px; font-size: 0.9em; color: #555;">
                <p style="margin-bottom: 8px;"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_1")}</p>
                <p style="margin-bottom: 8px;"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_2")}</p>
                <p><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_3")}</p>
            </div>
            `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          width: '320px',
          padding: '1.5em',
          confirmButtonText: window.langu("register_go_home_btn"),
          buttonsStyling: false,
          customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload(true);
            // setUserNameInIndexBar() is called by SessionManager.login
          }
        });

      } else if (register_result && register_result.error) {
        AuthUI.showError(window.langu('gen_swal_error_title'), register_result.error);
        AuthUI.showFieldValidationMsg(register_phone, register_result.error);
      } else {
        AuthUI.showError(window.langu('gen_swal_error_title'), window.langu('register_error_unexpected'));
      }
    } catch (error) {
      console.error(error);
      AuthUI.close();
      AuthUI.showError(window.langu('gen_swal_error_title'), window.langu('register_error_app'));
    }
  });
}

// Handle navigation to the login page.
try {
  var register_loginLink = document.getElementById(
    "register_goToLoginLink"
  );
  if (register_loginLink) {
    register_loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/pages/login/login.html";
    });
  }
} catch (error) {
  console.error("[تسجيل] لم يتم العثور على رابط تسجيل الدخول أو ربطه:", error);
}

// New: Add password visibility toggle for the main form.
var register_togglePasswordIcon = document.getElementById(
  "register_toggle-password-icon"
);
if (register_togglePasswordIcon && register_password) {
  register_togglePasswordIcon.addEventListener("click", function () {
    // Toggle input type.
    var type =
      register_password.getAttribute("type") === "password"
        ? "text"
        : "password";
    register_password.setAttribute("type", type);

    // Toggle eye icon.
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });
}

// This element is inserted in the way followed in the project (hgh_sec).
// insertUniqueSnapshot("/pages/header.html", "header-container1Xx", 300); removed

// Check for saved location on load
function register_restoreSavedLocation() {
  var savedLocation = localStorage.getItem('saved_location') || localStorage.getItem('bidstory_user_saved_location');
  var coordsInput = document.getElementById("register_coords");
  var mapIframe = document.getElementById("register_location-iframe");

  if (coordsInput) {
    let initialCoords = "";
    if (savedLocation) {
      try {
        var parsed = JSON.parse(savedLocation);
        if (parsed && (parsed.lat || parsed.lng)) {
          initialCoords = parsed.coordinates || `${parsed.lat}, ${parsed.lng}`;
        }
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }

    if (initialCoords) {
      coordsInput.value = initialCoords;
      var mapStatus = document.getElementById("register_map-status");
      if (mapStatus) {
        mapStatus.style.color = "#10b981";
        mapStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${window.langu("register_map_restored")}`;
        mapStatus.style.display = "block";
      }

      // Update Iframe with saved coords + cache busting
      if (mapIframe) {
        var [lt, ln] = initialCoords.split(",").map(c => c.trim());
        var timestamp = new Date().getTime();
        mapIframe.src = `/location/LOCATION.html?lat=${lt}&lng=${ln}&embedded=true&hideSave=true&v=${timestamp}`;
      }
    } else if (mapIframe) {
      // No saved location, just add cache busting
      var timestamp = new Date().getTime();
      mapIframe.src = `/location/LOCATION.html?embedded=true&hideSave=true&v=${timestamp}`;
    }
  }
}

// Global execution for the custom loader
register_restoreSavedLocation();

/**
 * ✅ NEW: Dynamic Categories & Sub-Categories Logic
 */
async function registerPopulateCategories() {
  if (!register_businessCategory) return;
  try {
    const data = window.appCategoriesList || await fetchAppCategories();
    if (!data || !data.categories) return;

    const currentLang = window.app_language || 'ar';
    const defaultTitle = (window.langu && window.langu('cat_select_main_placeholder')) || 'اختر التصنيف';
    register_businessCategory.innerHTML = `<option value="">-- ${defaultTitle} --</option>`;

    data.categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      const titleObj = cat.title;
      const displayTitle = typeof titleObj === 'object' ? (titleObj[currentLang] || titleObj['ar']) : titleObj;
      opt.textContent = displayTitle;
      register_businessCategory.appendChild(opt);
    });

    register_businessCategory.addEventListener("change", (e) => {
      registerUpdateSubCatsUI(e.target.value, data.categories);
    });
  } catch (e) { console.error(e); }
}

function registerUpdateSubCatsUI(mainId, categories) {
  const subGroup = document.getElementById("register_business-sub-category-group");
  const subContainer = document.getElementById("register_business-sub-categories-container");
  if (!subGroup || !subContainer) return;

  const selectedCat = categories.find(c => String(c.id) === String(mainId));

  if (!selectedCat || !selectedCat.subcategories || selectedCat.subcategories.length === 0) {
    subGroup.style.display = "none";
    subContainer.innerHTML = "";
    return;
  }

  subGroup.style.display = "block";
  subContainer.innerHTML = "";
  const currentLang = window.app_language || 'ar';

  selectedCat.subcategories.forEach(sub => {
    const subLabel = document.createElement("label");
    subLabel.style.display = "flex";
    subLabel.style.alignItems = "center";
    subLabel.style.gap = "8px";
    subLabel.style.cursor = "pointer";
    subLabel.style.fontSize = "0.9rem";
    subLabel.style.padding = "5px";
    subLabel.style.border = "1px solid #eee";
    subLabel.style.borderRadius = "6px";
    subLabel.style.background = "#fff";

    const titleObj = sub.title;
    const displayTitle = typeof titleObj === 'object' ? (titleObj[currentLang] || titleObj['ar']) : titleObj;

    subLabel.innerHTML = `
            <input type="checkbox" name="register_business-sub-cat" value="${sub.id}" style="accent-color: var(--primary-color);">
            <span>${displayTitle}</span>
        `;
    subContainer.appendChild(subLabel);
  });
}

// Initialize Categories
registerPopulateCategories();

