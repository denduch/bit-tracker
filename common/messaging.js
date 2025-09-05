class Communicator {

  /**
   * Registers a handler function for a given request type.
   * @param {string} type - The type of the request to listen for.
   * @param {function(any, chrome.runtime.MessageSender): (Promise<any>|any)} handler
   */
  on(type, handler) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("ON MESSAGE:", message);
      console.log("ON TYPE:", message.type, type);
      if (message.type === type) {
        // This listener is for events, so we don't send a response.
        handler(message.payload, sender);
      }
    });
  }

  /**
   * Broadcasts a message to all listeners without waiting for a response.
   * @param {string} type The message type.
   * @param {*} [payload] The message payload.
   */
  async broadcast(type, payload) {
    const message = { type, payload };
    console.log(`Broadcasting message: ${type}`, payload);
    // Send to the service worker
    chrome.runtime.sendMessage(message).catch(err => {
      if (err.message.includes('Could not establish connection')) {
        // Expected if only the service worker is active
      } else {
        console.error(`Error sending message to service worker: ${err.message}`);
      }
    });

    // Send to any open tabs with content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(err => {
          if (err.message.includes('Could not establish connection')) {
            // Expected if the content script is not injected or not listening
          } else {
            console.error(`Error sending message to tab ${tab.id}: ${err.message}`);
          }
        });
      });
    });
  }
}

export const communicator = new Communicator();

/**
 * Message type definitions.
 * @enum {string}
 */
export const MessageType = {
  // Event-driven
  REQUEST_ARTIST_FETCH: 'REQUEST_ARTIST_FETCH', // Popup -> SW
  REQUEST_EVENTS_FETCH: 'REQUEST_EVENTS_FETCH', // Popup -> SW
  REQUEST_RECOMMENDATIONS_FETCH: 'REQUEST_RECOMMENDATIONS_FETCH', // Popup -> SW
  SET_ARTIST_TRACKING_STATUS: 'SET_ARTIST_TRACKING_STATUS', // Popup -> SW
  REQUEST_CSRF_TOKEN_FETCH: 'REQUEST_CSRF_TOKEN_FETCH', // Popup -> SW
  DATA_UPDATED: 'DATA_UPDATED',           // SW -> Popup
  CSRF_TOKEN_UPDATED: 'CSRF_TOKEN_UPDATED', // SW -> Popup
  EVENTS_LOADING_PROGRESS: 'EVENTS_LOADING_PROGRESS', // SW -> Popup
  REDRAW: 'REDRAW', // SW -> Popup
};
