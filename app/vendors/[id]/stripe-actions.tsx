"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StripeConnectActions({
  vendorId,
  hasStripeAccount
}: {
  vendorId: string;
  hasStripeAccount: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createAccount() {
    setLoading("account");
    setError(null);

    const response = await fetch(`/api/vendors/${vendorId}/stripe/account`, {
      method: "POST"
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not create Stripe Connect account.");
      setLoading(null);
      return;
    }

    setLoading(null);
    router.refresh();
  }

  async function continueOnboarding() {
    setLoading("onboarding");
    setError(null);

    const response = await fetch(`/api/vendors/${vendorId}/stripe/onboarding-link`, {
      method: "POST"
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not create onboarding link.");
      setLoading(null);
      return;
    }

    const result = await response.json();
    window.location.href = result.onboardingUrl;
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!hasStripeAccount ? (
        <button
          onClick={createAccount}
          disabled={!!loading}
          className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm disabled:opacity-60"
        >
          {loading === "account" ? "Creating Stripe account..." : "Create Stripe Connect account"}
        </button>
      ) : (
        <button
          onClick={continueOnboarding}
          disabled={!!loading}
          className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm disabled:opacity-60"
        >
          {loading === "onboarding" ? "Opening onboarding..." : "Continue Stripe onboarding"}
        </button>
      )}
    </div>
  );
}
