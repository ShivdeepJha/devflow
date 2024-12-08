interface StorageAPI {
  get: (keys: string[], callback: (result: any) => void) => void;
  set: (items: { [key: string]: any }, callback?: () => void) => void;
  isInitialized: () => boolean;
}

class LocalStorageAPI implements StorageAPI {
  private initialized = false;

  get(keys: string[], callback: (result: any) => void) {
    const result: { [key: string]: any } = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    });
    callback(result);
  }

  set(items: { [key: string]: any }, callback?: () => void) {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    this.initialized = true;
    if (callback) callback();
  }

  isInitialized() {
    return this.initialized || localStorage.getItem('initialized') === 'true';
  }
}

class ChromeStorageAPI implements StorageAPI {
  get(keys: string[], callback: (result: any) => void) {
    chrome.storage.local.get(keys, callback);
  }

  set(items: { [key: string]: any }, callback?: () => void) {
    chrome.storage.local.set(items, callback);
  }

  isInitialized() {
    return true; // Chrome storage is always initialized
  }
}

// Export a storage instance based on environment
export const storage: StorageAPI = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
  ? new ChromeStorageAPI()
  : new LocalStorageAPI();

// Helper functions for common operations
export const getFromStorage = (key: string): Promise<any> => {
  return new Promise((resolve) => {
    storage.get([key], (result) => {
      resolve(result[key]);
    });
  });
};

export const setInStorage = (key: string, value: any): Promise<void> => {
  return new Promise((resolve) => {
    storage.set({ [key]: value }, () => {
      if (storage instanceof LocalStorageAPI) {
        localStorage.setItem('initialized', 'true');
      }
      resolve();
    });
  });
};

export const isStorageInitialized = (): boolean => {
  return storage.isInitialized();
};
