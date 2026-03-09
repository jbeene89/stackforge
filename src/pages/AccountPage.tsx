import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setName(profile.display_name || "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateProfile.mutate({ display_name: name });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
    toast.success("Signed out");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Separator />

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Session</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <Button variant="destructive" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}
