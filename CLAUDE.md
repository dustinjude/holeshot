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
- `npm run test:season`: bots play whole seasons of the city (racing stubbed) and report crashes, dead ends, and how the money
  and the heat ran. `node tests/season.mjs 40 --list` plays more and lists every dialog seen.
- `npm run test:talk`: checks the function that writes the characters' live lines, without the network.
- `npm run test:art`: checks the photographs on the server side without Netlify or the network: the list of pictures and what
  their prompts must and must not say, made-once-and-kept, the lock, giving up after failures, and the call to the image model.
- `npm run test:photo`: plays the city with photographs in headless Chrome against a stand-in server with placeholder
  pictures: which picture each place, hour and mood shows, the fallbacks, the Photos/Drawn switch, the offline cache.
- `node tools/chase.mjs [site]`: runs from the law in Node, for tuning the `CHASE_` constants in core.js.
- `npm run model -- <file.glb> <name>`: shrink a 3D model into `models/<name>/` (see Models).

## Layout

- `src/game/*.js`: the game. `build.mjs` joins them into one strict-mode IIFE, `dist/js/game.js`: `core.js` first,
  then `shell.js`, which has one marker line each (`//@arcade`, `//@draw`, `//@r3`, `//@party`, `//@run`, `//@bridge`) where those files
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
  - `run.js`: runs from the law, reached only from the city: what the player sees and hears and what the city is told.
    The logic is in core.js (`runGrid`, `chaseStep`, and `aiDrive` for a ski marked `hunt`).
  - `bridge.js`: everything the city needs from the racing, as `window.HS`, and the switch between the city's garage and
    tour and free play's (`cityOn`, `cityOff`, `PKEY`). See Side Hustle City below.
- `src/city/`: Side Hustle City. `city.js` is one closure of its own, built to `dist/js/city.js` and loaded after the
  game. `build.mjs` joins `art.js`, `photo.js`, `ui.js`, `hustle.js`, `life.js`, `street.js` and `talk.js` into it at their `//@name`
  lines, and `cast.json` at `/*@cast*/`, so they all share its scope. **Do not join it into the game's scope**: it has its own `stage`, `reset`, `render`, `tick`, `log`, `S`, `P`, `L`.
  `city.css` and `city.html` are put into a `<template id="cityT">` in the page (`/*@citycss*/`, `<!--@city-->`), which
  the script copies into a shadow root on `<div id="city">`, so the city's styles and the race's cannot meet.
- `netlify/functions/`: `talk.mts` (live lines), `art.mts` (serves the photographs) and `artmake.mts` (makes them, in the
  background). `netlify/lib/art.mts` is shared by the last two and is not a function: the list of pictures, their prompts, and
  the making and keeping. Functions need Node 22 (`NODE_VERSION` in netlify.toml), because `@netlify/blobs` does.
- `src/index.html` (markup, `/*@css*/` placeholder), `src/style.css`, `src/sw.js` (offline cache; the build fills
  in its file list and a version hash, so never bump it by hand; photographs go in a cache of their own that outlives
  builds), `src/manifest.webmanifest`, `src/icons/`.
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
- **The screen** (rebuilt for phones in the second pass): a top bar that stays put (clock, cash, wanted stars, the phone,
  five meters) and five tabs at the foot. **Here** (`hereView` in ui.js): a lit picture of the place (`scene` in art.js),
  the faces of whoever is there (tap one to talk: `talkTo`), the newest log line, the most pressing thing elsewhere, and
  the place's actions. **Map** (`mapView`, `mapBase`): the city by the hour, faces where people are, a marker where something
  is waiting, a patrol car after dark at two stars and a boat at three; tapping a place walks the marker there (`travel`)
  and switches to Here. **Hustles** (`hustleView` in hustle.js): every way to make money. **People** (`peopleView`): faces,
  bond and trust, where each one is now. **You** (`youView`): the aim, money, skills, your life, the street log, Free play
  and New life. The **phone** (`phoneView`, `PH`): Messages, Clout, Runner, Bank, News, Map, and Pike the lawyer once the
  heat is on. Dialogs come up from the bottom and show the face of whoever they're about (`whoOf`).
- **Faces** (`FACE`, `face(k, mood, size)` in art.js): every person, plus Reyes, Vance, Lena, Fitz, Carol, the IA woman and
  a generic crew, drawn from a spec, with four expressions (up, flat, down, cold). All original.
- **Who is where** (`SCHED`, `where(k)` in ui.js): each person keeps hours across the city. Talk buttons per place are gone;
  you talk to whoever is there. Marcus has to be at the ramp for a drag run.
- **Pop-ups** (`snap`, `deltas`, `toast`, `did1`): every tap that does something is wrapped in a before and after snapshot;
  money, heat, rep, followers, skill levels and each person's bond and trust pop up when they change. Overnight changes go
  to the **morning recap** (`EV.recap`, queued from `newDay`): yesterday's money, heat, people, the radio, today's happening
  and the top of the list. Quiet synth sounds go with them; the speaker button in You turns them off (`shc.snd`).
- **Next up** (`goals()` in ui.js, `GL` once per render): race day, promises, texts, rent, Sal, a clip to post, today's
  happening, story beats waiting elsewhere (actions added with `hot` 2 in `A()`), the aim, and a nudge when nothing is
  pressing. It drives the "Next" line on Here, the list under the map and the map's markers.
- **Side hustles** (hustle.js): **Clout** (`S.cl`): races, drag wins, fights, getaways, the court and stunt sessions at the
  Lake make clips (`clip`); posting one (`post`) brings followers (bigger the better the clip, sometimes viral; a getaway
  clip brings heat), and invented sponsors (`SPON`) sign you at follower thresholds and pay every rent day while you keep
  their terms (`sponsorWeek`). **Runner** (`S.gig`): delivery shifts from anywhere, about diner pay by the hour in the
  truck, a rating to keep up, things that happen on a shift (`GIG`). **Tuning** (`S.tn`): once a day at Tommy's with
  Wrenching 1: mild, hot or race maps, the hotter the riskier.
- **Aims and happenings** (life.js): the aim (`S.asp`, `ASP`) is picked on day 1 and changeable from You; if you make it,
  the season ends on it (`aimVerdict`). Happenings (`S.hap`, `HAP`) are rolled overnight: a block party at the court, a boat
  show at the Lake, a double-purse fight night, checkpoints after dark, Sal paying top dollar.
- Inside city.js: `S` is the save; `P` the characters' text and `S.pp` their state; `stage(k)` the relationship;
  `tick`, `newDay`, `dawn`, `morning` the clock; `ASK` the texts and `S.proms` the promises; `EV` the queued events;
  `A()` the actions for the place you are in; `motoCheck`, `dragMarcus`, `enterRace`, `raceDone`, `dragDone`, `cityBack`
  where it meets the racing.
- Not proven: no person has played a whole season. The bots finish seasons without crashes or dead ends, and a bot that
  works and races ends a season with a few thousand dollars, but they cannot say whether it is fun, whether the chase is
  fair in the hand, or how the phone layout feels. The live lines have never been called for real from here: the function's
  logic is tested with a fake client, and the first real call will be on the deployed site.

### The street, runs from the law, and live lines

- **Runs from the law** (`HS.open({mode:'run', run:{type, name, site, rev, laps, cops, level, pace}})`). `type` is `drop` (a
  load on the ski: every ram and crooked landing costs some of it) or `chase` (nothing to lose but the law). It skips the
  pits and goes straight to the line. Patrol skis (`cop`, `hunt`) launch behind at intervals, steer at the player, ram, drop
  back and come again. `wd.run.bust` is the gauge: it fills while one is within `CHASE_R`, fastest when the player is slow,
  jumps on a ram, drains in clear water; at 100 they have you. The city is told `{kind:'run', ok, how:'made'|'lost'|'bust'|
  'quit', cargo, hits}`. `lawFor()` in street.js turns the wanted level into how many patrol skis and how good (1 at level 0
  up to 4 at level 3). Tuned with the Node bot only: a bare ski should cope with one or two stars, three wants parts, five
  wants a built ski. Not yet felt by a person on a phone.
- **`src/city/street.js`** (joined into city.js at `//@street`, state in `S.z`): Dex's package and night runs by water, a
  getaway from a stop at the docks or the Lake, product to buy from Dex and sell around town (`GOODS`, `SPOTS`, prices move
  daily), using it (habit, crash), a lawyer on the phone, detectives at three stars, a respray when Harbor Patrol knows the
  ski, somewhere better to live (`PAD`), work from Sal (collections, the marina job), blackjack and a stranger at the Low
  End after 9, a gun (`piece`) that changes how being cornered ends, morning radio (`news()`), and Vance (`S.z.v`, see the
  comment above `noDex`): he wants the docks, Dex can die, and it ends by the book (Kowalski), in fire (allies), or with you
  holding the docks for him. One big score late on, the Second Wind (`bigScore`): a crew that takes a cut, then a run with
  the bag. The first raid costs a week and half the money; the second is the end.
- **Live lines** (`src/city/talk.js` at `//@talk`, `netlify/functions/talk.mts`, served at `/api/talk`): "Say something in your
  own words" in any conversation. Claude writes the reply in character, through Netlify's AI Gateway, so there is no key in
  the repo or the browser. The rules are in the function: adults, strong language and crime are in; **nothing sexually
  explicit** (Anthropic's Usage Policy rules out sex acts and erotic chat, with no exception for adult products), no
  real-world how-to, no real people. Do not loosen them. The browser sends short fields only; the characters (`cast.json`,
  shared with the city through `/*@cast*/`) and the sentences for world facts (`FLAGS`) live on the server. Replies are forced
  into `{say, bond, trust, mood, note}`, clamped on both sides, escaped before they reach `innerHTML`, capped per visit, per
  day and per person, and rate-limited per visitor. With no connection or no gateway the option disappears.
  **It spends the site's Netlify credits**: a small model, a few hundred tokens a line. `HS_TALK_MODEL` overrides the model.
- **18 or older**: the city asks once (`shc.adult`); saying no leaves free play. The real roster stays out of every storyline.

### Photographs

The city's places and people are photographs where one exists, and the drawings in art.js everywhere else.

- **What they are.** 65 pictures (`CATALOG` in `netlify/lib/art.mts`): each place by day and by night, four homes (bare studio,
  furnished studio, one-bedroom, lake house), a block party, fight night, race day and the boat show, and a portrait of each
  of the eight people in each of four moods plus Reyes, Vance, Carol, the IA woman and a generic crew. Night pictures, events
  and moods are made by editing the first picture (`from`), so a place stays the same place and a face the same person.
- **How they are made.** By an image model (Gemini, `MODELS`, `HS_ART_MODEL` to override) through Netlify's AI Gateway, so
  there is no key anywhere. `POST /api/art-make {key}` (artmake.mts, a background function, because a picture can take longer
  than the 60 seconds an ordinary function gets) makes one picture if nobody has, and keeps it in the site-wide Blobs store
  `art`, which deploy previews and the live site share. **This spends the site's Netlify credits**: about 7 cents a picture,
  about $5 for all 65, once. The guard rails are in the lib: only listed pictures, each once, a lock, three failures and a
  picture is left alone for a week, and `HS_ART=off` stops all making (kept pictures are still served).
- **How they are served.** `GET /api/art` (art.mts) says which exist, are being made, or have been given up on. A picture's
  address is `/api/art/<tag>/<name>`; the tag is a hash of its prompt, so changing a prompt makes a new picture with a new
  address and nothing has to be purged. The city never shows that address directly: it asks the Image CDN for a small WebP
  (`/.netlify/images?url=...`), and falls back to the original, then to the drawing.
- **The city's side** (`src/city/photo.js`, state in `ART`): `face()` and the scene box in `hereView` use a photograph when
  there is one (`photoFace`, `photoScene`, `sceneKeys` picks the picture for the place, hour and what is going on). Pictures
  on screen are asked for first, two at a time, then the everyday ones quietly (`artFrame`); nothing is asked for before the
  18+ answer, while racing, or with drawings chosen. You has the Photos/Drawn switch (`shc.photo`), a count, and a sheet of
  every picture made (`photoWall`). The map and the icons stay drawn.
- **Rules for the prompts.** Every person is an invented adult with a stated age; no real people, no one from the roster, no
  brands or logos, nothing sexual, no recognizable faces in the places. tests/art.mjs checks the words; do not loosen them.
- **Not proven.** No picture has been made yet from here: the sandbox cannot reach the gateway, and deploy previews sit behind
  the Netlify login. The logic is tested against a fake store and a fake model, and the layout against placeholders. What
  the real pictures look like, how long they take, and whether the Image CDN reads them from the function as its docs say
  will first be seen on a deployed site. Review them there (You, "See all") and fix a bad one by changing its prompt.

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
- For screenshots of the city with its real fonts in a sandbox without Google Fonts, `tests/scratch/` (git-ignored) has
  scripts that serve Bungee and Archivo from local copies.
- After any change to the city or to bridge.js, run `npm run test:city` and `npm run test:season`. The city uses
  `Math.random`, so a city test must not depend on a street event not happening on the way somewhere.
- After any change to `netlify/functions/talk.mts`, run `npm run test:talk`.
- After any change to the photographs (`netlify/lib/art.mts`, the two art functions, `src/city/photo.js`, the photo parts of
  sw.js), run `npm run test:art` and `npm run test:photo`. Changing a prompt changes that picture's tag, so the next
  visitor pays for it again: change prompts on purpose, not in passing.
- The sandbox's Chrome is older than the pinned Playwright expects: run the browser tests with
  `CHROME=/opt/pw-browsers/chromium_headless_shell` if Playwright says its browser is missing.
- After any change to the chase in core.js, run `node tools/chase.mjs` as well as the sim: ordinary races must come out
  exactly as before (`node tools/sim.mjs havasu` before and after, compared). `npm test` (the racing smoke test) steps out
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
