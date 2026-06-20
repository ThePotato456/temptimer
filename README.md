# TempTimer

TempTimer is a lightweight, mobile-friendly dual countdown timer for heat-up and cool-down intervals. It runs entirely in the browser with plain HTML, CSS, and JavaScript.

## Features

- Two configurable timers: Heat Up and Cool Down.
- Automatic sequence flow from heat-up to cool-down.
- Start/stop control that locks inputs while the sequence is running.
- Add 5 seconds to the cool-down timer while it is active.
- Toast notifications when each phase completes.
- Responsive layout for desktop and mobile screens.

## Getting Started

No build step or package installation is required.

Open `index.html` directly in a browser, or serve the folder with any static file server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project Structure

```text
.
├── index.html   # App markup and metadata
├── styles.css   # Responsive UI styles
├── script.js    # Timer and interaction logic
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE      # Project license
├── .editorconfig
└── README.md    # Project documentation
```

## Deployment

TempTimer is a static site. Deploy the repository contents to any static hosting provider, including GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an ordinary web server.

For production hosting, make sure `index.html`, `styles.css`, and `script.js` are published together at the same path.

## Development Notes

- Keep the app dependency-free unless a new dependency meaningfully improves the user experience.
- Test changes in a desktop browser and a narrow mobile viewport.
- Run a JavaScript syntax check before publishing:

```sh
node --check script.js
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
