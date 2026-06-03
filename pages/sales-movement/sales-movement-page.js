/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
function salesMovement_loadUserTypeSelection() {
    salesMovement_loadAllOrders();
}

var salesMovement_refreshBtn = document.getElementById("salesMovement_refreshButton");
if (salesMovement_refreshBtn) {
    salesMovement_refreshBtn.addEventListener("click", function () {
        salesMovement_loadAllOrders();
    });
}

var salesMovement_closeModalBtn = document.getElementById("salesMovement_closeModal");
var salesMovement_modal = document.getElementById("salesMovement_orderModal");

if (salesMovement_closeModalBtn) {
    salesMovement_closeModalBtn.addEventListener("click", function () {
        salesMovement_modal.classList.remove("salesMovement_show");
    });
}

var salesMovement_productKeyWatcher = setInterval(salesMovement_checkProductKeyChanges, 100);

window.addEventListener("beforeunload", function () {
    clearInterval(salesMovement_productKeyWatcher);
});
