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

## Requirements
- Node.js 20 (specified in `.nvmrc`)
- npm

## File Structure
- `main.js`: Electron main process
- `index.html`: Frontend interface
- `assets/`: Contains app and menu icons

## License
[MIT License](LICENSE)
