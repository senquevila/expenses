# Expenses Frontend

A personal finance management app built with Next.js 16 and React 19. Track accounts, transactions, loans, subscriptions, and financial periods through a clean, modular interface.

## Features

- **Dashboard** — Overview of your financial activity
- **Accounts** — Manage bank accounts and balances
- **Transactions** — Log and filter income/expenses
- **Loans** — Track active and completed loans
- **Subscriptions** — Monitor recurring payments
- **Periods** — Organize finances by time period
- **Settings** — App preferences and configuration

## Tech Stack

| Category | Libraries |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| UI | Radix UI, MUI 7, Tailwind CSS 4, Lucide |
| Forms | React Hook Form, Zod |
| State | Zustand |
| Charts | Recharts |
| i18n | i18next, react-i18next |
| Auth/Backend | Firebase |
| HTTP | Axios |
| Animations | Motion, Lottie React |

## Getting Started

```bash
npm install
npm run dev
```

App runs on [http://localhost:4200](http://localhost:4200).

## Project Structure

```
src/
├── app/               # Next.js app router pages
│   ├── accounts/
│   ├── loans/
│   ├── periods/
│   ├── settings/
│   ├── subscriptions/
│   └── transactions/
├── _shared/
│   └── components/    # Feature components
├── _libs/
│   └── ui/            # Reusable UI component library (46+ components)
└── styles/            # Global styles, theme, fonts
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 4200 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
