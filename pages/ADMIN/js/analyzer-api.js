/**
 * @file analyzer-api.js
 * @description Data fetching logic for the Image Analyzer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.fetchAllAnalyzerResources = async function (options = {}) {
    const state = window.AnalyzerState;
    const dom = window.AnalyzerDOM;
    const addLog = window.addAnalyzerLog;

    const cleanFileName = (path) => {
        if (!path || typeof path !== "string") return "";

        try {
            let clean = path.trim();
            const publicBase = (typeof window.getBazaarInfrastructureConfig === "function"
                ? window.getBazaarInfrastructureConfig().r2PublicUrl
                : null) || "";

            if (publicBase && clean.includes(publicBase)) {
                clean = clean.split(publicBase).pop().replace(/^\//, "");
            } else if (clean.includes("://")) {
                clean = clean.split(/[/\\]/).pop();
            } else {
                clean = clean.replace(/^\//, "");
            }

            return clean.split("?")[0].toLowerCase().trim();
        } catch (error) {
            return "";
        }
    };

    const parseJsonObject = (value) => {
        if (!value) return null;
        if (typeof value === "object") return value;
        if (typeof value !== "string") return null;

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    };

    const getCurrentUser = () => {
        if (window.UserService?.get) {
            return window.UserService.get();
        }

        try {
            const userStr = LocalDBStorage.getItem("loggedInUser");
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    };

    const fetchTableData = async (table, limit = 1000) => {
        const response = await fetch(
            `${window.baseURL}/api/database-analysis?mode=data&table=${encodeURIComponent(table)}&limit=${encodeURIComponent(limit)}`
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(`تعذر جلب بيانات ${table}`);
        }

        if (!payload || !Array.isArray(payload.rows)) {
            throw new Error(`استجابة ${table} غير صالحة`);
        }

        return payload;
    };

    const fetchFirestoreOrders = async (limit = 5000) => {
        if (typeof window.ensureFirestoreDb !== "function") {
            console.warn("[Analyzer] ensureFirestoreDb is not available; skipping Firestore order image references.");
            return [];
        }

        const db = await window.ensureFirestoreDb();
        const snap = await db.collection("orders").limit(limit).get();
        return snap.docs.map((doc) => ({ order_key: doc.id, ...doc.data() }));
    };

    const extractFeaturedImages = (row) => {
        return [
            row?.product_image,
            row?.image,
            row?.img_path,
            row?.ImageName
        ]
            .flatMap((value) => String(value || "").split(","))
            .map((item) => cleanFileName(item))
            .filter(Boolean);
    };

    function checkSuperAdmin() {
        try {
            const user = getCurrentUser();
            const capabilities = typeof window.resolveUserCapabilities === "function"
                ? window.resolveUserCapabilities(user)
                : null;
            const isSuper = !!capabilities?.isSuperAdmin;

            if (!isSuper) {
                if (dom.btnScan) dom.btnScan.style.display = "none";
                if (dom.btnDelete) dom.btnDelete.style.display = "none";
            }
        } catch (error) {
            console.error("[Analyzer] Auth check failed", error);
        }
    }

    checkSuperAdmin();

    if (!dom.btnScan) {
        throw new Error("زر بدء المسح غير موجود.");
    }

    const originalBtnHTML = dom.btnScan.innerHTML;
    dom.btnScan.disabled = true;
    dom.btnScan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المسح...';

    addLog("بدء فحص أصول الصور...");
    console.log("[Analyzer] --- STARTING FULL SCAN ---");
    const startTime = performance.now();

    try {
        addLog("جلب قائمة الملفات من Cloudflare R2...", "info");
        const cfWorkerBaseUrl = typeof window.getBazaarInfrastructureConfig === "function" ? window.getBazaarInfrastructureConfig().r2ManagerWorkerUrl : "";
        const r2Url = `${cfWorkerBaseUrl}/list?_=${Date.now()}`;
        const token = await ensureToken2cf();
        const fetchStart = performance.now();
        const r2Res = await fetch(r2Url, { headers: { "X-Auth-Key": token } });

        if (!r2Res.ok) {
            throw new Error(`تعذر جلب ملفات السيرفر (${r2Res.status})`);
        }

        const r2Payload = await r2Res.json();
        if (!Array.isArray(r2Payload?.files)) {
            throw new Error("قائمة ملفات السيرفر غير صالحة.");
        }

        const fetchEnd = performance.now();
        state.r2Files = r2Payload.files;
        addLog(`تم جلب ${state.r2Files.length} ملف من السيرفر.`, "success");
        console.log(`[Analyzer] R2 Inventory: Found ${state.r2Files.length} objects. (${(fetchEnd - fetchStart).toFixed(2)}ms)`);

        addLog("جلب مراجع الصور من قاعدة البيانات...", "info");
        state.dbRefs.clear();

        const dbStart = performance.now();
        const [pRes, uRes, adRes, orders, fRes] = await Promise.all([
            fetchTableData("marketplace_products", 5000),
            fetchTableData("users", 1000),
            fetchTableData("app_advertisements", 1000),
            fetchFirestoreOrders(5000),
            fetchTableData("app_featured_products", 5000)
        ]);
        const dbEnd = performance.now();
        console.log(`[Analyzer] Database payload fetched in ${(dbEnd - dbStart).toFixed(2)}ms.`);

        let prodCount = 0;
        pRes.rows.forEach((product) => {
            String(product?.ImageName || "")
                .split(",")
                .map((item) => cleanFileName(item))
                .filter(Boolean)
                .forEach((key) => {
                    state.dbRefs.set(key, {
                        type: "Product",
                        table: "marketplace_products",
                        id: product.id || product.product_key || "N/A"
                    });
                    prodCount += 1;
                });
        });

        let avatarCount = 0;
        let coverCount = 0;
        uRes.rows.forEach((user) => {
            const imageData = parseJsonObject(user.user_image) || { avatar: user.user_image };
            const avatarCandidates = [imageData?.avatar, imageData?.profile, imageData?.image];
            avatarCandidates.forEach((candidate) => {
                const key = cleanFileName(candidate);
                if (key && !state.dbRefs.has(key)) {
                    state.dbRefs.set(key, { type: "Avatar", table: "users", id: user.user_key });
                    avatarCount += 1;
                }
            });

            const coverCandidates = [
                ...(Array.isArray(imageData?.covers) ? imageData.covers : []),
                imageData?.cover
            ];
            coverCandidates.forEach((candidate) => {
                const key = cleanFileName(candidate);
                if (key && !state.dbRefs.has(key)) {
                    state.dbRefs.set(key, { type: "Cover", table: "users", id: user.user_key });
                    coverCount += 1;
                }
            });
        });

        adRes.rows.forEach((ad) => {
            const key = cleanFileName(ad?.img_path);
            if (key) {
                state.dbRefs.set(key, { type: "Advertisement", table: "app_advertisements", id: ad.id });
            }
        });

        let orderProofCount = 0;
        orders.forEach((order) => {
            const orderKey = order?.order_key;
            const buyer = order?.user_key;
            const items = Array.isArray(order?.order_items) ? order.order_items : [];
            items.forEach((item) => {
                const merchant = item.seller_key;
                const product = item.product_key;

                if (buyer && merchant && product && orderKey) {
                    [".webp", ".jpg", ".jpeg", ".png"].forEach((ext) => {
                        for (let index = 1; index <= 6; index += 1) {
                            const conventionKey = `${buyer}_${merchant}_${product}_${orderKey}_${index}${ext}`.toLowerCase();
                            state.dbRefs.set(conventionKey, {
                                type: "OrderSnapshot",
                                table: "firestore.orders.order_items",
                                id: orderKey,
                                optionalPresence: true
                            });
                        }
                    });
                }

                const directKey = cleanFileName(item?.image_path || item?.image);
                if (directKey) {
                    state.dbRefs.set(directKey, {
                        type: "OrderPhoto",
                        table: "firestore.orders.order_items",
                        id: orderKey || item.id
                    });
                    orderProofCount += 1;
                }
            });

            Object.entries(order || {}).forEach(([field, value]) => {
                if (typeof value !== "string") return;
                if (!/\.(jpg|jpeg|png|webp|gif|svg)/i.test(value)) return;

                const key = cleanFileName(value);
                if (key && !state.dbRefs.has(key)) {
                    state.dbRefs.set(key, {
                        type: "OrderReceipt",
                        table: `firestore.orders.${field}`,
                        id: orderKey || order.id
                    });
                    orderProofCount += 1;
                }
            });
        });

        fRes.rows.forEach((row) => {
            extractFeaturedImages(row).forEach((key) => {
                if (key && !state.dbRefs.has(key)) {
                    state.dbRefs.set(key, { type: "FeaturedCache", table: "app_featured_products", id: row.id });
                }
            });
        });

        ["advertisements.json", "selected_search_products.json"].forEach((systemFile) => {
            state.dbRefs.set(systemFile, { type: "SystemConfig", table: "N/A", id: "SYSTEM" });
        });

        addLog(`تم تجميع ${state.dbRefs.size} مرجع فريد من القاعدة.`, "success");
        console.log(`[Analyzer] References mapped: products=${prodCount}, avatars=${avatarCount}, covers=${coverCount}, orderLinks=${orderProofCount}, total=${state.dbRefs.size}`);

        if (state.r2Files.length === 0) {
            addLog("تحذير: قائمة ملفات R2 فارغة.", "warning");
        }

        addLog("بدء المقارنة بين السيرفر والقاعدة...", "info");
        window.computeAnalyzerResults();
        state.lastScanAt = new Date();
        state.scanDurationMs = performance.now() - startTime;
        window.renderAnalyzerTable();
        window.updateAnalyzerStats();
        if (window.updateAnalyzerSummary) {
            window.updateAnalyzerSummary();
        }

        if (dom.btnDelete) {
            dom.btnDelete.style.display = state.results.some((item) => item.status === "DEAD") ? "flex" : "none";
        }

        const totalTime = (performance.now() - startTime) / 1000;
        addLog(`اكتمل الفحص خلال ${totalTime.toFixed(2)} ثانية.`, "success");
        console.log(`[Analyzer] --- SCAN COMPLETED IN ${totalTime.toFixed(2)}s ---`);

        if (options.focusName && dom.search) {
            dom.search.value = String(options.focusName || '');
            window.renderAnalyzerTable();
            if (window.updateAnalyzerSummary) {
                window.updateAnalyzerSummary();
            }
        }
    } catch (error) {
        console.error("[Analyzer] CRITICAL ERROR during scan:", error);
        Swal.fire("خطأ برمجي", error.message, "error");
        addLog(`حدث خطأ: ${error.message}`, "error");
    } finally {
        dom.btnScan.disabled = false;
        dom.btnScan.innerHTML = originalBtnHTML;
    }
};

window.handleBatchCleanup = async function () {
    const deadFiles = window.AnalyzerState.results.filter((item) => item.status === "DEAD");
    if (deadFiles.length === 0) {
        return Swal.fire("نظيف", "لا توجد ملفات ميتة لحذفها.", "info");
    }

    const result = await Swal.fire({
        title: "تنظيف شامل للسيرفر؟",
        text: `أنت على وشك حذف ${deadFiles.length} ملف يتيم نهائيًا. هل أنت متأكد؟`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "نعم، نظف السيرفر",
        cancelButtonText: "إلغاء"
    });

    if (!result.isConfirmed) return;

    window.addAnalyzerLog("بدء تنظيف الملفات الميتة...", "warning");
    let count = 0;

    for (const file of deadFiles) {
        try {
            await window.deleteFile2cf(file.name);
            count += 1;
        } catch (error) {
            console.error(error);
            window.addAnalyzerLog(`فشل حذف ${file.name}: ${error.message}`, "error");
        }
    }

    Swal.fire("تم التنظيف", `تم حذف ${count} ملف من أصل ${deadFiles.length}.`, "success");
    window.fetchAllAnalyzerResources();
};
