import { parseEventsFromHTML } from './parser.js';
const BANDSINTOWN_ARTISTS_URL = 'https://www.bandsintown.com/u/trackedArtists?max=10000';

async function getTrackedArtists() {
  console.log('Fetching artists from Bandsintown...');
  const response = await fetch(BANDSINTOWN_ARTISTS_URL, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tracked artists: ${response.statusText}`);
  }
  const artists = await response.json();
  return artists;
}

async function getArtstEvent(artist) {
  console.log(`Fetching events for ${artist.name} from ${artist.url}`);
  const response = await fetch(artist.url);
  if (!response.ok) {
    console.error(`Failed to fetch page for ${artist.name}: ${response.statusText}`);
    return;
  }
  const html = await response.text();
  const events = parseEventsFromHTML(html);
  if (events.length > 0) {
    const eventsWithArtist = events.map(event => ({ ...event, artist, artist_id: artist.id }));
    allEvents = allEvents.concat(eventsWithArtist);
  } else {
    console.log(`No events found on page for ${artist.name}`);
  }
}

async function getArtistEvents() {
  console.log('Fetching events from Bandsintown...');
  const artists = await getTrackedArtists();
  let allEvents = [];

  for (const artist of artists) {
    try {
      allEvents.push(await getArtstEvent(artist));
    } catch (error) {
      console.error(`Error processing artist ${artist.name}:`, error);
      continue;
    }
  }
  return allEvents;
}

export const liveProvider = {
  getTrackedArtists,
  getArtistEvents,
};
