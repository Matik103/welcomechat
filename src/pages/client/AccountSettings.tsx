
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";

const AccountSettings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SettingsHeader />
      
      <div className="space-y-6 mt-6">
        <SecuritySection />
        <SignOutSection />
      </div>
    </div>
  );
};

export default AccountSettings;
