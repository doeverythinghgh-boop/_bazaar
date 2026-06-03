/**
 * @file cloudFileManager.js
 * @description Client-side Library for interacting with Cloudflare R2 file management service.
 *
 * This file provides three main functions for file handling:
 * - `uploadFile2cf(blob, fileName)`: Uploads a file (Blob) to the cloud.
 * - `downloadFile2cf(fileName)`: Downloads a file from the cloud as a Blob.
 * - `deleteFile2cf(fileName)`: Deletes a file from the cloud.
 *
 * Automatically requests a temporary authentication token and includes it in requests.
 * Primarily used in the "Add Product" form to upload product images.
 *
 * @example
 * const blob = await downloadFile2cf("example.pdf");
 * const url = URL.createObjectURL(blob); // Can be displayed or saved
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */






/**
 * @description Base URL for the Cloudflare Worker file management endpoint.
 * @type {string}
 * @const
 */
function getCloudInfraConfig() {
  return typeof window.getBazaarInfrastructureConfig === 'function'
    ? (window.getBazaarInfrastructureConfig() || {})
    : {};
}

function getCfWorkerBaseUrl() {
  return getCloudInfraConfig().r2ManagerWorkerUrl || "";
}

function getR2PublicBaseUrl() {
  return getCloudInfraConfig().r2PublicUrl || "";
}

/**
 * @description Generates the full public URL for a file stored in Cloudflare R2.
 * @param {string} fileName - The name of the file.
 * @returns {string} - The full public URL.
 */
function getPublicR2FileUrl(fileName) {
  if (!fileName) return "";

  const trimmedName = String(fileName || "").trim();
  if (!trimmedName || /^(null|undefined|none|nan)$/i.test(trimmedName)) {
    return "";
  }

  console.log(`[getPublicR2FileUrl] Step 1: Processing input: "${trimmedName}"`);

  // Check if it's already a full URL or absolute path
  const isPreResolved = /^(\/|http:\/\/|https:\/\/|blob:|data:)/.test(trimmedName);
  console.log(`[getPublicR2FileUrl] Step 2: Is absolute/resolved URL? ${isPreResolved}`);

  if (isPreResolved) {
    console.log(`[getPublicR2FileUrl] Pass: Returning resolved URL as is: "${trimmedName}"`);
    return trimmedName;
  }

  const publicBaseUrl = getR2PublicBaseUrl();
  console.log(`[getPublicR2FileUrl] Step 3: Current r2PublicUrl config: "${publicBaseUrl || 'MISSING'}"`);

  if (!publicBaseUrl) {
    // FORCE root-relative path to prevent directory-relative 404
    const fallbackUrl = trimmedName.startsWith("/") ? trimmedName : "/" + trimmedName;
    console.warn(`[getPublicR2FileUrl] Warning: Missing r2PublicUrl. Falling back to root-relative path: "${fallbackUrl}"`);
    return fallbackUrl;
  }

  const cleanName = trimmedName.startsWith("/") ? trimmedName.substring(1) : trimmedName;
  const baseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;

  const finalUrl = `${baseUrl}/${cleanName}`;
  console.log(`[getPublicR2FileUrl] Success: Generated cloud URL: "${finalUrl}"`);

  return finalUrl;
}

/**
 * @description Ensures a valid authentication token (X-Auth-Key) exists for Cloudflare Workers interaction.
 *   If a token exists in `LocalDBStorage`, it returns it.Otherwise, it fetches a new token from `/login` endpoint
  * and saves it to`LocalDBStorage`.
 * @function ensureToken2cf
 * @returns { Promise < string >} - A Promise containing the auth token.
 * @async
  * @throws { Error } - If token fetch fails.
 */
async function ensureToken2cf() {
  const existing = LocalDBStorage.getItem("X-Auth-Key");
  if (existing) return existing;

  try {
    const cfWorkerBaseUrl = getCfWorkerBaseUrl();
    const res = await fetch(cfWorkerBaseUrl + "/login");
    const { token } = await res.json();
    LocalDBStorage.setItem("X-Auth-Key", token);
    return token;
  } catch (err) {
    throw new Error("فشل في جلب التوكن: " + err.message);
  }
}

/**
 * @description Uploads a Blob file to Cloudflare R2 via `/upload` endpoint.
 *   Uses an auth token to ensure security.
 * @function uploadFile2cf
 * @param {Blob} blob - Blob object representing the file to upload.
 * @param {string} fileName - Name to save the file as in the cloud.
 * @param {function(string): void} [onLog=console.log] - Optional callback for logging messages.
 * @returns {Promise<object>} - A Promise with the upload result object.
 * @throws {Error} - If Blob or fileName is missing, or upload fails.
 * @async
 * @see ensureToken2cf
 */
async function uploadFile2cf(blob, fileName, onLog = console.log) {

  if (!(blob instanceof Blob) || !fileName) {
    throw new Error("❌ يجب توفير ملف Blob واسم الملف.");
  }

  const token = await ensureToken2cf();
  const formData = new FormData();
  formData.append("file", blob, fileName);
  const cfWorkerBaseUrl = getCfWorkerBaseUrl();

  onLog("🟢 🚀 بدء رفع الملف...");

  try {
    const res = await fetch(cfWorkerBaseUrl + "/upload", {
      method: "POST",
      headers: { "X-Auth-Key": token },
      body: formData
    });

    const result = await res.json();
    if (res.ok) {
      onLog("✅ تم رفع الملف: " + (result.file || fileName));
      LocalDBStorage.removeItem("X-Auth-Key");
      return result;
    } else {
      throw new Error("❌ فشل الرفع: " + result.error);
    }
  } catch (err) {
    throw new Error("❌ 🛑 فشل الاتصال أثناء رفع الملف: " + err.message);
  }
}

/**
 * @description Downloads a file from Cloudflare R2 via `/download` endpoint.
 *   Uses an auth token to ensure security.
 * @function downloadFile2cf
 * @param {string} fileName - Name of the file to download from cloud.
 * @param {function(string): void} [onLog=console.log] - Optional callback for logging messages.
 * @returns {Promise<Blob>} - A Promise containing the downloaded file as a Blob.
 * @throws {Error} - If fileName is missing, or download fails.
 * @async
 * @see ensureToken2cf
 */
async function downloadFile2cf(fileName, onLog = console.log) {

  if (!fileName) {
    throw new Error("❌ يجب توفير اسم الملف.");
  }

  const token = await ensureToken2cf();
  const cfWorkerBaseUrl = getCfWorkerBaseUrl();
  const url = `${cfWorkerBaseUrl}/download?file=${encodeURIComponent(fileName)}`;

  onLog("🔄 بدء تحميل الملف...");

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Key": token }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error("❌ فشل التحميل: " + err.error);
    }

    const blob = await res.blob();
    LocalDBStorage.removeItem("X-Auth-Key");

    onLog("✅ تم تحميل الملف بنجاح.");
    return blob; // Returns Blob for context usage (display, save, etc.)
  } catch (err) {
    throw new Error("❌ 🛑 خطأ أثناء التحميل: " + err.message);
  }
}

/**
 * @description Deletes a file from Cloudflare R2 via `/delete` endpoint.
 *   Uses an auth token to ensure security.
 * @function deleteFile2cf
 * @param {string} fileName - Name of the file to delete.
 * @param {function(string): void} [onLog=console.log] - Optional callback for logging messages.
 * @returns {Promise<object>} - A Promise with the deletion result object.
 * @throws {Error} - If fileName is missing, or deletion fails.
 * @async
 * @see ensureToken2cf
 */
async function deleteFile2cf(fileName, onLog = console.log) {

  if (!fileName) {
    throw new Error("❌ يجب توفير اسم الملف.");
  }

  const token = await ensureToken2cf();
  const cfWorkerBaseUrl = getCfWorkerBaseUrl();
  const url = `${cfWorkerBaseUrl}/delete?file=${encodeURIComponent(fileName)}`;

  onLog("⚠️ جاري حذف الملف...");

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "X-Auth-Key": token }
    });

    const result = await res.json();
    if (res.ok) {
      LocalDBStorage.removeItem("X-Auth-Key");
      onLog("✅ تم حذف الملف: " + result.file);
      return result;
    } else {
      throw new Error("❌ فشل الحذف: " + result.error);
    }
  } catch (err) {
    throw new Error("❌ 🛑 خطأ أثناء الحذف: " + err.message);
  }
}

/**
 * @description Lists all files stored in Cloudflare R2 via `/list` endpoint.
 *   Uses an auth token to ensure security.
 * @function listFiles2cf
 * @param {function(string): void} [onLog=console.log] - Optional callback for logging messages.
 * @returns {Promise<string[]>} - A Promise containing an array of file names.
 * @throws {Error} - If list fetch fails.
 * @async
 * @see ensureToken2cf
 */
async function listFiles2cf(onLog = console.log) {
  const token = await ensureToken2cf();
  const cfWorkerBaseUrl = getCfWorkerBaseUrl();
  const url = `${cfWorkerBaseUrl}/list`;

  onLog("📡 جاري جلب قائمة الملفات من السيرفر...");

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Key": token }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error("❌ فشل جلب القائمة: " + err.error);
    }

    const { files } = await res.json();
    LocalDBStorage.removeItem("X-Auth-Key");

    onLog(`✅ تم جلب ${files.length} ملف بنجاح.`);
    return files;
  } catch (err) {
    throw new Error("❌ 🛑 خطأ أثناء جلب القائمة: " + err.message);
  }
}

// Explicitly expose functions to global scope
window.getPublicR2FileUrl = getPublicR2FileUrl;
window.uploadFile2cf = uploadFile2cf;
window.downloadFile2cf = downloadFile2cf;
window.deleteFile2cf = deleteFile2cf;
window.listFiles2cf = listFiles2cf;
