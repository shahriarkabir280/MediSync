/**
 * dashboardCache.js — Generic IndexedDB cache for dashboard data
 * 
 * Used for AppointmentTab and PatientTab to provide "super fast" loading.
 */

const DB_NAME = 'CareConnectDashboard';
const DB_VERSION = 1;
const DASHBOARD_STORE = 'dashboard_data';

let db = null;

const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.warn('[DashboardCache] IndexedDB not available');
            resolve(null);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(DASHBOARD_STORE)) {
                database.createObjectStore(DASHBOARD_STORE, { keyPath: 'key' });
            }
        };
    });
};

const runTransaction = async (mode, callback) => {
    const database = await initDB();
    if (!database) return null;

    return new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(DASHBOARD_STORE, mode);
            const store = tx.objectStore(DASHBOARD_STORE);
            const result = callback(store);

            if (result && typeof result.onsuccess !== 'undefined') {
                result.onsuccess = () => resolve(result.result);
                result.onerror = () => reject(result.error);
            } else {
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error);
            }
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Save data to cache
 * @param {string} key - Unique key for the data (e.g. 'appointments_123')
 * @param {any} data - The data to cache
 */
export const saveData = async (key, data) => {
    try {
        await runTransaction('readwrite', (store) => {
            return store.put({
                key,
                data,
                cachedAt: Date.now()
            });
        });
    } catch (err) {
        console.warn(`[DashboardCache] Failed to save ${key}:`, err);
    }
};

/**
 * Get data from cache
 * @param {string} key 
 * @returns {any|null}
 */
export const getCachedData = async (key) => {
    try {
        const result = await runTransaction('readonly', (store) => {
            return store.get(key);
        });
        return result ? result.data : null;
    } catch (err) {
        console.warn(`[DashboardCache] Failed to get ${key}:`, err);
        return null;
    }
};

export const clearCache = async () => {
    try {
        await runTransaction('readwrite', (store) => store.clear());
    } catch (err) {
        console.warn('[DashboardCache] Failed to clear cache:', err);
    }
};
