/**
 * @file pages/profile-modal/js/profile-init.js
 * @description Initialization logic for the profile modal data and state.
 */

/**
 * Initializes the profile form fields with data from the current user session.
 */
function profileInitializeData() {
    try {
        const els = profileGetElements();
        const user = window.userSession;

        // Reset any pending image from previous sessions
        window.profilePendingImage = null;

        if (!user) return;

        if (els.usernameInput) els.usernameInput.value = user.username || "";
        if (els.phoneInput) els.phoneInput.value = user.phone || "";
        if (els.addressInput) els.addressInput.value = user.Address || user.address || "";

        // ✅ NEW: Guest visibility check
        if (SessionManager.isGuest()) {
            if (els.businessTabBtn) els.businessTabBtn.style.display = "none";
        }

        // Reset password fields
        if (els.changePasswordCheckbox) els.changePasswordCheckbox.checked = false;
        if (els.passwordFieldsContainer) els.passwordFieldsContainer.style.display = "none";
        if (els.newPasswordInput) els.newPasswordInput.value = "";
        if (els.confirmPasswordInput) els.confirmPasswordInput.value = "";
        if (els.passwordErrorDiv) els.passwordErrorDiv.textContent = "";

        // Initialize seller options
        if (els.isDeliveredInput) els.isDeliveredInput.value = user.isDelivered !== undefined ? user.isDelivered : 0;
        if (els.limitPackageInput) els.limitPackageInput.value = user.limitPackage !== undefined ? user.limitPackage : 0;

        if (els.sellerOptionsBtn) {
            const isSet = (user.isDelivered == 1 || user.limitPackage > 0);
            els.sellerOptionsBtn.setAttribute("data-status", isSet ? "set" : "none");
            els.sellerOptionsBtn.innerHTML = `<i class="fas fa-store"></i> ${window.langu("profile_seller_options_btn")} ${isSet ? window.langu("profile_seller_options_set") : ""}`;
        }

        // ✅ NEW: Initialize Business Fields with Sub-Categories support
        if (els.businessName) els.businessName.value = user.business_name || "";
        if (els.businessBio) els.businessBio.value = user.business_bio || "";
        if (els.businessWhatsapp) els.businessWhatsapp.value = user.business_whatsapp || "";

        // Populate Categories (Main and Sub)
        profilePopulateCategories();

        // ✅ NEW: Initialize Avatar
        if (user.user_image && els.avatarPreview) {
            els.avatarPreview.src = getPublicR2FileUrl(user.user_image);
            els.avatarPreview.style.display = "block";
            if (els.avatarPlaceholder) els.avatarPlaceholder.style.display = "none";
            if (els.avatarEditIcon) els.avatarEditIcon.style.display = "none"; // Hide edit icon if image exists
        } else if (els.avatarPreview) {
            els.avatarPreview.style.display = "none";
            if (els.avatarPlaceholder) els.avatarPlaceholder.style.display = "flex";
            if (els.avatarEditIcon) els.avatarEditIcon.style.display = "flex"; // Show edit icon if no image
        }

        // Restore saved location
        let initialCoords = user.location || user.location || user.Coordinates || user.coordinates || user.user_location || "";
        if (!initialCoords) {
            initialCoords = localStorage.getItem("saved_location") || "";
        }

        if (initialCoords && initialCoords.includes(",")) {
            if (els.coordsInput) {
                els.coordsInput.value = initialCoords;
            }

            // Update Iframe Source with coordinates and cache busting
            if (els.locationIframe) {
                const [lat, lng] = initialCoords.split(",").map(c => c.trim());
                const timestamp = new Date().getTime();
                els.locationIframe.src = `/location/LOCATION.html?lat=${lat}&lng=${lng}&embedded=true&hideSave=true&v=${timestamp}`;
            }
        }
    } catch (error) {
        console.error("Error initializing profile data:", error);
    }
}

/**
 * ✅ NEW: Dynamic Categories & Sub-Categories Logic
 * Populates the main category select and handles sub-category checkboxes.
 */
async function profilePopulateCategories() {
    const els = profileGetElements();
    const user = window.userSession;
    if (!els.businessCategory || !user) return;

    try {
        // Fetch categories if not already loaded
        const data = window.appCategoriesList || await fetchAppCategories();
        if (!data || !data.categories) {
            console.error("[Profile] Failed to load categories data.");
            return;
        }

        // 1. Populate Main Categories
        const currentLang = window.app_language || 'ar';
        const defaultMainTitle = (window.langu && window.langu('cat_select_main_placeholder')) || 'اختر السوق الرئيسي';
        els.businessCategory.innerHTML = `<option value="">-- ${defaultMainTitle} --</option>`;

        data.categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            const titleObj = cat.title;
            const displayTitle = typeof titleObj === 'object' ? (titleObj[currentLang] || titleObj['ar']) : titleObj;
            opt.textContent = displayTitle;
            els.businessCategory.appendChild(opt);
        });

        // 2. Set Initial Main Category
        const initialMainId = user.business_category || "";
        if (initialMainId) {
            els.businessCategory.value = initialMainId;
            updateSubCatsUI(initialMainId, data.categories, user, els);
        }

        // 3. Listener for Sub-Categories update
        // Note: Removing existing listener to prevent duplicates if function is recalled
        els.businessCategory.removeEventListener("change", handleMainCatChange);
        els.businessCategory.addEventListener("change", handleMainCatChange);

        function handleMainCatChange(e) {
            updateSubCatsUI(e.target.value, data.categories, user, els);
        }

    } catch (error) {
        console.error("[Profile] Error in profilePopulateCategories:", error);
    }
}

/**
 * Updates the sub-categories UI based on main category selection.
 */
function updateSubCatsUI(mainId, categories, user, els) {
    if (!els.businessSubCatsGroup || !els.businessSubCatsContainer) return;

    const selectedCat = categories.find(c => String(c.id) === String(mainId));

    if (!selectedCat || !selectedCat.subcategories || selectedCat.subcategories.length === 0) {
        els.businessSubCatsGroup.style.display = "none";
        els.businessSubCatsContainer.innerHTML = "";
        return;
    }

    els.businessSubCatsGroup.style.display = "block";
    els.businessSubCatsContainer.innerHTML = "";

    const currentLang = window.app_language || 'ar';

    // Get user's saved sub-categories (handle array or csv)
    let savedSubs = [];
    if (user.business_sub_categories) {
        if (Array.isArray(user.business_sub_categories)) {
            savedSubs = user.business_sub_categories.map(String);
        } else {
            savedSubs = String(user.business_sub_categories).split(",").map(s => s.trim());
        }
    }

    selectedCat.subcategories.forEach(sub => {
        const subItem = document.createElement("label");
        subItem.className = "profile-sub-cat-item";

        const titleObj = sub.title;
        const displayTitle = typeof titleObj === 'object' ? (titleObj[currentLang] || titleObj['ar']) : titleObj;

        const isChecked = savedSubs.includes(String(sub.id));

        subItem.innerHTML = `
            <input type="checkbox" name="profile-business-sub-cat" value="${sub.id}" ${isChecked ? 'checked' : ''}>
            <span class="profile-sub-cat-label">${displayTitle}</span>
        `;
        els.businessSubCatsContainer.appendChild(subItem);
    });
}
