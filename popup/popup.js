import { communicator, MessageType } from '../common/messaging.js';
import { store } from './store.js';

async function fetchArtists() {
  try {
    console.log('Sending GET_ARTISTS request from popup...');
    store.setState({ isLoading: true });
    // The service worker will decide whether to use mocks based on chrome.storage
    const response = await communicator.get(MessageType.GET_ARTISTS);
    console.log('Response from service worker:', response);

    if (response.status === 'success') {
      store.setState({ artists: response.data, isLoading: false });
    } else {
      store.setState({ isLoading: false });
    }
  } catch (error) {
    console.error('Error communicating with service worker:', error);
    store.setState({ isLoading: false });
  }
}

async function initializeMockToggle() {
  const toggle = document.getElementById('mock-toggle');

  // Get the initial value from storage, default to true
  const { useMocks = true } = await chrome.storage.local.get('useMocks');
  toggle.checked = useMocks;

  toggle.addEventListener('change', async (event) => {
    const newUseMocks = event.target.checked;
    await chrome.storage.local.set({ useMocks: newUseMocks });
    // Refetch artists with the new setting
    await fetchArtists();
  });
}

async function main() {
  await initializeMockToggle();
  await fetchArtists();
}

main();

