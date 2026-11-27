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
    (`MODELS`, `g3Models`, `g3UseModels`); painted ski models (`BASES`, `g3Bases`, `g3UseBases`, `skinPrep`, `skinPaint`).
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

- Painted skis (`BASES` in r3.js): three ski models without riders, `models/ski-blue/`, `ski-116/` and `ski-105/`,
  picked by craft (`BASE_OF`, by `sh.mark`). Each racer's ski is repainted on the phone as a race loads: hull and
  trim colours, two raked slashes, number plates on the sides and hood, the name on the tail. The paint is laid out on
  the 3D shape (`skinPrep` traces every texture pixel back to its spot on the hull), because the models' textures
  are scattered patches. Fittings (seat, mats, bars, hull bottom) keep their light and dark but lose colour, which also
  removes the models' old logos. The built rider rides on top and moves; `g3PutBase` fits the hips, feet and grips to
  the model. The player's ski paints at 1024 px, rivals at 512, one job at a time through `g3Work`. The heavy work
  (`skinPrep`, `skinPaint`, `skinRecolour`) runs in a Web Worker built from those same functions (`SKIN_SRC`,
  `skinCall`), so they must stay self-contained: no `mk`, `T3`, `G` or DOM inside them. Without workers it runs inline.
  The frame-rate governor in `frame()` doesn't sample while `G.skinBusy`, so painting can't lower the saved quality.
- `MODELS` (fused ski-and-rider models, no skeleton, rider can't move) is empty now. `models/vanjae-116/` (his real
  #116 ski) and `models/green-black/` are kept and still ship; `{0:'models/vanjae-116/',2:'models/green-black/'}`
  brings them back.
- Rigged rider (`RIDER`, `models/rider-fly/`, from `models-source/rider-fly.glb`): replaces the built rider's body
  on every ski. `g3Pose` still works out the built rider's joints (hidden), and `g3RigPose` turns the rig's bones to
  match with `g3Aim`, using the rig's own bone lengths. Each racer gets a copy of the skeleton (`g3RiderCopy`) and their
  hull colour on the gear (the model's orange is swapped). Bone names must be the Mixamo-style set in `RIG3`. The
  podium and award ceremony still use built riders, and the back number plate is gone with the built body.
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
