import { parseEventsFromHTML } from './parser.js';
import { communicator, MessageType } from '../../common/messaging.js';
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
  const { artists } = await response.json();
  return artists;
}

async function getArtstEvent(artist) {
  console.log(`Fetching events for ${artist.name} from ${artist.artistPageUrl}`, artist);
  
  const response = await fetch(artist.artistPageUrl);
  if (!response.ok) {
    console.error(`Failed to fetch page for ${artist.name}: ${response.statusText}`);
    return;
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
  console.log('Fetching events from Bandsintown...');
  const artists = await getTrackedArtists();
  let allEvents = [];
  const BATCH_SIZE = 2;
  const DELAY_MS = 200;

  for (let i = 0; i < artists.length; i += BATCH_SIZE) {
    const batch = artists.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch starting with artist ${i + 1}/${artists.length}...`);

    const batchPromises = batch.map(artist => 
      getArtstEvent(artist).catch(error => {
        console.error(`Error processing artist ${artist.name}:`, error);
        return []; // Return an empty array on error to avoid breaking Promise.all
      })
    );

    const results = await Promise.all(batchPromises);
    const successfulEvents = results.flat().filter(Boolean);
    allEvents = allEvents.concat(successfulEvents);

    communicator.broadcast(MessageType.EVENTS_LOADING_PROGRESS, { 
      current: Math.min(i + BATCH_SIZE, artists.length),
      total: artists.length 
    });

    if (i + BATCH_SIZE < artists.length) {
      console.log(`Waiting for ${DELAY_MS}ms before the next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('Finished fetching all artist events.');
  return allEvents;
}

export const liveProvider = {
  getTrackedArtists,
  getArtistEvents,
};
