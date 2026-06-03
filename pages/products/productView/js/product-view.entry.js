/**
 * @file pages/products/productView/js/product-view.entry.js
 * @description ESM entrypoint for Product View page.
 */

import { initProductPageShell, onReady } from "../../shared/modules/product-page-bootstrap.js";

onReady(async () => {
    // No 'homeButtonId' is passed here intentionally.
    // The productView page does not belong to any top-level nav section, so no
    // header button should appear active while the user is viewing a product.
    await initProductPageShell("productView", {
        fetchCategories: true
    });

    if (typeof window.productView_initPage === "function") {
        window.ProductDebugConsole?.log("productView", "page-init-start");
        await window.productView_initPage();
    }
});

