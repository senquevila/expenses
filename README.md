# Expenses

Site to create budgets and expenses. A personal finance management app to track accounts, transactions, loans, subscriptions, and financial periods.

## Project Structure

```
backend/   # Django + Django REST Framework API
frontend/  # Next.js 16 + React 19 web app
```

## Backend

Built with [Django](https://www.djangoproject.com/) and [Django REST Framework](https://www.django-rest-framework.org/).

```bash
cd backend
python manage.py runserver
```

## Frontend

A personal finance management app built with Next.js 16 and React 19.

### Features

- **Dashboard** — Overview of your financial activity
- **Accounts** — Manage bank accounts and balances
- **Transactions** — Log and filter income/expenses
- **Loans** — Track active and completed loans
- **Subscriptions** — Monitor recurring payments
- **Periods** — Organize finances by time period
- **Settings** — App preferences and configuration

### Tech Stack

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

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

App runs on [http://localhost:4200](http://localhost:4200).

### Project Structure

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

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 4200 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Contributing

Please read [CONTRIBUTING](backend/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/senquevila/expenses/tags).

## Authors

* **J. Enrique Avila** - *Initial work* - [senquevila](https://github.com/senquevila)

See also the list of [contributors](https://github.com/senquevila/expenses/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](backend/LICENSE) file for details.
