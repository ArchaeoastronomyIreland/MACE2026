// =================================================================
// CHUNKING CODE BACKUP - Extracted from intervisibility.js
// This code was removed to restore the working version
// Use this as reference when reimplementing chunking
// =================================================================

// CHUNKED PROCESSING WITH TEMP FILES (Memory Management)
// =================================================================
const CHUNK_SIZE = 30; // Process 30 sites at a time
let chunkedStorageHandle = null; // File System Access API directory handle
let chunkedStorageType = null; // 'fsa', 'downloads', or 'indexeddb'
let chunkedStorageSessionId = null; // Unique session ID for this calculation run

// Storage abstraction layer - tries File System Access API first, falls back to Downloads folder
async function initializeChunkedStorage() {
    chunkedStorageSessionId = `mace_iv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Try File System Access API first (Chrome/Edge only) - preferred because it allows loading chunks back
    if (window.showDirectoryPicker) {
        try {
            chunkedStorageHandle = await window.showDirectoryPicker();
            chunkedStorageType = 'fsa';
            return { success: true, type: 'fsa', canLoad: true };
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled - fall through to downloads
            } else {
                console.warn('File System Access API failed:', error);
                console.log('Falling back to Downloads folder');
            }
        }
    }
    
    // Fallback to Downloads folder (standard browser behavior)
    chunkedStorageType = 'downloads';
    return { success: true, type: 'downloads', canLoad: false };
}

// Save chunk data to temp file
async function saveChunkData(chunkIndex, dataType, data) {
    // dataType: 'profiles' or 'pairs'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `mace_intervisibility_chunk_${String(chunkIndex).padStart(3, '0')}_${dataType}_${timestamp}.json`;
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    if (chunkedStorageType === 'fsa' && chunkedStorageHandle) {
        try {
            const fileHandle = await chunkedStorageHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return { success: true, fileName: fileName };
        } catch (error) {
            console.error('Error saving to File System Access API:', error);
            // Fall through to downloads
        }
    }
    
    // Downloads folder fallback
    if (chunkedStorageType === 'downloads') {
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
            return { success: true, fileName: fileName };
        } catch (error) {
            console.error('Error downloading chunk file:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'No storage method available' };
}

// Load chunk data from temp file (only works with File System Access API)
async function loadChunkData(chunkIndex, dataType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_*';
    const fileNamePattern = `mace_intervisibility_chunk_${String(chunkIndex).padStart(3, '0')}_${dataType}_`;
    
    if (chunkedStorageType === 'fsa' && chunkedStorageHandle) {
        try {
            // Try to find matching file in directory
            const files = [];
            for await (const [name, handle] of chunkedStorageHandle.entries()) {
                if (handle.kind === 'file' && name.startsWith(fileNamePattern) && name.endsWith('.json')) {
                    files.push({ name, handle });
                }
            }
            
            if (files.length > 0) {
                // Use most recent file
                files.sort((a, b) => b.name.localeCompare(a.name));
                const fileHandle = files[0].handle;
                const file = await fileHandle.getFile();
                const text = await file.text();
                const data = JSON.parse(text);
                return { success: true, data: data };
            }
        } catch (error) {
            console.error('Error loading from File System Access API:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'Cannot load from downloads folder - files must be loaded manually' };
}

// Clean up temp files (only works with File System Access API)
async function cleanupChunkFiles() {
    if (chunkedStorageType === 'fsa' && chunkedStorageHandle) {
        try {
            let deletedCount = 0;
            for await (const [name, handle] of chunkedStorageHandle.entries()) {
                if (handle.kind === 'file' && name.startsWith('mace_intervisibility_chunk_') && name.endsWith('.json')) {
                    try {
                        await chunkedStorageHandle.removeEntry(name);
                        deletedCount++;
                    } catch (e) {
                        console.warn(`Could not delete ${name}:`, e);
                    }
                }
            }
            return { success: true, deletedCount: deletedCount };
        } catch (error) {
            console.error('Error cleaning up chunk files:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: true, message: 'Files in downloads folder must be manually deleted' };
}

// =================================================================
// INTEGRATION POINTS IN createIntervisibilityMatrix:
// =================================================================
//
// 1. Add chunking variables at top of function:
//    const useChunking = intervisibilityMarkers.length > CHUNK_SIZE && storageInit.success;
//    const canLoadChunks = storageInit.success && storageInit.canLoad === true;
//
// 2. Initialize chunked storage:
//    const storageInit = await initializeChunkedStorage();
//
// 3. In Phase 1 (profile calculation), add chunking logic to process in chunks
//    and save profiles to temp files
//
// 4. In Phase 2 (pair checking), add logic to load chunks and check pairs
//    incrementally
//
// See INTERVISIBILITY_MEMORY_EVALUATION.md for full design details

