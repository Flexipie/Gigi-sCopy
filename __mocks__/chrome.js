/**
 * Mock Chrome APIs for testing
 * Simple implementations without jest.fn() - tests will spy on these as needed
 */

// Storage mock data
const storageData = {};

// Helper no-op function
const noop = () => {};

export const chrome = {
  storage: {
    local: {
      get(keys, callback) {
        if (typeof keys === 'function') {
          callback = keys;
          keys = null;
        }
        
        const result = {};
        if (keys === null || keys === undefined) {
          Object.assign(result, storageData);
        } else if (typeof keys === 'string') {
          if (keys in storageData) result[keys] = storageData[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (key in storageData) result[key] = storageData[key];
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = key in storageData ? storageData[key] : keys[key];
          });
        }
        
        if (callback) {
          setTimeout(() => callback(result), 0);
        }
        return Promise.resolve(result);
      },
      
      set(items, callback) {
        Object.assign(storageData, items);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      },
      
      remove(keys, callback) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => delete storageData[key]);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      },
      
      clear(callback) {
        Object.keys(storageData).forEach(key => delete storageData[key]);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }
    },
    
    onChanged: {
      addListener: noop,
      removeListener: noop
    }
  },
  
  runtime: {
    lastError: null,
    onInstalled: {
      addListener: noop
    },
    onStartup: {
      addListener: noop
    },
    getURL: (path) => `chrome-extension://mock-id/${path}`,
    connectNative: noop,
    sendMessage: noop
  },
  
  contextMenus: {
    create: noop,
    onClicked: {
      addListener: noop
    }
  },
  
  commands: {
    onCommand: {
      addListener: noop
    }
  },
  
  alarms: {
    create: noop,
    onAlarm: {
      addListener: noop
    }
  },
  
  tabs: {
    query: () => Promise.resolve([]),
    sendMessage: noop
  },
  
  scripting: {
    executeScript: () => Promise.resolve([])
  },
  
  action: {
    onClicked: {
      addListener: noop
    }
  }
};

// Helper to reset storage between tests
export function resetChromeStorage() {
  Object.keys(storageData).forEach(key => delete storageData[key]);
}

// Helper to set storage data for tests
export function setChromeStorage(data) {
  Object.assign(storageData, data);
}

// Helper to get current storage state
export function getChromeStorage() {
  return { ...storageData };
}

// Make chrome available globally for tests
global.chrome = chrome;

export default chrome;
