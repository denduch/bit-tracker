import { ApiResponse } from './types';

class Communicator {
  get<T>(type: string, payload?: any): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, payload }, (response: ApiResponse<T>) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(response);
      });
    });
  }

  on<T>(
    type: string,
    handler: (payload: any, sender: chrome.runtime.MessageSender) => Promise<ApiResponse<T>> | ApiResponse<T>
  ) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === type) {
        Promise.resolve(handler(message.payload, sender)).then(sendResponse);
        return true; // Indicates an asynchronous response.
      }
      return true; // Indicates an asynchronous response.
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
