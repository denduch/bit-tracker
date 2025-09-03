import { communicator, MessageType } from '../common/messaging.js';
import { fetchRecommendations, fetchCsrfToken, setArtistTrackingStatus } from './helpers/recommendation-helper.js';
import { fetchArtists } from './helpers/artists-helper.js';
import { fetchEvents } from './helpers/events-helper.js';

const FETCH_ALARM_NAME = 'fetch-data-alarm';

communicator.on(MessageType.REQUEST_ARTIST_FETCH, fetchArtists);
communicator.on(MessageType.REQUEST_EVENTS_FETCH, fetchEvents);
communicator.on(MessageType.REQUEST_RECOMMENDATIONS_FETCH, fetchRecommendations);
communicator.on(MessageType.REQUEST_CSRF_TOKEN_FETCH, fetchCsrfToken);
communicator.on(MessageType.SET_ARTIST_TRACKING_STATUS, setArtistTrackingStatus);

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, creating alarm.');
  chrome.alarms.create(FETCH_ALARM_NAME, {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: 60 // Repeat every hour
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FETCH_ALARM_NAME) {
    console.log('Alarm triggered: fetching fresh data...');
    await fetchArtists();
  }
});

console.log('Service worker is listening for messages and alarms...');
