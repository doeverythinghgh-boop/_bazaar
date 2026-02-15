/**
 * @file pages/register/js/register-init.js
 * @description Initialization logic for the register page (Categories, Location Restore).
 */

/**
 * Initializes the registration module.
 */
function registerInitialize() {
    console.log("[Register] Initializing module...");
    
    // Check if user is logged in
    const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
    if (currentUser) {
        console.log("[Register] User already logged in, redirecting...");
        window.location.href = "/pages/user-dashboard.html";
        return;
    }

    const els = registerGetElements();
    
    // Clear Fields
    if (els.usernameInput) els.usernameInput.value = "";
    if (els.phoneInput) els.phoneInput.value = "";
    if (els.passwordInput) els.passwordInput.value = "";
    if (els.addressInput) els.addressInput.value = "";

    // Load initial data
    registerRestoreSavedLocation();
    registerPopulateCategories();
    
    console.log("[Register] Initialization complete.");
}

/**
 * Fetches and populates business categories.
 */
async function registerPopulateCategories() {
    const els = registerGetElements();
    if (!els.businessCategory) return;

    try {
        const data = window.appCategoriesList || await fetchAppCategories();
        if (!data || !data.categories) return;

        const currentLang = window.app_language || 'ar';
        const defaultTitle = (window.langu && window.langu('cat_select_main_placeholder')) || 'اختر التصنيف';
        
        els.businessCategory.innerHTML = `<option value="">-- ${defaultTitle} --</option>`;

        data.categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            const titleObj = cat.title;
            const displayTitle = typeof titleObj === 'object' ? (titleObj[currentLang] || titleObj['ar']) : titleObj;
            opt.textContent = displayTitle;
            els.businessCategory.appendChild(opt);
        });

        // Add Listener (Removing old one to be safe logic, though this runs once)
        els.businessCategory.addEventListener("change", (e) => {
            registerUpdateSubCatsUI(e.target.value, data.categories);
        });

    } catch (e) {
        console.error("[Register] Error loading categories:", e);
    }
}

/**
 * Updates sub-categories based on main selection.
 */
function registerUpdateSubCatsUI(mainId, categories) {
    const els = registerGetElements();
    if (!els.businessSubImgGroup || !els.businessSubImgsContainer) return;

    const selectedCat = categories.find(c => String(c.id) === String(mainId));

    if (!selectedCat || !selectedCat.subcategories || selectedCat.subcategories.length === 0) {
        els.businessSubImgGroup.style.display = "none";
        els.businessSubImgsContainer.innerHTML = "";
        return;
    }

    els.businessSubImgGroup.style.display = "block";
    els.businessSubImgsContainer.innerHTML = "";
    const currentLang = window.app_language || 'ar';

    selectedCat.subcategories.forEach(sub => {
        const subLabel = document.createElement("label");
        // Styling matches original code injection
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
        els.businessSubImgsContainer.appendChild(subLabel);
    });
}
