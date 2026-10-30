/**
 * BredForge Internal Event Bus
 * Handles zero-latency pad triggers (Route A) and live-recording staging buffer (Route B).
 */
class InternalEventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const DAWEventBus = new InternalEventBus();
