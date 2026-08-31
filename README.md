# Google Wallet demo

Minimal Express app that signs a Google Wallet "Loyalty pass" JWT server-side
and hands the browser a `https://pay.google.com/gp/v/save/<jwt>` link to
trigger the native "Add to Google Wallet" flow.

See [CONSOLE_SETUP.md](CONSOLE_SETUP.md) for the Wallet Business Console
steps needed for the loyalty class specifically.

## One-time account setup (outside this repo)

1. **Google Cloud project** — create or pick one at console.cloud.google.com,
   then enable the **Google Wallet API** for it.
2. **Service account** — in that project, create a service account and
   download its JSON key. Save it as `service-account.json` in this folder
   (already gitignored).
3. **Google Wallet Business Console** — sign up at the Wallet Business
   Console (console.pay.google.com <sup>if unfamiliar, search "Google Wallet
   Business Console"</sup>) and complete issuer registration. Approval isn't
   instant, but you can use your account for API calls before full approval.
   This is where you get your **Issuer ID**.
4. In the Business Console, add the service account's email (the
   `client_email` field in the JSON key) as an **authorized user** on your
   issuer account, so it's allowed to create passes on your behalf.
5. If you plan to deploy this (not just localhost), register the production
   domain that will host the "Add to Google Wallet" button in the Business
   Console's authorized domains list.

## Configure

```
cp .env.example .env
```

Fill in `GOOGLE_WALLET_ISSUER_ID` with your Issuer ID, point
`GOOGLE_APPLICATION_CREDENTIALS` at your downloaded key file, and set
`GOOGLE_WALLET_ISSUER_NAME`, `GOOGLE_WALLET_PROGRAM_NAME`, and
`GOOGLE_WALLET_LOGO_URL` (see [CONSOLE_SETUP.md](CONSOLE_SETUP.md)).

## Run

```
npm install
npm start
```

Open http://localhost:3000 and click the button. The first click for a given
`classId`/`objectId` creates the pass; later clicks with the same IDs update
it in place (the demo derives the object id from `memberId` in the query
string).

## Notes / production considerations

- The button styling here is a plain placeholder, not Google's official
  badge. For production, generate the compliant button asset from Google's
  "Add to Google Wallet" button generator so it matches their brand
  guidelines.
- This demo hardcodes `name`/`memberId` as query params for illustration —
  in a real app these would come from your authenticated user/session data,
  not the client.
- To update an already-issued pass later (e.g. change points balance), call
  the Wallet REST API's `loyaltyobject.patch` with the same object id — you
  don't need the user to click "Add" again, existing passes on-device get
  pushed the update.
