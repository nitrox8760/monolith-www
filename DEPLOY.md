# Deploy — monolithcompliance.co.uk

## Status (already set up)

| Item | Value |
|------|--------|
| GitHub | https://github.com/nitrox8760/monolith-www |
| Cloudflare Pages | `monolith-www` |
| Preview | https://monolith-www.pages.dev |
| Production branch | `main` |
| Build | none — output `/` |
| Custom domains | `www.monolithcompliance.co.uk`, `monolithcompliance.co.uk` |
| Apex → www | `_redirects` in repo |

Push to `main` auto-deploys. Do **not** attach www/apex to the Beacon Worker (`monolith-beacon`).

### Analytics

- **Google Analytics 4** (`G-GFWP9D7SZL`): consent-gated in `js/analytics.js`. CTA clicks fire `beacon_cta` events with a `cta_id` param when analytics cookies are accepted.
- In GA4 admin, mark **`beacon_cta`** as a conversion event and explore by `cta_id`.
- Enable **Cloudflare Web Analytics** on the `monolith-www` Pages project (Cloudflare dashboard — no code, no cookie banner).
- Outbound Beacon links get `utm_source=www`, `utm_medium=cta`, `utm_campaign={data-cta}` appended on click via `js/site.js`.

### Leave alone

- `beacon.monolithcompliance.co.uk` → Worker **monolith-beacon**

## After go-live checklist

- [ ] https://www.monolithcompliance.co.uk/ loads (SSL may take a few minutes after domain add)
- [ ] Apex redirects to www
- [ ] **Try Beacon** → beacon login
- [ ] Supabase: **Enable sign ups** + **Confirm email** ON (open beta)
