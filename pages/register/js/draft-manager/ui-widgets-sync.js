/**
 * @file pages/register/js/draft-manager/ui-widgets-sync.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    'use strict';
    window.DraftManagerInternals = window.DraftManagerInternals || {};

    window.DraftManagerInternals.syncSnapshotWidgets = function(snapshot) {
        const categoryRaw = snapshot?.fields?.register_business_category_json;
        if (categoryRaw) {
            try {
                const categoryData = typeof categoryRaw === "string" ? JSON.parse(categoryRaw) : categoryRaw;
                const display = document.getElementById("register_selected_categories_display");
                if (display && window.CategoryTreeModal?.renderDetailedSelection) {
                    const render = () => window.CategoryTreeModal.renderDetailedSelection(categoryData, display);
                    if (window.appCategoriesList) {
                        render();
                    } else if (typeof window.fetchAppCategories === "function") {
                        window.fetchAppCategories().then(render).catch((error) => {
                            console.warn("[DraftManager] Failed to restore category display.", error);
                        });
                    }
                }
            } catch (error) {
                console.warn("[DraftManager] Failed to parse restored categories.", error);
            }
        }

        if (window.registerSocialLinksApi?.renderVisibilityFromValues) {
            window.registerSocialLinksApi.renderVisibilityFromValues();
        }

        if (window.RegisterDeliveryPartnerManager?.bindUiOnce) {
            window.RegisterDeliveryPartnerManager.bindUiOnce();
        } else if (window.RegisterDeliveryPartnerManager?.renderSelection) {
            window.RegisterDeliveryPartnerManager.renderSelection();
        }

        if (window.RegisterUxEngine?.syncStepUI) {
            window.RegisterUxEngine.syncStepUI();
        } else if (typeof window.registerSyncDeliveryGroupForCategories === "function") {
            window.registerSyncDeliveryGroupForCategories();
        }
    };

    window.DraftManagerInternals.restorePrimaryLocationDraft = function(locations) {
        if (!Array.isArray(locations) || !locations.length) return;

        const primary = window.UserLocationsClient
            ? window.UserLocationsClient.getPrimary(locations)
            : (locations.find((loc) => loc.is_primary) || locations[0]);
        if (!primary) return;

        window.registerActiveLocationId = primary.id || window.registerActiveLocationId || "";
        window.registerDraftNewLocation = false;

        if (window.RegisterLocationsDraft?.setDraft) {
            console.log(` [DraftManager] Syncing Map Iframe with coordinates: ${primary.coords}`);
            window.RegisterLocationsDraft.setDraft({
                coords: primary.coords || "",
                address: primary.address || ""
            });
            window.DraftManagerInternals.syncRestoredFieldState("register_coords", primary.coords || "", document.getElementById("register_coords"));
            window.DraftManagerInternals.syncRestoredFieldState("register_address", primary.address || "", document.getElementById("register_address"));
        } else {
            console.warn("[DraftManager] RegisterLocationsDraft.setDraft not found. Map sync skipped.");
        }
    };
})();
