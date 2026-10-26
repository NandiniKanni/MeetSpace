# MeetSpace – frontend

A React + Vite frontend for your Zoom-style video-conferencing project.
It talks to your existing Express + MongoDB + Socket.IO backend and uses **WebRTC** for audio/video.

> The product name is **MeetSpace**. To rename it, change `VITE_APP_NAME` in `.env`
> (or the fallback in `src/config.js`).

---

## 1. Read this first: what was checked, and what was not

This frontend was written from the backend code you pasted:

- ✅ **`usercontroller.js`** – `login` and `register` (field names, status codes, responses)
- ✅ **Socket.IO manager** – `join-call`, `user-joined`, `user-left`, `signal`, `chat-message`

These were **not visible**, so nothing here depends on guesses about them:

- ❓ `app.js` – so I don't know the **port** or the **path** where the user routes are mounted
- ❓ `users.routes.js` – so I don't know the exact **URLs** (`/login`, `/register`)
- ❓ `meetingmodel.js`, `usermodel.js`, `package.json`

**Action for you:** open `backend/src/app.js` and find a line like
`app.use("/api/v1/users", userRoutes)` and `server.listen(8000)` (or `app.set("port", ...)`).
Then put the right values in `.env` (see section 3). If the path is wrong, the login page will tell you
to check `VITE_API_USERS_PATH`.

---

## 2. Run it (two terminals)

You need Node.js 18 or newer.

**Terminal 1 – backend** (use the script you normally use; check `backend/package.json`):

```bash
cd backend
npm run dev        # or: npm start / node src/app.js
```

**Terminal 2 – frontend:**

```bash
cd frontend
copy .env.example .env      # Windows (cmd).  PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**.

The frontend starts even if the backend is off. You will just see friendly "cannot reach the server" messages.

Other commands: `npm run build` (production build into `dist/`) and `npm run preview`.

---

## 3. Settings (`.env`)

| Variable | Meaning | Default |
| --- | --- | --- |
| `VITE_API_URL` | Where your Express server runs | `http://localhost:8000` |
| `VITE_API_USERS_PATH` | Where `users.routes.js` is mounted in `app.js` | `/api/v1/users` |
| `VITE_SOCKET_URL` | Where Socket.IO runs (usually the same server) | same as `VITE_API_URL` |
| `VITE_APP_NAME` | Product name in the UI | `MeetSpace` |

Everything in a `VITE_` variable is visible to anyone using the site. **Never put passwords or secrets here.**
`.env` is already in `.gitignore`; only `.env.example` (placeholders) should be committed.
After changing `.env`, stop and restart `npm run dev`.

---

## 4. How the frontend matches your backend

### REST (from `usercontroller.js`)

| Action | Request | Responses the frontend handles |
| --- | --- | --- |
| Login | `POST {path}/login` with `{ username, password }` | `200 { token }`, `400`, `401`, `404` |
| Register | `POST {path}/register` with `{ name, username, password }` | `201` success, `302` "User already exists", anything else → error |

Things worth knowing about the backend:

- `login` returns **only a token** (no name/profile). The frontend saves the token and the username you typed in `localStorage`.
- No route you've shared **checks** that token yet, so it is stored but not sent anywhere. When you add protected routes, add an `Authorization` header in `src/services/api.js`.
- `register` answers "already exists" with status **302** (normally a redirect code – `409` would be more correct). The frontend handles the 302.
- In `register`'s `catch` block, `res.json(...)` is called **without a status**, so server errors come back as `200`. The frontend treats any non-`201` as a failure, so you won't see a fake "success".
- After registering, the frontend logs you in automatically (register doesn't return a token).

### Socket.IO (from your socket manager)

| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `join-call` | room name (we send the meeting ID) |
| server → client | `user-joined` | `(joinedSocketId, allSocketIdsInRoom)` – sent to **everyone, including the joiner** |
| server → client | `user-left` | `(leftSocketId)` – sent when someone disconnects |
| client ↔ server | `signal` | send `(toSocketId, message)`, receive `(fromSocketId, message)` |
| client ↔ server | `chat-message` | send `(text, senderName)`, receive `(text, senderName, senderSocketId)`; history is replayed on join |

Because the server only knows socket IDs (no names), the frontend sends each person's **name and mic/camera state**
inside `signal` messages. That needs **no backend change**, because the server relays any message you give it.

---

## 5. Folder tour

```text
frontend/
├── index.html              the one HTML page React fills in
├── vite.config.js          Vite settings
├── .env.example            placeholder settings (copy to .env)
├── public/favicon.svg
└── src/
    ├── main.jsx            starts React, wraps the app in router + providers, loads CSS
    ├── App.jsx             the list of pages (routes)
    ├── config.js           reads .env (API URL, socket URL, app name, STUN server)
    ├── services/           code that talks to the outside world (no screens here)
    │   ├── api.js            login / register requests
    │   ├── socket.js         creates the Socket.IO connection
    │   ├── meetingId.js      make / validate / parse meeting IDs and links
    │   ├── recentMeetings.js recent meetings saved in this browser
    │   └── clipboard.js      "copy link"
    ├── context/            data shared by many components
    │   ├── AuthContext.jsx   who is logged in (token + username)
    │   └── ToastContext.jsx  the small pop-up notifications
    ├── hooks/              reusable logic
    │   ├── useLocalMedia.js  camera + microphone + on/off switches
    │   └── useMeetingRoom.js socket + WebRTC + chat + screen sharing  (the big one)
    ├── pages/              one file per screen
    │   ├── LoginPage.jsx, RegisterPage.jsx
    │   ├── DashboardPage.jsx, HistoryPage.jsx
    │   ├── MeetingPage.jsx   lobby first, then the room
    │   └── NotFoundPage.jsx
    ├── components/         small building blocks (Button, TextField, ConfirmDialog, Sidebar ...)
    │   ├── auth/  dashboard/  meeting/   (components grouped by screen)
    └── styles/             plain CSS: variables.css (colours), base.css, auth.css, dashboard.css, meeting.css
```

---

## 6. React ideas in simple language

**Component** – a function that returns what should appear on screen (JSX looks like HTML).
`Button.jsx` is a component; `DashboardPage.jsx` is a component that uses `Button` inside it.

**Props** – the inputs of a component, like function arguments.
`<Button variant="danger" icon="trash">Delete</Button>` passes `variant` and `icon` as props.

**State (`useState`)** – a value the component remembers. When you change it, React redraws the component.
`const [username, setUsername] = useState('')` – `username` is the value, `setUsername` changes it.

**Effect (`useEffect`)** – code that runs *after* the screen is drawn, for things outside React:
connecting a socket, starting the camera, adding a keyboard listener.
The function you `return` from an effect is the **cleanup**; it runs when the component disappears
(that's how we close sockets and stop the camera).

**Ref (`useRef`)** – a box that holds a value **without** redrawing the screen when it changes.
We use refs for the socket and the WebRTC connections.

**Hook** – a function whose name starts with `use` (`useState`, `useLocalMedia`...). Our own hooks keep
big pieces of logic out of the screen components.

**Context** – a way to share data (like "who is logged in") with any component without passing props down
through every level. Use it with `const { username } = useAuth()`.

**Routing (React Router)** – shows a different page for each address:
`/login`, `/register`, `/dashboard`, `/history`, `/meeting/:meetingId`. `:meetingId` is a variable part of the address,
read with `useParams()`. Logged-in pages are wrapped in `ProtectedRoute`, which sends visitors to `/login`.

### Socket.IO vs WebRTC (important!)

- **Socket.IO** only carries *small messages* through your server: who joined, chat, and "signals".
- **WebRTC** carries the *actual video and audio*, directly from browser to browser.
- A **signal** is a message two browsers use to agree how to connect (an *offer*, an *answer*, and *ICE candidates*,
  which are possible network routes). Your server just forwards them.

How a new person connects (see the comments at the top of `src/hooks/useMeetingRoom.js`):

1. New person emits `join-call` with the meeting ID.
2. Server sends `user-joined` with the list of everyone in the room.
3. The newcomer sends an **offer** to each person already there; each replies with an **answer**.
4. They swap ICE candidates, WebRTC connects, and video appears.

Leaving = closing the socket (your server has no `leave` event). The server then tells everyone `user-left`,
and each browser closes that person's WebRTC connection.

---

## 7. How to test each feature

Use **two browser tabs/windows** (a second one in a private/incognito window works well as a "guest").
Allow camera and microphone when asked.

| Feature | How to test |
| --- | --- |
| Register | Go to `/register`, create an account. You should land on the dashboard. Registering the same username again shows "already taken". |
| Login / sign out | Sign out from the sidebar (confirm dialog), then log in again. Wrong password shows an error. |
| New meeting | Dashboard → **New meeting** → opens the camera preview (lobby). |
| Pre-meeting | Toggle mic/camera, deny permission in the browser to see the error + **Try again**, then **Join meeting**. |
| Join by ID/link | Copy the link in tab 1. In tab 2 paste the **ID or the full link** into the dashboard's join box (or open the link directly). |
| Participants + join/leave notices | When tab 2 joins you should see a toast in tab 1 and the participant in the panel; closing tab 2 shows a "left" toast. |
| Video / audio | Both tabs should show each other's video. Mute/unmute and camera off/on should be reflected in the other tab. |
| Chat | Open the chat panel, send a message in each tab. A late joiner sees the earlier messages (history). |
| Screen sharing | Click **Share screen**, choose a window; the other tab should show it. Stop with the button or the browser's own "Stop sharing". |
| Connection status | Stop the backend while in a meeting: the badge changes to *Reconnecting*. Start it again to reconnect. |
| Responsive | Resize the window or use the browser's device toolbar (F12). |

---

## 8. What works, what is untested, and what needs backend work

### Verified while building (automated, outside a browser)

- `npm run build` succeeds and `npm run dev` starts **without** the backend.
- Every route renders without crashing (server-side render smoke test).
- The API layer handles the exact status codes/bodies of your `usercontroller.js` (tested against a mock that
  mimics them – **not** against your real server or database).
- The Socket.IO events and payloads used by the frontend work against a copy of your socket manager code:
  join, `user-joined` lists, signal relay, chat broadcast + history, `user-left`, room isolation.

### Not tested (needs a real browser, camera or your running backend)

- How the pages look and behave visually in a browser, and the responsive layout.
- Camera/microphone permission flows, real **WebRTC video/audio between browsers**, and **screen sharing**.
- Login/registration against your real server and MongoDB.
- Whether your Express server allows requests from `http://localhost:5173` (CORS, see below).

Treat the video-call features as **implemented but not yet confirmed** until you try them with two tabs.

### Backend notes (nothing is required for a basic call, but you should know)

1. **CORS for REST:** Socket.IO has `origin: "*"`, but I could not see your Express setup. If login fails with a CORS
   error in the browser console, add `app.use(cors())` (package `cors`) in `app.js`.
2. **Routes:** confirm the mount path in `app.js` and set `VITE_API_USERS_PATH`.
3. **No meeting history API:** `usercontroller.js` only exports `login` and `register`. "Recent meetings" are saved in
   this browser (localStorage), not in MongoDB. To store history per user, add endpoints (e.g. save/get meetings) and
   call them from `src/services`.
4. **Token is never checked:** and sockets are not authenticated, so anyone with a link can join a room.
   For real access control, verify the token on the server (REST middleware and in Socket.IO's `io.use`).
5. **Meetings are not created in the database:** a room exists in server memory from the first `join-call`.
   Chat history and rooms disappear when the server restarts.
6. **No `leave` event:** leaving works through disconnecting, which is fine here.
7. **Strict networks:** only a STUN server is configured (`src/config.js`). Calls between people on very restrictive
   networks (some offices/mobile carriers) may fail without a **TURN** server.
8. Mesh WebRTC (everyone connects to everyone) is great for small meetings, roughly up to 4–6 people.
   Larger meetings need an SFU server.
9. `register` returns `302` for "already exists" and `200` on errors (see section 4). Consider `409` and `500`;
   the frontend already copes with both the current and the corrected codes.

---

## 9. Troubleshooting

- **"Cannot reach the server"** – backend not running, or `VITE_API_URL` / port is wrong. Restart `npm run dev` after editing `.env`.
- **"Login URL not found"** – fix `VITE_API_USERS_PATH` to match `app.js`.
- **CORS error in the console** – see backend note 1.
- **No camera on another device** – browsers only allow the camera on `https://` or `http://localhost`. To test on a phone,
  use an https tunnel and point `VITE_SOCKET_URL`/`VITE_API_URL` at your computer's address.
- **Camera in use** – close other apps/tabs using the camera, or press **Try again**.
- **Black/Connecting... tile that never connects** – check the browser console and the Network tab for the socket; see the TURN note above.
