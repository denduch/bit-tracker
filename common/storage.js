/**
 * A singleton class to manage interactions with chrome.storage.local.
 * Provides a clean and consistent API for getting and setting data.
 */
class StorageManager {
  constructor() {
    if (StorageManager.instance) {
      return StorageManager.instance;
    }
    this.storage = chrome.storage.local;
    StorageManager.instance = this;
  }

  /**
   * Retrieves an item from storage, checking its age if maxAge is provided.
   * @param {string} key The key of the item to retrieve.
   * @param {*} [defaultValue=null] The default value to return if the key is not found or the data is stale.
   * @param {number|null} [maxAge=null] The maximum age of the data in seconds.
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null, maxAge = null) {
    try {
      const result = await this.storage.get(key);
      const storedItem = result[key];

      if (storedItem === undefined) {
        return defaultValue;
      }

      // If maxAge is provided, check if the data is stale
      if (maxAge !== null && storedItem.timestamp) {
        const age = (Date.now() - storedItem.timestamp) / 1000; // age in seconds
        if (age > maxAge) {
          console.log(`Cache for '${key}' is stale, ignoring.`);
          await this.storage.remove(key); // Clean up stale cache
          return defaultValue;
        }
      }

      return storedItem.value !== undefined ? storedItem.value : storedItem;
    } catch (error) {
      console.error(`Error getting item '${key}' from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Saves an item to storage, adding a timestamp if it's cacheable data.
   * @param {string} key The key of the item to save.
   * @param {*} value The value to save.
   * @param {boolean} [isCache=false] Whether to store the data with a timestamp.
   * @returns {Promise<void>}
   */
  async set(key, value, isCache = false) {
    try {
      let itemToStore = value;
      if (isCache) {
        itemToStore = {
          value,
          timestamp: Date.now(),
        };
      }
      await this.storage.set({ [key]: itemToStore });
    } catch (error) {
      console.error(`Error setting item '${key}' in storage:`, error);
    }
  }

  /**
   * Retrieves all items from storage.
   * @returns {Promise<Object>}
   */
  async getAll() {
    try {
      return await this.storage.get(null);
    } catch (error) {
      console.error('Error getting all items from storage:', error);
      return {};
    }
  }

  /**
   * Saves multiple items to storage.
   * @param {Object} items An object with key-value pairs to store.
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      await this.storage.remove(key);
    } catch (error) {
      console.error(`Error removing item '${key}' from storage:`, error);
    }
  }

  async setAll(items) {
    try {
      await this.storage.set(items);
    } catch (error) {
      console.error('Error setting all items in storage:', error);
    }
  }

  /**
   * Clears all items from storage.
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageManager = new StorageManager();
