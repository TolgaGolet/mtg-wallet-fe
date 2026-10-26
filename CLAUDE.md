# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

React 18 frontend (Create React App, plain JavaScript, no TypeScript) for [MTG Wallet BE](https://github.com/TolgaGolet/mtg-wallet-be), a Spring Boot personal-finance API (transactions, accounts, payees, categories, JWT auth with email verification and TOTP 2FA). UI is built with Mantine v7 and `@tabler/icons-react`. Deployed at https://mtgwallet.onrender.com.

## Commands

- `npm start` — dev server (react-scripts)
- `npm run build` — production build into `build/`
- `npm test` — Jest watch mode via react-scripts; single test: `npm test -- -t "name"` or `npm test -- path/to/file`. There are currently no test files.
- Linting is CRA's built-in ESLint (`react-app` config), surfaced during `start`/`build`.

## Configuration

All API endpoints come from `REACT_APP_*` env vars in `.env` (base URL, login/refresh/logout/sign-up/verify-email paths, and the localStorage key for auth tokens). Per the README, the local-dev values in `.env` need to be uncommented for local use. CRA bakes these in at build time, so restart the dev server after changing them. Don't commit local `.env` changes.

## Architecture

- **Entry/providers** ([src/index.js](src/index.js)): `MantineProvider` (auto color scheme) → `Notifications` → `ModalsProvider` → `DatesProvider` (user's timezone, Monday first). Also exports `userTimezone` and `userTimezoneOffsetInHours`, which other modules import from `".."`.
- **Routing** ([src/App.js](src/App.js)): a single `createBrowserRouter` tree. The root route wraps `AuthProvider` + `RootLayout` (AppShell with nav). Authenticated pages are wrapped in `PrivateRoute`, which redirects to `/login` when `user` is absent.
- **Auth** ([src/context/AuthContext.js](src/context/AuthContext.js)): stores `{accessToken, refreshToken}` in localStorage and the decoded JWT as `user`. Login, sign-up and logout use raw `fetch` (not axios). Login handles the TOTP step (`totpRequired` → `auth/totp/verify`) and calls `payee/create-defaults` after a successful login.
- **API calls** ([src/utils/useAxios.js](src/utils/useAxios.js)): every authenticated page does `const callApi = useAxios();` and then `callApi.get/post/put/delete("resource/action", ...)` with paths relative to the base URL. The hook:
  - refreshes expired access tokens before requests and retries once on 401/403, queuing concurrent requests behind a single refresh; logs out when the refresh token is expired or rejected;
  - **shows an error notification for any error response body and for 429**, so callers usually only handle `.then` and don't add their own error toasts;
  - **shifts top-level `Date` fields in the request body by the user's UTC offset** before sending, because the backend stores `LocalDateTime` in the user's local time. Nested Date fields are not adjusted.
- **Backend conventions**: listing is done with `POST <entity>/search` (body = filters, `params: { pageNo }`), and responses are Spring pages (`content`, `totalPages`). Single-entity fetches also use `search` with `{ id }`. Updates go to `PUT <entity>/update/:id` and deletes to `DELETE <entity>/delete/:id`.
- **Page patterns** ([src/pages/](src/pages/)): pages are grouped per entity folder. Create and edit share one component on route `<entity>/create-or-edit/:id`, where the literal id `create` means create mode (`isEdit = id !== "create"`). Forms use `@mantine/form` `useForm`. Loading states use Mantine `Skeleton`. Confirmations and dialogs use `modals` from `@mantine/modals`.
- **Shared components** ([src/components/](src/components/)): `showNotification(message, "success" | "error")` is the only way toasts are shown (it is rate-limited to 5 per 5s). `AmountInput` / `AmountFormatter` enforce 2-decimal, `.` decimal / `,` thousands formatting, and `AmountInput` is bound via `form` + `fieldName`. Enums such as `Currency` and `Interval` live in [src/enum/](src/enum/).
- **Styling**: Mantine props first; component-specific CSS goes in co-located `*.module.css` files. PostCSS ([postcss.config.cjs](postcss.config.cjs)) provides `postcss-preset-mantine` and `$mantine-breakpoint-*` variables.
- The Home page ([src/pages/Home/](src/pages/Home/)) owns `TransactionModal`, the main create/edit transaction UI, which is also opened from other pages.

## Related repos

- **Backend**: `../mtg-wallet-be` (Spring Boot 3 / Java 21, served under `/api` on `http://localhost:8080` locally). It has its own `CLAUDE.md` describing the controllers, DTOs, enums and error handling this app consumes.
- Changing what the UI sends or expects (fields, endpoint paths, enum `value`s) usually needs a matching backend change. If the dev server origin changes, the backend's CORS allowlist (`SecurityParams.CORS_ALLOWED_ORIGINS`) must be updated too.
