import { communicator, MessageType } from '../common/messaging';
import { apiProvider } from './api';

communicator.on(MessageType.GET_ARTISTS, async (payload: any, sender: chrome.runtime.MessageSender) => {
  console.log('Received GET_ARTISTS request', { payload, sender });

  try {
    const artists = await apiProvider.getTrackedArtists();
    return { status: 'success', data: artists };
  } catch (error) {
    console.error('Error fetching artists:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { status: 'error', message };
  }
});

console.log('Service worker is listening for messages...');
