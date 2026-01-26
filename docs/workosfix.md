# WorkOS AuthKit Integration Fix

This document explains the changes made to fix WorkOS authentication with Convex.
more on this later

## Problem

The original implementation used a custom OAuth flow that attempted to call the WorkOS token exchange API directly from the frontend. This approach failed because:

1. The token exchange endpoint requires a `client_secret` which should never be exposed in client-side code
2. The `auth.config.ts` was using an outdated format with `domain` instead of the proper JWT validation fields
3. The URL cleanup happened before the token exchange completed, causing redirect loops

## Solution

Switched to the official WorkOS AuthKit React SDK (`@workos-inc/authkit-react`) and Convex's WorkOS provider (`@convex-dev/workos`) as documented at https://docs.convex.dev/auth/authkit/

### Packages Installed

```bash
npm install @workos-inc/authkit-react @convex-dev/workos
```

### Files Changed

#### 1. convex/auth.config.ts

Updated from the old format:

```typescript
// OLD - incorrect
export default {
  providers: [
    {
      domain: "https://api.workos.com/",
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
};
```

To the proper JWT validation format:

```typescript
// NEW - correct
const clientId = process.env.WORKOS_CLIENT_ID;

export default {
  providers: [
    {
      type: "customJwt" as const,
      issuer: "https://api.workos.com/",
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: "customJwt" as const,
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};
```

#### 2. src/main.tsx

Replaced custom auth provider with the official AuthKit integration:

```typescript
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

function Root() {
  return (
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
      redirectUri={import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/callback`}
    >
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  );
}
```

#### 3. src/lib/auth.tsx

Simplified to wrap the AuthKit hooks instead of implementing custom OAuth logic:

```typescript
import { useAuth as useAuthKit } from "@workos-inc/authkit-react";
import { useConvexAuth } from "convex/react";

export function useAuth() {
  const { user, signIn, signOut, isLoading: authKitLoading } = useAuthKit();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  // ... map to consistent interface
}
```

## Required Configuration

### Environment Variables

Create a `.env.local` file with:

```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_WORKOS_CLIENT_ID=client_01XXXXX
VITE_REDIRECT_URI=http://localhost:5173/callback
```

### Convex Environment Variables

Set `WORKOS_CLIENT_ID` in your Convex dashboard:

1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to Settings > Environment Variables
4. Add `WORKOS_CLIENT_ID` with your client ID

### WorkOS Dashboard Configuration

1. Go to https://dashboard.workos.com
2. Navigate to **Authentication > AuthKit**
3. Add redirect URI: `http://localhost:5173/callback` (development)
4. Navigate to **Authentication > Sessions > CORS**
5. Add `http://localhost:5173` to allowed origins

For production, add your production domain to both redirect URIs and CORS origins.

## How AuthKit Works

The authentication flow with AuthKit:

1. User clicks sign in
2. `AuthKitProvider` redirects to WorkOS hosted login
3. User authenticates via email, SSO, or social login
4. WorkOS redirects back to `/callback` with an authorization code
5. AuthKit SDK exchanges the code for tokens (handled securely)
6. `ConvexProviderWithAuthKit` passes the access token to Convex
7. Convex validates the JWT using the JWKS endpoint
8. User is authenticated and can access protected routes

## Troubleshooting

### "Sign in" button does nothing

Check that `VITE_WORKOS_CLIENT_ID` is set in `.env.local` and restart the dev server.

### Redirect loop after authentication

1. Verify CORS is configured in WorkOS dashboard
2. Confirm redirect URI matches exactly in both WorkOS and `.env.local`
3. Check browser console for errors

### "isAuthenticated" stays false after login

1. Ensure `WORKOS_CLIENT_ID` is set in Convex environment variables
2. Run `npx convex dev` to sync the auth config
3. Check that both JWT issuers are configured in `auth.config.ts`

## References

- Convex WorkOS AuthKit docs: https://docs.convex.dev/auth/authkit/
- WorkOS AuthKit React: https://workos.com/docs/authkit/react
- Convex Authentication: https://docs.convex.dev/auth
