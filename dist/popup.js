import { c as communicator, M as MessageType } from "./chunks/messaging.js";
class Store {
  state;
  listeners = /* @__PURE__ */ new Set();
  constructor(initialState) {
    this.state = initialState;
  }
  getState() {
    return this.state;
  }
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }
  subscribe(listener) {
    this.listeners.add(listener);
  }
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }
}
const store = new Store({
  artists: [],
  isLoading: true
});
class TabView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.switchTab("artists");
    this.render();
    this.addEventListeners();
  }
  render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/tab-view.css">
            <div class="tabs">
                <button class="tab active" data-tab="artists">Artists</button>
                <button class="tab" data-tab="events">Events</button>
            </div>
            <div class="panels">
                <slot name="artists"></slot>
                <slot name="events"></slot>
            </div>
        `;
  }
  addEventListeners() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (event) => {
        const tabName = event.currentTarget.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });
  }
  switchTab(tabName) {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    this.querySelectorAll("[slot]").forEach((panel) => {
      panel.style.display = panel.slot === tabName ? "block" : "none";
    });
  }
}
customElements.define("tab-view", TabView);
class ArtistsView extends HTMLElement {
  handleStoreUpdate;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.handleStoreUpdate = this.render.bind(this);
  }
  connectedCallback() {
    store.subscribe(this.handleStoreUpdate);
    this.render();
  }
  disconnectedCallback() {
    store.unsubscribe(this.handleStoreUpdate);
  }
  render() {
    if (!this.shadowRoot) {
      return;
    }
    const { artists, isLoading } = store.getState();
    this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/artists-view.css">
            <div>
                <h2>Artists</h2>
                ${isLoading ? "<p>Loading artists...</p>" : `
                    ${artists.length > 0 ? `
                        <ul>
                            ${artists.map((artist) => `<li>${artist.name}</li>`).join("")}
                        </ul>
                    ` : "<p>No artists found.</p>"}
                `}
            </div>
        `;
  }
}
customElements.define("artists-view", ArtistsView);
class EventsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render();
  }
  render() {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/events-view.css">
            <div>
                <h2>Events</h2>
                <p>This is the events view.</p>
            </div>
        `;
  }
}
customElements.define("events-view", EventsView);
async function fetchArtists() {
  try {
    console.log("Sending GET_ARTISTS request from popup...");
    store.setState({ isLoading: true });
    const response = await communicator.get(MessageType.GET_ARTISTS);
    console.log("Response from service worker:", response);
    if (response.status === "success") {
      store.setState({ artists: response.data, isLoading: false });
    } else {
      console.error("Failed to fetch artists:", response.message);
      store.setState({ isLoading: false });
    }
  } catch (error) {
    console.error("Error communicating with service worker:", error);
    store.setState({ isLoading: false });
  }
}
async function initializeMockToggle() {
  const toggle = document.getElementById("mock-toggle");
  if (toggle) {
    const { useMocks = true } = await chrome.storage.local.get("useMocks");
    toggle.checked = useMocks;
    toggle.addEventListener("change", async (event) => {
      const newUseMocks = event.target.checked;
      await chrome.storage.local.set({ useMocks: newUseMocks });
      await fetchArtists();
    });
  }
}
async function main() {
  await initializeMockToggle();
  await fetchArtists();
}
main();
