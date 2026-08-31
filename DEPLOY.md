# Deployment notes (for DevOps)

What this service is: a small stateless Node/Express app (no database) that
signs a Google Wallet JWT and redirects the user to Google. Any container
platform works (Cloud Run, ECS, k8s, App Runner, etc.) — nothing here is
platform-specific.

## Build

```
docker build -t wallet-demo .
docker run -p 3000:3000 --env-file .env -v /path/to/service-account.json:/app/service-account.json:ro wallet-demo
```

## The one non-standard requirement: a secret key file

The app needs `service-account.json` — a **private key** for a Google
service account — available on disk at runtime (path given by
`GOOGLE_APPLICATION_CREDENTIALS`). This must NOT be baked into the Docker
image or committed anywhere.

Pick whichever your infra already uses for secrets:
- k8s: mount it as a `Secret` volume, set `GOOGLE_APPLICATION_CREDENTIALS`
  to the mount path.
- Cloud Run / GCP: use Secret Manager, mounted as a volume (same pattern).
- AWS: Secrets Manager or SSM Parameter Store, fetched at container start
  and written to a file, or mounted via an ECS secret volume.
- Generic Docker host: mount it as a bind-mounted file (as in the `docker
  run` example above) — file must be read-only and not in any image layer.

## Environment variables

All required — the app fails fast at request time with a clear error if any
are missing:

| Variable | Value |
|---|---|
| `PORT` | port to listen on (defaults to 3000) |
| `GOOGLE_WALLET_ISSUER_ID` | Issuer ID from Wallet Business Console |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to the mounted service account JSON |
| `GOOGLE_WALLET_ISSUER_NAME` | business name shown on the pass |
| `GOOGLE_WALLET_PROGRAM_NAME` | loyalty program name shown on the pass |
| `GOOGLE_WALLET_LOGO_URL` | public HTTPS URL to the program logo |

None of these are secret except `GOOGLE_APPLICATION_CREDENTIALS`'s target
file — the env vars themselves can go in normal config/environment
settings.

## Domain requirement (do this before going live)

Google only allows the "Add to Wallet" flow from domains registered as
**authorized domains** in the Wallet Business Console. Once you know the
production URL (e.g. `https://wallet.example.com`), it needs to be added
there — this is a manual step in Google's console (business owner does it,
not a deploy-time config). Tell whoever owns the Wallet Business Console
account the final domain as soon as it's decided.

## Health check

There's no dedicated health endpoint yet. `GET /` (static `index.html`)
returns 200 and is fine as a liveness check for now.

## Scaling

Fully stateless — no session affinity, no shared storage needed. Safe to
run multiple replicas behind a load balancer.
