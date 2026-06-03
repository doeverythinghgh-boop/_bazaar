/**
 * @file pages/products/productAdd/js/product-add.entry.js
 * @description ESM entrypoint for Product Add page.
 */

import { initProductPageShell, onReady } from "../../shared/modules/product-page-bootstrap.js";
import { getProductRouteContext, seedProductAddCategoriesFromUrl } from "../../shared/modules/product-routes.js";

onReady(async () => {
    const { providerKey } = getProductRouteContext();
    if (!providerKey) {
        console.error("[ProductAdd] Missing provider_key in URL. Redirecting to home.");
        window.location.replace("/");
        return;
    }

    seedProductAddCategoriesFromUrl();
    await initProductPageShell("productAdd");

    if (typeof window.add1_renderCategories === "function") {
        window.ProductDebugConsole?.log("productAdd", "render-categories-start");
        await window.add1_renderCategories();
        window.ProductDebugConsole?.log("productAdd", "render-categories-complete");

        if (typeof window.ADD1_restoreDraft === "function") {
            await window.ADD1_restoreDraft();
        }

        if (typeof window.ADD1_initSubmitLogic === "function") {
            window.ADD1_initSubmitLogic();
        }
    }
});

