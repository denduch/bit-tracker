// background/api/index.js

import { liveProvider } from './live-provider.js';
import { mockProvider } from './mock-provider.js';

async function getProvider() {
  const { useMocks = true } = await chrome.storage.local.get('useMocks');
  console.log(`Using ${useMocks ? 'mock' : 'live'} provider.`);
  return useMocks ? mockProvider : liveProvider;
}

// This is the facade that the rest of the application will use.
export const apiProvider = {
  async getTrackedArtists() {
    const provider = await getProvider();
    return provider.getTrackedArtists();
  },
  // Add other methods like getArtistDetails in the future
};
