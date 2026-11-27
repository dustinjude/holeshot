# Holeshot: notes for Claude Code

Jet ski closed-course racing seen from low behind your ski, built for phones. A static web app (three.js r128, no
framework) that installs to a home screen and plays offline. Owner: Dustin Charrier (Dean Strong Watercraft
Performance), who plays on an iPhone 18 Pro Max and judges the game there.

## Replies to Dustin

Keep replies short and mobile-friendly: he reads them on his phone. Lead with the answer. Always say what you
checked and what you couldn't check.

## Commands

- `npm run build`: assemble `src/` into `dist/` (`node build.mjs`, no dependencies). Always rebuild after editing `src/`.
- `npm start`: build, then serve `dist/` at http://localhost:8000 and print a Wi-Fi address for a phone.
- `npm run sim` (or `node tools/sim.mjs arena`): whole races in Node, no browser.
- `npm run test:story`: the Claude writing (preview, crew chief, magazine, championship call) with the functions stubbed; runs a tour's last moto to the end of the season.
- `npm test`: build a test copy and race it in headless Chrome at iPhone Pro Max size. First run:
  `npm install && npx playwright install chromium`.
- `npm run model -- <file.glb> <name>`: shrink a 3D model into `models/<name>/` (see Models).

## Layout

- `src/game/*.js`: the game. `build.mjs` joins them into one strict-mode IIFE, `dist/js/game.js`: `core.js` first,
  then `shell.js`, which has one marker line each (`//@arcade`, `//@draw`, `//@r3`, `//@party`) where those files
  are inserted. Everything shares one scope, so a function in one file calls one in another directly, and top-level
  `const`s are initialised in that order.
  - `core.js`: game logic, no DOM. Racers, crafts, garage parts, the 10 courses in `SITES` plus the drag strip,
    course building (closed Catmull-Rom path, points every `DS`=16 units, per-point lane width `p.w`, turns at
    curvature peaks, land, marks, rough-water zones), the wave field `waveH`, ski physics (fixed 120 Hz step, grip and
    slide, hops off wave tops: `GRAV`, `HOP`, `KICK`), rival AI, `rivalSpec(pace)`, `gridUp`, `simStep`, drag racing.
  - `shell.js`: DOM, saved settings, `loadSite`/`reset`, garage and money, tour weekends, drag ladder, `finish()`
    and results, input, `update(dt)`, HUD, the frame loop and the automatic quality steps.
  - `draw.js`: the flat overhead renderer, used only when WebGL is unavailable, plus `hudOverlay` (map, name tags,
    turn arrows), which also draws over the 3D view.
  - `r3.js`: the 3D view. `G` holds renderer state. `Bld` builds meshes from code. Water and sky shaders
    (`WAVE_GLSL` must stay in step with `waveH` in core). `g3Site` builds each course's scenery from `PAL3`
    palettes; `g3Skis` builds hulls (`g3SkiGeo`) and jointed riders (`g3RiderGeo`, `RIG`, `g3IK`, `g3Pose`);
    `g3Emit` spray; `render3` camera and frame; fireworks and podium (`g3Fw*`, `g3Cer*`); racers' own models
    (`MODELS`, `g3Models`, `g3UseModels`).
  - `arcade.js`: the item race and the crate run. `party.js`: the win celebration and the award ceremony.
- `src/index.html` (markup, `/*@css*/` placeholder), `src/style.css`, `src/sw.js` (offline cache; the build fills
  in its file list and a version hash, so never bump it by hand), `src/manifest.webmanifest`, `src/icons/`.
- `vendor/`: three.js r128 and its r128 `GLTFLoader` (non-module, `THREE.GLTFLoader`). Pinned on purpose: the code
  relies on r128 APIs (`texture.encoding`, linear output). Don't upgrade casually.
- `models/`: racers' models as the game loads them. `models-source/`: the original files they came from.
- `tools/`, `tests/`: see Commands. `dist/` is the built app, committed so it can be hosted as is.

Coordinates: the race runs on a flat map (x, y); in 3D that is (x, z) with y up. A ski points along local +x and
+z is the rider's right. Model files point their bow along +z with the keel at y=0; the loader turns and scales them
to the built hull they replace.

## Modes

- Race: one race, 10 riders, 3 laps (4 at Sundown Stadium), on any course in either direction.
- Tour: 8 race weekends ending at Lake Havasu (`TOUR`). Each weekend is two motos on one course; moto 2 lines up in
  moto 1's finishing order. Moto points (`PTS` 25-20-16-13-11-9-7-5-3-1) add up to the weekend overall, a tie going
  to the better moto 2. The weekend overall pays series points on the same scale. Award ceremony after each weekend
  and a championship ceremony at the end. Saved as `tour12`.
- Drag: reaction-time ladder (quarterfinal, semifinal, final) on a Christmas tree, then tapping trim lights during
  the run. Drag parts in the garage. The rival gets the same machine apart from drag parts.
- Items and Crates: arcade modes in the spirit of Crash Team Racing and Crash Warped, with all-original art and
  no characters from those games.
- Garage: parts, setup, wear and cash, informed by deanstrong.cc. Classes Stock, Limited, Open.
- Difficulty is a pace from 0 to 1; Easy, Medium, Hard and Pro sit on it. Pro is the default and is meant to be hard.

## Racers

`RACERS` in core.js. `name` is shown on the water and in the timing strip, `full` on results and the podium, `num`
on the plates. Real names and numbers: Vanjae Ramgeet #116, Vaylon Ramgeet #3, Garrett Loftin #114, JJ McLean #45,
Chris Macclugage #46, Dustin Charrier #40. Deven, Tory, Andre and GJ have placeholder numbers and no last names.
**Every rating is a placeholder**: don't invent real stats; ask Dustin. A new player rides as Dustin.

## Models

- `MODELS` in r3.js maps a racer's index to a folder: Vanjae (0) has `models/vanjae-116/`, his real #116 ski with
  rider. Deven (2) has `models/green-black/` as a stand-in until Dustin says whose ski it is.
- Each model is one mesh, ski and rider fused, no skeleton. So for a modelled ski `g3Pose` is skipped: the rider tilts
  with the hull but doesn't lean, stand or celebrate, and the podium still uses built riders. Next step Dustin is
  working toward: a model per racer, and a separate rigged rider (Mixamo) so the body can move.
- Budget per ski with rider: 40,000 triangles or fewer, 1024 px textures, about 2 MB after `npm run model`.
- Why `model.json` plus JPEGs instead of `.glb`: the old claude.ai host wouldn't serve `.glb`. Any normal host would,
  but the folder form works everywhere, so it stays.
- The loader hides `createImageBitmap` while parsing, because r128's GLTFLoader mishandles ImageBitmap on some iPhones.
  Textures are read as linear (`texture.encoding = LinearEncoding`) to match how the game uses colours.
- The green-black model has Yamaha and Monster Energy logos printed on it. Fine for sharing with friends; they have
  to come off, or be licensed, before any App Store release.

## Testing

- After any change to core.js, run the sim. A healthy course: 0 rescues, 0 DNF, 0 offCourseSteps at every pace, both
  directions. Hops, air and bumps are fine.
- After visual changes, run `npm test`, then look at the screenshots in `tests/out/`. For more, build with
  `node build.mjs --test`, which exposes `window.__hs` (`state()`, `auto()`, `run(seconds)`).
- Headless Chrome renders with software WebGL. Its frame rate says nothing about a phone, and the auto quality
  drops to its lowest there. For performance, ask Dustin for a screen recording from his phone. His last one held
  60 frames a second, the most a screen recording captures, at the old 2x pixel cap; the 3x top level
  (`QUAL` 3, saved as `o17.q`) is not yet confirmed on his phone.
- Check phone sizes: 440x956 at 3x (his phone) and 390x780. Nothing may scroll sideways.

## Conventions

- Saved data goes through `store`/`load` (try/catch around localStorage). When a saved shape changes, change its key
  (`tour10` to `tour12`, `o9.q` to `o17.q`) rather than migrating.
- Speeds are game units; `MPH` converts for display. Top speeds were brought down 5% earlier because 91 mph looked
  unrealistic: keep them believable.
- Built skis, riders and liveries are original designs. Real liveries come only from models Dustin supplies.
- Write comments as plain sentences about what the code does and why.

## Hosting

`dist/` is the whole app: upload it to any static https host (Netlify Drop, Cloudflare Pages, Vercel, a subdomain
such as holeshot.deanstrong.cc). Installing to the home screen and offline play need https. The old claude.ai link,
https://claude.ai/artifact/CDz3WUr9mC15hBtwL5vFQq, is frozen at the version this project started from and is not
updated by anything here.

## The booth call

`netlify/functions/race-call.mjs` (served at `/api/race-call`) asks Claude (`claude-haiku-5-5`) for a short announcer
call from the race facts `boothCall` in shell.js sends after `finish()`. The key is `ANTHROPIC_API_KEY` in Netlify's
environment, never in the repo. The function takes structured race facts only (no free text), checks the origin
against holeshotgame.netlify.app and its deploy previews, and rate-limits per address. The racers are real people:
the prompt keeps the call good-natured and limited to the facts given, so keep it that way if you change it.

## More Claude writing

`netlify/functions/story.mjs` (served at `/api/story`, same key, origin check and rate limit as the booth call) has
four kinds: `intro` (Preview the race, on the start screen, `buildPreview` from `summary()`), `crew` (Ask the crew
chief, top of the garage, `crewBox`, using `lastRace` from `finish()`), `mag` (Watercraft Weekly on the weekend overall
and the season finale issue on the final standings, `magBox`, drawn into `#extra`, which `board()` clears) and `champ`
(the announcer's line under the championship podium, `champCall`, asked by `startCeremony` when `o.champ`). The first
three come only on a tap; the championship call asks by itself, once a season. `storyBox` draws a button, waiting line
or reply; replies live in `STORY` in memory, never saved. The prompts keep the riders' real-people rule and tell the
crew chief to recommend only listed parts, settings and services within the cash.
