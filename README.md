# The Dinner Jar

*Can't decide? Ask the jar.* Write dishes you've cooked and loved on paper slips, fold them into a glass jar, and pull one out at random whenever you need a cooking idea.

Live: https://jar-blond.vercel.app

## How it works
- **Add:** write a dish name, optionally add a photo and a recipe link. The note folds twice and drops into the jar.
- **Pick:** a random note rises out of the jar and unfolds. Put it back or pick another.
- **One shared jar:** anyone with the link can add, edit and pick. Only the owner (via a private link) can remove notes.

## Built with
Next.js 16, React, Tailwind, Drizzle ORM, Postgres on Neon, Three.js (only for the fold motion), hosted on Vercel. The glass jar is a hand-drawn SVG. The 3D layer loads after the page shows and is skipped for reduced motion or no WebGL.

## Run it locally
```bash
cd dinnerjar
npm install
npm run dev -- --port 3457
```
With no `DATABASE_URL`, dishes are saved to `.data/jars.json`. To use Postgres, copy `.env.example` to `.env`, fill in `DATABASE_URL`, and run `npm run db:push`. Set `OWNER_KEY` to any secret, then open `/owner/<OWNER_KEY>` once on a device to get the remove buttons.

## Design files
Mockups and motion studies are in `design-refs/`.
