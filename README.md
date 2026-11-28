# Holeshot

Side Hustle City and jet ski closed-course racing from behind your ski. The app opens in the city: a season of rent,
jobs, hustles and people, with a race weekend every five days, your ski built at Tommy's Garage, and one wallet for all
of it. The city is written for adults and asks once: crime, violence, drugs, strong language. It has runs
from Harbor Patrol on the ski, product to move, a wanted level, a man called Vance who wants the docks, and people you
can talk to in your own words, with Claude writing their replies. Its places and people are photographs, made once by an
image model and kept, with drawings underneath for anywhere a photograph is missing. It's laid out for a phone: tabs for where you are, the
map, your hustles, the people and yourself, a phone with apps, and a recap every morning. Free play has the racing on its own: race, tour weekends with an award ceremony, drag ladder, garage, and two
arcade modes. Runs in the browser and installs to a phone's home screen as an app that works offline.

## Work on it

Open this folder in Claude Code and describe the change. CLAUDE.md tells it how the game is put together and how to
test it.

## Play it on your computer

Needs Node.js 22 or newer (`node -v` to check; Claude Code can install it). From this folder:

    npm start

Then open http://localhost:8000. It also prints an address you can open on your phone while it's on the same Wi-Fi.

## Put it online and on your phone

The `dist` folder is the whole app. Upload it to any static https host:

- **Netlify Drop:** go to app.netlify.com/drop and drag the `dist` folder onto the page. You get a link right away.
- **Your own domain:** host `dist` and point a subdomain at it, for example holeshot.deanstrong.cc.

Talking to characters in your own words needs the site to be on Netlify from this repository (not a dragged folder): the
replies come from a small function, `netlify/functions/talk.mts`, which uses Netlify's AI Gateway and spends the site's
Netlify credits. Everything else works on any host, and the game falls back to its scripted lines without it.

The photographs need the same: they are made by `netlify/functions/artmake.mts` through the AI Gateway, the first time
anyone's screen asks for each one, and kept in Netlify Blobs. That costs about 7 cents of credits a picture and about $5
for all 65, once; after that they are served like any other image. On another host, or with a dragged folder, the city is
drawn instead. To stop any more being made, set the environment variable `HS_ART` to `off` in Netlify and redeploy. You,
in the city, has a Photos/Drawn switch and a sheet of every photograph made so far.

Then on the iPhone, open the link in Safari, tap Share, then Add to Home Screen. It opens full screen with its own
icon, and after the first visit it plays with no connection. Upload a new `dist` after changes; installed copies
update themselves.

## Add a racer's model

    npm run model -- path/to/their-ski.glb their-name

Then ask Claude Code to give that racer the model.
