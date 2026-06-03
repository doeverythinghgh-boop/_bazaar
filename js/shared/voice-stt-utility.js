/**
 * @file voice-stt-utility.js
 * @description Unified Speech-to-Text Auto-Scanner Utility for Suez Bazaar.
 * Automatically injects voice STT buttons into text and number inputs across the application.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.VoiceSTTManager = {
    instances: {},
    isGlobalScannerActive: false,

    /**
     * Legacy initialization (kept for backward compatibility if any local scripts still call it before cleanup)
     */
    init(textareaId, buttonId, options = {}) {
        const textarea = document.getElementById(textareaId);
        const voiceBtn = document.getElementById(buttonId);
        if (!textarea || !voiceBtn) return;
        this.bindInstance(textarea, voiceBtn, options);
    },

    /**
     * Binds internal STT logic to a specific input and its microphone button.
     */
    bindInstance(inputField, voiceBtn, options = {}) {
        if (inputField.dataset.voiceBound === 'true') return;

        const available = ('webkitSpeechRecognition' in window);
        if (!available) {
            voiceBtn.style.display = 'none';
            return;
        }

        const baseLang = window.app_language === 'ar' ? 'ar-SA' : 'en-US';

        const instance = {
            textarea: inputField,
            voiceBtn: voiceBtn,
            isRecording: false,
            recognition: null,
            options: Object.assign({
                lang: baseLang,
                continuous: false,
                interimResults: true,
                numericOnly: inputField.type === 'number' || inputField.type === 'tel'
            }, options)
        };

        this.setupRecognition(instance);
        this.bindEvents(instance);

        const fieldId = inputField.id || `voice-stt-input-${Date.now()}`;
        this.instances[fieldId] = instance;
        inputField.dataset.voiceBound = 'true';

        // Global callback for Android permissions
        if (!window.onAndroidPermissionResult) {
            window.onAndroidPermissionResult = (granted) => {
                this.nativeLog(`[VoiceSys] Global permission result: ${granted}`);
                Object.values(this.instances).forEach(inst => {
                    if (inst.waitingForPermission && granted) {
                        inst.waitingForPermission = false;
                        this.startRecording(inst);
                    }
                });
            };
        }
    },

    setupRecognition(instance) {
        try {
            instance.recognition = new webkitSpeechRecognition();
            instance.recognition.continuous = instance.options.continuous;
            instance.recognition.interimResults = instance.options.interimResults;
            instance.recognition.lang = instance.options.lang;

            instance.recognition.onstart = () => {
                instance.isRecording = true;
                this.updateUI(instance, true);
            };

            instance.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        let transcript = event.results[i][0].transcript;

                        if (instance.options.numericOnly) {
                            transcript = transcript.replace(/\D/g, "");
                        }

                        instance.textarea.focus();

                        let start = instance.textarea.selectionStart;
                        let end = instance.textarea.selectionEnd;

                        if (start === 0 && instance.textarea.value && instance.textarea.value.length > 0) {
                            start = instance.textarea.value.length;
                            end = instance.textarea.value.length;
                        }

                        // Prevent "null" or "undefined" from being treated as numbers
                        if (typeof start !== 'number') { start = instance.textarea.value.length; }
                        if (typeof end !== 'number') { end = instance.textarea.value.length; }

                        const oldVal = instance.textarea.value;
                        const suffix = (instance.options.numericOnly || transcript.endsWith(" ")) ? "" : " ";
                        const insertedText = transcript + suffix;

                        instance.textarea.value = oldVal.substring(0, start) + insertedText + oldVal.substring(end);

                        const newPos = start + insertedText.length;
                        instance.textarea.setSelectionRange(newPos, newPos);

                        instance.textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        instance.textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            };

            instance.recognition.onerror = () => {
                this.stopRecording(instance);
            };

            instance.recognition.onend = () => {
                this.stopRecording(instance);
            };

        } catch (e) {
            this.nativeLog(`[VoiceSys] ENGINE_INIT_ERR: ${e.message}`, 'e');
        }
    },

    bindEvents(instance) {
        instance.voiceBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (instance.isRecording) {
                this.stopRecording(instance);
            } else {
                this.handleStartClick(instance);
            }
        };
    },

    handleStartClick(instance) {
        if (window.BridgeManager && typeof window.BridgeManager.invokeForResult === 'function' && window.BridgeManager.isAndroid()) {
            const granted = window.BridgeManager.invokeForResult('isAudioPermissionGranted');
            if (granted) {
                this.startRecording(instance);
            } else {
                instance.waitingForPermission = true;
                window.BridgeManager.invoke('requestAudioPermission');
            }
        } else {
            this.startRecording(instance);
        }
    },

    startRecording(instance) {
        if (!instance.recognition) return;
        try {
            // Stop any other active recordings first
            Object.values(this.instances).forEach(inst => {
                if (inst.isRecording) this.stopRecording(inst);
            });
            instance.recognition.start();
        } catch { }
    },

    stopRecording(instance) {
        if (!instance.recognition) return;
        try { instance.recognition.stop(); } catch { }
        instance.isRecording = false;
        this.updateUI(instance, false);
    },

    updateUI(instance, active) {
        if (active) {
            instance.voiceBtn.classList.add('recording');
        } else {
            instance.voiceBtn.classList.remove('recording');
        }
    },

    nativeLog(message, level = 'i') {
        if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function' && window.BridgeManager.isAndroid()) {
            window.BridgeManager.invoke('logToNative', level, "VoiceSTT", message);
        } else {
            console.log(`[VoiceSTT] ${message}`);
        }
    },

    /**
     * DOM Auto-Scanner Implementation
     */
    initGlobalScanner() {
        if (this.isGlobalScannerActive) return;
        this.isGlobalScannerActive = true;
        this.scanDOM();

        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            for (let mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldScan = true;
                    break;
                }
            }
            if (shouldScan) this.scanDOM();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    scanDOM() {
        const inputs = document.querySelectorAll('input:not([data-voice-bound="true"]), textarea:not([data-voice-bound="true"])');
        inputs.forEach(input => {
            if (input.type === 'password') return;
            const idAndName = `${input.id || ''} ${input.name || ''}`.toLowerCase();
            if (idAndName.includes('password') || idAndName.includes('pass')) return;
            if (['hidden', 'submit', 'button', 'radio', 'checkbox', 'file', 'image', 'color', 'range', 'url'].includes(input.type)) return;
            if (input.classList.contains('no-voice')) return;
            if (input.style.display === 'none' || window.getComputedStyle(input).display === 'none') return;
            this.injectVoiceUI(input);
        });
    },

    injectVoiceUI(inputField) {
        // 1. Ensure the parent has relative positioning for absolute child anchoring
        const parent = inputField.parentElement;
        if (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.position === 'static') {
                parent.style.position = 'relative';
            }
        }

        // 2. Create the microphone button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-voice-global';
        btn.title = typeof window.langu === 'function' ? (window.langu('voice_btn_title') || 'Use Microphone') : 'Use Microphone';
        btn.innerHTML = '<i class="fas fa-microphone"></i>';

        // 3. Mark the input as having a voice button (CSS-only mark)
        inputField.classList.add('has-voice-btn');

        // 4. Position and Sync Logic (Pixel Perfect)
        const syncPosition = () => {
            if (!inputField.isConnected) return;
            const isRtl = document.dir === 'rtl' || window.getComputedStyle(inputField).direction === 'rtl';
            const rect = inputField.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();

            const topOffset = rect.top - parentRect.top;
            const leftOffset = rect.left - parentRect.left;
            const rightOffset = parentRect.right - rect.right;

            // Position calculation: use absolute top without transforms to avoid "jumping" on click/active
            if (inputField.tagName.toLowerCase() === 'textarea') {
                btn.style.top = `${topOffset + 14}px`;
            } else {
                // Vertical center = (Midpoint of input) - (Half of button height which is 20px)
                const inputMid = topOffset + (rect.height / 2);
                btn.style.top = `${inputMid - 20}px`;
            }
            btn.style.transform = 'none';

            if (isRtl) {
                btn.style.left = `${leftOffset + 8}px`;
                btn.style.right = 'auto';
            } else {
                btn.style.right = `${rightOffset + 8}px`;
                btn.style.left = 'auto';
            }
        };

        // 5. Append to the same parent as an absolute sibling
        parent.appendChild(btn);

        // 6. Dynamic Sync via ResizeObserver
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => syncPosition());
            ro.observe(inputField);
            window.addEventListener('resize', syncPosition);
        }

        // 7. SYNC INITIAL POSITION (Slightly delayed to catch post-render layout)
        syncPosition();
        setTimeout(syncPosition, 100);

        // 8. BIND LOGIC (CRITICAL: Do NOT set voiceBound=true before this call!)
        this.bindInstance(inputField, btn);
    }
};

// Start scanner on load automatically
document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to allow dynamic JS renders to finish their initial pass
    setTimeout(() => {
        if (window.VoiceSTTManager) {
            window.VoiceSTTManager.initGlobalScanner();
        }
    }, 500);
});

