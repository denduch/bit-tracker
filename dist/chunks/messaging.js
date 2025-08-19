class Communicator {
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
  on(type, handler) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === type) {
        Promise.resolve(handler(message.payload, sender)).then(sendResponse);
        return true;
      }
      return true;
    });
  }
}
const communicator = new Communicator();
const MessageType = {
  GET_ARTISTS: "GET_ARTISTS"
};
export {
  MessageType as M,
  communicator as c
};
