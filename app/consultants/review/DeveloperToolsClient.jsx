"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import DeveloperEmailTemplatesClient from "./DeveloperEmailTemplatesClient";
import VaultCreatorClaimOutreach from "./VaultCreatorClaimOutreach.client";

function formatCount(value) {
  if (value == null) return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
}

export default function DeveloperToolsClient() {
  const [activeTool, setActiveTool] = useState("reset-user");
  const [email, setEmail] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sandbox, setSandbox] = useState(null);
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [consultantSandbox, setConsultantSandbox] = useState(null);
  const [consultantSandboxBusy, setConsultantSandboxBusy] = useState(false);
  const [consultantDeleteText, setConsultantDeleteText] = useState("");
  const [stripePayoutAccount, setStripePayoutAccount] = useState(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [checkoutResources, setCheckoutResources] = useState([]);
  const [checkoutResourceId, setCheckoutResourceId] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [buyerJourneyResourcePath, setBuyerJourneyResourcePath] = useState("");

  async function callAuthenticatedApi(path, { method = "GET", body } = {}) {
    const sb = supabaseBrowser();
    const {
      data: { session },
      error: sessionError,
    } = await sb.auth.getSession();
    if (sessionError) throw new Error(sessionError.message || "Unable to read session.");

    const response = await fetch(path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.ok === false) {
      throw new Error(result?.error || `Request failed (${response.status}).`);
    }
    return { result, userId: session?.user?.id || "" };
  }

  async function loadCheckoutResources() {
    setError("");
    setCheckoutBusy(true);
    try {
      const { result, userId } = await callAuthenticatedApi("/api/resources?view=card&limit=200");
      const resources = (result.resources || []).filter((resource) => (
        Number(resource.priceCents) > 0 && resource.ownerUserId && resource.ownerUserId !== userId
      ));
      setCheckoutResources(resources);
      setCheckoutResourceId((current) => resources.some((resource) => resource.id === current) ? current : resources[0]?.id || "");
    } catch (err) {
      setError(err.message || "Unable to load paid Vault resources.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function handleCheckoutTest() {
    if (!checkoutResourceId) {
      setError("Select a paid resource to test Checkout.");
      return;
    }

    setError("");
    setCheckoutBusy(true);
    try {
      const { result: orderResult } = await callAuthenticatedApi("/api/resources/orders", {
        method: "POST",
        body: { resourceIds: [checkoutResourceId] },
      });
      const orderId = orderResult.order?.id;
      if (!orderId) throw new Error("Order creation did not return an order ID.");

      const { result: checkoutResult } = await callAuthenticatedApi(`/api/resources/orders/${orderId}/checkout`, {
        method: "POST",
      });
      if (!checkoutResult.url) throw new Error("Stripe did not return a Checkout URL.");
      window.location.assign(checkoutResult.url);
    } catch (err) {
      setError(err.message || "Unable to start Stripe Checkout.");
      setCheckoutBusy(false);
    }
  }

  async function handleCheckoutSandbox(mode = "prepare") {
    if (mode === "delete" && !window.confirm("Delete only the DEV Stripe Checkout Test Resource?")) return;
    setError("");
    setMessage("");
    setCheckoutBusy(true);
    try {
      const { result: sandboxResult } = await callAuthenticatedApi("/api/admin/dev-tools/stripe-checkout-sandbox", {
        method: "POST",
        body: { mode },
      });
      if (mode === "delete") {
        setBuyerJourneyResourcePath("");
        setMessage(sandboxResult.deleted ? "Stripe Checkout test resource deleted." : "Stripe Checkout test resource was already absent.");
        return;
      }
      if (!sandboxResult.resourcePath) throw new Error("Sandbox setup did not return a resource path.");
      setBuyerJourneyResourcePath(sandboxResult.resourcePath);
      setMessage("Seller test resource is ready. Sign out, sign in as the separate buyer, then open the resource below.");
    } catch (err) {
      setError(err.message || "Unable to prepare the Stripe Checkout sandbox.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function configureWebhookSettlement() {
    setError("");
    setCheckoutBusy(true);
    try {
      await callAuthenticatedApi("/api/admin/dev-tools/stripe-webhook-settlement", { method: "POST" });
      setMessage("Stripe webhook settlement is configured for this environment.");
    } catch (err) {
      setError(err.message || "Unable to configure Stripe webhook settlement.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function callStripeConnectApi(path, method = "GET") {
    const sb = supabaseBrowser();
    const {
      data: { session },
      error: sessionError,
    } = await sb.auth.getSession();

    if (sessionError) throw new Error(sessionError.message || "Unable to read session.");

    const response = await fetch(path, {
      method,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      credentials: "include",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Request failed (${response.status}).`);
    }
    return body;
  }

  async function loadStripePayoutAccount() {
    setError("");
    setStripeBusy(true);
    try {
      const body = await callStripeConnectApi("/api/resources/payout-account");
      setStripePayoutAccount(body.payoutAccount || null);
    } catch (err) {
      setError(err.message || "Unable to load Stripe payout account.");
    } finally {
      setStripeBusy(false);
    }
  }

  async function handleStripeConnect() {
    setError("");
    setStripeBusy(true);
    try {
      const body = await callStripeConnectApi("/api/resources/payout-account/onboard", "POST");
      if (!body.url) throw new Error("Stripe did not return an onboarding URL.");
      window.location.assign(body.url);
    } catch (err) {
      setError(err.message || "Unable to start Stripe onboarding.");
      setStripeBusy(false);
    }
  }

  async function resetStripePayoutAccount() {
    if (!window.confirm("Remove this local Stripe payout record? This does not delete the Stripe account.")) return;

    setError("");
    setMessage("");
    setStripeBusy(true);
    try {
      const body = await callStripeConnectApi("/api/admin/dev-tools/stripe-payout-account", "DELETE");
      setStripePayoutAccount(null);
      setMessage(body.deleted ? "Local Stripe payout record removed. You can now start live Connect onboarding." : "No local Stripe payout record was found.");
    } catch (err) {
      setError(err.message || "Unable to remove the local Stripe payout record.");
    } finally {
      setStripeBusy(false);
    }
  }

  useEffect(() => {
    if (activeTool === "stripe-connect") {
      void loadStripePayoutAccount();
    }
    if (activeTool === "stripe-checkout") {
      void loadCheckoutResources();
    }
  }, [activeTool]);

  async function callSandboxApi(mode) {
    const sb = supabaseBrowser();
    const {
      data: { session },
      error: sessionError,
    } = await sb.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message || "Unable to read session.");
    }

    const response = await fetch("/api/admin/dev-tools/resource-claim-sandbox", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ mode }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Request failed (${response.status}).`);
    }

    return body;
  }

  async function handleSandbox(mode) {
    setError("");
    setMessage("");
    setSandboxBusy(true);
    try {
      const body = await callSandboxApi(mode);
      setSandbox(body);
      setMessage(
        mode === "reset"
          ? "Sandbox resource reset and ready for claim-flow testing."
          : mode === "delete"
            ? (body.deleted ? "Claim sandbox resource deleted." : "Claim sandbox resource was already absent.")
            : "Loaded current sandbox state."
      );
    } catch (err) {
      setError(err.message || "Sandbox request failed.");
    } finally {
      setSandboxBusy(false);
    }
  }

  async function callConsultantSandboxApi(mode, confirmText) {
    const sb = supabaseBrowser();
    const {
      data: { session },
      error: sessionError,
    } = await sb.auth.getSession();
    if (sessionError) throw new Error(sessionError.message || "Unable to read session.");

    const response = await fetch("/api/admin/dev-tools/consultant-profile-sandbox", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ mode, ...(confirmText ? { confirmText } : {}) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Request failed (${response.status}).`);
    }
    return body;
  }

  async function handleConsultantSandbox(mode) {
    setError("");
    setMessage("");
    setConsultantSandboxBusy(true);
    try {
      const body = await callConsultantSandboxApi(
        mode,
        mode === "delete" ? consultantDeleteText.trim() : undefined
      );
      setConsultantSandbox(body);
      if (mode === "delete") {
        setConsultantDeleteText("");
        setMessage("Test consultant profile deleted.");
      } else if (mode === "create") {
        setMessage("Test consultant profile created and assigned to jaymeblue@gmail.com.");
      } else {
        setMessage("Loaded test consultant profile state.");
      }
    } catch (err) {
      setError(err.message || "Consultant sandbox request failed.");
    } finally {
      setConsultantSandboxBusy(false);
    }
  }

  const trimmedEmail = email.trim().toLowerCase();
  const requiredPhrase = useMemo(() => (trimmedEmail ? `RESET ${trimmedEmail}` : ""), [trimmedEmail]);
  const canReset = Boolean(preview?.ok && trimmedEmail && confirmText.trim() === requiredPhrase);

  async function callResetApi(mode) {
    const sb = supabaseBrowser();
    const {
      data: { session },
      error: sessionError,
    } = await sb.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message || "Unable to read session.");
    }

    const response = await fetch("/api/admin/dev-tools/reset-test-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        mode,
        email: trimmedEmail,
        confirmText: mode === "execute" ? confirmText.trim() : undefined,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Request failed (${response.status}).`);
    }

    return body;
  }

  async function handlePreview() {
    setError("");
    setMessage("");
    setPreview(null);

    if (!trimmedEmail) {
      setError("Enter the testing email you want to inspect.");
      return;
    }

    setLoadingPreview(true);
    try {
      const body = await callResetApi("preview");
      setPreview(body);
      if (!body.userExists) {
        setMessage("No auth account exists for that email yet. You can proceed with sign-up tests.");
      }
    } catch (err) {
      setError(err.message || "Preview failed.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleReset() {
    setError("");
    setMessage("");

    if (!canReset) {
      setError("Type the exact confirmation phrase to run the reset.");
      return;
    }

    setResetting(true);
    try {
      const body = await callResetApi("execute");
      setPreview(body);
      setMessage(`Reset complete for ${trimmedEmail}.`);
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Developer tools</h1>
        <p className="text-sm text-slate-400">
          Admin-only testing utilities. Start with a dedicated UAT account email and use preview before executing reset.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTool("reset-user")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "reset-user"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Reset test account
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("email-templates")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "email-templates"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Email triggers
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("creator-claims")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "creator-claims"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Creator claim outreach
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("claim-sandbox")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "claim-sandbox"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Claim sandbox
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("consultant-sandbox")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "consultant-sandbox"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Consultant sandbox
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("stripe-connect")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "stripe-connect"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Stripe Connect
        </button>
        <button
          type="button"
          onClick={() => setActiveTool("stripe-checkout")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeTool === "stripe-checkout"
              ? "bg-sky-500/20 text-sky-100 border border-sky-300/50"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          Stripe Checkout
        </button>
      </div>

      {activeTool === "email-templates" ? <DeveloperEmailTemplatesClient /> : null}
      {activeTool === "creator-claims" ? <VaultCreatorClaimOutreach /> : null}

      {activeTool === "stripe-connect" ? (
        <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Stripe Connect test</h2>
            <p className="mt-1 text-sm text-slate-400">Creates or resumes onboarding for your current signed-in account.</p>
          </div>

          <div className="space-y-1 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
            <div>Account status: <span className="text-sky-300">{stripePayoutAccount?.status || "Not connected"}</span></div>
            <div>Provider account ID: <span className="break-all text-sky-300">{stripePayoutAccount?.providerAccountId || "-"}</span></div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadStripePayoutAccount}
              disabled={stripeBusy}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-60"
            >
              {stripeBusy ? "Working..." : "Refresh status"}
            </button>
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={stripeBusy}
              className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60"
            >
              {stripeBusy ? "Opening Stripe..." : "Test Stripe Connect"}
            </button>
            <button
              type="button"
              onClick={resetStripePayoutAccount}
              disabled={stripeBusy}
              className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
            >
              {stripeBusy ? "Working..." : "Reset local Stripe record"}
            </button>
          </div>

          <p className="text-sm text-slate-400">This removes only the local payout record for your signed-in user. It does not delete anything in Stripe.</p>

          {error ? <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
          {message ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div> : null}
        </article>
      ) : null}

      {activeTool === "stripe-checkout" ? (
        <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Stripe Checkout test</h2>
            <p className="mt-1 text-sm text-slate-400">Creates a new draft order for the selected paid resource, then opens Stripe Checkout.</p>
          </div>

          <button
            type="button"
            onClick={handleCheckoutSandbox}
            disabled={checkoutBusy}
            className="w-fit rounded-full border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-60"
          >
            {checkoutBusy ? "Preparing..." : "Prepare $1 buyer-journey test resource"}
          </button>
          <button
            type="button"
            onClick={() => handleCheckoutSandbox("delete")}
            disabled={checkoutBusy}
            className="w-fit rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
          >
            {checkoutBusy ? "Working..." : "Delete DEV Stripe Checkout Test Resource"}
          </button>
          <p className="text-sm text-slate-400">Creates or refreshes a clearly marked seller resource using your active Stripe test recipient. It does not create an order.</p>

          {buyerJourneyResourcePath ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="font-semibold">Buyer test link ready</div>
              <p className="mt-1 text-emerald-100/85">Sign out, sign in as the separate buyer, then open this link and use the normal Buy button.</p>
              <a href={buyerJourneyResourcePath} className="mt-3 inline-flex break-all text-sky-200 underline decoration-sky-300/50 underline-offset-4 hover:text-white">
                {buyerJourneyResourcePath}
              </a>
            </div>
          ) : null}

          <button
            type="button"
            onClick={configureWebhookSettlement}
            disabled={checkoutBusy}
            className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-60"
          >
            {checkoutBusy ? "Working..." : "Configure webhook settlement"}
          </button>

          <label className="block text-sm text-slate-200">
            Paid resource
            <select
              value={checkoutResourceId}
              onChange={(event) => setCheckoutResourceId(event.target.value)}
              disabled={checkoutBusy || !checkoutResources.length}
              className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/60 disabled:opacity-60"
            >
              {checkoutResources.length ? checkoutResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title} - {resource.currencyCode} {(Number(resource.priceCents) / 100).toFixed(2)}
                </option>
              )) : <option value="">No eligible paid resources found</option>}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadCheckoutResources}
              disabled={checkoutBusy}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-60"
            >
              {checkoutBusy ? "Working..." : "Refresh resources"}
            </button>
            <button
              type="button"
              onClick={handleCheckoutTest}
              disabled={checkoutBusy || !checkoutResourceId}
              className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60"
            >
              {checkoutBusy ? "Opening Stripe..." : "Create order and test Checkout"}
            </button>
          </div>

          {error ? <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
          {message ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div> : null}
        </article>
      ) : null}

      {activeTool === "claim-sandbox" ? (
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Resource claim sandbox</h2>
            <p className="mt-1 text-sm text-slate-400">
              One reusable dev-only unclaimed resource tied to a sandbox claim email. Use reset before each test run.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSandbox("preview")}
              disabled={sandboxBusy}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-60"
            >
              {sandboxBusy ? "Working..." : "Preview sandbox"}
            </button>
            <button
              type="button"
              onClick={() => handleSandbox("reset")}
              disabled={sandboxBusy}
              className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60"
            >
              {sandboxBusy ? "Working..." : "Reset sandbox"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete only the DEV Claim Sandbox Resource?")) void handleSandbox("delete");
              }}
              disabled={sandboxBusy}
              className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
            >
              {sandboxBusy ? "Working..." : "Delete DEV Claim Sandbox Resource"}
            </button>
          </div>

          {message ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {sandbox?.sandbox ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200 space-y-2">
              <div>Claim email: <span className="text-sky-300">{sandbox.sandbox.claimEmail || "-"}</span></div>
              <div>Consultant ID: {sandbox.sandbox.consultantId || "-"}</div>
              <div>Resource ID: {sandbox.sandbox.resourceId || "-"}</div>
              <div>Currently claimed: {sandbox.sandbox.consultantClaimed ? "Yes" : "No"}</div>
              {sandbox?.links?.resource ? (
                <div>
                  Resource link: <a href={sandbox.links.resource} className="text-sky-300 hover:underline">{sandbox.links.resource}</a>
                </div>
              ) : null}
              {sandbox?.links?.claim ? (
                <div>
                  Claim page link: <a href={sandbox.links.claim} className="text-sky-300 hover:underline">{sandbox.links.claim}</a>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>
      ) : null}

      {activeTool === "consultant-sandbox" ? (
        <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Consultant profile sandbox</h2>
            <p className="mt-1 text-sm text-slate-400">
              Creates one private, DevTools-marked consultant profile for jaymeblue@gmail.com. This tool cannot modify or delete any other consultant.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleConsultantSandbox("preview")}
              disabled={consultantSandboxBusy}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-60"
            >
              {consultantSandboxBusy ? "Working..." : "Preview profile"}
            </button>
            <button
              type="button"
              onClick={() => handleConsultantSandbox("create")}
              disabled={consultantSandboxBusy}
              className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60"
            >
              {consultantSandboxBusy ? "Working..." : "Create or reset profile"}
            </button>
          </div>

          {consultantSandbox ? (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
              <div>Test account: <span className="text-sky-300">{consultantSandbox.testEmail || "jaymeblue@gmail.com"}</span></div>
              <div>Auth account exists: {consultantSandbox.testAccountExists ? "Yes" : "No"}</div>
              <div>Profile exists: {consultantSandbox.sandbox?.id ? "Yes" : "No"}</div>
              {consultantSandbox.profileUrl ? (
                <div>
                  Profile link: <a href={consultantSandbox.profileUrl} className="text-sky-300 hover:underline">{consultantSandbox.profileUrl}</a>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
            <label className="block text-xs uppercase tracking-[0.18em] text-rose-100">
              Confirmation phrase
              <input
                type="text"
                value={consultantDeleteText}
                onChange={(event) => setConsultantDeleteText(event.target.value)}
                placeholder="DELETE TEST PROFILE"
                className="mt-2 w-full rounded-xl border border-rose-300/30 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-300/60"
              />
            </label>
            <p className="mt-2 text-xs text-rose-100/90">Type exactly: <span className="font-semibold">DELETE TEST PROFILE</span></p>
            <button
              type="button"
              onClick={() => handleConsultantSandbox("delete")}
              disabled={consultantSandboxBusy || consultantDeleteText.trim() !== "DELETE TEST PROFILE"}
              className="mt-3 rounded-full border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/30 disabled:opacity-50"
            >
              {consultantSandboxBusy ? "Working..." : "Delete test profile"}
            </button>
          </div>

          {message ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </article>
      ) : null}

      {activeTool === "reset-user" ? (
        <>

      <article className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
        This action is destructive. It removes user-linked profile and activity records, then deletes the auth user account so the same email can be reused for full onboarding tests.
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <label className="block text-sm text-slate-200">
          Testing email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="uat-tester@example.com"
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/60"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loadingPreview || resetting}
            className="rounded-full border border-sky-300/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20 disabled:opacity-60"
          >
            {loadingPreview ? "Checking..." : "Preview reset impact"}
          </button>
        </div>

        {preview ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="text-sm font-semibold text-white">Preview</div>
            <div className="mt-2 text-xs text-slate-300">User exists: {preview.userExists ? "Yes" : "No"}</div>
            {preview.userId ? <div className="mt-1 text-xs text-slate-300">User ID: {preview.userId}</div> : null}

            {Array.isArray(preview.affected) && preview.affected.length ? (
              <div className="mt-3 overflow-x-auto rounded border border-white/10">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Table</th>
                      <th className="px-3 py-2">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200">
                    {preview.affected.map((row) => (
                      <tr key={row.key}>
                        <td className="px-3 py-2">{row.key}</td>
                        <td className="px-3 py-2">{formatCount(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
          <label className="block text-xs uppercase tracking-[0.18em] text-rose-100">
            Confirmation phrase
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredPhrase || "RESET <email>"}
              className="mt-2 w-full rounded-xl border border-rose-300/30 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-300/60"
            />
          </label>
          <p className="mt-2 text-xs text-rose-100/90">
            Type exactly: <span className="font-semibold">{requiredPhrase || "RESET <email>"}</span>
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!canReset || resetting || loadingPreview}
              className="rounded-full border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/30 disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Execute reset"}
            </button>
          </div>
        </div>

        {message ? (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </article>
      </>
      ) : null}
    </section>
  );
}
