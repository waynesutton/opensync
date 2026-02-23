# One-Click Deploy Checklist

You clicked a deploy button and now have the OpenSync frontend running on Vercel or Netlify. The frontend is deployed, but the app won't work until you complete the backend setup.

## What one-click deploy does

- Forks the OpenSync repository to your GitHub account
- Deploys the React frontend to Vercel or Netlify
- Prompts you for environment variables (which you may not have yet)

## What one-click deploy does NOT do

- Set up the Convex backend (database and functions)
- Create your WorkOS authentication account
- Configure OAuth redirect URIs
- Set up OpenAI for embeddings

## Post-deploy checklist

Complete these steps to get OpenSync fully working:

### 1. Set up Convex backend

```bash
# Clone your forked repo locally
git clone https://github.com/YOUR_USERNAME/opensync.git
cd opensync
npm install

# Initialize Convex (creates a new project)
npx convex dev
```

This will:

- Prompt you to log in to Convex (create account if needed)
- Create a new Convex project
- Deploy the schema and functions
- Give you a deployment URL like `https://happy-animal-123.convex.cloud`

Keep this terminal running during development.

- [ ] Convex project created
- [ ] Note your Convex URL: `https://____________.convex.cloud`

### 2. Set up WorkOS authentication

1. Go to [dashboard.workos.com](https://dashboard.workos.com) and create a project
2. Enable **Email + Password** authentication in Authentication section
3. Add redirect URIs in the Redirects section:

```
https://your-deployed-url.vercel.app/callback
https://your-deployed-url.netlify.app/callback
```

Replace with your actual deployed URL from Vercel or Netlify.

4. Copy your **Client ID** (`client_xxxxx`) from API Keys

5. **Configure CORS (Required for production):**
   - In the WorkOS Dashboard, go to **Authentication** page
   - Click **"Configure CORS"** or find **"Allowed web origins"** section
   - Add your deployed URL:
   ```
   https://your-deployed-url.vercel.app
   https://your-deployed-url.netlify.app
   ```

   - This prevents CORS errors when the app authenticates users

- [ ] WorkOS project created
- [ ] Email + Password auth enabled
- [ ] Redirect URI added for your deployed URL
- [ ] **CORS origins configured**
- [ ] Note your Client ID: `client_____________`

### 3. Set up OpenAI (for semantic search)

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy it (you won't see it again)

- [ ] OpenAI API key created
- [ ] Note your API key: `sk-____________`

### 4. Set Convex environment variables

In the [Convex dashboard](https://dashboard.convex.dev):

1. Select your project
2. Go to **Settings** > **Environment Variables**
3. Add these variables:

| Name               | Value                        |
| ------------------ | ---------------------------- |
| `WORKOS_CLIENT_ID` | `client_xxxxx` (from step 2) |
| `OPENAI_API_KEY`   | `sk-xxxxx` (from step 3)     |

- [ ] WORKOS_CLIENT_ID set in Convex
- [ ] OPENAI_API_KEY set in Convex

### 5. Deploy Convex backend

```bash
npx convex deploy
```

This deploys your backend to production.

- [ ] Convex backend deployed

### 6. Update frontend environment variables

In your Vercel or Netlify dashboard, update environment variables:

**Vercel:** Project Settings > Environment Variables

**Netlify:** Site settings > Environment variables

| Variable                | Value                                             |
| ----------------------- | ------------------------------------------------- |
| `VITE_CONVEX_URL`       | `https://your-project.convex.cloud` (from step 1) |
| `VITE_WORKOS_CLIENT_ID` | `client_xxxxx` (from step 2)                      |

- [ ] VITE_CONVEX_URL set
- [ ] VITE_WORKOS_CLIENT_ID set

### 7. Redeploy frontend

Trigger a new deployment in Vercel or Netlify to pick up the new environment variables.

**Vercel:** Deployments > Redeploy

**Netlify:** Deploys > Trigger deploy

- [ ] Frontend redeployed with correct environment variables

### 8. Test the app

1. Visit your deployed URL
2. Click "Get Started" to sign in
3. Create an account or sign in
4. You should see the empty dashboard
5. Go to Settings and generate an API key

- [ ] Can sign in with WorkOS
- [ ] Dashboard loads correctly
- [ ] Can generate API key in Settings

## Install a sync plugin (optional)

Once your instance is working, install a plugin to sync coding sessions:

**For Claude Code:**

```bash
npm install -g claude-code-sync
claude-code-sync login
```

**For OpenCode:**

```bash
npm install -g opencode-sync-plugin
opencode-sync login
```

**For Codex CLI:**

```bash
npm install -g codex-sync
codex-sync login
```

Enter your Convex URL and API key when prompted.

## Troubleshooting

### "Setup incomplete" banner showing

The app detected missing environment variables. Check that:

- `VITE_CONVEX_URL` is set in Vercel/Netlify
- `VITE_WORKOS_CLIENT_ID` is set in Vercel/Netlify
- You redeployed after setting the variables

### CORS error: "Access-Control-Allow-Origin" header missing

This happens when WorkOS CORS is not configured:

1. Go to WorkOS Dashboard > **Authentication** page
2. Click **"Configure CORS"** button
3. Add your deployed URL to allowed origins:
   ```
   https://your-deployed-url.vercel.app
   ```
4. Save and try logging in again

### Login redirects but user stays on login page

1. Check WorkOS redirect URI matches your deployed URL exactly
2. Check `WORKOS_CLIENT_ID` is set in Convex environment variables
3. Verify CORS is configured (see above)
4. Run `npx convex deploy` to sync changes

### "Invalid token" errors

1. Verify `WORKOS_CLIENT_ID` matches between Convex and frontend
2. Run `npx convex deploy` after changing Convex env vars

### Sessions not appearing after plugin setup

1. Check plugin is authenticated: `claude-code-sync status` or `opencode-sync status`
2. Check Convex dashboard logs for errors
3. Verify API key is valid in OpenSync Settings

### Semantic search not working

1. Verify `OPENAI_API_KEY` is set in Convex environment variables
2. Run `npx convex deploy`
3. Wait a minute (embeddings generate asynchronously)

## Next steps

- [Full setup guide](https://docs.opensync.dev/hosting/convex) for detailed configuration
- [Plugin development guide](https://docs.opensync.dev/plugins/opencode-sync) to build your own sync plugin
- [API reference](https://docs.opensync.dev/api/endpoints) for programmatic access
- [install.md](install.md) for local development setup

## Need help?

Open an issue on [GitHub](https://github.com/waynesutton/opensync/issues) with:

- Your deployment platform (Vercel or Netlify)
- Which step you're stuck on
- Any error messages from browser console or Convex logs
