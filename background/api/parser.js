/**
 * Parses the HTML content of an artist's page to extract event data.
 * @param {string} html The HTML content as a string.
 * @returns {Array} An array of event objects, or an empty array if not found.
 */
export function parseEventsFromHTML(html) {
  const match = html.match(/<script>window\.__data=(.*?)<\/script>/);
  if (match && match[1]) {
    try {
      const data = JSON.parse(match[1]);
      if (data.artistView?.body?.events?.upcomingEvents?.events) {
        return data.artistView.body.events.upcomingEvents.events;
      }
    } catch (error) {
      console.error('Failed to parse event data:', error);
      return [];
    }
  }
  return [];
}
