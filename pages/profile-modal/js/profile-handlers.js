/**
 * @file pages/profile-modal/js/profile-handlers.js
 * @description Main event handlers and API interaction logic for the profile modal.
 */

// Define globally to ensure persistence across scopes
window.profilePendingImage = null;

/**
 * Handles the selection and compression of a new profile picture.
 * @async
 */
async function profileHandleAvatarChange(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const els = profileGetElements();

        AuthUI.showLoading(window.langu("profile_verifying")); // Reuse loading UI
        const compressed = await compressImage(file, 400, 400, 0.7);
        AuthUI.close();

        // Assign to global variable
        window.profilePendingImage = compressed;

        if (els.avatarPreview) {
            els.avatarPreview.src = URL.createObjectURL(compressed);
            els.avatarPreview.style.display = "block";
            if (els.avatarPlaceholder) els.avatarPlaceholder.style.display = "none";
            if (els.avatarEditIcon) els.avatarEditIcon.style.display = "none"; // Hide edit icon immediately
        }

        console.log(`[Profile] Image compressed: ${formatBytes(compressed.size)}`);
    } catch (error) {
        console.error("Error in profileHandleAvatarChange:", error);
        AuthUI.showError(window.langu("alert_title_info"), window.langu("gen_err_compression"));
    }
}

/**
 * Triggers the device camera to take a new profile photo.
 * Reuses the logic pattern from the Add Product page.
 */
async function profileHandleCameraTrigger() {
    try {
        const tempInput = document.createElement("input");
        tempInput.type = "file";
        tempInput.accept = "image/*";
        tempInput.style.display = "none";
        tempInput.setAttribute("capture", "user"); // Profile usually uses front camera
        document.body.appendChild(tempInput);

        tempInput.addEventListener("change", async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                // Pass the files to the common handler
                await profileHandleAvatarChange({ target: e.target });
            }
            if (tempInput.parentNode) {
                tempInput.parentNode.removeChild(tempInput);
            }
        });

        setTimeout(() => {
            tempInput.click();
        }, 100);
    } catch (error) {
        console.error("[Profile] Error in camera trigger:", error);
    }
}

/**
 * Handles the "Change Password" checkbox interaction.
 * Verifies identity if necessary before showing password fields.
 * @async
 */
async function profileHandleChangePasswordCheck() {
    try {
        const els = profileGetElements();
        const user = window.userSession;
        if (!els.changePasswordCheckbox || !user) return;

        if (els.changePasswordCheckbox.checked) {
            // If user has no existing password, allow setting one directly
            if (!user.Password) {
                if (els.passwordFieldsContainer) {
                    els.passwordFieldsContainer.style.display = "block";
                }
                profileIsPasswordVerified = true;
                return;
            }

            // Verify current identity
            const passwordEntered = await AuthUI.confirmPassword(
                window.langu("profile_confirm_identity_title"),
                window.langu("profile_confirm_identity_text")
            );

            if (passwordEntered) {
                AuthUI.showLoading(window.langu("profile_verifying"));
                const result = await verifyUserPassword(user.phone, passwordEntered);
                AuthUI.close();

                if (result && !result.error) {
                    if (els.passwordFieldsContainer) {
                        els.passwordFieldsContainer.style.display = "block";
                    }
                    profileIsPasswordVerified = true;
                } else {
                    els.changePasswordCheckbox.checked = false;
                    AuthUI.showError(window.langu("alert_title_info"), window.langu("profile_invalid_password"));
                }
            } else {
                els.changePasswordCheckbox.checked = false;
            }
        } else {
            // Hide password fields if checkbox is unchecked
            if (els.passwordFieldsContainer) {
                els.passwordFieldsContainer.style.display = "none";
            }
            profileIsPasswordVerified = false;
        }
    } catch (error) {
        console.error("Error in profileHandleChangePasswordCheck:", error);
    }
}

/**
 * Handles the "Seller Options" button click.
 * Shows a SweetAlert2 modal to configure self-delivery and order limit.
 * @async
 */
async function profileHandleSellerOptions() {
    try {
        const els = profileGetElements();
        const user = window.userSession;
        if (!els.sellerOptionsBtn) return;
        if (!user) {
            console.warn("[Profile] No active session found. Initializing session...");
            if (typeof SessionManager !== "undefined") SessionManager.init();
            if (!window.userSession) {
                AuthUI.showError(window.langu("alert_title_info"), "يرجى تسجيل الدخول أولاً.");
                return;
            }
        }

        const currentIsDelivered = els.isDeliveredInput.value;
        const currentLimitPackage = els.limitPackageInput.value;

        const { value: formValues } = await Swal.fire({
            title: window.langu("profile_seller_settings_title"),
            html: `
                <div class="swal-profile-container">
                    <div class="swal-profile-section">
                        <label class="swal-profile-label" style="color: #059669;">
                            ${window.langu("profile_delivery_question")}
                        </label>
                        <select id="swal-profile_is-delivered" class="swal2-input swal-profile-input">
                            <option value="0" ${currentIsDelivered == "0" ? "selected" : ""}>${window.langu("profile_delivery_no")}</option>
                            <option value="1" ${currentIsDelivered == "1" ? "selected" : ""}>${window.langu("profile_delivery_yes")}</option>
                        </select>
                    </div>
                    <div class="swal-profile-section" style="border-top: 1px dashed #e2e8f0; padding-top: 15px;">
                        <label class="swal-profile-label" style="color: #2563eb;">
                            ${window.langu("profile_min_order_question")}
                        </label>
                        <select id="swal-profile_has-limit" class="swal2-input swal-profile-input">
                            <option value="no" ${currentLimitPackage == "0" ? "selected" : ""}>${window.langu("profile_min_order_no")}</option>
                            <option value="yes" ${currentLimitPackage != "0" ? "selected" : ""}>${window.langu("profile_min_order_yes")}</option>
                        </select>
                        <div id="swal-profile_limit-container" style="margin-top: 15px; display: ${currentLimitPackage != "0" ? "block" : "none"};">
                            <label class="swal-profile-label-sub" style="color: #64748b;">${window.langu("profile_min_order_value_label")}</label>
                            <input type="number" id="swal-profile_limit-value" class="swal2-input swal-profile-input" value="${currentLimitPackage}" placeholder="${window.langu("profile_min_order_placeholder")}">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: window.langu("profile_save_settings_btn"),
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
                const hasLimitSelect = document.getElementById("swal-profile_has-limit");
                const limitContainer = document.getElementById("swal-profile_limit-container");
                hasLimitSelect.addEventListener("change", (e) => {
                    limitContainer.style.display = e.target.value === "yes" ? "block" : "none";
                });
            },
            preConfirm: () => {
                const isDelivered = document.getElementById("swal-profile_is-delivered").value;
                const hasLimit = document.getElementById("swal-profile_has-limit").value;
                const limitValue = document.getElementById("swal-profile_limit-value").value;

                if (hasLimit === "yes" && (!limitValue || limitValue <= 0)) {
                    Swal.showValidationMessage(window.langu("profile_invalid_min_order"));
                    return false;
                }

                return {
                    isDelivered: parseInt(isDelivered),
                    limitPackage: hasLimit === "yes" ? parseFloat(limitValue) : 0
                };
            }
        });

        if (formValues) {
            els.isDeliveredInput.value = formValues.isDelivered;
            els.limitPackageInput.value = formValues.limitPackage;

            // Update UI feedback on the button
            const isSet = (formValues.isDelivered === 1 || formValues.limitPackage > 0);
            els.sellerOptionsBtn.innerHTML = `<i class="fas fa-store"></i> ${window.langu("profile_seller_options_btn")} ${isSet ? window.langu("profile_seller_options_set") : ""}`;

            // Use data attribute for styling hook
            els.sellerOptionsBtn.setAttribute('data-status', isSet ? 'set' : 'none');
            // Remove hardcoded inline styles
            els.sellerOptionsBtn.style.background = '';
            els.sellerOptionsBtn.style.color = '';
        }
    } catch (error) {
        console.error("Error in profileHandleSellerOptions:", error);
    }
}

/**
 * Handles the save changes request.
 * Performs final validation and calls the update API.
 * @async
 */
async function profileHandleSaveChanges() {
    const els = profileGetElements();
    const validationResult = profileValidateInputs();
    if (!validationResult.isValid) return;

    const { username, phone, address, password } = validationResult.data;
    const user = window.userSession;
    if (!user) return;

    // Track actual modifications to show "No Changes" message if needed
    let hasChanges = false;

    // Always include identifying fields to satisfy API requirements
    const updatedData = {
        user_key: user.user_key,
        username: username,
        phone: phone
    };

    // Check for changes in basic fields
    if (username !== user.username) hasChanges = true;
    if (phone !== user.phone) hasChanges = true;

    const currentAddress = (user.Address || user.address || "").trim();
    if (address !== currentAddress) {
        updatedData.address = address;
        hasChanges = true;
    }

    // Normalized location comparison
    const currentCoords = (user.location || user.location || "").toString().trim().replace(/\s+/g, '');
    const newCoords = (els.coordsInput?.value || "").toString().trim().replace(/\s+/g, '');

    // Mandatory Location Check
    const mapError = document.getElementById("profile-map-error");
    if (!newCoords) {
        if (mapError) {
            mapError.textContent = window.langu("profile_map_mandatory_error");
            mapError.style.display = "block";
            mapError.style.color = "#dc2626";
            mapError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    } else {
        if (mapError) mapError.style.display = "none";
    }

    if (newCoords && newCoords !== currentCoords) {
        updatedData.location = newCoords.includes(',') ? newCoords.replace(',', ', ') : newCoords;
        hasChanges = true;
    }

    if (els.changePasswordCheckbox?.checked && password) {
        updatedData.password = password;
        hasChanges = true;
    }

    // Include Seller Options
    const newIsDelivered = parseInt(els.isDeliveredInput?.value || 0);
    const newLimitPackage = parseFloat(els.limitPackageInput?.value || 0);

    // Always include these too, just in case, or only if changed?
    // Let's stick to only if changed for these specific ones unless they cause issues.
    // The issue was likely username/phone/email validation on the backend.

    if (String(newIsDelivered) !== String(user.isDelivered || 0)) {
        updatedData.isDelivered = newIsDelivered;
        hasChanges = true;
    }
    if (String(newLimitPackage) !== String(user.limitPackage || 0)) {
        updatedData.limitPackage = newLimitPackage;
        hasChanges = true;
    }

    // ✅ Business Fields with Multi-Sub-Category Support
    const bName = els.businessName?.value || "";
    const bCategory = els.businessCategory?.value || "";
    const bBio = els.businessBio?.value || "";
    const bWhatsapp = els.businessWhatsapp?.value || "";

    // Collect selected sub-categories
    const selectedSubCats = [];
    document.querySelectorAll('input[name="profile-business-sub-cat"]:checked').forEach(cb => {
        selectedSubCats.push(cb.value);
    });
    const bSubCategories = selectedSubCats.join(",");

    if (bName !== (user.business_name || "")) { updatedData.business_name = bName; hasChanges = true; }
    if (bCategory !== (user.business_category || "")) { updatedData.business_category = bCategory; hasChanges = true; }
    if (bBio !== (user.business_bio || "")) { updatedData.business_bio = bBio; hasChanges = true; }
    if (bWhatsapp !== (user.business_whatsapp || "")) { updatedData.business_whatsapp = bWhatsapp; hasChanges = true; }

    // Deep comparison for sub-categories
    const currentSubs = Array.isArray(user.business_sub_categories)
        ? user.business_sub_categories.join(",")
        : (user.business_sub_categories || "");

    if (bSubCategories !== currentSubs) {
        updatedData.business_sub_categories = bSubCategories;
        hasChanges = true;
    }

    // Check Global Pending Image 
    if (window.profilePendingImage) {
        hasChanges = true;
    }

    // If no changes, stop here
    if (!hasChanges) {
        await AuthUI.showSuccess(window.langu("profile_no_changes_title"), window.langu("profile_no_changes_text"));
        return;
    }

    // Verify identity before critical update
    if (user.Password && !profileIsPasswordVerified) {
        const passwordEntered = await AuthUI.confirmPassword(
            window.langu("profile_confirm_identity_title"),
            window.langu("profile_save_confirm_text")
        );
        if (!passwordEntered) return;

        AuthUI.showLoading(window.langu("profile_verifying"));
        const verification = await verifyUserPassword(user.phone, passwordEntered);
        AuthUI.close();

        if (!verification || verification.error) {
            AuthUI.showError(window.langu("alert_title_info"), window.langu("profile_invalid_password"));
            return;
        }
    }

    // Execute update
    AuthUI.showLoading(window.langu("profile_saving"));

    // ✅ Handle Avatar Upload
    if (window.profilePendingImage) {
        const fileName = `avatar_${user.user_key}_${Date.now()}.webp`;
        const uploadResult = await uploadFile2cf(window.profilePendingImage, fileName);
        if (uploadResult) {
            updatedData.user_image = fileName;
        } else {
            AuthUI.showError(window.langu("alert_title_info"), window.langu("gen_err_upload"));
            AuthUI.close();
            return;
        }
    }

    const result = await updateUser(updatedData);
    AuthUI.close();

    if (result && !result.error) {
        profileUpdateSession(updatedData);
        window.profilePendingImage = null; // Reset
        await AuthUI.showSuccess(window.langu("profile_update_success_title"), result.message || window.langu("profile_save_success"));
        if (typeof mainLoader === 'function') {
            mainLoader("pages/user-dashboard.html", "index-user-container", 0, undefined, "showHomeIcon", true);
        }
    } else {
        AuthUI.showError(window.langu("alert_title_info"), result?.error || window.langu("profile_update_fail"));
    }
}

/**
 * Updates the local user session data.
 * @param {Object} updatedData - The newly updated user data.
 */
function profileUpdateSession(updatedData) {
    SessionManager.updateUser(updatedData);
}

/**
 * Handles the secure account deletion process.
 * @async
 */
async function profileHandleAccountDeletion() {
    const confirmation = await Swal.fire({
        title: window.langu("profile_delete_confirm_title"),
        text: window.langu("profile_delete_confirm_text"),
        showCancelButton: true,
        confirmButtonText: window.langu("profile_delete_yes"),
        cancelButtonText: window.langu("alert_cancel_btn"),
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        }
    });

    if (!confirmation.isConfirmed) return;

    const user = window.userSession;
    if (user.Password) {
        const password = await AuthUI.confirmPassword(
            window.langu("profile_delete_verify_title"),
            window.langu("profile_delete_verify_text")
        );
        if (!password) return;

        AuthUI.showLoading(window.langu("profile_verifying"));
        const verification = await verifyUserPassword(user.phone, password);
        AuthUI.close();

        if (!verification || verification.error) {
            AuthUI.showError(window.langu("alert_title_info"), window.langu("profile_invalid_password"));
            return;
        }
    }

    AuthUI.showLoading(window.langu("profile_deleting"));
    const result = await deleteUser(user.user_key);
    AuthUI.close();

    if (result && !result.error) {
        await SessionManager.logout();
        await Swal.fire({
            title: window.langu("profile_delete_success_title"),
            text: window.langu("profile_delete_success_text"),
            confirmButtonText: window.langu("alert_confirm_btn"),
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    } else {
        AuthUI.showError(window.langu("alert_title_info"), result?.error || window.langu("profile_delete_fail"));
    }
}
