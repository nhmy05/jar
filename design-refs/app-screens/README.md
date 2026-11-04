# App screens: design handoff

Base: the prototype in `Magic jar/interactive-recipe-bowl-app`.
Build on that code. Only what's listed here changes.

PNGs are at 2x (laptop 1440x900, phone 390x844).
`source/` holds the mockup source. It's a reference for exact values and needs the design tool to run, so don't copy it in as is.

| File | Screen |
|---|---|
| 01 | Home |
| 02 | Add a dish popup |
| 03 | Picked note, no photo or link |
| 04 | Picked note with photo and link (photo is a placeholder) |
| 05 | My dishes popup |
| 06 | About popup |
| 07, 08 | Jar at 0 and 50 notes |
| 09 | Key frames for add and pull motion |
| 10-13 | Phone: home, add, picked, my dishes |

## What changes from the prototype

### Jar (`bowl-illustration.tsx`)
Replace the prototype jar, including the dotted band, with the shape in `source/Jar.dc.html`.

Outline, in a 640x640 box:
`M130 90 L136 130 C80 160 40 240 40 370 C40 500 140 600 230 610 L410 610 C500 600 600 500 600 370 C600 240 560 160 504 130 L510 90 Z`

- Rim: ellipse at (320, 90), rx 190, ry 22
- No lid
- Soft yellow glow under the base (`#F9DE97`), replaces the prototype's ground shadow

### Notes in the jar
- Thin, plain white paper with no lines
- Each note is folded twice, drawn as 3 layers. There are 4 fold shapes (`SHAPES` in `source/Jar.dc.html`), randomly rotated and flipped
- Layer colors: `#E7E4DA`, `#F5F3EC`, white. Edge: `#D9D6CC`, hairline
- Notes pile up from the bottom. 50 notes fill the jar to the shoulder (`makeSlips` in `source/Jar.dc.html`)

### All paper is white
- Remove "Pick your paper" from the add popup, and the `color` field if nothing else needs it
- Picked note and My dishes cards are white (`#FFFFFF`)
- Remove the 5 note colors from jar art, folding and flying notes

### Removed from the home screen
- Floating note above the rim
- Pile of loose notes beside the jar

### Wording
- Headline: "Can't decide? *Ask the jar*" (second part keeps the green italic)
- Line under it: "Write down dishes you've cooked and loved, fold them in, and pull one out whenever you need an idea."
- About, step 2: "Your note folds twice" (was "folds in two")

### Unchanged
Colors (background `#FDFAE9`, green `#536447`), fonts (DM Serif Display, DM Sans, Caveat), layout, buttons, side notes, footer and all other wording.

## Motion
See 09. Rules:
- The dish name ends up folded inside the note
- Folding presses itself, so no separate crease step
- No lift before the drop: the packet drops straight in
- Pull: note rises, floats to the middle, unfolds one fold at a time, name appears

## Not decided or not built yet
1. **50 limit:** planned, but not in the prototype or these mockups. 08 only shows how full the jar looks.
2. **Deleting dishes:** there's no way to do it. A full jar would be stuck without it.
3. **Name:** the brand says "the dinner bowl", but the jar is no longer a bowl and the headline says "jar". Copy mixes both ("Fold it into the bowl", "Tuck it in the jar").
4. **Small text:** some prototype text is 7-10px, kept to match. Hard to read on a phone.
5. **Saving:** About says "saved here, just for this browser", but the plan is cloud storage with Google sign-in later.

## Setup problems in the prototype folder
- `public/fonts/` has only license files. `layout.tsx` needs these, or the app won't start: `dm-sans.ttf`, `dm-sans-semibold.ttf`, `dm-serif.ttf`, `dm-serif-italic.ttf`, `caveat.ttf`
- It needs a Postgres database (`DATABASE_URL`). Saving dishes hasn't been tested
