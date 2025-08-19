class Communicator {
  /**
   * Sends a request and waits for a response.
   * @param {string} type - The type of the request, e.g., 'GET_ARTISTS'.
   * @param {any} [payload] - Additional data to send.
   * @returns {Promise<any>}
   */
  get(type, payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(response);
      });
    });
  }

  /**
   * Registers a handler function for a given request type.
   * @param {string} type - The type of the request to listen for.
   * @param {function(any, chrome.runtime.MessageSender): (Promise<any>|any)} handler
   */
  on(type, handler) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === type) {
        const result = handler(message.payload, sender);
        Promise.resolve(result).then(sendResponse);
        return true; // Indicates an asynchronous response.
      }
    });
  }
}

export const communicator = new Communicator();

/**
 * Message type definitions.
 * @enum {string}
 */
export const MessageType = {
  GET_ARTISTS: 'GET_ARTISTS',
};
