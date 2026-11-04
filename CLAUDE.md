# What's for Dinner? (project name: dinnerjar)

Cozy web app. I write dishes I've cooked on paper slips, drop them in a glass jar, and pull one out at random when I need a cooking idea. Portfolio piece to share. Laptop and phone. Web app first, native app later. Free hosting only.

I'm a product manager, not an engineer. Explain things in plain words, keep it short.

## Starting point
The app is in `dinnerjar/`. Keep iterating on it. Don't start over. Design files are in `design-refs/`, next to it.

The app is ahead of some mockups in places: it already has the 50 limit, code for removing dishes, the yellow #FFF9E3, and doodles. Where this file says "prototype", it means an older version called interactive-recipe-bowl-app, which is no longer in this folder. Compare the app with the mockups and tell me where they differ before changing anything.

Not tested yet, so check these first:
- Does it run? `npm run dev` in `dinnerjar/`, port 3457 in `.claude/launch.json`
- Does saving work? It uses `.data/jars.json` with no database, or Postgres if DATABASE_URL is set
- Do slips pile up in the jar?
- Headline has a period in the app ("Ask the jar."). I wrote it with no period

## How it works
- Add: write dish name, optional photo from gallery, optional link. Slip folds twice, drops in jar
- Pull: random slip comes out and unfolds. Buttons: Put back, Pick another
- A pulled slip always goes back in the jar
- No cap on dishes. The jar art looks full at 50; past that it stays looking full and people can keep adding. Only the owner can remove dishes
- V1 is random pull only. Filters come in V2
- Soft sound when a slip lands

## Look
- Jar: realistic round clear glass, like a fish tank or fishbowl. Wide opening, no lid. Use the shape in `design-refs/jar-and-paper.html`
- Paper: thin, no lines, folded twice. Written name ends up folded inside
- All paper is white everywhere: in the jar, the picked note, and My dishes cards. No "Pick your paper" step, even though the prototype has one
- Remove the prototype's pastel note floating above the jar and the pastel pile beside it
- Handwriting font for dish names
- No real-world background like a kitchen or home
- Everything else matches the prototype: layout, sage green, fonts, grain, footer
- Main goal is that the jar is the star: big and centered
- Keep the gentle floating motion on the small background doodles and sparkles (off when the device asks for less motion)

Home page wording, exact:
- Headline: Can't decide? Ask the jar ("Ask the jar" in green italic)
- Line under it, on 2 lines: Write down dishes you've cooked and loved, fold them in, / and pull one out whenever you need an idea.

Mockup gaps: the latest screens have no delete, since it isn't in the prototype. It's still needed in V1 (owner only).

## Motion
Copy timing and bend from `design-refs/slip-fold-motion.html` (open it in a browser, it has a timeline):
- About 3.3s: hold, fold 1, fold 2, drop, land, settle
- Paper bows and rolls over, like soft paper, not a stiff hinge
- Folding presses the crease on its own. No separate press step
- Fold 2 is one smooth roll, with no shake or side-turn
- Each fold lands exactly on the far edge. Folded slip is a clean rectangle
- Plain outside, no sticky strip
- No lift before the drop. It falls straight down from the hand: no tumble, spin or sideways drift, it just tips flat on the way down. No V shape in the air
- One small bounce
- The fold relaxes open a little, like real paper (about 17 degrees on the top fold). This starts the moment it's let go (1.75s), opens fast at first, then eases out through the landing, bounce and settle (ends 2.9s). Keep the thin shadow in the gap, so the opening shows
- The study uses a yellow note. The real slip is white
- Pulling out (changed 2026-11-04): the note rises out of the jar, folding shut as it's picked up, then unfolds while it grows toward you, ending the size and place of the picked note (about 2.65s). The unfold is the fold played backwards at its real timing
- Put back: the open note shrinks from the picked card to just above the jar, then folds and drops like adding a dish

## Accounts and data
Phase 1 (now):
- One jar, saved in the cloud. I share its link with friends and they can add dishes. No login
- Friends can add and pick, but not remove. Only I can remove dishes, using a private owner link with a secret key only I have. The shared link never shows the trash button
- Anyone with the shared link can edit a note (name, link, photo) by clicking it in My dishes (decided 2026-11-04). Removing stays owner only
- Put a jar id on every dish from day one, so phase 2 needs no rebuild
- Photos stay in the database for now, shrunk before upload so storage stays free
- The jar starts empty. No starter dishes

Phase 2 (later):
- Log in (Google). Each person gets their own jar
- People can view others' jars, and invite others to edit theirs
- Replaces the old plan of guest jars saved on each device

## Tech
The app now: Next.js 16, React, Tailwind, Drizzle, optional Postgres. The notes suggest Neon for free cloud storage. There is no 3D library yet, and the jar is a drawing (`jar-illustration.tsx`).
Earlier plan, now out of date: Svelte 5 + Threlte (3D), Rapier (physics), Supabase (login, data, photos), Cloudflare Pages (hosting), installable on phone home screen.

Default is to keep this stack. Biggest question: I asked for a realistic 3D jar and real fold motion, and the study uses Three.js. Recommend how to add that here, with the cost of each option, and ask me before adding big pieces. Also not set up yet: git in `dinnerjar/`, Google sign-in, photo storage, free hosting.

Hosting (decided): code on GitHub, app hosted on Vercel's free plan, connected so every push to GitHub updates the site. Database: Neon free plan. Not GitHub Pages: it can't run the server that saves the shared jar or keeps the owner key secret.

Hidden safety cap: about 500 dishes, never shown, so spam on the shared link can't fill free storage.

Watch for: glass can run slow on old phones, so lower quality automatically on weak ones. Slips can jitter in a pile, so let them rest once settled.

## Decided (2026-11-04)
1. Name: "the dinner jar", in the mockup's serif brand style (DM Serif Display, gold end mark). Swap the bowl logo for a jar. "Bowl" becomes "jar" everywhere
2. Yellow: #FDFAE9 (replaces #FFF9E3)
3. Background: mix. The mockup's handwritten side notes and gold sparkles, plus a few of the app's food doodles, used sparingly so the jar stays the star
4. Wording, exact (paper is called "note" everywhere):
   - Above headline: nothing
   - Headline: Can't decide? Ask the jar (no period)
   - Header link: How it works
   - Main button: Pick a dish
   - Counter under jar: "{n} dishes to choose from" (e.g. "20 dishes to choose from")
   - Line under buttons: nothing
   - Side notes: "every dish you've loved" (left), "dishes to try" (right)
   - Footer: Made to answer the question: What's for dinner?
   - Add popup title: One more good idea.
   - Add popup button: Fold it into the jar
   - Picked note: no small text above the dish name
   - My dishes popup title: My dishes
   - About popup title: How the jar works
   - Keep the app's messages for a full jar and removing a dish. Reword the guest-saving messages to fit one shared jar
   - Add a dish popup: no small label, no line under the title, field labels "Dish name" and "Photo", no line under the button
   - Picked note: straight, not tilted. Nothing under the name (no plate drawing, no "You know the way"). Keep the mockup's heart icon and the small line at the bottom. No fold lines on the note
   - My dishes popup: small label "YOUR GOOD-FOOD COLLECTION" above the title. 3 columns with a trash button on each card. Search placeholder "Find a favorite…". No line at the bottom
   - How it works popup: steps "Write a note", "Drop it in", "Pull one out". Info box about saving. Button "Got it"
5. Jar: the flat mockup drawing (SVG), not 3D. A 3D jar was tried and dropped. Three.js is used only for the fold motion: the note folds in front of the jar, drops in behind the front glass, lands on its pile spot, then fades into the flat note. Pulling: it rises out, then unfolds while it grows into the picked note. Each note lands in one of 16 natural poses (tipped, angled, folds sprung open, some turned round, like the reference photo of slips in a jar); the pile shows a picture of that same pose (public/notes/), so nothing changes when it lands. Three.js loads after the page shows. No WebGL or reduced motion: skips the motion
6. Starter dishes: none. The jar starts empty
7. Picked note: no tape strip, even though the mockup has one
8. Never show the limit ("of 50", "room for 38 more"). Only show how many dishes are in the jar, e.g. "12 dishes to choose from" or "12 in the jar". 50 is the size the jar art is drawn for: how full it looks. Past 50, adding still works and the jar stays drawn full
9. Text: make the mockup's tiny text (7-10px) bigger so it reads on a phone
10. Logo: option C, the simple jar outline with a gold heart inside (also the browser tab icon)

## Design files in `design-refs/`
These are for looking at and copying from, not app code. Some need the design tool's runtime, so read their code if they don't open properly.
- `slip-fold-motion.html`: fold and drop motion study (Three.js)
- `app-screens/`: latest mockup of every screen as PNGs (home, add, picked, my dishes, about, empty, full, motion key frames, phone), plus a README with the handoff notes
- `app-screens/source/Jar.dc.html`: latest jar and note drawing (jar outline, 4 fold shapes, pile layout)
- `app-screens/source/Screen.dc.html`: source for the screens
- Not in the folder (listed earlier): `jar-and-paper.html`, `all-screens-template.html`, `first-3d-jar.html`

Live mockups: https://claude.ai/artifact/8PYEgrBjdnhsnekwyvKspX
Live motion study: https://claude.ai/artifact/VaR1oG2YwNvX5Uz893DCXu
(These need my login. I may paste screenshots.)

## Build order
1. Get the app running, set up git, compare it to the mockups
2. Settle the open questions above
3. Real glass jar with notes that pile up, full at 50
4. Add flow with fold and drop
5. Pull flow with unfold, Put back, Pick another
6. Cloud save for the one shared jar, and its share link (Google sign-in and per-person jars are phase 2)
7. Hosting, phone install, speed fixes
8. Portfolio polish

Show me each step working before moving on. Use git, with small commits.
