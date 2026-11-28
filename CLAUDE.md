# Holeshot: notes for Claude Code

Jet ski closed-course racing seen from low behind your ski, built for phones, inside a life sim, **Side Hustle City**,
which is the main game: the app opens in the city and the racing is reached from it. A static web app (three.js r128, no
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
- `npm run test:city`: plays the city in headless Chrome and goes through it into the garage, an open race, a drag run, a
  whole race weekend, a retirement, a missed weekend, and free play. It drives time with the test hooks, so it is not
  slowed by software rendering.
- `npm run model -- <file.glb> <name>`: shrink a 3D model into `models/<name>/` (see Models).

## Layout

- `src/game/*.js`: the game. `build.mjs` joins them into one strict-mode IIFE, `dist/js/game.js`: `core.js` first,
  then `shell.js`, which has one marker line each (`//@arcade`, `//@draw`, `//@r3`, `//@party`, `//@bridge`) where those files
  are inserted. Everything shares one scope, so a function in one file calls one in another directly, and top-level
  `const`s are initialised in that order.
  - `core.js`: game logic, no DOM. Racers, crafts, garage parts, the 11 courses in `SITES` plus the drag strip,
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
  - `bridge.js`: everything the city needs from the racing, as `window.HS`, and the switch between the city's garage and
    tour and free play's (`cityOn`, `cityOff`, `PKEY`). See Side Hustle City below.
- `src/city/`: Side Hustle City. `city.js` is one closure of its own, built to `dist/js/city.js` and loaded after the
  game. **Do not join it into the game's scope**: it has its own `stage`, `reset`, `render`, `tick`, `log`, `S`, `P`, `L`.
  `city.css` and `city.html` are put into a `<template id="cityT">` in the page (`/*@citycss*/`, `<!--@city-->`), which
  the script copies into a shadow root on `<div id="city">`, so the city's styles and the race's cannot meet.
- `src/index.html` (markup, `/*@css*/` placeholder), `src/style.css`, `src/sw.js` (offline cache; the build fills
  in its file list and a version hash, so never bump it by hand), `src/manifest.webmanifest`, `src/icons/`.
- `vendor/`: three.js r128 and its r128 `GLTFLoader` (non-module, `THREE.GLTFLoader`). Pinned on purpose: the code
  relies on r128 APIs (`texture.encoding`, linear output). Don't upgrade casually.
- `models/`: racers' models as the game loads them. `models-source/`: the original files they came from.
- `tools/`, `tests/`: see Commands. `dist/` is the built app, committed so it can be hosted as is.

Coordinates: the race runs on a flat map (x, y); in 3D that is (x, z) with y up. A ski points along local +x and
+z is the rider's right. Model files point their bow along +z with the keel at y=0; the loader turns and scales them
to the built hull they replace.

## Side Hustle City

The main game. A season in a city: $200, a studio apartment, a bare ski, rent every week, jobs, hustles, heat and
cops, and eight people (Rosa, Nia, Dex, Marcus, Sal, June, Tommy, Kowalski, all invented) who each hold a bond with you
and a trust in you that move separately, remember what you did, text you for help, and talk to each other. It is
written for adults: crime, drinking, fights, dating that fades to black. The racers on the water are the real roster;
none of them is a character in the city.

- The city is a full-screen layer over the race page. While it shows, `window.CITYON` is true and `frame()` and `key()`
  do nothing. The city never touches the game's internals: it calls `window.HS` (bridge.js) and nothing else.
- **One wallet.** In the city `gar.cash` is a getter and setter over the city's money (`HS.wallet`), so rent, parts,
  shifts, hustles and prize money are the same money. The city starts with $200, not $3,500.
- **Its own garage and tour**, saved under `city.` (`PKEY`): `city.garage1`, `city.tour13`, `city.racer`, `city.craft`,
  `city.paint`, `city.o8.pace`. Free play keeps its own. The city's own save is the localStorage key `shc` (not under
  `holeshot.`). Rivals are on Auto in the city; the Pro default is for free play.
- **The calendar.** A race weekend every five days (`motoDay` in city.js), so the nine weekends make a 45-day season
  (`S.life`). At the Lake on race day the city opens the pits (`HS.open({mode:'tour'})`); both motos, the ceremony and
  the standings run as in Tour, and then the result goes back (`done(res)`). Miss the day and `HS.skip()` gives the field
  the points for the whole weekend.
- **Other ways in.** `open`: one race for a small purse (0.3), once a day. `drag`: one run against Marcus for a side bet
  made in the city, or pink slips; he is not on the roster, the rival ski is renamed and repainted (`MARCUS`), and
  `level` 0 to 2 sets his drag parts. `garage`: Tommy's Garage, the only place parts can be bought in the city, at
  `disc` (15% off as his friend, 25% once you own the place); `svc` cuts service by wrenching skill.
- **No restarts in the city.** The pause plate offers "Retire: counts as a DNF" (`hsRetire`), which in a tour ends the
  weekend. Racer and craft lock once the city's tour is live, so the parts stay on one ski.
- `tourScore(order, out)` in shell.js books one moto; `finish()`, `hsSkip` and `hsRetire` all go through it.
- Free play (Race, Tour, Drag ladder, Items, Crates) is the "Free play" button at the top of the city, and "Back to
  the city" on the setup plate returns. Check after any change to shell.js that free play behaves as it did.
- Inside city.js: `S` is the save; `P` the characters' text and `S.pp` their state; `stage(k)` the relationship;
  `tick`, `newDay`, `dawn`, `morning` the clock; `ASK` the texts and `S.proms` the promises; `EV` the queued events;
  `A()` the actions for the place you are in; `motoCheck`, `dragMarcus`, `enterRace`, `raceDone`, `dragDone`, `cityBack`
  where it meets the racing.
- Not proven: nobody has played a whole season for balance (prize money against rent and parts, how fast bonds grow),
  and the city has not been judged on the phone yet.

## Modes

These are free play, and what the city's race weekends, open race and drag runs are built on.

- Race: one race, 10 riders, 3 laps (4 at Sundown Stadium, 1 at Jet Around Cayman), on any course in either direction.
- Jet Around Cayman (`cayman`): after the real endurance race once round Grand Cayman (Easter Monday, from Seven
  Mile Public Beach, heading north, so clockwise). One lap of a freehand island (`island` outline filled with land in
  `buildCourse`), not to scale: about 2:40 a lap. Rough-water zones off the north coast, East End and Pedro; named
  checkpoints (`cps`) are called out with the time. The real event has a fuel stop and checkpoints with GPS; neither the
  route map nor the distance is published, so the shape is a guess from race reports.
- Tour: 9 race weekends ending at Lake Havasu (`TOUR`), with Jet Around Cayman as round 2. Each weekend is two motos on one course; moto 2 lines up in
  moto 1's finishing order. Moto points (`PTS` 25-20-16-13-11-9-7-5-3-1) add up to the weekend overall, a tie going
  to the better moto 2. The weekend overall pays series points on the same scale. Award ceremony after each weekend
  and a championship ceremony at the end. Saved as `tour13`.
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
- After any change to the city or to bridge.js, run `npm run test:city`. `npm test` (the racing smoke test) steps out
  of the city to free play first; on a machine with only software rendering it can time out waiting for frames at 3x.

## Conventions

- Saved data goes through `store`/`load` (try/catch around localStorage). When a saved shape changes, change its key
  (`tour12` to `tour13`, `o9.q` to `o17.q`) rather than migrating.
- Speeds are game units; `MPH` converts for display. Top speeds were brought down 5% earlier because 91 mph looked
  unrealistic: keep them believable.
- Built skis, riders and liveries are original designs. Real liveries come only from models Dustin supplies.
- Write comments as plain sentences about what the code does and why.

## Hosting

`dist/` is the whole app: upload it to any static https host (Netlify Drop, Cloudflare Pages, Vercel, a subdomain
such as holeshot.deanstrong.cc). Installing to the home screen and offline play need https. The old claude.ai link,
https://claude.ai/artifact/CDz3WUr9mC15hBtwL5vFQq, is frozen at the version this project started from and is not
updated by anything here.
