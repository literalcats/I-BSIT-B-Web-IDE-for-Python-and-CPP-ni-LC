// js/core/bus.js
// ---------------------------------------------------------------------------
// A tiny "message board". One part of the app SHOUTS that something happened,
// and any other part that cares LISTENS. Neither needs to know about the other.
//
//   bus.on('run-requested', () => runs.run());   // listen (done once, at startup)
//   bus.emit('run-requested');                   // shout  (done by the editor)
//
// Why we have it: the editor must be able to say "the student pressed Ctrl+Enter"
// before the run controller even exists. Without a bus, main.js needed
// half-built variables (`let runs = null`) to patch that gap. Now there are none.
//
// Safety rule: if one listener crashes, the others still run. So one broken
// feature can never silently stop another feature from hearing the message.
// ---------------------------------------------------------------------------

export function createBus() {
  const listeners = new Map(); // event name -> list of functions

  return {
    /** Listen for an event. Returns a function that stops listening. */
    on(name, listener) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(listener);
      return () => {
        const list = listeners.get(name) || [];
        const at = list.indexOf(listener);
        if (at >= 0) list.splice(at, 1);
      };
    },

    /** Tell every listener. Nobody listening is fine (nothing happens). */
    emit(name, ...args) {
      for (const listener of [...(listeners.get(name) || [])]) {
        try {
          const result = listener(...args);
          // A listener may be async; report its failure too instead of losing it.
          if (result && typeof result.catch === 'function') result.catch((error) => console.error(`[bus] "${name}" listener failed`, error));
        } catch (error) {
          console.error(`[bus] "${name}" listener failed`, error);
        }
      }
    },
  };
}
