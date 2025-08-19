import { communicator, MessageType } from '../common/messaging';
import { store } from './store';
import './components/tab-view';
import './components/artists-view';
import './components/events-view';

// Define a basic Artist type for now
interface Artist {
  name: string;
  url: string;
  events: any[]; // Define a proper Event type later
}

async function fetchArtists() {
  try {
    console.log('Sending GET_ARTISTS request from popup...');
    store.setState({ isLoading: true });

    const response = await communicator.get<Artist[]>(MessageType.GET_ARTISTS);
    console.log('Response from service worker:', response);

    if (response.status === 'success') {
      store.setState({ artists: response.data, isLoading: false });
    } else {
      // TODO: Display the error message to the user
      console.error('Failed to fetch artists:', response.message);
      store.setState({ isLoading: false });
    }
  } catch (error) {
    console.error('Error communicating with service worker:', error);
    store.setState({ isLoading: false });
  }
}

async function initializeMockToggle() {
  const toggle = document.getElementById('mock-toggle') as HTMLInputElement | null;

  if (toggle) {
    // Get the initial value from storage, default to true
    const { useMocks = true } = await chrome.storage.local.get('useMocks');
    toggle.checked = useMocks;

    toggle.addEventListener('change', async (event) => {
      const newUseMocks = (event.target as HTMLInputElement).checked;
      await chrome.storage.local.set({ useMocks: newUseMocks });
      // Refetch artists with the new setting
      await fetchArtists();
    });
  }
}

async function main() {
  await initializeMockToggle();
  await fetchArtists();
}

main();

