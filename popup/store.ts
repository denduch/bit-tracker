import { Artist } from '../common/types';

interface State {
  artists: Artist[];
  isLoading: boolean;
}

class Store {
  private state: State;
  private listeners: Set<(state: State) => void> = new Set();

  constructor(initialState: State) {
    this.state = initialState;
  }

  getState(): State {
    return this.state;
  }

  setState(newState: Partial<State>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
  }

  unsubscribe(listener: (state: State) => void) {
    this.listeners.delete(listener);
  }
}

export const store = new Store({
  artists: [],
  isLoading: true,
});
