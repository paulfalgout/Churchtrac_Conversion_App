# ChurchTrac Conversion App

ChurchTrac Conversion App is an Electron-based desktop application designed to help convert data from ChurchTrac into other formats or tools, providing a modern and intuitive interface.

## Features
- Modern sidebar menu with icons for easy navigation
- Separate modules for Accounting, Giving, Tithe.ly, and Hanacard
- Responsive and sleek design with macOS-like title bar

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/churchtrac-conversion-app.git
   cd churchtrac-conversion-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm start
   ```

4. Package the app for distribution:
   ```bash
   npm run package
   ```

## Windows Distribution (No Local Build Needed For End Users)

Build once on a maintainer machine, then share the generated `.exe` files.

1. Build Windows artifacts:
   ```bash
   npm ci
   npm run dist:win
   ```
2. Share files from `dist/`:
   - `ConversionApp Setup <version>.exe` (installer)
   - `ConversionApp <version>.exe` (portable, no install required)
3. Windows users only need to download/copy one of those `.exe` files and run it.

## GitHub Actions Build (Downloadable Artifacts)

You can also generate downloadable Windows builds from GitHub without asking users to build locally.

1. Open the repo in GitHub.
2. Go to **Actions** -> **Build Windows App**.
3. Click **Run workflow**.
4. Download the artifact `conversionapp-windows-<run_number>`.
5. Share the included `.exe` files.

## TODO: Use Codex To Maintain This Repo

If you want AI help developing this app, use the official OpenAI Codex desktop app:

- Codex app overview: [OpenAI Codex](https://openai.com/codex/)
- Codex app announcement and availability: [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- ChatGPT desktop downloads: [Download ChatGPT](https://openai.com/chatgpt/download)

Basic setup:

1. Install the Codex app or ChatGPT desktop app from OpenAI.
2. Sign in with your ChatGPT account.
3. Open this repository folder in the app:
   ```bash
   /Users/YourUser/Projects/ChurchTrac_Conversion_App
   ```
4. Ask Codex to inspect the repo before making changes.
5. Review the diff before accepting edits.

Good prompts to start with:

- `Read this repo and explain how the Electron app is structured.`
- `Find the main conversion flows and explain where accounting, giving, and exchange processing live.`
- `Update the README with clearer build and release instructions, then show me the diff.`
- `Add a small feature to the app, keep the existing style, and explain which files you changed.`
- `Review this repo for packaging or installer issues on Windows and macOS.`
- `Find bugs or risky code paths in the conversion logic and propose fixes.`
- `Add tests or validation around the CSV conversion logic without changing app behavior.`

Good prompt pattern for future work:

```text
Open this repo, inspect the current code first, then make the change.
Keep edits minimal and explain your assumptions.
After changes, summarize what you changed and any risks or follow-up work.
```

## Requirements
- Node.js 20 (specified in `.nvmrc`)
- npm

## File Structure
- `main.js`: Electron main process
- `index.html`: Frontend interface
- `assets/`: Contains app and menu icons

## License
[MIT License](LICENSE)
