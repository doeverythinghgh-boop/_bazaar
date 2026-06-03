/**
 * @file pages/products/shared/form/product-form-dom-core.js
 * @description Shared DOM helpers for product add/edit image previews.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductFormDomCore = window.ProductFormDomCore || (function createProductFormDomCore() {
    function attachSelectionBehavior(wrapper, options = {}) {
        const {
            removeSelector,
            selectedClass
        } = options;

        wrapper.addEventListener('click', (event) => {
            if (event.target.closest(removeSelector)) return;
            document.querySelectorAll(`.${selectedClass}`).forEach((preview) => {
                preview.classList.remove(selectedClass);
            });
            wrapper.classList.add(selectedClass);
        });
    }

    function loadPreviewImage(state, imgEl, existingImageUrl, options = {}) {
        const { useObjectUrl = false } = options;
        const resolvedUrl = existingImageUrl || (typeof state?.url === 'string' ? state.url : '');

        if (resolvedUrl) {
            imgEl.src = resolvedUrl;
            return;
        }

        if (!(state?.file instanceof Blob)) {
            imgEl.removeAttribute('src');
            if (state) state.status = state.status || 'error';
            console.warn('[ProductFormDomCore] Preview skipped because no image source is available.', {
                id: state?.id || null,
                status: state?.status || null
            });
            return;
        }

        if (useObjectUrl) {
            const objectUrl = URL.createObjectURL(state.file);
            imgEl.src = objectUrl;
            state._objectUrl = objectUrl;
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            imgEl.src = event.target.result;
        };
        reader.readAsDataURL(state.file);
    }

    function createImagePreview(state, options = {}) {
        const {
            existingImageUrl = null,
            previewsEl = null,
            removeHandler = null,
            removeTitle = '',
            processingText = '',
            currentImageText = '',
            wrapperClass = '',
            selectedClass = '',
            removeClass = '',
            metaClass = '',
            wrapperId = '',
            removeBtnId = '',
            imgId = '',
            metaId = '',
            pendingMetaClass = '',
            useObjectUrl = false,
            removeIconHtml = '<i class="fas fa-trash-alt"></i>',
            removeIconId = ''
        } = options;

        const wrapper = document.createElement('div');
        if (wrapperId) wrapper.id = wrapperId;
        wrapper.className = wrapperClass;
        wrapper.setAttribute('data-id', state.id);

        attachSelectionBehavior(wrapper, {
            removeSelector: `.${removeClass}`,
            selectedClass: selectedClass
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        if (removeBtnId) removeBtn.id = removeBtnId;
        removeBtn.className = removeClass;
        removeBtn.setAttribute('title', removeTitle);
        removeBtn.innerHTML = removeIconHtml;
        if (removeIconId) {
            const icon = removeBtn.querySelector('i');
            if (icon) icon.id = removeIconId;
        }
        removeBtn.addEventListener('click', () => removeHandler(state.id));

        const img = document.createElement('img');
        if (imgId) img.id = imgId;

        const meta = document.createElement('div');
        if (metaId) meta.id = metaId;
        meta.className = metaClass;
        if (pendingMetaClass && state.status === 'pending') meta.classList.add(pendingMetaClass);
        meta.textContent = state.status === 'uploaded' ? currentImageText : processingText;

        wrapper.appendChild(removeBtn);
        wrapper.appendChild(img);
        wrapper.appendChild(meta);

        loadPreviewImage(state, img, existingImageUrl, { useObjectUrl });

        if (previewsEl) previewsEl.appendChild(wrapper);
        state._el = wrapper;
        state._metaEl = meta;
        return wrapper;
    }

    async function confirmAndRemoveImage(id, options = {}) {
        const {
            images = [],
            confirmTitle = '',
            confirmText = '',
            confirmButtonText = '',
            cancelButtonText = '',
            logPrefix = 'ProductForm',
            revokeObjectUrl = false
        } = options;

        const result = await Swal.fire({
            title: confirmTitle,
            text: confirmText,
            showCancelButton: true,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            },
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText
        });

        if (!result.isConfirmed) return false;

        const idx = images.findIndex((image) => image.id === id);
        if (idx < 0) return false;

        const state = images[idx];
        if (revokeObjectUrl && state._objectUrl) {
            URL.revokeObjectURL(state._objectUrl);
            console.log(`[Memory] Revoked URL for image: ${id}`);
        }

        if (state._el) state._el.remove();
        images.splice(idx, 1);
        console.log(`[${logPrefix}] Done ${id} .`);
        return true;
    }

    return {
        confirmAndRemoveImage,
        createImagePreview
    };
})();
