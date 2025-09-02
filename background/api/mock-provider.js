import { parseEventsFromHTML } from './parser.js';

async function getTrackedArtists() {
  console.log('Fetching artists from mock JSON file...');
  const response = await fetch('../mocks/artist-list-mock.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock artists: ${response.statusText}`);
  }
  const data = await response.json();
  // Assuming the JSON structure is { "artists": [...] }
  console.log('Mock artists:', data.artists)
  return data.artists;
}

async function getEventsForArtist(artist) {
  console.log(`Fetching mock events for ${artist.name}...`);
  const response = await fetch('../mocks/artist-mock.html');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock artist page: ${response.statusText}`);
  }
  const html = await response.text();
  const events = parseEventsFromHTML(html);
  return events.map(event => ({ ...event, artist_id: artist.id }));
}

async function getRecommendations() {
  console.log('Fetching recommendations from mock JSON file...');
  const response = await fetch('../mocks/recommendations.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock recommendations: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Mock recommendations:', data.artists)
  return data.artists;
}

async function getArtistEvents(artists) {
  console.log('Fetching mock events...');
  let allEvents = [];
  // For simplicity, mock provider returns events for one hardcoded artist
  // if the artist list is not empty.
  if (artists && artists.length > 0) {
    const mockArtist = artists[0]; // Use the first artist for mock events
    const events = await getEventsForArtist(mockArtist);
    allEvents.push(...events);
  }
  return allEvents;
}

export const mockProvider = {
  getTrackedArtists,
  getArtistEvents,
  getRecommendations,
};
