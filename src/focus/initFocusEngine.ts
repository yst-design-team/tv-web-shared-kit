import { init } from "@noriginmedia/norigin-spatial-navigation";

let initialised = false;

/** Boot Norigin once. Safe to call multiple times. */
export function initFocusEngine() {
  if (initialised) return;
  init({
    debug: false,
    visualDebug: false,
    // We render at fixed 1080p and may scale via CSS transform on <Stage>.
    // Norigin uses getBoundingClientRect, which already reports post-transform
    // coordinates, so geometric navigation works in screen space out of the box.
    shouldFocusDOMNode: true,
    // Use arrow keys + Enter / Back. Pointer is enabled so trackpad/mouse hover
    // can also drive focus during dev.
    shouldUseNativeEvents: false,
  });
  initialised = true;
}
