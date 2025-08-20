import { communicator, MessageType } from '../common/messaging.js';
import { apiProvider } from './api/index.js';

communicator.on(MessageType.GET_ARTISTS, async (payload, sender) => {
  console.log('Received GET_ARTISTS request', { payload, sender });

  try {
    const artists = await apiProvider.getTrackedArtists();
    return { status: 'success', data: artists };
  } catch (error) {
    console.error('Error fetching artists:', error);
    return { status: 'error', message: error.message };
  }
});

console.log('Service worker is listening for messages...');
