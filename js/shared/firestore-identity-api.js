/**
 * @file js/shared/firestore-identity-api.js
 * @description Browser-side Firestore repository for user, token, rating, and order-adjacent identity data.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function (global) {
  "use strict";

  const PROJECT_ID = "users-baad9";
  const API_KEY = "AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo";
  const DATABASE_ID = "(default)";
  const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const OWNED_COLLECTIONS = new Set([
    "users",
    "user_contacts",
    "user_tokens",
    "user_capabilities",
    "user_specialties",
    "merchant_ratings_v2",
  ]);

  function withKey(url) {
    return `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(API_KEY)}`;
  }

  function encodeValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "boolean") return { booleanValue: value };
    if (Number.isInteger(value)) return { integerValue: String(value) };
    if (typeof value === "number") return { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
    if (typeof value === "object") {
      return {
        mapValue: {
          fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)])),
        },
      };
    }
    return { stringValue: String(value) };
  }

  function decodeValue(value) {
    if (!value || typeof value !== "object") return null;
    if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
    if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return value.booleanValue;
    if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
    if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return value.timestampValue;
    if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, "arrayValue")) {
      return (value.arrayValue.values || []).map(decodeValue);
    }
    if (Object.prototype.hasOwnProperty.call(value, "mapValue")) {
      return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
    }
    return null;
  }

  function decodeDoc(doc) {
    if (!doc) return null;
    const data = Object.fromEntries(Object.entries(doc.fields || {}).map(([key, value]) => [key, decodeValue(value)]));
    return { ...data, _firestore_id: String(doc.name || "").split("/").pop() };
  }

  function docUrl(collectionName, docId) {
    return `${BASE_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(String(docId))}`;
  }

  async function firestoreFetch(url, options = {}) {
    const response = await fetch(withKey(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (response.status === 404) return null;
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Firestore request failed with ${response.status}`);
    }
    return payload;
  }

  async function getDoc(collectionName, docId) {
    if (!docId) return null;
    return decodeDoc(await firestoreFetch(docUrl(collectionName, docId)));
  }

  async function setDoc(collectionName, docId, data) {
    if (!OWNED_COLLECTIONS.has(collectionName)) throw new Error("UNSUPPORTED_COLLECTION");
    const document = await firestoreFetch(docUrl(collectionName, docId), {
      method: "PATCH",
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, encodeValue(value)])),
      }),
    });
    return decodeDoc(document);
  }

  async function deleteDoc(collectionName, docId) {
    if (!docId) return false;
    await firestoreFetch(docUrl(collectionName, docId), { method: "DELETE" });
    return true;
  }

  function fieldFilter(fieldPath, op, value) {
    return {
      fieldFilter: {
        field: { fieldPath },
        op,
        value: encodeValue(value),
      },
    };
  }

  async function runQuery(collectionName, where, options = {}) {
    const structuredQuery = { from: [{ collectionId: collectionName }] };
    if (where) structuredQuery.where = where;
    if (options.orderBy) structuredQuery.orderBy = options.orderBy;
    if (options.limit) structuredQuery.limit = options.limit;
    if (options.offset) structuredQuery.offset = options.offset;
    const rows = await firestoreFetch(`${BASE_URL}:runQuery`, {
      method: "POST",
      body: JSON.stringify({ structuredQuery }),
    });
    return (Array.isArray(rows) ? rows : []).map((item) => decodeDoc(item.document)).filter(Boolean);
  }

  async function listAllDocs(collectionName, options = {}) {
    const rows = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams();
      params.set("pageSize", String(options.pageSize || 500));
      if (options.orderBy) params.set("orderBy", options.orderBy);
      if (pageToken) params.set("pageToken", pageToken);
      const payload = await firestoreFetch(`${BASE_URL}/${encodeURIComponent(collectionName)}?${params.toString()}`);
      rows.push(...(payload?.documents || []).map(decodeDoc).filter(Boolean));
      pageToken = payload?.nextPageToken || "";
    } while (pageToken && rows.length < (options.maxRows || 5000));
    return rows;
  }

  async function findByField(collectionName, fieldPath, value, options = {}) {
    return runQuery(collectionName, fieldFilter(fieldPath, "EQUAL", value), options);
  }

  async function findByFieldIn(collectionName, fieldPath, values, options = {}) {
    const unique = Array.from(new Set((Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)));
    const chunks = [];
    for (let index = 0; index < unique.length; index += 30) chunks.push(unique.slice(index, index + 30));
    const batches = await Promise.all(chunks.map((chunk) => runQuery(collectionName, fieldFilter(fieldPath, "IN", chunk), options)));
    return batches.flat();
  }

  async function deleteByField(collectionName, fieldPath, value) {
    const rows = await findByField(collectionName, fieldPath, value);
    await Promise.all(rows.map((row) => deleteDoc(collectionName, row._firestore_id || row.id)));
    return rows.length;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    const value = global.crypto && typeof global.crypto.randomUUID === "function"
      ? global.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}_${value}`;
  }

  function safeParseJson(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch (_) {
      return fallback;
    }
  }

  function normalizeAccountTypeValue(value) {
    return typeof global.normalizeAccountType === "function"
      ? global.normalizeAccountType(value)
      : (parseInt(value || 1, 10) || 1);
  }

  function normalizePhone(value) {
    if (global.AuthValidators && typeof global.AuthValidators.normalizePhone === "function") {
      return global.AuthValidators.normalizePhone(value || "");
    }
    return String(value || "").trim();
  }

  function normalizePhonesPayload(phones, fallback = {}) {
    const list = Array.isArray(phones) && phones.length
      ? phones
      : [
        { number: fallback.phone, is_primary: true, has_whatsapp: true },
        { number: fallback.business_whatsapp, is_primary: false, has_whatsapp: true },
      ];
    const seen = new Set();
    const normalized = [];
    list.forEach((item) => {
      const number = normalizePhone(item?.number || item?.phone_number || item || "");
      if (!number || seen.has(number)) return;
      seen.add(number);
      normalized.push({
        number,
        is_primary: !!item?.is_primary,
        has_whatsapp: item?.has_whatsapp !== false,
      });
    });
    if (normalized.length && !normalized.some((item) => item.is_primary)) normalized[0].is_primary = true;
    return normalized;
  }

  function derivePhoneAliases(phones) {
    const primary = phones.find((item) => item.is_primary) || phones[0] || {};
    const whatsapp = phones.find((item) => item.is_primary && item.has_whatsapp) || phones.find((item) => item.has_whatsapp) || primary;
    return {
      phone: primary.number || "",
      primary_phone: primary.number || "",
      whatsapp_phone: whatsapp.number || "",
      business_whatsapp: whatsapp.number || "",
      phone_link: primary.number ? `tel:${primary.number}` : "",
    };
  }

  async function listContactsByUserKeys(userKeys) {
    const keys = Array.isArray(userKeys) ? userKeys.filter(Boolean) : [];
    const map = new Map(keys.map((key) => [key, []]));
    const rows = await findByFieldIn("user_contacts", "user_key", keys);
    rows
      .sort((a, b) => Number(b.is_primary || 0) - Number(a.is_primary || 0))
      .forEach((row) => {
        if (!map.has(row.user_key)) map.set(row.user_key, []);
        map.get(row.user_key).push({
          number: row.phone_number,
          is_primary: !!row.is_primary,
          has_whatsapp: !!row.has_whatsapp,
        });
      });
    return map;
  }

  async function listTokensByUserKeys(userKeys) {
    const keys = Array.isArray(userKeys) ? userKeys.filter(Boolean) : [];
    const map = new Map(keys.map((key) => [key, []]));
    const rows = await findByFieldIn("user_tokens", "user_key", keys);
    rows.forEach((row) => {
      if (!map.has(row.user_key)) map.set(row.user_key, []);
      map.get(row.user_key).push(row);
    });
    return map;
  }

  async function listRatingsByUserKeys(userKeys) {
    const keys = Array.isArray(userKeys) ? userKeys.filter(Boolean) : [];
    const map = new Map(keys.map((key) => [key, []]));
    const rows = await findByFieldIn("merchant_ratings_v2", "merchant_user_key", keys);
    rows
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .forEach((row) => {
        if (!map.has(row.merchant_user_key)) map.set(row.merchant_user_key, []);
        map.get(row.merchant_user_key).push({
          rating_id: row.id || row._firestore_id,
          rater_id: row.actor_user_key,
          rater_name: row.actor_name,
          rating: row.rating,
          note: row.note || "",
          date: row.created_at,
          edited_at: row.updated_at !== row.created_at ? row.updated_at : undefined,
        });
      });
    return map;
  }

  function normalizeUserDoc(row = {}) {
    return {
      ...row,
      user_key: row.user_key || row._firestore_id,
      settings: typeof row.settings === "string" ? row.settings : JSON.stringify(row.settings || {}),
      business_category: typeof row.business_category === "string" ? row.business_category : JSON.stringify(row.business_category || {}),
      user_image: typeof row.user_image === "string" ? row.user_image : JSON.stringify(row.user_image || null),
      featured_items_data: typeof row.featured_items_data === "string" ? row.featured_items_data : JSON.stringify(row.featured_items_data || null),
      links: typeof row.links === "string" ? row.links : JSON.stringify(row.links || {}),
      account_type: normalizeAccountTypeValue(row.account_type),
    };
  }

  async function hydrateUsers(rows, options = {}) {
    const normalized = rows.filter(Boolean).map(normalizeUserDoc);
    if (options.compact) {
      return normalized.map((row) => ({
        user_key: row.user_key,
        username: row.username,
        user_image: row.user_image,
        featured_items_data: row.featured_items_data,
      }));
    }
    const keys = normalized.map((row) => row.user_key).filter(Boolean);
    const [contactsMap, tokensMap, ratingsMap] = await Promise.all([
      listContactsByUserKeys(keys),
      listTokensByUserKeys(keys),
      listRatingsByUserKeys(keys),
    ]);
    return normalized.map((row) => {
      const phones = contactsMap.get(row.user_key) || [];
      const aliases = derivePhoneAliases(phones);
      const token = (tokensMap.get(row.user_key) || [])[0] || {};
      const hydrated = {
        ...row,
        phones,
        phone: aliases.phone || row.phone || "",
        business_whatsapp: aliases.business_whatsapp || row.business_whatsapp || "",
        primary_phone: aliases.primary_phone || "",
        whatsapp_phone: aliases.whatsapp_phone || "",
        phone_link: aliases.phone_link || "",
        fcm_token: token.fcm_token || row.fcm_token || null,
        platform: token.platform || row.platform || null,
        ratings: ratingsMap.get(row.user_key) || [],
      };
      return global.UserService?.normalizeUser ? global.UserService.normalizeUser(hydrated) : hydrated;
    });
  }

  async function replaceContacts(userKey, phones) {
    await deleteByField("user_contacts", "user_key", userKey);
    const timestamp = nowIso();
    await Promise.all((phones || []).map((phone) => {
      const id = randomId("contact");
      return setDoc("user_contacts", id, {
        id,
        user_key: userKey,
        phone_number: phone.number,
        contact_type: "phone",
        is_primary: phone.is_primary ? 1 : 0,
        has_whatsapp: phone.has_whatsapp ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }));
  }

  function buildSpecialtyEntries(user) {
    const map = safeParseJson(user.business_category, {});
    const entries = [];
    Object.entries(map || {}).forEach(([mainId, subIds]) => {
      if (Array.isArray(subIds) && subIds.length) {
        subIds.forEach((subId) => entries.push({ mainId: String(mainId), subId: String(subId) }));
      } else if (subIds) {
        entries.push({ mainId: String(mainId), subId: String(subIds) });
      }
    });
    return entries;
  }

  async function syncSpecialtyState(user, source) {
    const userKey = String(user?.user_key || "").trim();
    if (!userKey) return;
    const timestamp = nowIso();
    const entries = buildSpecialtyEntries(user);
    await deleteByField("user_specialties", "user_key", userKey);
    await Promise.all(entries.map((entry) => {
      const id = `${userKey}_${entry.mainId}_${entry.subId || "root"}`.replace(/[^\w-]+/g, "_");
      return setDoc("user_specialties", id, {
        id,
        user_key: userKey,
        main_category_id: entry.mainId,
        sub_category_id: entry.subId || null,
        source: source || "browser",
        created_at: timestamp,
        updated_at: timestamp,
      });
    }));
    const accountType = normalizeAccountTypeValue(user.account_type);
    await setDoc("user_capabilities", userKey, {
      user_key: userKey,
      account_type: accountType,
      primary_main_category_id: entries[0]?.mainId || null,
      has_business_specialties: entries.length ? 1 : 0,
      has_sellable_specialties: entries.length ? 1 : 0,
      can_deliver: 0,
      normalized_business_category: JSON.stringify(safeParseJson(user.business_category, {})),
      specialty_profile_json: JSON.stringify({ entries, accountType }),
      updated_at: timestamp,
    });
  }

  function userMatchesSearch(user, searchTerm) {
    const term = String(searchTerm || "").trim().toLowerCase();
    if (!term) return true;
    return [user.username, user.business_name, user.business_bio, user.phone]
      .map((value) => String(value || "").toLowerCase())
      .join(" ")
      .includes(term);
  }

  function userMatchesSpecialty(user, options = {}) {
    const entries = buildSpecialtyEntries(user);
    if (options.sellerOnly && (normalizeAccountTypeValue(user.account_type) & 32) !== 32) return false;
    if (options.mainId && !entries.some((entry) => String(entry.mainId) === String(options.mainId))) return false;
    if (options.subId && !entries.some((entry) => String(entry.subId) === String(options.subId))) return false;
    return true;
  }

  async function listUsers(params = {}) {
    let rows = await listAllDocs("users", { orderBy: "updated_at desc", maxRows: 5000 });
    rows = rows.map(normalizeUserDoc);
    if (params.get("last_id")) rows = rows.filter((row) => Number(row.id || 0) > parseInt(params.get("last_id"), 10));
    if (params.get("role")) {
      const role = normalizeAccountTypeValue(parseInt(params.get("role"), 10));
      rows = rows.filter((row) => (normalizeAccountTypeValue(row.account_type) & role) === role);
    }
    const searchTerm = params.get("searchTerm");
    if (searchTerm) rows = rows.filter((row) => userMatchesSearch(row, searchTerm));
    const mode = params.get("mode");
    if (mode === "category_search" || params.get("main_id") || params.get("sub_id")) {
      rows = rows.filter((row) => userMatchesSpecialty(row, {
        sellerOnly: mode === "category_search",
        mainId: params.get("main_id"),
        subId: params.get("sub_id"),
      }));
    }
    if (mode === "delivery_users") {
      rows = rows.filter((row) => (normalizeAccountTypeValue(row.account_type) & 32) === 32);
    }
    rows.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")) || Number(b.id || 0) - Number(a.id || 0));
    const offset = parseInt(params.get("offset") || "0", 10) || 0;
    const limit = Math.min(parseInt(params.get("limit") || "100", 10) || 100, 500);
    return hydrateUsers(rows.slice(offset, offset + limit));
  }

  async function handleUsers(endpoint, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const url = new URL(endpoint, global.location.origin);
    const params = url.searchParams;

    if (method === "GET") {
      if (params.get("mode") === "max_id") {
        const rows = await listAllDocs("users", { maxRows: 5000 });
        return { max_id: rows.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0) };
      }
      if (params.get("user_keys")) {
        const rows = await Promise.all(params.get("user_keys").split(",").filter(Boolean).map((key) => getDoc("users", key.trim())));
        return hydrateUsers(rows, { compact: true });
      }
      if (params.get("user_key")) {
        const rows = await hydrateUsers([await getDoc("users", params.get("user_key"))]);
        if (!rows[0]) return { error: "المستخدم غير موجود.", code: "USER_NOT_FOUND" };
        return rows[0];
      }
      if (params.get("phone")) {
        const phone = normalizePhone(params.get("phone"));
        const rows = await findByField("users", "phone", phone, { limit: 1 });
        if (!rows[0]) return params.get("exists") ? { exists: false } : { error: "المستخدم غير موجود.", code: "USER_NOT_FOUND" };
        if (params.get("exists")) return { exists: true };
        return (await hydrateUsers([rows[0]]))[0];
      }
      return listUsers(params);
    }

    const payload = options.body && typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
    if (method === "POST") {
      if (payload.action === "verify") {
        const phone = normalizePhone(payload.phone);
        const rows = await findByField("users", "phone", phone, { limit: 1 });
        const user = rows[0];
        if (!user || String(user.Password || "") !== String(payload.password || "")) {
          return { error: "كلمة المرور أو رقم الهاتف غير صحيح.", code: "INVALID_CREDENTIALS" };
        }
        const timestamp = nowIso();
        await setDoc("users", user.user_key || user._firestore_id, { ...user, last_login_at: timestamp, updated_at: timestamp });
        return (await hydrateUsers([{ ...user, last_login_at: timestamp, updated_at: timestamp }]))[0];
      }
      if (payload.action === "touch_login") {
        if (!payload.user_key || payload.user_key === "guest_user") return { success: false, skipped: true };
        const current = await getDoc("users", payload.user_key);
        const timestamp = nowIso();
        if (current) await setDoc("users", payload.user_key, { ...current, last_login_at: timestamp, updated_at: timestamp });
        return { success: true, last_login_at: timestamp };
      }
      const phones = normalizePhonesPayload(payload.phones, payload);
      const aliases = derivePhoneAliases(phones);
      const existing = aliases.phone ? await findByField("users", "phone", aliases.phone, { limit: 1 }) : [];
      if (existing[0]) return { error: "رقم الهاتف هذا مسجل بالفعل.", code: "PHONE_ALREADY_EXISTS" };
      const timestamp = nowIso();
      const userKey = payload.user_key || randomId("user");
      const user = {
        ...payload,
        id: payload.id || Date.now(),
        user_key: userKey,
        phone: aliases.phone,
        business_whatsapp: aliases.business_whatsapp || null,
        account_type: normalizeAccountTypeValue(payload.account_type),
        settings: typeof payload.settings === "string" ? payload.settings : JSON.stringify(payload.settings || {}),
        created_at: timestamp,
        updated_at: timestamp,
        last_login_at: timestamp,
      };
      await setDoc("users", userKey, user);
      await replaceContacts(userKey, phones);
      await syncSpecialtyState(user, "browser_create");
      return (await hydrateUsers([await getDoc("users", userKey)]))[0];
    }

    if (method === "PUT") {
      const items = Array.isArray(payload) ? payload : [payload];
      const updated = [];
      for (const item of items) {
        const userKey = item.user_key || "";
        if (!userKey) continue;
        const current = await getDoc("users", userKey);
        if (!current) continue;
        const updates = { ...current, ...item, updated_at: nowIso() };
        if (item.account_type !== undefined) updates.account_type = normalizeAccountTypeValue(item.account_type);
        if (item.password !== undefined) {
          updates.Password = item.password;
          delete updates.password;
        }
        if (item.phones !== undefined || item.phone !== undefined || item.business_whatsapp !== undefined) {
          const phones = normalizePhonesPayload(item.phones, {
            phone: item.phone !== undefined ? item.phone : current.phone,
            business_whatsapp: item.business_whatsapp !== undefined ? item.business_whatsapp : current.business_whatsapp,
          });
          const aliases = derivePhoneAliases(phones);
          updates.phone = aliases.phone;
          updates.business_whatsapp = aliases.business_whatsapp || null;
          await replaceContacts(userKey, phones);
        }
        await setDoc("users", userKey, updates);
        await syncSpecialtyState(updates, "browser_update");
        updated.push((await hydrateUsers([await getDoc("users", userKey)]))[0]);
      }
      return Array.isArray(payload) ? updated : updated[0];
    }

    if (method === "DELETE") {
      const userKey = payload.user_key || params.get("user_key");
      if (!userKey) return { error: "مفتاح المستخدم مطلوب للحذف.", code: "USER_KEY_REQUIRED" };
      await Promise.all([
        deleteByField("user_contacts", "user_key", userKey),
        deleteByField("user_tokens", "user_key", userKey),
        deleteDoc("user_capabilities", userKey),
        deleteByField("user_specialties", "user_key", userKey),
        deleteByField("merchant_ratings_v2", "merchant_user_key", userKey),
        deleteByField("merchant_ratings_v2", "actor_user_key", userKey),
        deleteDoc("users", userKey),
      ]);
      return { success: true, deleted: true, user_key: userKey };
    }

    return { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" };
  }

  async function handleTokens(endpoint, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const url = new URL(endpoint, global.location.origin);
    const params = url.searchParams;
    if (method === "GET") {
      const keys = (params.get("userKeys") || params.get("user_keys") || "").split(",").filter(Boolean);
      const rows = keys.length ? await findByFieldIn("user_tokens", "user_key", keys) : await listAllDocs("user_tokens");
      return rows;
    }
    const payload = options.body && typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
    if (method === "POST" || method === "PUT") {
      const userKey = payload.user_key || payload.userKey;
      const token = payload.fcm_token || payload.fcmToken || payload.token;
      if (!userKey || !token) return { error: "USER_KEY_AND_TOKEN_REQUIRED", code: "VALIDATION_ERROR" };
      const existing = await Promise.all([
        findByField("user_tokens", "user_key", userKey),
        findByField("user_tokens", "fcm_token", token),
      ]);
      const ids = new Set(existing.flat().map((row) => row._firestore_id || row.id).filter(Boolean));
      await Promise.all(Array.from(ids).map((id) => deleteDoc("user_tokens", id)));
      const id = randomId("token");
      await setDoc("user_tokens", id, {
        id,
        user_key: userKey,
        fcm_token: token,
        platform: payload.platform || "web",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      return { success: true, id };
    }
    if (method === "DELETE") {
      const userKey = payload.user_key || payload.userKey || params.get("user_key");
      const token = payload.fcm_token || payload.fcmToken || payload.token || params.get("token");
      let deleted = 0;
      if (userKey) deleted += await deleteByField("user_tokens", "user_key", userKey);
      if (token) deleted += await deleteByField("user_tokens", "fcm_token", token);
      return { success: true, deleted };
    }
    return { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" };
  }

  async function handleApiFetch(endpoint, options = {}) {
    try {
      const path = new URL(endpoint, global.location.origin).pathname;
      if (path === "/api/users") return handleUsers(endpoint, options);
      if (path === "/api/tokens") return handleTokens(endpoint, options);
      return null;
    } catch (error) {
      console.error("[FirestoreIdentityApi] Request failed:", error);
      return { error: error.message || "Firestore identity request failed" };
    }
  }

  global.FirestoreIdentityApi = {
    handleApiFetch,
    getDoc,
    setDoc,
    deleteDoc,
    findByField,
    findByFieldIn,
    listAllDocs,
    hydrateUsers,
  };
})(window);
