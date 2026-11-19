# Deploying BoerIT to Azure

BoerIT runs in two hosted environments, both in Azure **South Africa North**:

| Environment | Deployed from | Who uses it |
|---|---|---|
| **beta** | the `beta` branch | you, to check a release before the demo users see it |
| **production** | the `main` branch | the invited demo users |

Both are private: there is no public sign-up. The demo accounts are created
from a secret list that you keep in GitHub (step 6).

## How the pieces fit

```
GitHub ─ push to beta ──► GitHub Actions ──► beta:        <prefix>-ui-beta  ──►  <prefix>-api-beta  ──►  database boerit_beta
       └ push to main ──►                ──► production:  <prefix>-ui       ──►  <prefix>-api       ──►  database boerit_prod
                                                          └───────── one App Service plan (B1) ─────┘    └ one PostgreSQL server ┘
```

- **Website (Next.js)** and **API (.NET 10)** are separate App Service web apps.
  All four apps share one App Service plan, so you pay for it once.
- **Database**: one PostgreSQL Flexible Server holding two databases. The API
  creates its database and runs the migrations on startup.
- **Deployments** sign in to Azure with OpenID Connect: GitHub vouches for the
  repository and environment, and Azure trusts that. No Azure password is stored
  in GitHub, and the deploy identity can only touch the BoerIT resource group.

Expected cost: **roughly US$35–40 / R550–750 a month** for both environments
together. See [Costs](#costs) for how to bring that down.

---

## Branches

```
feature/<something>  ──►  develop  ──►  beta  ──►  main
   your work               all merged     deploys     deploys
   (CI builds)             work, tested   beta        production
                           locally
                           (CI builds)
```

You are the only developer, so no pull-request reviews are needed. Merging
locally and pushing is enough. Each push to `beta` or `main` deploys.

---

## Step 1: Create the Azure account

1. Go to <https://azure.microsoft.com/free> and choose **Try Azure for free** (or **Pay as you go**).
2. Sign in with a Microsoft account, or create one. Use an address you will
   keep, because this account owns the billing.
3. Verify your identity by phone, then add a credit card. On the free account
   the card is for identity verification and is not charged unless you upgrade.
4. Accept the agreement. You land in the Azure portal at <https://portal.azure.com>.

**Free account or pay-as-you-go?** The free account gives you starter credit for
the first 30 days, plus 12 months of selected free services. That includes a
PostgreSQL Flexible Server of the B1ms size this setup uses, which can make the
database free for a year. The App Service plan is not free, so it uses the
credit and then needs a paid subscription. When the credit runs out, Azure asks
you to **upgrade to pay-as-you-go**. Do this before your demo date so nothing
stops unexpectedly. Free subscriptions also sometimes have no quota for App
Service in smaller regions. If the setup script reports a quota error, upgrading
usually fixes it.

### Set a budget alert (do this straight away)

1. In the portal, search for **Cost Management** and open **Budgets**, then **Add**.
2. Scope: your subscription. Amount: for example **R1 000** per month.
3. Alert at 80% and 100% to your email.

A budget does not stop spending. It warns you, so you're never surprised by a bill.

## Step 2: Install the Azure CLI and sign in

In PowerShell:

```powershell
winget install -e --id Microsoft.AzureCLI
```

Close and reopen PowerShell, then:

```powershell
az login
```

A browser window opens. Sign in with the account from step 1.

## Step 3: Choose a prefix

Every resource name and website address is built from a short **prefix**, such
as `boerit-daan`. It must be lowercase letters, digits and hyphens, and unique
across all of Azure. Your sites will be called things like
`boerit-daan-ui.azurewebsites.net`.

## Step 4: Create the Azure resources

From the repository root:

```powershell
./deploy/azure-setup.ps1 -Prefix boerit-daan
```

It shows which subscription it will use and asks for confirmation, then
creates the resource group, App Service plan, the four web apps, the PostgreSQL
server and the deployment identity. Allow 10–15 minutes; the database is the
slow part.

At the end it prints every value GitHub needs and saves them to
`boerit-azure-setup-<prefix>.txt` in your user folder. **That file contains
secrets.** Save the database admin password in your password manager, and
delete the file once step 5 is done.

> If it fails with *runtime not supported*, run `az webapp list-runtimes --os linux`
> and adjust `DOTNETCORE:10.0` or `NODE:22-lts` near the middle of the script.
> If it fails with a *quota* error, see step 1, or re-run with
> `-Location westeurope`. The demo will be a little slower from South Africa,
> but it will work.

## Step 5: Configure GitHub

Open the repository on GitHub, then **Settings**.

### 5a. Repository secrets

**Secrets and variables → Actions → Repository secrets → New repository secret**.
Add these three from the setup output:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### 5b. The two environments

**Environments → New environment**. Create one named exactly **`beta`** and
one named exactly **`production`**. The names must match, because Azure only
trusts deployments from environments with these names.

For each environment:

1. **Deployment branches and tags**: choose *Selected branches and tags* and
   add only `beta` (for the beta environment) or `main` (for production). This
   stops anything else from deploying there by accident.
2. **Environment variables → Add variable**, from that environment's section of
   the setup output: `AZURE_RESOURCE_GROUP`, `API_APP_NAME`, `UI_APP_NAME`,
   `API_URL`, `UI_URL`.
3. **Environment secrets → Add secret**: `DB_CONNECTION_STRING`, `JWT_SECRET`,
   and `DEMO_USERS` (next step).

No reviewers are needed on either environment.

## Step 6: Create the demo users

`DEMO_USERS` is a JSON list of the people who may sign in to that
environment:

```json
[
  { "email": "you@example.com",    "password": "…", "firstName": "Daan", "lastName": "…" },
  { "email": "pieter@example.com", "password": "…", "firstName": "Pieter", "lastName": "Botha" }
]
```

- Give every person their own account, and a strong password of at least 12
  characters. To generate one in PowerShell:
  `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 16 | % {[char]$_})`
- **beta** usually only needs you. **production** holds you plus the demo users.
- On every deploy the API creates any missing accounts. It also **resets the
  password** of any account whose password no longer matches the list. To change
  a password, edit the secret and re-run the deployment (*Actions → Deploy → Run
  workflow*).
- Removing someone from the list does **not** delete their account. If you need
  to lock someone out, change their password in the list.
- Send each person their sign-in details privately, not in a group chat.

## Step 7: Create the branches and deploy

Once the deployment work is merged into `main`:

```powershell
git switch main
git pull
git switch -c develop
git push -u origin develop
git switch -c beta
git push -u origin beta
```

Pushing `beta` triggers the first beta deployment. Watch it under the **Actions**
tab on GitHub. When it is green, open the beta `UI_URL` and sign in with a
beta demo user.

The first production deployment happens on the next push to `main`. You can
also start it by hand under *Actions → Deploy → Run workflow* with branch `main`.

### Day-to-day release flow

```powershell
# finish a feature
git switch develop
git merge feature/my-change
git push                      # CI builds it

# release to beta
git switch beta
git merge develop
git push                      # deploys beta, then check it

# release to production
git switch main
git merge beta
git push                      # deploys production
```

---

## Costs

| Item | Approx. per month |
|---|---|
| App Service plan B1 (all four apps) | ~US$17 |
| PostgreSQL B1ms + 32 GB (both databases) | ~US$18–22 (may be free for 12 months on a free account) |
| GitHub Actions, within the free minutes | free |

These are rough estimates; check the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/)
for South Africa North.

**Saving money between demos**

- Stop the database while nobody is demoing:
  `az postgres flexible-server stop -g rg-<prefix> -n <prefix>-db`.
  Storage is still billed. It restarts by itself after 7 days, and you start it
  again with `... start` before a demo.
- Stopping the web apps does **not** save money; the plan is billed regardless.
- When the demo period is over, delete everything in one go:
  `az group delete -n rg-<prefix>`. This cannot be undone and removes the data.
  Also delete the app registration `<prefix>-github-deploy` under
  *Microsoft Entra ID → App registrations*.

## Troubleshooting

- **A deployment failed**: open the failed run under *Actions*. The step name
  tells you which part.
- **The smoke test says the API did not come up**: stream its logs with
  `az webapp log tail -g rg-<prefix> -n <prefix>-api-beta`. A wrong
  `DB_CONNECTION_STRING` or invalid `DEMO_USERS` JSON both stop the API at
  startup, deliberately, so a misconfiguration is never silent.
- **Sign-in fails with "Invalid email or password"**: check that the email in
  `DEMO_USERS` matches exactly, and that a deployment has run since the
  secret was last changed.
- **The browser says it can't reach the API**: `API_URL` in that environment
  must be the API's `https://…` address with no trailing slash, and `UI_URL`
  must match the website's address exactly (it is used for CORS).
