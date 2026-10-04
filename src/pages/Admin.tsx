import { AdminUsageUsers } from "../components/AdminUsageUsers";
import {
  RecipientPicker,
  type EmailRecipient,
} from "../components/RecipientPicker";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../lib/utils";
import { useTheme, getThemeClasses } from "../lib/theme";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  Moon,
  Sun,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  ScrollText,
  Mail,
  Send,
  FlaskConical,
  Trash2,
  Save,
} from "lucide-react";
function errorMessage(err: unknown): string {
  if (err instanceof ConvexError && typeof err.data === "string") {
    return err.data;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// The composer mounts only after the server confirms owner access.
export function AdminPage() {
  const access = useQuery(api.admin.getAccessStatus);
  const allowed = access?.allowed;
  const { theme, toggleTheme } = useTheme();
  const t = getThemeClasses(theme);
  return (
    <div className={cn("min-h-screen", t.bgPrimary, t.textPrimary)}>
      <header
        className={cn("border-b px-4 py-3 flex items-center gap-3", t.border)}
      >
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className={cn("p-2 rounded", t.bgHover)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <ShieldCheck className="h-4 w-4" />
        <h1 className="text-sm">Admin</h1>
        <div className="flex-1" />
        <Link to="/usage-leaderboard" className={cn("text-xs underline underline-offset-4", t.textMuted)}>Public leaderboard</Link>
        <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className={cn("p-2 rounded", t.bgHover)}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {allowed === undefined ? (
          <p role="status">Checking admin access…</p>
        ) : !allowed ? (
          <p role="alert">
            {access?.message ?? "Platform admin access required"}
          </p>
        ) : (
          <AdminConsole />
        )}
      </main>
    </div>
  );
}
function AdminConsole() {
  const [params, setParams] = useSearchParams();
  const section = params.get("tab");
  const tab = section === "email" || section === "audit" ? section : "users";
  const setTab = (value: string) => setParams({ tab: value });
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  return (
    <>
      <nav aria-label="Admin sections" className="flex gap-2 mb-6">
        {(["users", "email", "audit"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "px-3 py-2 text-sm rounded border",
              t.border,
              tab === value ? t.bgActive : t.bgHover,
            )}
          >
            {value === "users" ? "Users" : value === "email" ? "Email updates" : "Audit log"}
          </button>
        ))}
      </nav>
      {tab === "users" ? <AdminUsageUsers /> : <div className="max-w-4xl">{tab === "email" ? <EmailUpdatesTab /> : <AuditLog />}</div>}
    </>
  );
}
function AuditLog() {
  const entries = useQuery(api.admin.listAuditLog);
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  return (
    <section
      aria-label="Admin audit log"
      className={cn("rounded-lg border p-4", t.border)}
    >
      <h2 className="text-sm mb-3">Recent admin activity</h2>
      {entries === undefined ? (
        <p role="status">Loading activity…</p>
      ) : entries.length === 0 ? (
        <p className={cn("text-sm", t.textMuted)}>
          No admin actions recorded yet
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry._id} className="text-sm break-words">
              <p>
                {entry.action} · {entry.actorEmail ?? "Deleted account"}
              </p>
              <p className={cn("text-xs", t.textMuted)}>
                {formatDate(entry.createdAt)} · {entry.targetType}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function broadcastStatusClass(status: string): string {
  switch (status) {
    case "sent":
      return "text-emerald-500";
    case "sending":
      return "text-amber-500";
    case "failed":
      return "text-red-400";
    default:
      return "";
  }
}

/**
 * Compose and send product update emails to all opted-in accounts.
 * Drafts are saved server side; sending runs in cursor-paged batches
 * through the Resend component with reactive progress below.
 */
function EmailUpdatesTab() {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const broadcasts = useQuery(api.broadcasts.listBroadcasts);
  const recipients = useQuery(api.broadcasts.recipientCount);
  const configuration = useQuery(api.broadcasts.getEmailConfiguration);
  const convex = useConvex();
  const [selectedBroadcastId, setSelectedBroadcastId] =
    useState<Id<"emailBroadcasts"> | null>(null);
  const selectedBroadcast = useQuery(
    api.broadcasts.getBroadcast,
    selectedBroadcastId ? { broadcastId: selectedBroadcastId } : "skip",
  );
  const recipientLabel = recipients
    ? `${recipients.isExact ? "" : "at least "}${recipients.count}`
    : "…";

  const createDraft = useMutation(api.broadcasts.createDraft);
  const updateDraft = useMutation(api.broadcasts.updateDraft);
  const deleteDraft = useMutation(api.broadcasts.deleteDraft);
  const sendTest = useMutation(api.broadcasts.sendTest);
  const sendBroadcast = useMutation(api.broadcasts.sendBroadcast);
  const sendToRecipient = useMutation(api.broadcasts.sendToRecipient);
  const [audience, setAudience] = useState<"all" | "one">("all");
  const [recipient, setRecipient] = useState<EmailRecipient | null>(null);

  // Draft currently loaded in the compose form (null = new, unsaved)
  const [draftId, setDraftId] = useState<Id<"emailBroadcasts"> | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmTest, setConfirmTest] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState<Id<"emailBroadcasts"> | null>(
    null,
  );

  const canCompose =
    (audience === "all" || recipient !== null) &&
    subject.trim().length > 0 &&
    subject.trim().length <= 200 &&
    bodyText.trim().length > 0 &&
    bodyText.trim().length <= 50000;
  const canSend = canCompose && !busy && configuration?.canSend === true;
  const canBroadcast =
    canSend &&
    (audience === "one"
      ? recipient !== null
      : recipients !== undefined &&
        (!recipients.isExact || recipients.count > 0));

  // Save the compose form as a draft, creating or updating as needed
  const saveDraft = async (): Promise<Id<"emailBroadcasts">> => {
    const recipientId = audience === "one" ? recipient?._id : null;
    if (audience === "one" && !recipientId)
      throw new Error("Select one recipient first");
    if (draftId) {
      await updateDraft({
        broadcastId: draftId,
        subject,
        bodyText,
        recipientId,
      });
      return draftId;
    }
    const id = await createDraft({ subject, bodyText, recipientId });
    setDraftId(id);
    return id;
  };

  const run = (label: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    void fn()
      .then(() => setNotice(label))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  };

  const handleSendTest = () =>
    run("Test email queued for your account address", async () => {
      const id = await saveDraft();
      await sendTest({ broadcastId: id });
    });

  const handleSend = () =>
    run(
      audience === "one"
        ? "Email queued for the selected recipient"
        : "Broadcast started",
      async () => {
        const id = await saveDraft();
        if (audience === "one") {
          if (!recipient) throw new Error("Select one recipient first");
          await sendToRecipient({
            broadcastId: id,
            recipientId: recipient._id,
            recipientEmail: recipient.email,
          });
        } else {
          await sendBroadcast({ broadcastId: id });
        }
        setSelectedBroadcastId(id);
        setDraftId(null);
        setSubject("");
        setBodyText("");
        setRecipient(null);
      },
    );

  // Fetch only the selected draft; no email is sent by opening or saving it.
  const loadDraft = (id: Id<"emailBroadcasts">) =>
    run("Draft opened", async () => {
      const draft = await convex.query(api.broadcasts.getBroadcast, {
        broadcastId: id,
      });
      if (!draft || draft.status !== "draft")
        throw new Error("This draft is no longer available");
      setDraftId(id);
      setSubject(draft.subject);
      setBodyText(draft.bodyText);
      setAudience(draft.recipientId ? "one" : "all");
      setRecipient(
        draft.recipientId
          ? { _id: draft.recipientId, email: draft.recipientEmail ?? "" }
          : null,
      );
      setSelectedBroadcastId(id);
    });

  const handleDiscard = () =>
    run("Draft discarded", async () => {
      if (draftId) await deleteDraft({ broadcastId: draftId });
      setDraftId(null);
      setSubject("");
      setBodyText("");
      setRecipient(null);
    });

  return (
    <div className="space-y-6">
      {/* Test mode banner */}
      {configuration?.testMode && (
        <div className="px-3 py-2 rounded border border-amber-500/30 bg-amber-500/10 text-sm text-amber-500 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0" />
          Resend test mode is on. Save drafts and preview emails here; sending
          is disabled.
        </div>
      )}

      {configuration && configuration.missing.length > 0 && (
        <p role="status" className={cn("text-sm", t.textMuted)}>
          Email setup is incomplete: {configuration.missing.join(", ")}. Drafts
          and previews are available.
        </p>
      )}
      {notice && (
        <div
          role="status"
          className="px-3 py-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-500"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="px-3 py-2 rounded border border-red-500/30 bg-red-500/10 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {/* Compose */}
      <div
        className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}
      >
        <div
          className={cn("px-4 py-3 border-b flex items-center gap-2", t.border)}
        >
          <Mail className={cn("h-4 w-4", t.textMuted)} />
          <h3 className={cn("text-xs font-normal", t.textMuted)}>
            Compose product update
          </h3>
          <div className="flex-1" />
          <span className={cn("text-xs", t.textMuted)}>
            {audience === "one"
              ? recipient
                ? "1 selected account"
                : "Choose one account"
              : recipients === undefined
                ? "Counting recipients..."
                : `${recipientLabel} eligible accounts`}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <fieldset disabled={busy} className="space-y-2">
            <legend className="text-sm mb-2">Recipients</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="email-audience"
                  value="all"
                  checked={audience === "all"}
                  onChange={() => {
                    setAudience("all");
                    setRecipient(null);
                  }}
                />
                All eligible accounts
              </label>
              <label className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="email-audience"
                  value="one"
                  checked={audience === "one"}
                  onChange={() => setAudience("one")}
                />
                One person
              </label>
            </div>
          </fieldset>
          {audience === "one" && (
            <RecipientPicker
              selected={recipient}
              onSelect={setRecipient}
              disabled={busy}
            />
          )}
          <label
            htmlFor="broadcast-subject"
            className={cn("block text-sm", t.textSecondary)}
          >
            Subject
          </label>
          <input
            id="broadcast-subject"
            type="text"
            maxLength={200}
            disabled={busy}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className={cn(
              "w-full px-3 py-2 text-sm rounded border bg-transparent outline-none",
              t.border,
              t.textPrimary,
            )}
          />
          <label
            htmlFor="broadcast-body"
            className={cn("block text-sm", t.textSecondary)}
          >
            Message
          </label>
          <textarea
            id="broadcast-body"
            maxLength={50000}
            disabled={busy}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Plain text body. Blank lines start new paragraphs. An unsubscribe footer is added automatically."
            rows={8}
            className={cn(
              "w-full px-3 py-2 text-sm rounded border bg-transparent outline-none resize-y",
              t.border,
              t.textPrimary,
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                run("Draft saved", async () => {
                  await saveDraft();
                })
              }
              disabled={!canCompose || busy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border disabled:opacity-50",
                t.border,
                t.textPrimary,
                t.bgHover,
              )}
            >
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
            <button
              onClick={() => setConfirmTest(true)}
              disabled={!canSend}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50",
                t.border,
                t.textMuted,
                t.bgHover,
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Send test to me
            </button>
            <button
              onClick={() => setConfirmSend(true)}
              disabled={!canBroadcast}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50",
                t.border,
                t.textPrimary,
                t.bgHover,
              )}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {audience === "one" ? "Review email" : "Review broadcast"}
            </button>
            {(draftId || subject || bodyText) && (
              <button
                onClick={() => setConfirmDiscard(true)}
                disabled={busy}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50",
                  t.border,
                  t.textMuted,
                  t.bgHover,
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Discard
              </button>
            )}
          </div>
          <details className={cn("rounded border p-3 text-sm", t.border)}>
            <summary className={cn("cursor-pointer", t.textSecondary)}>
              Preview email
            </summary>
            <h4 className={cn("mt-3 font-medium break-words", t.textPrimary)}>
              {subject.trim() || "Add a subject to preview"}
            </h4>
            <p
              className={cn(
                "mt-2 whitespace-pre-wrap break-words",
                t.textSecondary,
              )}
            >
              {bodyText.trim() || "Write your message above."}
            </p>
            <p
              className={cn(
                "mt-4 border-t pt-3 text-xs",
                t.border,
                t.textMuted,
              )}
            >
              An unsubscribe link and the configured postal address are added
              when sending.
            </p>
          </details>
          {configuration && (
            <p className={cn("text-xs", t.textMuted)}>
              Test recipient: {configuration.testRecipient}. Tests require
              confirmation and send only to your signed-in account.
            </p>
          )}
        </div>
      </div>

      {/* Past broadcasts */}
      <div
        className={cn("rounded-lg border overflow-hidden", t.bgCard, t.border)}
      >
        <div
          className={cn("px-4 py-3 border-b flex items-center gap-2", t.border)}
        >
          <ScrollText className={cn("h-4 w-4", t.textMuted)} />
          <h3 className={cn("text-xs font-normal", t.textMuted)}>
            Drafts and broadcasts
          </h3>
        </div>
        {broadcasts === undefined ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className={cn("h-5 w-5 animate-spin", t.textMuted)} />
          </div>
        ) : broadcasts.length === 0 ? (
          <p className={cn("p-4 text-sm text-center", t.textMuted)}>
            No drafts or broadcasts yet
          </p>
        ) : (
          <div className={cn("divide-y", t.divide)}>
            {broadcasts.map((b) => (
              <div
                key={b._id}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              >
                <span className={cn("text-xs w-24 shrink-0", t.textDim)}>
                  {formatDate(b.sentAt ?? b.createdAt)}
                </span>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (b.status !== "draft") {
                      setSelectedBroadcastId(b._id);
                      return;
                    }
                    if (subject || bodyText) setConfirmLoad(b._id);
                    else loadDraft(b._id);
                  }}
                  className={cn(
                    "text-sm flex-1 truncate text-left underline underline-offset-4 disabled:opacity-50",
                    t.textPrimary,
                  )}
                  aria-label={`${b.status === "draft" ? "Edit draft" : "View delivery"}: ${b.subject}`}
                >
                  {b.subject}
                </button>
                {b.status === "sending" && (
                  <span className={cn("text-xs", t.textMuted)}>
                    {b.sentCount ?? 0} queued
                  </span>
                )}
                {b.status === "sent" && (
                  <span className={cn("text-xs", t.textMuted)}>
                    {b.sentCount ?? 0}/{b.recipientCount ?? 0} queued
                    {(b.failedCount ?? 0) > 0 && `, ${b.failedCount} failed`}
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider w-16 text-right",
                    broadcastStatusClass(b.status) || t.textDim,
                  )}
                >
                  {b.recipientEmail
                    ? `To: ${b.recipientEmail} · `
                    : "All eligible · "}
                  {b.status === "sent" ? "queued" : b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBroadcast && (
        <section
          className={cn("rounded-lg border p-4 space-y-2", t.border, t.bgCard)}
          aria-label="Broadcast delivery details"
        >
          <h3 className={cn("text-sm break-words", t.textPrimary)}>
            {selectedBroadcast.subject}
          </h3>
          <p className={cn("text-xs", t.textMuted)}>
            {selectedBroadcast.recipientEmail
              ? `To: ${selectedBroadcast.recipientEmail}. `
              : "All eligible accounts. "}
            {selectedBroadcast.delivery.delivered} delivered ·{" "}
            {selectedBroadcast.delivery.queued} queued ·{" "}
            {selectedBroadcast.delivery.pending} awaiting delivery ·{" "}
            {selectedBroadcast.delivery.failed} failed or suppressed
            {!selectedBroadcast.delivery.isExact &&
              " (first 1,000 recipients only)"}
          </p>
          {selectedBroadcast.error && (
            <p role="alert" className="text-sm text-red-500">
              {selectedBroadcast.error}
            </p>
          )}
          <p
            className={cn(
              "text-sm whitespace-pre-wrap break-words",
              t.textSecondary,
            )}
          >
            {selectedBroadcast.bodyText}
          </p>
        </section>
      )}
      <ConfirmModal
        isOpen={confirmLoad !== null}
        onClose={() => setConfirmLoad(null)}
        onConfirm={() => {
          if (confirmLoad) loadDraft(confirmLoad);
        }}
        title="Open saved draft"
        message="Replace the editor contents with this saved draft? Save your current draft first if you want to keep your changes."
        confirmText="Open draft"
      />
      <ConfirmModal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Discard draft"
        message="Delete this draft and clear the editor? This cannot be undone."
        confirmText="Discard"
        variant="danger"
      />
      <ConfirmModal
        isOpen={confirmTest}
        onClose={() => setConfirmTest(false)}
        onConfirm={() => {
          if (canSend) handleSendTest();
        }}
        title="Send test email"
        message={`Send a real test email to ${configuration?.testRecipient ?? "your authorized account"}? No other accounts will receive it.`}
        confirmText="Send test"
      />
      <ConfirmModal
        isOpen={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={() => {
          if (canBroadcast) handleSend();
        }}
        title={audience === "one" ? "Send to one person" : "Send broadcast"}
        message={
          audience === "one"
            ? `Send "${subject.trim()}" only to ${recipient?.email ?? "the selected account"}? Eligibility and the address are checked again before queueing. This action is recorded in the audit log.`
            : `Send "${subject.trim()}" to ${recipientLabel} eligible accounts? The audience is checked again during sending. This cannot be undone and is written to the audit log.`
        }
        confirmText={audience === "one" ? "Send email" : "Send broadcast"}
        variant="danger"
      />
    </div>
  );
}
