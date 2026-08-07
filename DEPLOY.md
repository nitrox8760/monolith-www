# Deploy — monolithcompliance.co.uk

## Cloudflare Pages

1. GitHub: push this repo (`monolith-www`).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect to Git.
3. Select `monolith-www`.
4. Build settings:
   - **Framework preset:** None  
   - **Build command:** *(leave empty)*  
   - **Build output directory:** `/` (project root)
5. Deploy.

### Custom domains

On the Pages project → **Custom domains**:

1. Add `www.monolithcompliance.co.uk`
2. Add `monolithcompliance.co.uk` (apex)
3. Prefer redirecting **apex → www** (Pages “Redirects” or a Redirect Rule):

   - Source: `monolithcompliance.co.uk/*`  
   - Target: `https://www.monolithcompliance.co.uk/$1`  
   - Status: 301  

DNS is already on Cloudflare — accepting the custom domain should create/update the right records. Do **not** attach these hostnames to the Beacon Pages project.

### Leave alone

- `beacon.monolithcompliance.co.uk` → existing **monolith-beacon** Pages project

## After go-live checklist

- [ ] https://www.monolithcompliance.co.uk/ loads
- [ ] Apex redirects to www
- [ ] **Try Beacon** → beacon login
- [ ] Supabase: **Enable sign ups** + **Confirm email** ON (open beta)
