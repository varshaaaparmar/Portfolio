# Varsha Ghanchi Portfolio Backend

This is the backend for my portfolio website, built with Node.js, Express and SQLite.

## What it does

- Handles contact form submissions (POST /api/contact)
- Sends an email notification when someone submits the contact form (optional, see setup below)
- Serves project data
- Serves experience data
- Has admin routes for managing contact messages
- Has a stats endpoint
- Uses SQLite, so the database and tables are created and seeded automatically the first time it runs
- CORS is enabled
- Basic input validation and error handling are in place

## API Endpoints

### Public
| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/api/health`         | Health check                    |
| POST   | `/api/contact`        | Submit contact form             |
| GET    | `/api/projects`       | Get all projects                |
| GET    | `/api/experiences`    | Get all experiences             |
| GET    | `/api/stats`          | Portfolio statistics            |

### Admin (protected)
Add `?key=varsha2026` as a query parameter to use these:

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | `/api/contacts`           | List all contact messages       |
| GET    | `/api/contacts/:id`       | Get a single message            |
| PATCH  | `/api/contacts/:id`       | Update status (new/read/replied)|
| DELETE | `/api/contacts/:id`       | Delete a message                |

## How to run it

```bash
# Install dependencies (skip if already done)
npm install

# Start the server
npm start

# Or run in dev mode with auto-reload
npm run dev
```

It runs on **http://localhost:3000**.

## Connecting it to the frontend

The contact form in `index.html` is wired up to call `POST http://localhost:3000/api/contact` with the name, email and message fields. On success it shows a "message sent" confirmation; if the backend is unreachable or returns an error, it shows an alert instead.

## Environment variables

Create a `.env` file with:

```
PORT=3000
DB_PATH=./portfolio.db
CORS_ORIGIN=*

# Optional — enables email notifications when someone submits the contact form
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your-gmail-app-password
NOTIFY_EMAIL=youraddress@gmail.com
```

A template is in `.env.example` — copy it to `.env` and fill in your own values.

### Setting up email notifications

Every contact form submission is always saved to the database. If you also want an email
sent to you when that happens, fill in `EMAIL_USER` and `EMAIL_PASS`:

1. Turn on 2-Step Verification on the Gmail account you want to send from.
2. Generate an "App Password" at https://myaccount.google.com/apppasswords.
3. Set `EMAIL_USER` to that Gmail address and `EMAIL_PASS` to the app password (not your normal Gmail password).
4. Set `NOTIFY_EMAIL` to whichever address you want the notifications sent to — this can be the same as `EMAIL_USER` or different.

If `EMAIL_USER`/`EMAIL_PASS` are left blank, the server just skips sending email and logs a note — the contact form still works and messages still get saved.

## Database

- File: `portfolio.db`
- Tables: `contacts`, `projects`, `experiences`
- Gets seeded with real portfolio data the first time it runs

## Notes for production

- Set `CORS_ORIGIN` to your actual frontend domain instead of `*`
- Add rate limiting
- Use real admin authentication instead of the query-param key
- Serve over HTTPS
- Switch to PostgreSQL if it needs to scale
