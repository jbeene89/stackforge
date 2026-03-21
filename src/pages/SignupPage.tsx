import { useState, useMemo, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, ArrowRight, Eye, EyeOff, Check, X, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthLabel = strength <= 1 ? "Weak" : strength <= 3 ? "Medium" : strength <= 4 ? "Strong" : "Very Strong";
  const strengthColor = strength <= 1 ? "bg-destructive" : strength <= 3 ? "bg-forge-amber" : "bg-forge-emerald";

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-3 pt-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= strength ? strengthColor : "bg-secondary"
              )}
            />
          ))}
        </div>
        <span className={cn(
          "text-xs font-medium",
          strength <= 1 ? "text-destructive" : strength <= 3 ? "text-forge-amber" : "text-forge-emerald"
        )}>
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { key: "length", label: "8+ characters" },
          { key: "uppercase", label: "Uppercase" },
          { key: "lowercase", label: "Lowercase" },
          { key: "number", label: "Number" },
        ].map(({ key, label }) => (
          <div key={key} className={cn("flex items-center gap-1", checks[key as keyof typeof checks] ? "text-forge-emerald" : "text-muted-foreground")}>
            {checks[key as keyof typeof checks] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const navigate = useNavigate();

  const { user, loading, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Process referral after signup
      if (referralCode) {
        supabase.functions.invoke("process-referral", {
          body: { referral_code: referralCode },
        }).then(({ data }) => {
          if (data?.success) {
            toast.success(data.message || "Referral bonus applied!");
          }
        }).catch(() => {});
      }
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate, referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, password, name);
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "google") {
      await signInWithGoogle();
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Sign Up Free" description="Create your free StackForge account. Build AI agents, design multi-model pipelines, and deploy apps to web or Android — no coding required." />
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SoupyForge</span>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Start building today</h1>
          <p className="text-white/80 text-lg max-w-md">
            Create AI-powered software in minutes. Web apps, Android apps, AI modules, and intelligent workflows.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Free tier with 100 generations/month",
              "No credit card required",
              "Full access to all templates",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-white/90">
                <Check className="h-4 w-4" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="relative text-white/50 text-sm">
          © 2026 SoupyForge
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
          </div>
          <div className="lg:text-left text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start building with SoupyForge</p>
          </div>

          {referralCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-forge-emerald/30 bg-forge-emerald/10 px-4 py-3 text-sm"
            >
              <Gift className="h-4 w-4 text-forge-emerald shrink-0" />
              <span>You've been referred! Sign up to get <strong>25 bonus credits</strong>.</span>
            </motion.div>
          )}

          {/* Social Signup */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => handleSocialLogin("google")}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
