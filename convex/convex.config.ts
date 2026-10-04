import { defineApp } from "convex/server";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import resend from "@convex-dev/resend/convex.config";
import rag from "@convex-dev/rag/convex.config";

const app = defineApp();
// Keep existing HTTP endpoints at the root; the app registers static routes.
app.use(staticHosting);
app.use(rag);
app.use(resend);

export default app;
