/**
 * Mock Chrome APIs for testing
 * Provides jest.fn() implementations of chrome.storage, chrome.runtime, etc.
 */

// Storage mock
const storageData = {};

export const chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
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
      }),
      
      set: jest.fn((items, callback) => {
        Object.assign(storageData, items);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      
      remove: jest.fn((keys, callback) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => delete storageData[key]);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      
      clear: jest.fn((callback) => {
        Object.keys(storageData).forEach(key => delete storageData[key]);
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      })
    },
    
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  
  runtime: {
    lastError: null,
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
    connectNative: jest.fn(),
    sendMessage: jest.fn()
  },
  
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  
  scripting: {
    executeScript: jest.fn()
  },
  
  action: {
    onClicked: {
      addListener: jest.fn()
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
