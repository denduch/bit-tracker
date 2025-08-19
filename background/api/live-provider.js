// background/api/live-provider.js
import { parseArtistsFromHTML } from '../parser.js';

const BANDSINTOWN_ARTISTS_URL = 'https://www.bandsintown.com/u/trackedArtists?max=10000';

async function getTrackedArtists() {
  console.log('Fetching artists from Bandsintown...');
  const response = await fetch(BANDSINTOWN_ARTISTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch tracked artists: ${response.statusText}`);
  }
  const htmlText = await response.text();
  const artists = parseArtistsFromHTML(htmlText);
  return artists;
}

export const liveProvider = {
  getTrackedArtists,
};
