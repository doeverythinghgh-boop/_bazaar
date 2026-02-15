/**
 * @file pages/register/js/register-handlers.js
 * @description Main event handlers (Form Submit, Avatar, Seller Options) for the register page.
 */

/* -------------------------------------------------------------------------- */
/*                               Avatar Handlers                              */
/* -------------------------------------------------------------------------- */

async function registerHandleAvatarChange(e) {
    const file = e.target.files[0];
    const els = registerGetElements();
    if (!file) return;

    try {
        AuthUI.showLoading(window.langu("profile_verifying") || "جاري التحميل...");
        const compressed = await compressImage(file, 400, 400, 0.7);
        AuthUI.close();

        // Save global
        window.registerPendingAvatar = compressed;

        if (els.avatarPreview) {
            els.avatarPreview.src = URL.createObjectURL(compressed);
            els.avatarPreview.style.display = "block";
            if (els.avatarPlaceholder) els.avatarPlaceholder.style.display = "none";
        }
    } catch (err) {
        console.error("[Register] Avatar error:", err);
        AuthUI.showError(window.langu("gen_swal_error_title"), window.langu("gen_err_compression"));
    }
}

async function registerHandleCameraTrigger() {
    try {
        const tempInput = document.createElement("input");
        tempInput.type = "file";
        tempInput.accept = "image/*";
        tempInput.setAttribute("capture", "user");
        tempInput.style.display = "none";
        document.body.appendChild(tempInput);

        tempInput.addEventListener("change", async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                await registerHandleAvatarChange({ target: e.target });
            }
            if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
        });

        setTimeout(() => tempInput.click(), 100);
    } catch (err) {
        console.error("[Register] Camera trigger error:", err);
    }
}

/* -------------------------------------------------------------------------- */
/*                           Seller Options Handler                           */
/* -------------------------------------------------------------------------- */

async function registerHandleSellerOptions() {
    const els = registerGetElements();
    if (!els.sellerOptionsBtn) return;

    const currentIsDelivered = els.isDeliveredInput ? els.isDeliveredInput.value : "0";
    const currentLimit = els.limitPackageInput ? els.limitPackageInput.value : "0";

    const { value: formValues } = await Swal.fire({
        title: window.langu("register_seller_settings_title"),
        html: `
        <div style="font-family: 'Tajawal', sans-serif;">
          <div class="register-modal-section">
            <label class="register-modal-label">
              <i class="fas fa-truck-moving" style="color: #10b981;"></i> ${window.langu("register_delivery_question")}
            </label>
            <select id="swal_is-delivered" class="swal2-input register-modal-input">
              <option value="0" ${currentIsDelivered == "0" ? "selected" : ""}>${window.langu("register_delivery_no")}</option>
              <option value="1" ${currentIsDelivered == "1" ? "selected" : ""}>${window.langu("register_delivery_yes")}</option>
            </select>
          </div>
          <div class="register-modal-section" style="margin-bottom: 0;">
            <label class="register-modal-label">
              <i class="fas fa-hand-holding-usd" style="color: #10b981;"></i> ${window.langu("register_min_order_question")}
            </label>
            <select id="swal_has-limit" class="swal2-input register-modal-input">
              <option value="no" ${currentLimit == "0" ? "selected" : ""}>${window.langu("register_min_order_no")}</option>
              <option value="yes" ${currentLimit != "0" ? "selected" : ""}>${window.langu("register_min_order_yes")}</option>
            </select>
            <div id="swal_limit-container" style="margin-top: 15px; display: ${currentLimit != "0" ? "block" : "none"};">
              <label class="register-modal-sublabel">${window.langu("register_min_order_value_label")}</label>
              <input type="number" id="swal_limit-value" class="swal2-input register-modal-input" value="${currentLimit}" placeholder="${window.langu("register_min_order_placeholder")}">
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
            const hasLimitSelect = document.getElementById("swal_has-limit");
            const limitContainer = document.getElementById("swal_limit-container");
            if (hasLimitSelect && limitContainer) {
                hasLimitSelect.addEventListener("change", (e) => {
                    limitContainer.style.display = e.target.value === "yes" ? "block" : "none";
                });
            }
        },
        preConfirm: () => {
            const isDelivered = document.getElementById("swal_is-delivered").value;
            const hasLimit = document.getElementById("swal_has-limit").value;
            const limitValue = document.getElementById("swal_limit-value").value;

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
        if (els.isDeliveredInput) els.isDeliveredInput.value = formValues.isDelivered;
        if (els.limitPackageInput) els.limitPackageInput.value = formValues.limitPackage;

        // Update UI feedback on the button
        const isSet = (formValues.isDelivered === 1 || formValues.limitPackage > 0);
        const statusText = isSet ? ` ${window.langu("register_seller_options_set")}` : ` ${window.langu("register_seller_options_none")}`;
        
        els.sellerOptionsBtn.innerHTML = `<i class="fas fa-store"></i> ${window.langu("register_seller_options_btn")}${statusText}`;
        els.sellerOptionsBtn.setAttribute('data-status', isSet ? 'set' : 'none');
        
        // Legacy style cleanup
        els.sellerOptionsBtn.style.background = '';
        els.sellerOptionsBtn.style.borderStyle = isSet ? "solid" : "dashed";
    }
}


/* -------------------------------------------------------------------------- */
/*                             Form Submit Handler                            */
/* -------------------------------------------------------------------------- */

async function registerHandleSubmit(e) {
    if (e) e.preventDefault();

    // 1. Validation
    const validation = registerValidateInputs();
    if (!validation.isValid) return;

    const { username, phone, password, address, location } = validation.data;
    const els = registerGetElements();

    // 2. Password Confirmation
    const { value: confirmedPassword } = await Swal.fire({
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
            const confirmInput = document.getElementById("register_swal-confirm-password");
            const toggleIcon = document.getElementById("register_swal-toggle-confirm-password");
            if (confirmInput) confirmInput.focus();
            if (toggleIcon && confirmInput) {
                toggleIcon.addEventListener("click", () => {
                    const isPassword = confirmInput.type === "password";
                    confirmInput.type = isPassword ? "text" : "password";
                    toggleIcon.classList.toggle("fa-eye");
                    toggleIcon.classList.toggle("fa-eye-slash");
                });
            }
        },
        preConfirm: () => {
            const confirmValue = document.getElementById("register_swal-confirm-password").value;
            if (!confirmValue) {
                Swal.showValidationMessage(window.langu("register_error_no_password"));
                return false;
            }
            if (confirmValue !== password) {
                Swal.showValidationMessage(window.langu("register_error_password_mismatch"));
                return false;
            }
            return confirmValue;
        },
    });

    if (!confirmedPassword) return;

    // 3. Prepare User Object
    const userKey = generateSerial();
    const newUser = {
        username: username,
        phone: phone, // Already normalized
        user_key: userKey,
        password: password,
        address: address,
        location: location,
        isDelivered: parseInt(els.isDeliveredInput?.value || 0),
        limitPackage: parseFloat(els.limitPackageInput?.value || 0),
    };

    // Add Business Fields if category is selected
    if (els.businessCategory && els.businessCategory.value) {
        newUser.business_name = els.businessName?.value.trim() || "";
        newUser.business_category = els.businessCategory.value;
        newUser.business_bio = els.businessBio?.value.trim() || "";
        newUser.business_whatsapp = els.businessWhatsapp?.value.trim() || "";

        // Collect Sub-Categories
        const selectedSubCats = [];
        document.querySelectorAll('input[name="register_business-sub-cat"]:checked').forEach(cb => {
            selectedSubCats.push(cb.value);
        });
        newUser.business_sub_categories = selectedSubCats.join(",");
    }

    // 4. Submit to Backend
    AuthUI.showLoading(window.langu("register_creating_account"));

    try {
        // Handle Avatar Upload
        if (window.registerPendingAvatar) {
            const fileName = `avatar_${userKey}_${Date.now()}.webp`;
            const uploadResult = await uploadFile2cf(window.registerPendingAvatar, fileName);
            if (uploadResult) {
                newUser.user_image = fileName;
            }
        }

        const result = await addUser(newUser);
        AuthUI.close();

        if (result && result.message) {
            // Success: Auto Login
            const loggedInUserData = {
                username: newUser.username,
                phone: newUser.phone,
                user_key: newUser.user_key,
                Address: newUser.address,
                location: newUser.location,
                isDelivered: newUser.isDelivered,
                limitPackage: newUser.limitPackage,
                user_image: newUser.user_image || null,
                business_name: newUser.business_name || "",
                business_category: newUser.business_category || "",
                business_bio: newUser.business_bio || "",
                business_whatsapp: newUser.business_whatsapp || "",
                is_seller: 0, // Default for new users? Yes based on original code.
            };

            await SessionManager.login(loggedInUserData, false);

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
            }).then((res) => {
                if (res.isConfirmed) {
                    window.location.reload(true);
                }
            });

        } else if (result && result.error) {
            AuthUI.showError(window.langu('gen_swal_error_title'), result.error);
            // Also show inline error on phone as generic fallback?
             if(els.phoneInput) AuthUI.showFieldValidationMsg(els.phoneInput, result.error);
        } else {
            AuthUI.showError(window.langu('gen_swal_error_title'), window.langu('register_error_unexpected'));
        }
    } catch (error) {
        console.error(error);
        AuthUI.close();
        AuthUI.showError(window.langu('gen_swal_error_title'), window.langu('register_error_app'));
    }
}
