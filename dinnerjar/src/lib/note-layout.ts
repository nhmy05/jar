/* Layout of a note that has a photo: square photo centred near the top, name and link below.
   Every number is a fraction of the note's width, so the picked card (CSS, cqw units) and
   the folding note (canvas) draw exactly the same thing at any size. The note is 3 : 2.2. */
export const NOTE_ASPECT = 2.2 / 3;
export const PHOTO_SIZE = 0.46;                          // photo side
export const PHOTO_TOP = 0.05;                           // gap above the photo
export const PHOTO_LEFT = (1 - PHOTO_SIZE) / 2;          // centred left to right
export const TEXT_TOP = PHOTO_TOP + PHOTO_SIZE;          // name area starts under the photo
export const TEXT_HEIGHT = NOTE_ASPECT - TEXT_TOP;       // ...and runs to the bottom edge
export const TEXT_WIDTH = 0.88;                          // name may use most of the width

/** Name size under a photo, as a fraction of note width. Short names write bigger; long ones
    (names are at most 48 characters) wrap onto two lines rather than shrinking. */
export function photoNameSize(name: string) {
  const length = name.trim().length;
  return length <= 14 ? 0.064 : length <= 30 ? 0.054 : 0.05;
}
