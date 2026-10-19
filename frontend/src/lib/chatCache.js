/**
 * chatCache.js — Messenger-style IndexedDB cache for chat data
 *
 * Strategy:
 * 1. On load: show cached data INSTANTLY, then refresh from server in background
 * 2. On chat select: show cached messages INSTANTLY, then sync from server
 * 3. On offline: show cached data with offline indicator
 * 4. On reconnect: sync missed data silently
 */

const DB_NAME = 'MediSyncChat';
const DB_VERSION = 1;
const CHATS_STORE = 'chats';
const MESSAGES_STORE = 'messages';
const META_STORE = 'meta';

// Cache TTL: how long before we consider data "stale" (still show it, but refresh)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_MESSAGES_PER_CHAT = 100; // Keep last 100 messages per chat

let db = null;

/**
 * Initialize the IndexedDB database
 */
const initDB = () => {
    return new Promise((resolve) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.warn('[ChatCache] IndexedDB not available, caching disabled');
            resolve(null); // Gracefully degrade — don't crash the app
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Chats store — keyed by userId_userType
            if (!database.objectStoreNames.contains(CHATS_STORE)) {
                const chatsStore = database.createObjectStore(CHATS_STORE, { keyPath: 'cacheKey' });
                chatsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            // Messages store — keyed by chatId
            if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
                const messagesStore = database.createObjectStore(MESSAGES_STORE, { keyPath: 'chatId' });
                messagesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
            }

            // Meta store — for sync timestamps and other metadata
            if (!database.objectStoreNames.contains(META_STORE)) {
                database.createObjectStore(META_STORE, { keyPath: 'key' });
            }
        };
    });
};

/**
 * Generic helper to run an IndexedDB transaction
 */
const runTransaction = async (storeName, mode, callback) => {
    const database = await initDB();
    if (!database) return null; // Gracefully degrade if IndexedDB unavailable

    return new Promise((resolve, reject) => {
        try {
            const tx = database.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
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
 * Save chats list to cache
 */
export const saveChats = async (userId, userType, chats) => {
    try {
        const cacheKey = `${userId}_${userType}`;
        await runTransaction(CHATS_STORE, 'readwrite', (store) => {
            return store.put({
                cacheKey,
                chats,
                cachedAt: Date.now(),
                updatedAt: new Date().toISOString()
            });
        });
    } catch (err) {
        console.warn('[ChatCache] Failed to save chats:', err);
    }
};

/**
 * Get cached chats list
 * Returns { chats, cachedAt, isStale } or null if no cache
 */
export const getCachedChats = async (userId, userType) => {
    try {
        const cacheKey = `${userId}_${userType}`;
        const result = await runTransaction(CHATS_STORE, 'readonly', (store) => {
            return store.get(cacheKey);
        });

        if (!result) return null;

        const isStale = Date.now() - result.cachedAt > CACHE_TTL_MS;
        return {
            chats: result.chats || [],
            cachedAt: result.cachedAt,
            isStale
        };
    } catch (err) {
        console.warn('[ChatCache] Failed to get cached chats:', err);
        return null;
    }
};

/**
 * Save messages for a specific chat
 */
export const saveMessages = async (chatId, messages) => {
    try {
        // Only keep the most recent messages to avoid bloating storage
        const trimmed = messages.slice(-MAX_MESSAGES_PER_CHAT);
        await runTransaction(MESSAGES_STORE, 'readwrite', (store) => {
            return store.put({
                chatId,
                messages: trimmed,
                cachedAt: Date.now()
            });
        });
    } catch (err) {
        console.warn('[ChatCache] Failed to save messages:', err);
    }
};

/**
 * Get cached messages for a chat
 * Returns { messages, cachedAt, isStale } or null
 */
export const getCachedMessages = async (chatId) => {
    try {
        const result = await runTransaction(MESSAGES_STORE, 'readonly', (store) => {
            return store.get(chatId);
        });

        if (!result) return null;

        const isStale = Date.now() - result.cachedAt > CACHE_TTL_MS;
        return {
            messages: result.messages || [],
            cachedAt: result.cachedAt,
            isStale
        };
    } catch (err) {
        console.warn('[ChatCache] Failed to get cached messages:', err);
        return null;
    }
};

/**
 * Update a single message in the cache (for optimistic updates, edits, deletes)
 */
export const updateCachedMessage = async (chatId, messageId, updates) => {
    try {
        const cached = await getCachedMessages(chatId);
        if (!cached) return;

        const updatedMessages = cached.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
        );

        await saveMessages(chatId, updatedMessages);
    } catch (err) {
        console.warn('[ChatCache] Failed to update cached message:', err);
    }
};

/**
 * Append a new message to the cache (for optimistic sends)
 */
export const appendCachedMessage = async (chatId, message) => {
    try {
        const cached = await getCachedMessages(chatId);
        const existing = cached?.messages || [];

        // Avoid duplicates
        const isDuplicate = existing.some(m => m.id === message.id);
        if (!isDuplicate) {
            await saveMessages(chatId, [...existing, message]);
        }
    } catch (err) {
        console.warn('[ChatCache] Failed to append cached message:', err);
    }
};

/**
 * Update the chat list cache with a new/updated chat entry
 */
export const updateCachedChat = async (userId, userType, updatedChat) => {
    try {
        const cached = await getCachedChats(userId, userType);
        if (!cached) return;

        const exists = cached.chats.some(c => c.id === updatedChat.id);
        let updatedChats;

        if (exists) {
            updatedChats = cached.chats.map(c => c.id === updatedChat.id ? { ...c, ...updatedChat } : c);
        } else {
            updatedChats = [updatedChat, ...cached.chats];
        }

        // Sort by most recent
        updatedChats.sort((a, b) => {
            const timeA = new Date(a.last_message_at || a.created_at).getTime();
            const timeB = new Date(b.last_message_at || b.created_at).getTime();
            return timeB - timeA;
        });

        await saveChats(userId, userType, updatedChats);
    } catch (err) {
        console.warn('[ChatCache] Failed to update cached chat:', err);
    }
};

/**
 * Save last sync timestamp
 */
export const saveLastSync = async (key, timestamp) => {
    try {
        await runTransaction(META_STORE, 'readwrite', (store) => {
            return store.put({ key, timestamp });
        });
    } catch (err) {
        console.warn('[ChatCache] Failed to save last sync:', err);
    }
};

/**
 * Get last sync timestamp
 */
export const getLastSync = async (key) => {
    try {
        const result = await runTransaction(META_STORE, 'readonly', (store) => {
            return store.get(key);
        });
        return result?.timestamp || null;
    } catch (err) {
        console.warn('[ChatCache] Failed to get last sync:', err);
        return null;
    }
};

/**
 * Clear all cached data (for logout)
 */
export const clearAllCache = async () => {
    try {
        await runTransaction(CHATS_STORE, 'readwrite', (store) => store.clear());
        await runTransaction(MESSAGES_STORE, 'readwrite', (store) => store.clear());
        await runTransaction(META_STORE, 'readwrite', (store) => store.clear());
        console.log('[ChatCache] Cache cleared');
    } catch (err) {
        console.warn('[ChatCache] Failed to clear cache:', err);
    }
};

/**
 * Check if the browser supports IndexedDB
 */
export const isCacheAvailable = () => {
    return typeof indexedDB !== 'undefined';
};
