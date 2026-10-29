interface WelcomeAccount {
  id: string;
  email?: string;
  created_at: string;
  email_confirmed_at?: string;
  user_metadata?: { name?: string };
}

export function welcomeRequest(user: WelcomeAccount, now = Date.now()) {
  const age = now - Date.parse(user.created_at);
  if (!user.email || !user.email_confirmed_at || !Number.isFinite(age) || age < 0 || age > 86400000) return null;
  return {
    templateName: "welcome",
    recipientEmail: user.email,
    idempotencyKey: `welcome-${user.id}`,
    templateData: { name: user.user_metadata?.name },
  };
}