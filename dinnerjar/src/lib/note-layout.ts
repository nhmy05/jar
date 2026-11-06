/* Layout of a note that has a photo: square photo on the left, name and link on the right.
   Every number is a fraction of the note's width, so the picked card (CSS, cqw units) and
   the folding note (canvas) draw exactly the same thing at any size. The note is 3 : 2.2. */
export const NOTE_ASPECT = 2.2 / 3;
export const PHOTO_SIZE = 0.6;          // photo side
export const PHOTO_LEFT = 0.036;        // gap from the left edge
export const PHOTO_TOP = (NOTE_ASPECT - PHOTO_SIZE) / 2;   // centred top to bottom
export const TEXT_LEFT = PHOTO_LEFT + PHOTO_SIZE + 0.03;   // start of the name column
export const TEXT_WIDTH = 1 - TEXT_LEFT - 0.036;           // width of the name column

/** Name size beside a photo, as a fraction of note width. Shorter names write bigger;
    a long single word shrinks so it still fits the column. */
export function photoNameSize(name: string) {
  const length = name.trim().length;
  const longestWord = Math.max(1, ...name.trim().split(/\s+/).map((word) => word.length));
  const tier = length <= 10 ? 0.064 : length <= 20 ? 0.054 : length <= 34 ? 0.046 : 0.039;
  return Math.min(tier, (TEXT_WIDTH * 2.1) / longestWord);
}
