// background/api/index.ts

import { liveProvider } from './live-provider';
import { mockProvider } from './mock-provider';

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
