import { useSyncExternalStore } from "react";

// Tiny global signal for "the user is in an active timed test." When true, the
// app-wide 3D space background unmounts so nothing moves behind a live test.
// Backed by an external store (no context/provider plumbing): any page can flip
// it with setFocusMode, and <App> subscribes with useFocusMode.
let focused = false;
const listeners = new Set();

export function setFocusMode(value) {
  const next = Boolean(value);
  if (next === focused) return;
  focused = next;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => focused;

export function useFocusMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
