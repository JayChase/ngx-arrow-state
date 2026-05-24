/**
 * Shared utility for determining whether an arrow-key press should trigger
 * history navigation.  Used by both `ArrowState` and `ArrowStateSignal`.
 */
export function shouldChangeState(
  el: HTMLInputElement | HTMLTextAreaElement,
  historyLength: number,
  direction: 'UP' | 'DOWN',
): boolean {
  if (historyLength < 2) {
    return false;
  }

  if (el.value.length === 0) {
    return true;
  }

  // if the user is selecting text then do not change state
  if (el.selectionStart !== el.selectionEnd) {
    return false;
  }

  if (
    (direction === 'UP' && el.selectionStart === 0) ||
    (direction === 'DOWN' && el.selectionStart === el.value.length)
  ) {
    return true;
  } else {
    return false;
  }
}
