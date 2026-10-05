# ComplyWise Azure deployment handover

This guide is for updating the existing ComplyWise deployment from the prepared branch while keeping its current frontend and backend addresses. It is based on the checked-in Dockerfiles and active route configuration. Azure resource names, public hostnames, registry names, and secret values are specific to the existing Azure account; read them from that account and fill them into the deployment worksheet below. Do not use old hostnames or resource names copied from historical architecture documents.

## The address rule

**Update the existing production frontend and backend resources. Do not create replacements, change custom domains or DNS, delete the current services, or publish a new production hostname.** Record the exact working production frontend and backend origins before deployment. Keep those origins unchanged throughout the release.

For this frontend, browser API requests on a deployed site go to the frontend origin under `/api/v1`. The existing Next.js rewrite forwards those requests to `BACKEND_INTERNAL_URL`; `/health` is forwarded as well. Set the frontend's `BACKEND_INTERNAL_URL` to the existing, reachable backend origin and build the frontend with the existing public API base. Keep the backend hostname itself unchanged. See `frontend/next.config.ts`, `frontend/lib/api/client.ts`, and `frontend/Dockerfile`.

## 1. Record the live Azure deployment

Sign in to the Azure account and subscription that owns production. In the Azure Portal, locate the currently serving frontend and backend. Record their exact production URL, hosting service, resource group, resource name, deployment slot or Container Apps revision mode, registry, image repository, target port, and current health-check result. Check the deployed resources themselves; the repository has Dockerfiles, but no current Bicep or Terraform deployment definition, and older architecture notes may describe a superseded host.

Keep this worksheet private to the deployment team. Do not commit it with credentials.

| Setting | Existing production value |
|---|---|
| Frontend public origin, including scheme | `https://<existing-frontend-host>` |
| Backend public origin, including scheme; no path | `https://<existing-backend-host>` |
| Backend API base | `<existing-backend-origin>/api/v1` |
| Azure service for frontend | `<existing Azure resource type and resource name>` |
| Azure service for backend | `<existing Azure resource type and resource name>` |
| Resource group / subscription | `<existing values>` |
| Container registry and existing image repositories, if used | `<existing values>` |
| Current slot/revision mode and production traffic target | `<record current settings>` |

Before proceeding, open the saved frontend and backend URLs in a browser and record the current `/health` results. Preserve the existing production routing configuration. If the live services are not the existing Azure resources you expected, stop and identify their actual owner and hosting service before choosing the matching instructions in section 5.

## 2. Update the friend's local branch

Use the prepared branch; do not reset the branch or overwrite local work. First inspect the friend's checkout. If it has uncommitted work, keep it safe before switching branches.

```powershell
Set-Location <path-to-ComplyWise-checkout>
git status --short
git fetch origin
git switch <prepared-branch>
git pull --ff-only origin <prepared-branch>
git rev-parse --short HEAD
```

Check that the resulting commit contains the changes intended for deployment. The task checkpoint for this handover reports **876 backend tests passed, 3 opt-in tests skipped**; the previous **53 browser tests and frontend build/type-check** are separate earlier results. Those are repository evidence, not a substitute for checking the exact commit being deployed.

Run the relevant checks from that checkout before publishing images:

```powershell
Push-Location backend
python -m pytest -q
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
Pop-Location

Push-Location frontend
npm ci
npx tsc --noEmit
npm run build
Pop-Location
```

If local Python is installed under the repository virtual environment, use its Windows executable (for example, `.venv\Scripts\python.exe`). Use the repository's supported Python and Node versions. Do not treat an unavailable optional live-provider test as a successful live integration test.

## 3. Transfer the existing environment safely

Send the `.env` file separately from this Markdown, using an approved encrypted secret-sharing method or grant the friend the necessary Azure Key Vault access. **Never paste `.env` contents into this handover, Git, chat, an issue, a Docker build argument, or a terminal transcript.** The repository ignores `.env` and `frontend/.env.local`; keep them out of commits and build contexts. The checked-in `.env.example` contains local-development values, not production settings.

For deployment, put backend secrets in the existing Azure server-side secret store and reference them from the existing backend resource. Put only non-secret frontend build settings on the frontend build/resource. Preserve the working production values, database, authentication configuration, provider selections, and domain-specific settings. Do not rotate a secret or point at a different database as part of this code release.

### Backend settings to preserve or confirm

Set these on the existing backend deployment, using the already-working values where present:

| Variable | Deployment rule |
|---|---|
| `DJANGO_DEBUG` | `false` in production. |
| `DJANGO_SECRET_KEY` | Keep the current strong production secret in Azure's secret store. Do not generate a new one for this release. |
| `DATABASE_URL` | Keep the existing persistent PostgreSQL production database and connection string. Production must not silently use the container's local SQLite file. |
| `DJANGO_ALLOWED_HOSTS` | Include the existing backend hostname(s), without scheme or path, as a comma-separated list. |
| `CORS_ALLOWED_ORIGINS` | Include the existing frontend origin(s), with `https://` and no path. Preserve other currently required origins. |
| `CSRF_TRUSTED_ORIGINS` | Keep the current working list and include the trusted production frontend origin using its full scheme. Do not include an API path. |
| Provider settings | Preserve the configured `LLM_PROVIDER` and matching server-side provider credentials. `SERPAPI_API_KEY` (or the supported `SERP_API` alias) and `COMPLIANCERAG_URL` are optional service integrations; keep their existing values, if configured. |
| Google and file-storage settings | Preserve existing `GOOGLE_AUTH_*`, Calendar/mail, and `AZURE_STORAGE_*` values when those features are active. Keep credentials server-side. |

Do not make a provider key `NEXT_PUBLIC_*`. Do not put `DATABASE_URL`, `DJANGO_SECRET_KEY`, provider credentials, OAuth secrets, or storage connection strings in the frontend container or into any `NEXT_PUBLIC_*` setting.

### Frontend settings for this repo

These are build-time Docker arguments as well as runtime values in `frontend/Dockerfile`. Use the recorded existing origins:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://<existing-backend-host>/api/v1
BACKEND_INTERNAL_URL=https://<existing-backend-host>
```

`BACKEND_INTERNAL_URL` must be reachable from the deployed Next.js server. If the current Azure network requires a private Container Apps address or private App Service route, use the already-working private address for that value while keeping the public backend address, frontend address, DNS, and browser API path unchanged. Verify the route from the frontend resource before promoting the release. `NEXT_PUBLIC_API_BASE_URL` is public and may be bundled into frontend JavaScript; put no secrets in it.

## 4. Build and deploy immutable images

Use the registry and repositories already used by the frontend/backend resources. Do not make a new registry, resource group, app, public ingress, or DNS record for this task. Use a unique image tag for the commit; do not overwrite a mutable `latest` tag. Keep the previous image tags/revisions available for rollback.

If these resources use Azure Container Registry, verify the account and existing repository names first. From the repository root, Azure can build from each service's own Docker context:

```powershell
$tag = (git rev-parse --short HEAD)

az acr build --registry <existing-acr-name> --image <existing-backend-repository>:$tag backend

az acr build --registry <existing-acr-name> `
  --image <existing-frontend-repository>:$tag `
  --build-arg "NEXT_PUBLIC_API_BASE_URL=https://<existing-backend-host>/api/v1" `
  --build-arg "BACKEND_INTERNAL_URL=https://<existing-backend-host>" `
  frontend
```

Replace every placeholder with the values recorded in section 1. If a registry or image repository does not already exist, stop rather than creating a new production target as an unreviewed shortcut. Preserve the backend's current environment settings when changing its image.

Deploy the backend image to its **existing** resource first, then the frontend image to its **existing** resource. In the Azure Portal, review the resource identity, image tag, environment settings, health probe, hostname binding, ingress, and traffic configuration before saving. Image changes should create a new deployable version on the existing app; never detach or rebind the current production domain.

## 5. Use the rollout method for the service that is actually running

### Azure Container Apps

Keep the current Container App names, ingress FQDNs, custom-domain bindings, TLS certificates, and revision mode. In the default **single-revision** mode, Azure retains the old revision's traffic until the replacement revision has provisioned and passed its probes, then moves traffic to the ready revision; its app hostname remains the same. Watch the new revision's readiness and logs before checking the public routes. Keep the old revision/image available long enough to roll back.

If the app is already in **multiple-revision** mode, keep the current traffic weights and current production revision while validating the new revision. Use an existing revision label or other approved revision-specific test route, then promote through the existing app after health and smoke checks pass. Do not switch revision mode, alter weights, or move a production label as a routine part of this handover.

### Azure App Service for Containers

Deploy the new backend and frontend images to their **existing staging slots**, if configured, and test the slot hostnames there. Preserve the production slots, custom-domain bindings, certificates, app settings and connection strings. Before a swap, compare every source and destination setting and confirm production is the target. Swap a validated staging slot into production only under the existing release procedure. Azure App Service keeps custom domains and several networking settings with their slot, while app settings may swap unless marked slot-specific; check the actual swap preview carefully. Keep the previous app in staging so a reverse swap remains available.

If there is no existing staging slot, do not create an unreviewed second production service or change DNS. Use the service owner's approved release method for that App Service plan, or create/review a proper staging slot in a separately approved infrastructure change before deploying.

Official Microsoft guidance: [Container Apps revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions), [Container Apps traffic splitting](https://learn.microsoft.com/en-us/azure/container-apps/traffic-splitting?pivots=azure-cli), [App Service deployment slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots), and [App Service deployment best practices](https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices).

## 6. Database and migration checks

Keep the current PostgreSQL database. Never point the deployment at a local SQLite database, a new empty database, or an unverified copy. Take and verify the normal production backup before any schema migration.

The ComplyWise backend entrypoint attempts `migrate --noinput` at startup by default, but logs and continues when migration fails. That means a healthy container alone does **not** prove that migrations succeeded. Read the deployment logs. If the selected branch has pending migrations, run them once using the existing database and backend settings, verify a successful exit, and confirm the migration is compatible with both the old and new application during rollout. Stop the release on a migration error. Do not run a database reset, flush, fake migration, delete, or seed/reset operation.

The source-grounding handover checkpoint introduced no migrations. Re-check the actual branch locally before release rather than assuming a later branch has the same schema state.

## 7. Smoke checks before and after promotion

Use the exact production origins recorded in section 1. Test the backend directly and through the frontend's same-origin proxy:

```text
https://<existing-backend-host>/health
https://<existing-backend-host>/health/ready
https://<existing-backend-host>/api/v1/health
https://<existing-frontend-host>/health
https://<existing-frontend-host>/api/v1/health
```

Check that readiness matches the configured database/dependencies; liveness alone does not prove the database is ready. On the existing frontend address, verify login, business selection, assessment loading, a read-only standards/schemes result, and navigation to the remaining main sections. Confirm the browser remains on the existing frontend host and that its requests are served through the expected backend. Confirm the direct backend hostname still resolves and serves the backend. Do not use real legal submissions or destructive account changes as smoke tests.

After promotion, repeat the health and browser checks on both exact original public URLs. Check backend and frontend deployment logs for migration, readiness, rewrite, CORS/CSRF, and startup errors. Record the commit, image tags, deployed resource/revision/slot IDs, health results, and the prior rollback image/revision privately for the release record.

If a health, login, rewrite, or data check fails, restore the previous image/revision or reverse the approved App Service slot swap. Preserve both existing hostnames during rollback. If the new frontend points at the wrong backend, restore the prior frontend image/build arguments; do not patch DNS or invent a new public API address as a quick fix.

## 8. Sharing and closing the handoff

Send this Markdown and the environment file as two separate files over the agreed secure channel. Only the friend who needs the settings should receive them. Keep `.env`, backend secrets, production URLs that the team treats as private, and this filled worksheet out of a public repository. After deployment, confirm that the friend's checkout and any release branch contain the intended code changes only; do not commit the secret environment file.

This repository handover does not identify the live Azure resource names or current production hostnames on its own. Verify both in the owner's Azure account, then use those same resources and origins throughout the release.
