# Wallet Business Console setup — Loyalty pass

Steps needed in the [Google Wallet Business Console](https://console.pay.google.com)
after switching this project from a Generic pass to a Loyalty pass.

## 1. Host a logo image

Loyalty passes require a `programLogo` — a publicly reachable **HTTPS** image
URL. Google recommends a square image, ~660x660px, transparent or solid
background.

- Upload your logo somewhere public (your own site, a CDN, an S3/GCS bucket
  with public read access — anywhere HTTPS-reachable).
- Put that URL in `.env` as `GOOGLE_WALLET_LOGO_URL`.
- A broken or unreachable URL will cause the "Add to Wallet" step to fail
  silently or show a placeholder — verify it loads in a plain browser tab
  first.

## 2. Set issuer/program name

- `GOOGLE_WALLET_ISSUER_NAME` should match the business name on your Wallet
  Business Profile (Console → your account → Business profile).
- `GOOGLE_WALLET_PROGRAM_NAME` is the loyalty program's display name (e.g.
  "Acme Rewards") — shown as the card title in Wallet.

## 3. Class creation

Unlike the old `demo_generic_class`, no class exists yet for
`demo_loyalty_class` — this code creates/updates it automatically the first
time someone completes the "Add to Wallet" flow (the class definition is
embedded in the signed JWT, so Google upserts it on save).

If you want the class to appear in the Console's class list *before* the
first save (e.g. to double check the logo/colors render correctly, or to
add optional fields like a hero image), create it manually instead:

1. Console → **Manage** tab → **Create a class** → type **Loyalty**.
2. Use `<your issuer ID>.demo_loyalty_class` as the class ID so it matches
   what `server.js` generates.
3. Fill in issuer name, program name, logo — same values as your `.env`.
4. Set status to **Active**.

## 4. Publishing access

You already completed the 3/3 "Get publishing access" checklist for this
issuer account (class created, business profile completed, request sent).
That approval is account-wide, not per pass type — once Google approves the
issuer account, the Loyalty class goes live too. No separate request is
needed for switching pass types.

## 5. Test accounts (while still in demo mode)

Until publishing access is approved, only test accounts can save passes:

1. Console → **Set up test accounts** → add the Google account email(s) you
   will test with (the same account signed in on your Android phone).
2. Passes created for any other account will fail to save.

## 6. Testing checklist

1. `npm start` with `.env` fully filled in (issuer ID, credentials path,
   issuer name, program name, logo URL).
2. Open the app from a device signed into a **test account**, on Android
   with the Google Wallet app installed (or reachable over the same
   network/tunnel as your phone — `localhost` won't work directly from a
   phone).
3. Click **Add to Google Wallet** → confirm the loyalty card shows the
   correct logo, program name, member name, and points balance.
4. Reload with a different `points` query param and re-click — the existing
   card on-device should update in place rather than creating a duplicate
   (same `objectId` = update, not insert).
