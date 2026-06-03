/**
 * @file pages/cardPackage/js/cartPackage-notes.js
 * @description Note management functionality for cart items.
 * Handles opening, closing, and saving notes for cart items.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Opens the modal to add or edit a note for a specific cart item.
 * @function cartPage_openNoteModal
 * @param {string} cartPage_productKey - The unique key of the product to edit the note for.
 * @param {string} cartPage_currentNote - The current note content (if any).
 * @returns {void}
 */
function cartPage_openNoteModal(cartPage_productKey, cartPage_currentNote) {
    try {
        cartPage_currentProductKeyForNote = cartPage_productKey;
        document.getElementById('cartPage_noteTextarea').value = cartPage_currentNote;
        document.getElementById('cartPage_noteModal').style.display = 'flex';
    } catch (error) {
        console.error(' Error :', error);
    }
}

/**
 * @description Closes the note editing modal and resets the current product key.
 * @function cartPage_closeNoteModal
 * @returns {void}
 */
function cartPage_closeNoteModal() {
    try {
        document.getElementById('cartPage_noteModal').style.display = 'none';
        cartPage_currentProductKeyForNote = '';
    } catch (error) {
        console.error(' Error :', error);
    }
}

/**
 * @description Saves the note entered in the modal to the corresponding cart item and updates the cart.
 * @function cartPage_saveNote
 * @returns {void}
 */
function cartPage_saveNote() {
    try {
        const cartPage_note = document.getElementById('cartPage_noteTextarea').value.trim();
        updateCartItemNote(cartPage_currentProductKeyForNote, cartPage_note);
        cartPage_closeNoteModal();
    } catch (error) {
        console.error(' Error :', error);
    }
}
