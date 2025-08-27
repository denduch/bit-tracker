import { communicator, MessageType } from '../common/messaging.js';
import { store } from './store.js';
import { storageManager } from '../common/storage.js';


async function initializeMockToggle() {
  const toggle = document.getElementById('mock-toggle');

  const useMocks = await storageManager.get('useMocks', true);
  toggle.checked = useMocks;

  toggle.addEventListener('change', async (event) => {
    const newUseMocks = event.target.checked;
    await storageManager.set('useMocks', newUseMocks);
  });
}

function initialize() {
  initializeMockToggle();
}

initialize();
