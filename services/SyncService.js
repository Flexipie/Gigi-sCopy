/**
 * Sync Service - Cross-Device Clip Synchronization
 * Syncs clips between local Chrome storage and backend server
 */

import { getClips, setClips } from '../storage.js';
import { CONFIG } from '../constants.js';

// Backend URL - change this to your Azure URL when deployed
// const BACKEND_URL = 'http://localhost:3000'; // For local testing
const BACKEND_URL = 'http://gigis-backend-felix.eastus.azurecontainer.io:3000'; // Azure deployment
const SYNC_ENDPOINT = `${BACKEND_URL}/api/clips`;

// Generate or retrieve device ID
async function getDeviceId() {
  const result = await chrome.storage.local.get('deviceId');
  let deviceId = result.deviceId;
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await chrome.storage.local.set({ deviceId });
  }
  return deviceId;
}

export class SyncService {
  /**
   * Sync clips with backend
   * Strategy: Two-way sync with last-write-wins conflict resolution
   */
  static async syncClips() {
    try {
      console.log('🔄 Starting clip sync...');
      
      // Check if backend is reachable (with timeout)
      const backendReachable = await this.checkBackend();
      if (!backendReachable) {
        console.warn('⚠️ Backend unreachable, skipping sync');
        return { success: false, error: 'Backend unreachable' };
      }
      
      const deviceId = await getDeviceId();
      const localClips = await getClips();
      
      // Get last sync timestamp
      const syncData = await chrome.storage.local.get('lastSyncTime');
      const lastSync = parseInt(syncData.lastSyncTime || '0');
      console.log(`Last sync: ${lastSync ? new Date(lastSync).toISOString() : 'never'}`);
      
      // 1. Upload local clips that haven't been synced
      const unsyncedLocal = localClips.filter(clip => 
        !clip.syncedAt || clip.syncedAt < (clip.updatedAt || clip.createdAt)
      );
      
      if (unsyncedLocal.length > 0) {
        console.log(`📤 Uploading ${unsyncedLocal.length} local clips...`);
        await this.uploadClips(unsyncedLocal, deviceId);
      }
      
      // 2. Download clips from backend that are newer than last sync
      console.log('📥 Downloading remote clips...');
      const remoteClips = await this.downloadClips(lastSync);
      
      if (remoteClips.length > 0) {
        console.log(`📥 Received ${remoteClips.length} clips from server`);
        
        // 3. Merge remote clips with local clips
        const mergedClips = this.mergeClips(localClips, remoteClips);
        
        // 4. Save merged clips back to storage
        await setClips(mergedClips);
        console.log(`✅ Sync complete: ${mergedClips.length} total clips`);
      } else {
        console.log('✅ No new clips from server');
      }
      
      // Update last sync timestamp
      await chrome.storage.local.set({ lastSyncTime: Date.now().toString() });
      
      return {
        success: true,
        uploaded: unsyncedLocal.length,
        downloaded: remoteClips.length
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Upload clips to backend
   */
  static async uploadClips(clips, deviceId) {
    // Add device ID to all clips
    const clipsWithDevice = clips.map(clip => ({
      ...clip,
      deviceId
    }));
    
    // Use batch endpoint for efficiency
    const response = await fetch(`${SYNC_ENDPOINT}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clips: clipsWithDevice })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✓ Uploaded ${result.saved} clips`);
    
    // Mark clips as synced locally
    const now = Date.now();
    clips.forEach(clip => {
      clip.syncedAt = now;
    });
    
    return result;
  }
  
  /**
   * Download clips from backend
   */
  static async downloadClips(since = 0) {
    const url = since > 0 
      ? `${SYNC_ENDPOINT}?since=${since}`
      : SYNC_ENDPOINT;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.clips || [];
  }
  
  /**
   * Merge local and remote clips
   * Strategy: Last-write-wins based on createdAt/updatedAt
   */
  static mergeClips(localClips, remoteClips) {
    const clipMap = new Map();
    
    // Add all local clips to map
    localClips.forEach(clip => {
      clipMap.set(clip.id, clip);
    });
    
    // Merge remote clips (overwrites if remote is newer)
    remoteClips.forEach(remote => {
      const local = clipMap.get(remote.id);
      
      if (!local) {
        // New clip from remote
        clipMap.set(remote.id, remote);
      } else {
        // Conflict: decide which version to keep
        const localTime = local.updatedAt || local.createdAt;
        const remoteTime = remote.updatedAt || remote.createdAt;
        
        if (remoteTime > localTime) {
          // Remote is newer, use remote version
          clipMap.set(remote.id, remote);
        }
        // else: local is newer or same, keep local
      }
    });
    
    // Convert map back to array, sorted by createdAt
    return Array.from(clipMap.values())
      .filter(clip => !clip.deleted)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  /**
   * Delete a clip (both locally and on backend)
   */
  static async deleteClip(clipId) {
    try {
      // Delete locally first
      const clips = await getClips();
      const filtered = clips.filter(c => c.id !== clipId);
      await setClips(filtered);
      
      // Delete from backend
      const response = await fetch(`${SYNC_ENDPOINT}/${clipId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        console.warn('Failed to delete from backend:', response.statusText);
      }
      
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }
  
  /**
   * Force full sync (download all clips from backend)
   */
  static async forceFullSync() {
    try {
      console.log('🔄 Force full sync...');
      
      // Download all clips
      const remoteClips = await this.downloadClips(0);
      
      // Replace local clips with remote
      await setClips(remoteClips);
      
      await chrome.storage.local.set({ lastSyncTime: Date.now().toString() });
      
      console.log(`✅ Full sync complete: ${remoteClips.length} clips`);
      return true;
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return false;
    }
  }
  
  /**
   * Check if backend is reachable (with short timeout)
   */
  static async checkBackend() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Backend check failed:', error.message);
      return false;
    }
  }
  
  /**
   * Get sync status
   */
  static async getSyncStatus() {
    const syncData = await chrome.storage.local.get('lastSyncTime');
    const lastSync = parseInt(syncData.lastSyncTime || '0');
    const deviceId = await getDeviceId();
    
    return {
      lastSync: lastSync || null,
      lastSyncDate: lastSync ? new Date(lastSync).toISOString() : null,
      deviceId,
      backendUrl: BACKEND_URL
    };
  }
}

export default SyncService;
