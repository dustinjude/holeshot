# Holeshot

Jet ski closed-course racing from behind your ski. Race, tour weekends with an award ceremony, drag ladder, garage,
and two arcade modes. Runs in the browser and installs to a phone's home screen as an app that works offline.

## Work on it

Open this folder in Claude Code and describe the change. CLAUDE.md tells it how the game is put together and how to
test it.

## Play it on your computer

Needs Node.js 18 or newer (`node -v` to check; Claude Code can install it). From this folder:

    npm start

Then open http://localhost:8000. It also prints an address you can open on your phone while it's on the same Wi-Fi.

## Put it online and on your phone

The `dist` folder is the whole app. Upload it to any static https host:

- **Netlify Drop:** go to app.netlify.com/drop and drag the `dist` folder onto the page. You get a link right away.
- **Your own domain:** host `dist` and point a subdomain at it, for example holeshot.deanstrong.cc.

Then on the iPhone, open the link in Safari, tap Share, then Add to Home Screen. It opens full screen with its own
icon, and after the first visit it plays with no connection. Upload a new `dist` after changes; installed copies
update themselves.

## Add a racer's model

    npm run model -- path/to/their-ski.glb their-name

Then ask Claude Code to give that racer the model.
