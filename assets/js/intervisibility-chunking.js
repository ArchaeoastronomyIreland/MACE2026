// =================================================================
// INTERVISIBILITY CHUNKING SUPPORT (Memory Management)
// Separate file to avoid breaking existing functionality
// Uses IndexedDB as primary storage (reliable, no user interaction required)
// =================================================================

(function() {
    'use strict';
    
    // Chunking constants and storage
    window.IV_CHUNK_SIZE = 30; // Process 30 sites at a time
    let chunkedStorageDB = null; // IndexedDB database handle
    let chunkedStorageType = null; // 'indexeddb', 'downloads', or null
    let chunkedStorageSessionId = null; // Unique session ID for this calculation run
    const DB_NAME = 'MACE_Intervisibility_Chunks';
    const DB_VERSION = 1;
    const STORE_NAME = 'chunkData';
    
    // Initialize IndexedDB
    function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                chunkedStorageDB = request.result;
                resolve(chunkedStorageDB);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    objectStore.createIndex('sessionId', 'sessionId', { unique: false });
                    objectStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
                    objectStore.createIndex('dataType', 'dataType', { unique: false });
                }
            };
        });
    }
    
    // Storage abstraction layer - uses IndexedDB as primary, Downloads as fallback
    window.IV_initializeChunkedStorage = async function() {
        chunkedStorageSessionId = `mace_iv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Try IndexedDB first (most reliable, no user interaction)
        if (typeof indexedDB !== 'undefined') {
            try {
                await initIndexedDB();
                chunkedStorageType = 'indexeddb';
                console.log('Using IndexedDB for chunked storage');
                return { success: true, type: 'indexeddb', canLoad: true, directoryName: 'Browser storage (IndexedDB)' };
            } catch (error) {
                console.warn('IndexedDB initialization failed:', error);
                // Fall through to Downloads
            }
        }
        
        // Fallback to Downloads folder (standard browser behavior)
        // Note: Downloads folder doesn't allow programmatic loading, so chunked processing
        // will save files but cannot load them back for pair checking
        chunkedStorageType = 'downloads';
        console.log('Using Downloads folder for chunked storage (IndexedDB not available)');
        return { success: true, type: 'downloads', canLoad: false, directoryName: 'Downloads folder' };
    };
    
    // Save chunk data to IndexedDB or Downloads
    window.IV_saveChunkData = async function(chunkIndex, dataType, data) {
        // dataType: 'profiles' or 'pairs'
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '');
        const fileName = `mace_intervisibility_chunk_${String(chunkIndex).padStart(3, '0')}_${dataType}_${timestamp}.json`;
        const key = `${chunkedStorageSessionId}_chunk_${String(chunkIndex).padStart(3, '0')}_${dataType}`;
        
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Try IndexedDB first
        if (chunkedStorageType === 'indexeddb' && chunkedStorageDB) {
            try {
                const storeData = {
                    key: key,
                    sessionId: chunkedStorageSessionId,
                    chunkIndex: chunkIndex,
                    dataType: dataType,
                    fileName: fileName,
                    timestamp: timestamp,
                    data: data, // Store JSON directly (IndexedDB can handle objects)
                    blob: blob  // Also store blob for consistency
                };
                
                return new Promise((resolve, reject) => {
                    const transaction = chunkedStorageDB.transaction([STORE_NAME], 'readwrite');
                    const objectStore = transaction.objectStore(STORE_NAME);
                    const request = objectStore.put(storeData);
                    
                    request.onsuccess = () => {
                        console.log(`Successfully saved chunk ${chunkIndex} ${dataType} to IndexedDB: ${key}`);
                        resolve({ success: true, fileName: fileName, storageType: 'indexeddb', key: key });
                    };
                    
                    request.onerror = () => {
                        console.error(`Error saving chunk ${chunkIndex} ${dataType} to IndexedDB:`, request.error);
                        // Try Downloads fallback
                        chunkedStorageType = 'downloads';
                        resolve(saveToDownloads());
                    };
                });
            } catch (error) {
                console.error(`Error saving chunk ${chunkIndex} ${dataType} to IndexedDB:`, error);
                // Fall back to Downloads
                chunkedStorageType = 'downloads';
            }
        }
        
        // Downloads folder fallback
        function saveToDownloads() {
            try {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log(`Chunk ${chunkIndex} ${dataType} saved to Downloads folder: ${fileName}`);
                return { success: true, fileName: fileName, storageType: 'downloads' };
            } catch (error) {
                console.error('Error downloading chunk file:', error);
                return { success: false, error: error.message };
            }
        }
        
        if (chunkedStorageType === 'downloads') {
            return saveToDownloads();
        }
        
        return { success: false, error: 'No storage method available' };
    };
    
    // Load chunk data from IndexedDB (only works with IndexedDB)
    window.IV_loadChunkData = async function(chunkIndex, dataType) {
        if (chunkedStorageType !== 'indexeddb' || !chunkedStorageDB) {
            return { success: false, error: 'IndexedDB not available for loading' };
        }
        
        const key = `${chunkedStorageSessionId}_chunk_${String(chunkIndex).padStart(3, '0')}_${dataType}`;
        
        return new Promise((resolve, reject) => {
            const transaction = chunkedStorageDB.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(key);
            
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`Successfully loaded chunk ${chunkIndex} ${dataType} from IndexedDB`);
                    resolve({ success: true, data: request.result.data });
                } else {
                    resolve({ success: false, error: 'Chunk data not found' });
                }
            };
            
            request.onerror = () => {
                console.error(`Error loading chunk ${chunkIndex} ${dataType} from IndexedDB:`, request.error);
                resolve({ success: false, error: request.error.message });
            };
        });
    };
    
    // Cleanup chunk files from IndexedDB (optional, for cleanup)
    window.IV_cleanupChunkFiles = async function() {
        if (chunkedStorageType !== 'indexeddb' || !chunkedStorageDB) {
            return { success: true, message: 'No IndexedDB cleanup needed' };
        }
        
        return new Promise((resolve, reject) => {
            const transaction = chunkedStorageDB.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('sessionId');
            const request = index.openCursor(IDBKeyRange.only(chunkedStorageSessionId));
            
            let deletedCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`Cleaned up ${deletedCount} chunk files from IndexedDB`);
                    resolve({ success: true, deletedCount: deletedCount });
                }
            };
            
            request.onerror = () => {
                console.error('Error cleaning up chunk files from IndexedDB:', request.error);
                resolve({ success: false, error: request.error.message });
            };
        });
    };
    
})();