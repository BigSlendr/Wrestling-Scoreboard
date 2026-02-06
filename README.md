# Wrestling Scoreboard (Static Web App)

## What this app does
A static, offline-capable wrestling scoreboard inspired by the “Wrestling Scoreboard 2.0” PowerPoint macro version. It provides a large scoreboard view, operator controls, quick-score buttons, event logging with undo, and CSV/JSON exports for meet records.

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
- **Operator Controls** include undo, quick-score buttons, and export options.
- **Exports** create downloadable CSV/JSON files for record keeping.
- The app stores state locally so you can refresh without losing the bout data.
