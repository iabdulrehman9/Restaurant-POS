# Restaurant POS Backend

## Setup
1. Copy `.env.example` to `.env` and edit values if needed.
2. Install dependencies:
   - `npm install`
3. Start the server:
   - `npm run dev`

## Default Admin (first run only)
- Email: `admin@pos.local`
- Password: `ChangeMe123!`
- You will be prompted to change this password on first login.

## Notes
- SQLite database uses **better-sqlite3** with WAL mode.
- Default dev DB path: `./data/pos.sqlite`
- Packaged desktop app stores data in `%APPDATA%/Restaurant POS/`
- Uploaded product images are stored under `UPLOAD_DIR` (default `./uploads`).
