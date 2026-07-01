# Prime Teaching System (Frontend)

Ethiopian school management portal — Next.js frontend for the Prime Teaching System.

The API lives in a separate repository in the [`backend/`](backend/) folder (Express + PostgreSQL).

## Prerequisites

- Node.js 20+
- [Prime API](backend/) running on port 3004 (see `backend/README.md`)

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `NEXT_PUBLIC_API_URL=http://localhost:3004` in `.env.local` if the API is not on the default host.

## Demo login

| Role | Email | Password |
|------|-------|----------|
| Teacher | martha.feyissa@prime.edu.et | teacher123 |
| School Head | principal.semeneh@prime.edu.et | school123 |
| MOE Admin | moe.admin@prime.gov.et | moe123 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |

## Splitting into separate repositories

The `backend/` folder is a self-contained Node.js project with its own `package.json` and `.gitignore`. To use it as a standalone repository:

```bash
cd backend
git init
git add .
git commit -m "Initial backend"
```

Then remove `backend/` from this frontend repository when you are ready to point at the remote API URL instead.
