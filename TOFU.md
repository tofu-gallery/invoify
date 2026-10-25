# Tofu gallery copy

This repository is Tofu's copy of **al1abb/invoify** (licence: MIT), listed in Tofu's app gallery as **Invoify**: an invoice maker that runs in the browser and turns the invoice into a PDF.

- `master` mirrors the upstream repository and is never committed to by Tofu.
- `tofu` carries Tofu's own changes; tags named `pin/<date>` mark the versions the gallery points to.
- A visitor who chooses this app gets a private snapshot of the pinned version in their own Tofu account. Their copy does not follow upstream updates.

## What the app is

Invoify is a Next.js 15 app (App Router, 18 languages). A person fills in a five-step form (sender and client, invoice details, line items, payment information, summary), watches a live preview in one of thirteen layouts with their own accent colour, typeface and spacing, and generates a PDF, which the server renders with a headless Chromium. Invoices, and the senders and clients a person saves, are kept in that person's own browser (encrypted local storage): the server keeps nothing, and there are no accounts. An invoice can be exported as JSON, CSV or XML, and loaded back from JSON. Sending the PDF by email is optional and needs the owner's own Gmail account (see **What works differently on Tofu**).

## How Tofu runs it

- **Framework preset:** `nextjs`, on Tofu's server hosting (provider `vercel`). Tofu's detector answers `container` for this repository because of upstream's root `Dockerfile`; the gallery sets the preset to `nextjs` explicitly, and the `Dockerfile` is not used.
- **Root folder:** the repository root.
- **Install:** `npm install`, from `package-lock.json`. When `VERCEL` is set, as on Vercel's build machine, puppeteer skips downloading its own Chrome (see **What Tofu changes**).
- **Build:** `npm run build`. Its `prebuild` step (`node scripts/build-pdf-css.mjs`) regenerates `lib/pdfStyles.generated.ts`, the PDF's Tailwind CSS with its fonts embedded from the `@fontsource` packages; then `next build`. The interface's fonts come through `next/font/google`, which fetches them at build time, so visitors' browsers load them from the app itself.
- **Output:** Next.js on Vercel functions. The PDF route, `/api/invoice/generate`, launches `@sparticuz/chromium` with `puppeteer-core` whenever `VERCEL`, `AWS_LAMBDA_FUNCTION_NAME` or `NETLIFY` is set (`services/invoice/server/browser.ts`, upstream's code); anywhere else it launches the full `puppeteer` package's own Chrome. That function is about 85 MB, 68 MB of it the compressed Chromium. The route declares `maxDuration = 60` and the warm-up route `/api/invoice/warm` 30, both within the Free plan's 60-second limit.
- **Settings:**

  | Setting | Value | Kind |
  |---|---|---|
  | `NEXT_PUBLIC_SITE_URL` | the copy's own address, with no trailing slash. Tofu's gallery sets it when it makes a copy | public |
  | `NODEMAILER_EMAIL` | the owner's Gmail address, only to send invoices by email | hidden, the owner's |
  | `NODEMAILER_PW` | an app password for that Gmail address | hidden, the owner's |

  `NEXT_PUBLIC_SITE_URL` makes the canonical and language links, the sitemap, `robots.txt`, the structured data, the logo address in the email and the address printed on the Open Graph card. It is read when the app is built, so deploy again after changing it. Unset, all of these fall back to upstream's own site, `https://invoify.vercel.app`. Upstream's `GOOGLE_SC_VERIFICATION` (its Search Console tag) stays unset.
- **Database:** none.
- **Accounts:** none. Anyone who opens the copy can use it; there is nothing to sign up for and no administrator.

## What Tofu changes

Changed on the `tofu` branch on 2026-10-25, on top of upstream commit `3859b3c` (`3859b3cbae28ca4ec559db5ef87e41b798740340`) of al1abb/invoify:

- **Analytics and the donation widget removed** (`9d17585`). `app/[locale]/layout.tsx` no longer renders `<Analytics />` from `@vercel/analytics` and no longer loads the author's Buy Me a Coffee widget. `@vercel/analytics` is removed from `package.json` and `package-lock.json` (`npm uninstall --package-lock-only --ignore-scripts`; nothing else in the lockfile moved). Why: a copy belongs to its owner, so it reports its visitors to no one and asks them for no donations.
- **Sending by email says what it needs** (`b0e456e`). Upstream sends from one Gmail account named by `NODEMAILER_EMAIL` and `NODEMAILER_PW`, and without them answered every send with "Something went wrong. Try again in a moment". Now `GET /api/invoice/send` answers `{ "configured": true }` or `false` (never the settings themselves), and the **Send to mail** dialog asks it when it opens. While sending is off, the dialog shows "Sending by email is not set up here. The site's owner has to add NODEMAILER_EMAIL (a Gmail address) and NODEMAILER_PW (an app password for that address) to its settings, then deploy it again. Until then, download the PDF and attach it to your own email." instead of the form, and `POST /api/invoice/send` answers 503 with the same sentence. The sentence is `EMAIL_NOT_SET_UP` in `lib/variables.ts`. Files: `app/api/invoice/send/route.ts`, `app/components/modals/email/SendPdfToEmailModal.tsx`, `lib/variables.ts`, `services/invoice/server/sendPdfToEmailService.ts`.
- **The Open Graph card names the copy's own address** (`16470f9`). `app/[locale]/opengraph-image.tsx` printed `invoify.vercel.app` on every copy's social card; it now prints the host of `NEXT_PUBLIC_SITE_URL`.
- **No Chrome download on Vercel's build machine** (`830adf5`). `puppeteer.config.cjs` sets `skipDownload` when `VERCEL` is set. There the PDF route runs `@sparticuz/chromium` and never the Chrome that the full `puppeteer` package downloads at install, about 150 MB on every build, and the install no longer depends on that download. Everywhere else it downloads as before.
- **Left as upstream wrote them:** the footer's "Developed by Ali Abbasov" link to the author's GitHub profile, and the author named in the page metadata (credit to the author); the root `Dockerfile` (unused, since the preset is `nextjs`); `.github/` (CI and Dependabot settings, which do not run for this fork), `e2e/` (its smoke test still lets requests to `/_vercel/insights/` fail) and `.claude/launch.json`; the README's links to upstream's live demo and issues; the request each page load sends to `/api/invoice/warm`, which starts the PDF Chromium early; and the currency list, which the visitor's browser fetches from `https://openexchangerates.org/api/currencies.json` (a public list, no key) when the invoice details step is shown.

## What works differently on Tofu

- **Sending by email is off** until the owner adds `NODEMAILER_EMAIL` and `NODEMAILER_PW` as hidden values on the app's Keys & settings page and deploys again. Only Gmail works (`service: "gmail"` in `services/invoice/server/sendPdfToEmailService.ts`), with an app password, which Google offers to accounts with 2-Step Verification. Once it is on, **anyone who can open the copy can make it send an invoice PDF from the owner's Gmail account to any address.** Upstream's limits stay: a fixed subject and message whose only variable part is an invoice number of up to 50 characters, a real PDF under 10 MB, and 5 sends an hour for each visitor's address, counted in each server instance's memory, so not a hard cap. Turn it on only in a copy that is shared with people the owner chose.
- **The first PDF after a quiet spell is slower:** a new function instance unpacks and starts Chromium (a few seconds) before it renders. Later PDFs reuse it, and an unchanged invoice comes back from a small in-memory cache.
- **Nothing is kept on the server.** Invoices live in each visitor's own browser: another browser, or cleared browser storage, starts empty. **Export Invoice** as JSON keeps one.

## Verification

Run on 2026-10-25 on macOS (Apple silicon) with Node 22.22.3 and npm 10.9.8, on the files of the `tofu` branch at `830adf5`, exported with `git archive` into a folder with no `.git`, with every executable bit cleared (`find <dir> -type f -exec chmod a-x {} +`; afterwards no file was executable), as Tofu's import delivers them. Nothing was deployed and no Docker image was built. This file was written after these checks and is not read by the build.

1. **Install:** `VERCEL=1 npm ci --foreground-scripts`: 844 packages from `package-lock.json`. puppeteer's postinstall printed `**INFO** Skipping downloading browsers as instructed.` and made no `.cache` folder.
2. **Build:** `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:<port> npm run build`, without `VERCEL` and with `PUPPETEER_SKIP_DOWNLOAD=1`, passed: the `prebuild` step regenerated the PDF stylesheet, 47 static pages were generated, and ESLint printed warnings only, all in upstream's files.
3. **The PDF function's size:** `.next/server/app/api/invoice/generate/route.js.nft.json`, the list of files Vercel packs into that function, names 932 files, 84.6 MB in all: 68.4 MB `@sparticuz/chromium` (its four `bin/*.br` archives included), 8.3 MB `typescript`, 2.8 MB `puppeteer-core`. Neither a puppeteer cache folder nor `puppeteer.config.cjs` is in it.
4. **Serve:** `next start -H localhost -p <port>` with `NODE_OPTIONS=--dns-result-order=ipv4first`, listening on 127.0.0.1 only. (With `-H 127.0.0.1`, every page answered 500 here: Next.js writes `127.0.0.1` as `localhost` in the middleware's URL, takes next-intl's rewrite for one to another host and proxies it to `localhost`, which this Mac resolves to `::1` first. That is a local quirk of that flag, not of the app.) With `curl`: `/` answered 307 to `/en` on the address it was asked on; `/en`, `/de` and `/en/guide` 200; `/en/opengraph-image` a 1200 by 630 PNG; `/robots.txt` and `/sitemap.xml` 200 with the configured address; an unknown path 404. The HTML of `/en` gives the configured address as its canonical link and `og:url`, and holds no `invoify.vercel.app`, no Buy Me a Coffee and no `/_vercel/insights`.
5. **Email while it is off:** `GET /api/invoice/send` answered `{"configured":false}`; a `POST` with an address, an invoice number and a PDF answered 503 with the sentence above.
6. **Browser** (headless Chromium from Playwright 1.64, 1200 by 750, 127.0.0.1 only, every request for another host aborted and listed): `/en` loaded with no page errors, no console errors and no failed requests. **Load Invoice** → **Import JSON** with a sample invoice (Mike Carter to Frank Doyle, three line items, 8% tax) filled the form; **Preview** showed it, with the total USD 1,047.60; **Change template** showed the layouts with it. **Generate PDF**, answered inside the page with a placeholder PDF so that only one browser ran at a time, opened the Final PDF view, and **Send to mail** opened a dialog with the sentence above and no address field. The only request for another host was `GET https://openexchangerates.org/api/currencies.json`, when the details step was shown; the check aborted it, and the page logged `Error fetching currencies`, as upstream does whenever that list is out of reach.
7. **PDF on the server:** with `PUPPETEER_EXECUTABLE_PATH` set to a local Chromium (Playwright's build 1248), on the branch `next start` takes away from Vercel, `POST /api/invoice/generate?locale=en` with the exact JSON the page had sent answered 200 `application/pdf`, 40,147 bytes, in 1.5 seconds with `X-Pdf-Cache: miss`; the same request again gave identical bytes with `hit`. The PDF is one A4 page with 5 embedded fonts, and its page, rendered with `sips`, matches the live preview. `POST /api/invoice/export?format=JSON`, `CSV` and `XML` answered 200 with the invoice. Stopping the server left no Chromium running.
8. **Tofu's own import and checks** (`lane_check_r9.mts`, which imports the branch from GitHub the way Tofu's GitHub import does, then runs Tofu's static-lane predicates and its safety check) on `tofu` at `830adf5`: 208 files, `detect=container` (the root `Dockerfile`), not on the static lane, `safety ok (3 findings)` with none critical or high; `free static limit: 197/500 published files`.

Not run: the Playwright e2e tests, `tsc`, ESLint on its own and Prettier.

## Still needs a real deploy

- The deploy lands on Tofu's server hosting with the `nextjs` preset despite the root `Dockerfile`, and on a Free account it is admitted as the account's one app.
- On Vercel's Linux build, `VERCEL` is set during the install, so puppeteer's Chrome is not downloaded, and the function with `@sparticuz/chromium` stays within the provider's size limit.
- In the function, `@sparticuz/chromium` unpacks and launches (the route sees `VERCEL` or `AWS_LAMBDA_FUNCTION_NAME`), and a PDF comes back well within 60 seconds on the Free plan's standard CPU, the first one after a cold start included. Only Chromium on macOS ran here.
- Tofu's check of each new version at the build's own `*.vercel.app` address: `/` redirects to `/en` on the address it was asked on (seen locally), so that check should pass.
- Sending by email with a real Gmail address and app password; no credentials were used here.

## Dependencies

This pin keeps upstream's dependency versions. GitHub lists open security advisories for some of them: critical ones for `next` 15.3.8 (remote code execution through Next.js's own image optimizer, fixed in 15.5.28) and for `basic-ftp` (which puppeteer's proxy support pulls in, and which this app never calls), and high ones for `next`, `nodemailer` (used only once the owner turns on email) and other packages. Updating them is a change to test on its own.

## Licence

MIT, `Copyright (c) 2023 Ali Abbasov`; `LICENSE` stays exactly as it is. The name Invoify and its logo are the author's. The PDF stylesheet embeds fonts read from the `@fontsource` packages in `devDependencies`, and the interface loads its fonts through `next/font/google`; these fonts (Outfit, IBM Plex Sans and Mono, Source Serif 4, Noto Sans Arabic and Hebrew, and the signature fonts Dancing Script, Parisienne, Great Vibes and Alex Brush) are under the SIL Open Font License.
