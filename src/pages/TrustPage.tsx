import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Shield, Lock, Database, Users, Cookie, Mail, AlertTriangle, Server, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LAST_UPDATED = "June 18, 2026";

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Trust & Security"
        description="How Soupy handles your data, accounts, and AI workloads — authentication, hosting, encryption of your own API keys, subprocessors, retention, and how to report security issues."
      />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Trust & Security</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-md border border-border bg-muted/30 p-4 mb-8 text-xs text-muted-foreground leading-relaxed">
          This page is maintained by the Soupy team to answer common security and privacy questions about Soupy.
          It describes controls that are currently enabled in the app today — it is <strong>not</strong> a
          third-party certification or audit report. Soupy runs on top of Lovable Cloud (managed Supabase) and
          third-party providers; security is a shared responsibility between us, those providers, and you as
          the account owner.
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Accounts & Authentication</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>Sign-in options: email + password and Google sign-in.</li>
              <li>Passwords are never stored in plain text — authentication is handled by our managed auth provider.</li>
              <li>Password reset is self-serve via a verified email link.</li>
              <li>Sessions can be revoked at any time by signing out from your account.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Hosting & Platform</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Soupy is hosted on Lovable Cloud, which runs on managed Supabase infrastructure. Application
              traffic is served over HTTPS. Database access is gated by Row-Level Security policies so each
              account can only read and write its own records.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Your AI API Keys (BYOK)</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you bring your own AI provider keys (Bring Your Own Key), they are encrypted at rest using
              AES-256-GCM before being stored, and only decrypted server-side at the moment a request is made
              on your behalf. Your keys are never returned to the browser after they're saved.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">What We Collect & How It's Used</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Account info (name, email), billing info (handled by Stripe), the projects, datasets, and prompts
              you create in the app, and usage data such as credit consumption. We use it to run the service,
              bill correctly, prevent abuse, and improve the product. Full detail is in our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Subprocessors & Integrations</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              We rely on a small set of vendors to operate the service:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li><strong>Lovable Cloud / Supabase</strong> — hosting, database, authentication, edge functions.</li>
              <li><strong>Stripe</strong> — subscriptions, credit purchases, and billing portal.</li>
              <li><strong>Lovable AI Gateway</strong> — routing requests to AI model providers (e.g. Google Gemini).</li>
              <li><strong>Google Analytics & Google Ads</strong> — anonymized usage and conversion analytics.</li>
              <li><strong>Google Search Console</strong> — search-performance reporting for the marketing site.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Cookies & Analytics</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Soupy uses cookies for sign-in sessions and (with your consent) for analytics and advertising
              measurement. You're asked for consent on first visit via our cookie banner, and you can change
              your mind at any time by clearing cookies in your browser.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Retention & Deletion</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can delete your projects, datasets, and chat history from inside the app at any time. To
              fully close your account and remove personal data, email{" "}
              <a href="mailto:support@soupy.com" className="text-primary hover:underline">support@soupy.com</a>{" "}
              and we'll process the request. Some records (e.g. billing history) may be retained to meet legal
              and tax obligations.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Reporting a Security Issue</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you believe you've found a vulnerability, please email{" "}
              <a href="mailto:support@soupy.com" className="text-primary hover:underline">support@soupy.com</a>{" "}
              with the subject line "Security report" and steps to reproduce. Please do not publicly disclose
              the issue until we've had a reasonable chance to investigate and fix it.
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground m-0">Contact</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Privacy or security questions:{" "}
              <a href="mailto:support@soupy.com" className="text-primary hover:underline">support@soupy.com</a>.
              See also our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
