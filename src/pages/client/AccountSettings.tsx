
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";

const AccountSettings = () => {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <div className="grid gap-8">
        <SecuritySection />
        <SignOutSection />
      </div>
    </div>
  );
};

export default AccountSettings;
