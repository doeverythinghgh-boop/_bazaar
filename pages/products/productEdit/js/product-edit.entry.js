/**
 * @file pages/products/productEdit/js/product-edit.entry.js
 * @description ESM entrypoint for Product Edit page.
 */

import { initProductPageShell, onReady } from "../../shared/modules/product-page-bootstrap.js";

onReady(async () => {
    await initProductPageShell("productEdit");

    if (typeof window.initializeEditProductForm === "function") {
        window.ProductDebugConsole?.log("productEdit", "initialize-form-start");
        await window.initializeEditProductForm();
        window.ProductDebugConsole?.log("productEdit", "initialize-form-complete");
    }
});

