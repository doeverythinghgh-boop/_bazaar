/**
 * @file js/api-client/db-clients.js
 * @description Direct REST Firestore clients for users, products, and externalSpecialty projects.
 * Runs purely browser-side using BazaarRuntimeConfig.
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

    function getProjectConfig(projectName) {
        const config = global.BazaarRuntimeConfig?.firebase?.projects?.[projectName];
        if (!config) {
            console.error(`[ApiClient DB] Missing firebase project config for: ${projectName}`);
            throw new Error(`MISSING_PROJECT_CONFIG_${projectName.toUpperCase()}`);
        }
        return config;
    }

    function encodeValue(value) {
        if (value === null || value === undefined) return { nullValue: null };
        if (typeof value === "boolean") return { booleanValue: value };
        if (Number.isInteger(value)) return { integerValue: String(value) };
        if (typeof value === "number") return { doubleValue: value };
        if (Array.isArray(value)) {
            return { arrayValue: { values: value.map(encodeValue) } };
        }
        if (typeof value === "object") {
            return {
                mapValue: {
                    fields: Object.fromEntries(
                        Object.entries(value).map(([key, item]) => [key, encodeValue(item)])
                    ),
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
            return Object.fromEntries(
                Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)])
            );
        }
        return null;
    }

    function encodeDocument(data) {
        return {
            fields: Object.fromEntries(
                Object.entries(data || {}).map(([key, value]) => [key, encodeValue(value)])
            ),
        };
    }

    function getDocumentId(name = "") {
        return String(name).split("/").pop();
    }

    function decodeDocument(document) {
        if (!document) return null;
        const data = Object.fromEntries(
            Object.entries(document.fields || {}).map(([key, value]) => [key, decodeValue(value)])
        );
        return {
            ...data,
            _firestore_id: getDocumentId(document.name),
        };
    }

    class FirestoreRestClient {
        constructor(projectName) {
            this.projectName = projectName;
            const { projectId, apiKey } = getProjectConfig(projectName);
            this.projectId = projectId;
            this.apiKey = apiKey;
            this.databaseId = "(default)";
            this.baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/${this.databaseId}/documents`;
        }

        withKey(url) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}key=${encodeURIComponent(this.apiKey)}`;
        }

        docUrl(collectionName, docId) {
            return `${this.baseUrl}/${encodeURIComponent(collectionName)}/${encodeURIComponent(String(docId))}`;
        }

        async firestoreFetch(url, options = {}) {
            const response = await fetch(this.withKey(url), {
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
                const message = payload?.error?.message || `Firestore request failed with status ${response.status}`;
                throw new Error(message);
            }

            return payload;
        }

        async getDoc(collectionName, docId) {
            if (!docId) return null;
            const doc = await this.firestoreFetch(this.docUrl(collectionName, docId));
            return decodeDocument(doc);
        }

        async setDoc(collectionName, docId, data, options = {}) {
            const method = "PATCH"; // PATCH acts as an upsert in Firestore REST
            const url = this.docUrl(collectionName, docId);
            const document = await this.firestoreFetch(url, {
                method,
                body: JSON.stringify(encodeDocument(data)),
            });
            return decodeDocument(document);
        }

        async deleteDoc(collectionName, docId) {
            if (!docId) return false;
            await this.firestoreFetch(this.docUrl(collectionName, docId), { method: "DELETE" });
            return true;
        }

        fieldFilter(fieldPath, op, value) {
            return {
                fieldFilter: {
                    field: { fieldPath },
                    op,
                    value: encodeValue(value),
                },
            };
        }

        fieldInFilter(fieldPath, values) {
            return this.fieldFilter(
                fieldPath,
                "IN",
                Array.isArray(values) ? values.filter((value) => value !== undefined && value !== null) : []
            );
        }

        async runQuery(collectionName, where, options = {}) {
            const structuredQuery = {
                from: [{ collectionId: collectionName }],
            };

            if (where) structuredQuery.where = where;
            if (options.orderBy) structuredQuery.orderBy = options.orderBy;
            if (options.limit) structuredQuery.limit = options.limit;
            if (options.offset) structuredQuery.offset = options.offset;

            const rows = await this.firestoreFetch(`${this.baseUrl}:runQuery`, {
                method: "POST",
                body: JSON.stringify({ structuredQuery }),
            });

            return (Array.isArray(rows) ? rows : [])
                .map((item) => decodeDocument(item.document))
                .filter(Boolean);
        }

        async listDocs(collectionName, options = {}) {
            const params = new URLSearchParams();
            params.set("pageSize", String(options.pageSize || 500));
            if (options.orderBy) params.set("orderBy", options.orderBy);
            if (options.pageToken) params.set("pageToken", options.pageToken);

            const payload = await this.firestoreFetch(`${this.baseUrl}/${encodeURIComponent(collectionName)}?${params.toString()}`);
            return {
                rows: (payload?.documents || []).map((doc) => decodeDocument(doc)).filter(Boolean),
                nextPageToken: payload?.nextPageToken || null,
            };
        }

        async listAllDocs(collectionName, options = {}) {
            const rows = [];
            let pageToken = null;
            do {
                const page = await this.listDocs(collectionName, { ...options, pageToken });
                rows.push(...page.rows);
                pageToken = page.nextPageToken;
            } while (pageToken && rows.length < (options.maxRows || 5000));
            return rows;
        }

        async findByField(collectionName, fieldPath, value, options = {}) {
            return this.runQuery(
                collectionName,
                this.fieldFilter(fieldPath, "EQUAL", value),
                options
            );
        }

        async findByFieldIn(collectionName, fieldPath, values, options = {}) {
            const uniqueValues = Array.from(new Set((Array.isArray(values) ? values : [])
                .map((value) => String(value || "").trim())
                .filter(Boolean)));
            if (!uniqueValues.length) return [];

            const batches = [];
            for (let index = 0; index < uniqueValues.length; index += 30) {
                batches.push(uniqueValues.slice(index, index + 30));
            }

            const rows = await Promise.all(
                batches.map((batch) => this.runQuery(
                    collectionName,
                    this.fieldInFilter(fieldPath, batch),
                    options
                ))
            );
            return rows.flat();
        }

        async deleteByField(collectionName, fieldPath, value) {
            const rows = await this.findByField(collectionName, fieldPath, value);
            await Promise.all(rows.map((row) => this.deleteDoc(collectionName, row._firestore_id || row.id)));
            return rows.length;
        }

        async deleteWhereAny(collectionName, predicates) {
            const found = new Map();
            for (const predicate of predicates) {
                if (predicate.value === undefined || predicate.value === null || predicate.value === "") continue;
                const rows = await this.findByField(collectionName, predicate.field, predicate.value);
                rows.forEach((row) => found.set(row._firestore_id || row.id, row));
            }
            await Promise.all(Array.from(found.keys()).map((docId) => this.deleteDoc(collectionName, docId)));
            return found.size;
        }
    }

    // Instantiation
    const usersClient = new FirestoreRestClient("users");
    const productsClient = new FirestoreRestClient("products");
    const externalClient = new FirestoreRestClient("externalSpecialty");

    global.ApiClientDb = {
        users: usersClient,
        products: productsClient,
        externalSpecialty: externalClient,
        encodeValue,
        decodeValue,
        encodeDocument,
        decodeDocument
    };

    console.log("[ApiClient DB] Clients initialized successfully for users, products, and externalSpecialty.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
