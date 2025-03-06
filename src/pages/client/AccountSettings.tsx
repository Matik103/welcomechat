
import { Card, CardContent } from "@/components/ui/card";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";

const AccountSettings = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-24">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account preferences</p>
        </div>

        <SecuritySection />
        <SignOutSection />
      </div>
    </div>
  );
};

export default AccountSettings;
