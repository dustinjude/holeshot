# Side Hustle City into the Holeshot repo: handoff

Written 28 Nov 2026 for Claude Code working in `dustinjude/holeshot`. Read this whole file before changing anything.

## What you are being asked to do

Dustin has two games. **Holeshot** is this repo. **Side Hustle City** is a life sim (Sims meets GTA) built as a
claude.ai artifact: 30 days in a city, rent, jobs, hustles, cops, and eight people with relationships that change.
On 26 Nov the two were joined into a working prototype, **Side Hustle Holeshot**, where the city is the life and
Holeshot is the racing. Your job is to bring that into this repo properly.

The prototype was made by string-patching the **26 Nov single-file Holeshot** (the frozen claude.ai artifact).
This repo has moved a long way since: modules, tour weekends of two motos, drag, items, crates, a new roster,
ceremonies, a PWA. **The patches will not apply. Port the intent.** The city code itself needs almost no changes
to its logic, only to the places where it meets the race.

## What is in this folder

    city/city.js      The city: 627 lines, one IIFE, no dependencies. This is the thing to move in.
    city/city.css     Its styles, written for a shadow root (:host).
    city/city.html    Its markup.
    reference/prototype-combined.html     The working prototype. Open it in a browser and play it first.
    reference/holeshot-nov26.html         The Holeshot it was built on, unpatched.
    reference/build.py                    The exact patches, as old-text and new-text pairs. The best spec there is.
    reference/bridge-nov26.js             The bridge code that was appended to Holeshot.
    reference/side-hustle-city-standalone.html   The city before it met Holeshot (street racing, cars). build.py reads it.
    tests/city-stub.html      The city alone, with a fake race that returns a result at once.
    tests/fuzz-city.cjs       Simulated players for city-stub.html (jsdom).
    tests/e2e-prototype.cjs, e2e2-prototype.cjs   Headless Chrome runs of the prototype. The flows to cover here.

To rebuild the prototype: `python3 reference/build.py reference/holeshot-nov26.html reference/side-hustle-city-standalone.html out`.
Every `rep(...)` call in build.py asserts that its target text exists exactly once, so it reads as a checklist.

## How the prototype fits together

- The Holeshot page is underneath, unchanged in structure. The city is `<div id="city">` with a **shadow root**,
  fixed over the whole screen, scrolling on its own (`touch-action: pan-y` on the host; the body keeps
  `touch-action: none`). The shadow root is there because both games style `button`, `.panel`, `.cash`, `.tabs`,
  `.row` and `.pips`.
- The city script is its **own IIFE** and never reaches into Holeshot. Do not join it into the shared game scope:
  it has its own `stage`, `reset`, `render`, `draw`, `tick`, `log`, `open`, `$`, `S`, `P`, `L` and more.
- Everything between them goes through one object, **`window.HS`**, and one flag, **`window.CITYON`**.
- While `CITYON` is true, Holeshot's `frame()` returns at once (no sim, no drawing) and `key()` ignores keys.
- **One wallet.** Holeshot's `gar.cash` became a getter and setter over the city's cash. Rent, parts, shifts,
  hustles and prize money are the same money.

## The bridge the city expects

`city.js` calls exactly these. Keep the names and it runs as is.

| Call | What it does |
| --- | --- |
| `HS.wallet(get, set)` | City hands over its cash. Holeshot reads and writes money only through these. |
| `HS.open(cfg)` | Leave the city and show the pits. `cfg.mode` is `'tour'`, `'open'` or `'garage'`. Sets `CITYON = false`. |
| `HS.info()` | `{round, next, pts, pos, cls, craft, parts, wear}`: motos done, next site name, the player's series points and position, class name, craft name, total part levels, lowest wear. Called on every city render, so keep it cheap. |
| `HS.skip()` | The player missed a moto: the rest of the field shares the points and the tour moves on. |
| `HS.newTour()` | Start a fresh tour, same racer and craft. |
| `HS.strip()` | Take every part off the player's ski (lost a pink slip race). |
| `HS.fresh()` | Set all wear to 100 (a friend serviced it). |
| `HS.offer()` | A part Dex can get: `{i, name, level, cost}` at half price, or `null` if everything is maxed. |
| `HS.grant(i)` | Add one level to part `i` without paying. |
| `HS.resetAll()` | New life: wipe tour and garage. |

`cfg` for `HS.open`: `disc` (parts price multiplier), `svc` (service price multiplier), `purse` (prize multiplier),
`top` and `turn` (small multipliers on the player's top speed and turning), `done(res)`, `exit()`.

- `done(res)` is called once when a race is decided: `{p, prize, tour, site, mpos, dnf, round, tpos}`. `p` is the
  finishing place, `mpos` is where Marcus finished, `round` is motos done after this one, `tpos` is the series
  position after it. The city applies time, energy, respect, bets and relationships from this.
- `exit()` is called when the player leaves the race page. The city shows itself again.

In `garage` mode there is no race: the start button is hidden, parts can be bought, and `exit()` costs an hour.
In `tour` and `open` mode parts cannot be bought (only at Tommy's), but setup and service work.

## What changed inside Holeshot, by intent

Names on the right are where each lives in this repo today (`src/game/shell.js` unless said).

1. **Wallet.** `gar.cash` reads and writes through the bridge; the garage save no longer holds cash. See `gar`,
   `loadGar`, `saveGar`. This changes a saved shape, so use a new key.
2. **Idle while in the city.** First line of `frame()` and of `key()`. Also stop Space and Enter starting a race
   when the start button is hidden.
3. **Prices.** Parts cost times `disc`, service times `svc`, and buying is off unless `mode` is `garage`. See
   `buildGarage` (the drag parts rows, `dbuy`, are new since the prototype and need the same) and `serviceCost`.
4. **Purse.** Prize times `purse` in `finish()` (tour 1, open race 0.3). `dragFinish` pays too.
5. **Rider edge.** `playerMod()` result times `top` and `turn`.
6. **Results lead back to the city.** After a result the only way on is "Back to the city"; no "Race again", no
   "Change setup". `finish()` calls `done(res)`.
7. **No restarts.** The pause plate loses Restart; "Back to setup" becomes "Retire: counts as a DNF", which calls
   `done` with `dnf: 1` and, in a tour, gives the player nothing for that moto.
8. **Racer and craft lock** as soon as the tour is live, in every mode, so parts stay on one ski.
9. **Start plate.** Mode tabs hidden, a "Back to the city" button added, eyebrow says where you are.
10. **Rivals default to Auto** in the city (this repo's default is Pro on purpose: leave that alone outside it).

## What no longer lines up. Ask Dustin before deciding.

1. **Is the city the whole game, or a mode?** The prototype hid Race and Tour: the city was the only way in.
   This repo is an app with five modes. Recommended: add the city as a sixth mode, **Career**, with **its own
   garage and tour saves** (so a free-play Tour cannot advance the career tour and the two wallets stay apart).
   Entering Career swaps to the career copies; leaving swaps back.
2. **The calendar.** The prototype ran 6 motos, one every 5 days, in a 30-day game. The tour here is 9 weekends of
   two motos. Options: a 45-day career with a weekend every 5 days (recommended, simplest); 30 days with a weekend
   every 3; or a shorter career tour. In `city.js` this touches `motoDay` (line 79), the `S.day>30` finale (140),
   `motoCheck` (412), the Lake actions (359), `raceDone` (438), the race-day notice (508), the "Thirty days"
   endings (541) and every `round<6`. A weekend should be one visit: both motos and the ceremony, then back.
   `res` then describes a weekend, and `HS.skip()` skips a whole weekend in the `tour13` shape (`wk`, `m1`, `last`, `hist`).
3. **Marcus.** He is the city's rival rider. The prototype renamed racer index 9 (then "Wildcard") to Marcus,
   stopped the player choosing him, and reported his finish as `mpos`. Index 9 is now Dustin, the default player.
   Marcus needs a slot in the field in Career only. Which racer he replaces, and his ratings, are Dustin's call
   (CLAUDE.md: don't invent ratings).
4. **Drag.** It did not exist in the prototype. It is one against one, which suits Marcus better than "finish
   ahead of him in a ten-ski race": side bets and the pink slip race could be drag runs. The city's old street
   racing was a shift-timing game, so this is close to the original idea. Offer it.
5. **Items and Crates** could be things to do in the city. Optional.
6. **Fonts.** The city uses Bungee and Archivo from Google Fonts. The app works offline, so either ship them in
   `src/` or fall back to the fonts already here.
7. **Who sees it.** The city is written for adults: crime, drinking, fights, dating that fades to black. The
   repo and the hosted app are public, and the rivals on the water carry real friends' names. All city characters
   are invented. Ask Dustin whether Career ships in the public build or behind a switch.

## A suggested shape here

- `src/city/city.js`, `city.css`, `city.html`. In `build.mjs`: write `dist/js/city.js`, and fill two new
  placeholders in `src/index.html` with a `<template id="cityT">` holding the styles and markup. Load `city.js`
  after `game.js`. The offline file list picks it up without help.
- `src/game/bridge.js`, joined at a new `//@bridge` marker near the end of `shell.js`, holding the bridge state and
  `window.HS`. It can call shell functions directly.
- In `--test` builds, add the city to `window.__hs` (its state, and a way to act) so `auto()` and `run()` can
  finish a race started from the city.
- Follow the repo's rules: new save keys instead of migrations, comments as plain sentences, rebuild after edits.

## Inside city.js

- `S` is the whole save (`localStorage` key `shc`). `fresh()` (line 61) is a new life.
- People: `P` holds the eight characters' text; `S.pp[k]` holds each one's **bond** `b`, **trust** `t`, trust
  ceiling `cap`, mood, what you know, what they remember. `stage(k)` turns that into Stranger, Knows you, Friend,
  Close, or Done with you. `TIES` is who talks to whom; `gossip()` carries news along it.
- Time: `tick(hours)` runs the clock; `newDay()` is midnight (money, rent, drift, scheduled events), `dawn()` is
  5am (broken promises), `morning()` is 8am (a new text).
- Texts: `ASK` is the list. Saying yes makes a promise in `S.proms`; `did(need)` keeps one.
- Events wait in `S.pend` and are shown by `EV` when no dialog is open.
- `A()` builds the actions for the place you are in. The Lake and Tommy's Garage are where racing comes in.
- Racing: `motoCheck`, `openRace`, `enterRace`, `raceDone`, `cityBack` (lines 411 to 478). This block and the
  Lake actions are the only parts that should need real rewriting.

## Testing

- `cd tests && npm i jsdom && node fuzz-city.cjs`. Healthy: `errors []` on every line, no `BADTEXT`, no `STUCK`.
  If you change city logic, rebuild a stub page the same way (`STUB` in build.py) and run it again.
- The prototype runs cover: a garage visit and back; an open race to the flag and back; touch scrolling of the
  city; a tour moto with a retirement; the last moto through standings; the ending. Cover the same with
  Playwright in `tests/`, at 440x956 and 390x780, and check nothing scrolls sideways.
- `npm run sim` must be unchanged: nothing here should touch `core.js` physics.
- Check by hand that the other modes behave exactly as before when Career is not in use.

## Done means

- Career opens from the app, plays a full career on a phone, and saves.
- Race weekends start from the Lake on their day and return a result; missing one costs the points.
- One wallet in Career. Parts only at Tommy's, at his prices.
- No restart of a started race in Career.
- Race, Tour, Drag, Items and Crates are untouched outside Career, with their own saves.
- `npm run build`, `npm run sim`, `npm test` pass.

## What is not proven

- No person has played the prototype for balance. Prize money against rent and parts prices is a guess, and so
  is how fast bonds grow. The test player rode hands-off and came last.
- The prototype was checked in headless Chrome only, in both the 3D and the flat view. Never on a phone.
- A page reload during a race cancels it with no penalty. Known, left alone.
