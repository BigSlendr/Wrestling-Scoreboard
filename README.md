# Wrestling Scoreboard (Static Web App)

## What this app does
A static, offline-capable wrestling scoreboard inspired by the “Wrestling Scoreboard 2.0” PowerPoint macro version. It provides a large scoreboard view, operator controls, quick-score buttons, match outcome logging, undo, and CSV/JSON exports for meet records.

## Run locally
- **Fastest:** open `index.html` directly in your browser.
- **Local server (recommended for service worker caching):**
  ```bash
  python3 -m http.server 8000
  ```
  Then open `http://localhost:8000`.

## Publish with GitHub Pages
1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose branch **main** and folder **/** (root).
5. Save. GitHub Pages will publish `index.html` at your Pages URL.

## Keyboard shortcuts
- **Space**: Start/Stop timer
- **U**: Undo
- **A**: Toggle active side
- **1**: E1
- **2**: NF2
- **3**: NF3
- **4**: NF4
- **T**: T3
- **R**: R2
- **P**: P1
- **Shift+P**: P2
- **Plus/Equals (+/=)**: Increment active side by 1
- **Minus (-)**: Decrement active side by 1

## Meet usage notes
- Use **Fullscreen** for projector/arena displays.
- **Bout controls** support `-100`, `-10`, `-1`, `+1`, `+10`, and `+100` steps (never below 0).
- **Scoring controls** and **Match Outcome** controls both log events against the active side.
- **Outcome acronyms**:
  - **WBD**: Win By Decision
  - **WBMD**: Win By Major Decision
  - **WBTF**: Win By Technical Fall
  - **WBF**: Win By Fall
  - **WBDQ**: Win By Disqualification
  - **WBID**: Win By Injury Default
  - **WBFor**: Win By Forfeit
  - **WBMF**: Win By Medical Forfeit
- **Event log format** is: `Bout Period Side: Action Time`.
  - Scoring entries include points, e.g. `220 Period 2 Green: T3 (+3) 1:16pm`.
  - Outcome entries omit a points suffix, e.g. `220 Period 3 Green: WBD 1:16pm`.
- **Exports** include outcome events and preserve captured mat/bout/period values at event time.
- The app stores state locally so you can refresh without losing bout data.
