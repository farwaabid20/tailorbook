# TailorBook

React + Vite + TypeScript + Supabase app for tailoring shops. **Status: first version, NOT yet built or tested** (see "Honest status" below).

## 1. Run locally
1. Install Node.js LTS (nodejs.org) and VS Code.
2. Extract the ZIP, open the folder in VS Code, open a terminal (Terminal > New Terminal).
3. `npm install`
4. Copy `.env.example` to `.env` and fill in your Supabase values (step 2).
5. `npm run dev`, then open the address shown (usually http://localhost:5173).

## 2. Supabase setup
1. Create a free project at supabase.com.
2. Project Settings > API: copy **Project URL** and the **anon public** key into `.env`. Never use the `service_role` key.
3. SQL Editor > New query: paste all of `supabase/migrations/0001_init.sql` and Run.
4. Authentication > URL Configuration: set Site URL to `http://localhost:5173` for testing, later your Vercel URL (also add it under Redirect URLs). Password-reset emails use this.
5. Authentication > Providers > Email: for quick testing you may turn off "Confirm email".

## 3. What is stored where
- **PostgreSQL database:** shops, customers, measurements (each save = new version), orders, order items, payments. Protected by Row Level Security: every row carries `shop_id` and policies only allow the shop owner to read/write it.
- **Storage:** not used yet. Logo upload is not implemented; if you add it, create a **private** bucket `logos` and a policy limiting access to the folder named after the shop id.

## 4. Backups
- Free Supabase plans have no automatic downloadable backups. Regularly run: `npx supabase db dump --db-url "YOUR_DB_CONNECTION_STRING" -f backup.sql` (connection string: Project Settings > Database). Restore with `psql "CONNECTION_STRING" -f backup.sql` into an empty project.
- Keep backups out of GitHub (they hold customer data).

## 5. GitHub + Vercel
1. Create a GitHub repo and push: `git init`, `git add .`, `git commit -m "first"`, `git remote add origin URL`, `git push -u origin main`. (`.env` is git-ignored.)
2. vercel.com > Add New Project > import the repo. Framework: Vite.
3. Add Environment Variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then Deploy.
4. Put the Vercel URL into Supabase Authentication URL settings (step 2.4).

## 6. Troubleshooting
- Blank page / "supabaseUrl is required": `.env` missing or values wrong; restart `npm run dev`.
- "new row violates row-level security": the SQL migration did not fully run, or you are not signed in.
- Cannot sign in after signup: confirm the email, or disable email confirmation for testing.
- Reset link goes to wrong site: fix Site URL in Supabase.

## Honest status
Not done: landing page and photos, charts beyond simple bars, shop settings/logo upload, unit switching UI, delete for orders, automated tests. Not verified: `npm install`, `npm run build`, and every screen (this was written without network access). Tenant isolation must be tested manually with two accounts: sign up twice and confirm each sees only its own data. Urdu covers navigation, forms, statuses and receipts; some validation messages come from Supabase in English.
