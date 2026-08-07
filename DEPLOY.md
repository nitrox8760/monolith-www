# Deploy — monolithcompliance.co.uk

## Status (already set up)

| Item | Value |
|------|--------|
| GitHub | https://github.com/nitrox8760/monolith-www |
| Cloudflare Pages | `monolith-www` |
| Preview | https://monolith-www.pages.dev |
| Production branch | `master` |
| Build | none — output `/` |
| Custom domains | `www.monolithcompliance.co.uk`, `monolithcompliance.co.uk` |
| Apex → www | `_redirects` in repo |

Push to `master` auto-deploys. Do **not** attach www/apex to the Beacon Worker (`monolith-beacon`).

### Leave alone

- `beacon.monolithcompliance.co.uk` → Worker **monolith-beacon**

## After go-live checklist

- [ ] https://www.monolithcompliance.co.uk/ loads (SSL may take a few minutes after domain add)
- [ ] Apex redirects to www
- [ ] **Try Beacon** → beacon login
- [ ] Supabase: **Enable sign ups** + **Confirm email** ON (open beta)
