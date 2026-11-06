/* A note with a photo is a tall card, like an instant photo: square photo with an even
   white border at the top, name and link on the wider strip below.
   Every number is a fraction of the note's width, so the picked card (CSS, cqw units) and
   the folding note (canvas, 3D paper) draw exactly the same thing at any size. */
export const NOTE_ASPECT = 2.2 / 3;          // plain note, no photo: wide
export const PHOTO_NOTE_ASPECT = 1.22;       // note with a photo: tall
export const PHOTO_MARGIN = 0.04;            // white border left, top and right of the photo
export const PHOTO_SIZE = 1 - 2 * PHOTO_MARGIN;
export const PHOTO_LEFT = PHOTO_MARGIN;
export const PHOTO_TOP = PHOTO_MARGIN;
export const TEXT_TOP = PHOTO_TOP + PHOTO_SIZE;              // name area starts under the photo
export const TEXT_HEIGHT = PHOTO_NOTE_ASPECT - TEXT_TOP;     // ...and runs to the bottom edge
export const TEXT_WIDTH = 0.88;
export const PHOTO_RADIUS = 0.022;          // soft photo corners
export const CARD_RADIUS = 0.035;           // soft card corners
export const LINK_SIZE = 0.034;

/** Name size under a photo, as a fraction of note width. Short names write bigger; long ones
    (names are at most 48 characters) wrap onto two lines rather than shrinking. */
export function photoNameSize(name: string) {
  const length = name.trim().length;
  return length <= 14 ? 0.09 : length <= 30 ? 0.072 : 0.064;
}
