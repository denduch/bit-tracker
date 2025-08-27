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

async function getArtstEvent(artist) {
  console.log('Fetching events from mock HTML file...');
  const response = await fetch('../mocks/artist-mock.html');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock artist page: ${response.statusText}`);
  }
  let allEvents = [];
  const html = await response.text();
  const events = parseEventsFromHTML(html);
  if (events.length > 0) {
    const eventsWithArtist = events.map(event => ({ ...event, artist, artist_id: artist.id }));
    allEvents = allEvents.concat(eventsWithArtist);
  } else {
    console.log(`No events found on page for ${artist.name}`);
  }
  return allEvents;
}

async function getArtistEvents() {
  console.log('Fetching events from mock HTML file...');
  let allEvents = [];
  allEvents = allEvents.concat(await getArtstEvent({
    ViewConcertlink: "https://www.bandsintown.com/a/432?came_from=0&utm_medium=web&utm_source=artist_explorer_page&utm_campaign=artist",
    artistPageUrl: "https://www.bandsintown.com/a/432?came_from=0&utm_medium=web&utm_source=settings_my_artist&utm_campaign=artist",
    id: 432,
    imageUrl: "https://photos.bandsintown.com/thumb/8540190.jpeg",
    media_id: 8540190,
    name: "A Perfect Circle",
    on_tour: true,
    properlySizedArtistImageURL: "https://media.bandsintown.com/50x50/8540190.webp",
    source: "spotify",
    timestamp: "2023-06-02T13:08:49",
    tracker_count: 1101339
  }));
  return allEvents;
}

export const mockProvider = {
  getTrackedArtists,
  getArtistEvents,
};
