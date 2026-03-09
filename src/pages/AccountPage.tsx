import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue="Alex Builder" /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue="alex@stackforge.ai" /></div>
        </div>
        <Button variant="outline" size="sm">Save Changes</Button>
      </div>

      <Separator />

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">Current plan: <span className="font-medium text-foreground">Pro</span></p>
        <Button variant="outline" size="sm">Manage Subscription</Button>
      </div>

      <Separator />

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Team members: 3</p>
        <Button variant="outline" size="sm">Invite Members</Button>
      </div>
    </div>
  );
}
