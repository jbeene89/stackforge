import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LAST_UPDATED = "March 10, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Privacy Policy" description="Soupy privacy policy. Learn how we collect, use, and protect your data when you use our AI development platform." />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information you provide directly: your name, email address, and payment information when you create an account or subscribe to a plan. We also collect usage data automatically, including pages visited, features used, AI module interactions, and credit consumption patterns.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage your subscription</li>
              <li>Track credit usage and enforce plan limits</li>
              <li>Send service-related communications (billing, security, updates)</li>
              <li>Analyze usage patterns to improve AI model performance</li>
              <li>Prevent fraud and enforce our Terms of Service</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. AI-Generated Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Soupy processes your prompts and inputs through third-party AI models to generate outputs. Your inputs may be sent to AI model providers for processing. We do not use your inputs or outputs to train AI models. AI-generated content is provided "as-is" and may contain errors or inaccuracies.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell your personal information. We share data only with: payment processors (Stripe) to handle billing; AI model providers to process your requests; cloud infrastructure providers to host the service; and law enforcement when legally required.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use industry-standard encryption (TLS/SSL) for data in transit and at rest. API keys are encrypted before storage. Access to user data is restricted to authorized personnel only. Despite our safeguards, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Cookies & Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We may use analytics cookies to understand how users interact with the platform. You can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a standard format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              To exercise these rights, contact us at <span className="text-primary">privacy@soupy.ai</span>.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We retain your account data for as long as your account is active. After account deletion, we may retain anonymized usage data for analytics. Transaction records are retained as required by applicable tax and financial regulations.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify you of material changes via email or an in-app notification. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
