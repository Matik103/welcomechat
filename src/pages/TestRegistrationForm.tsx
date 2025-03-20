import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";

const TestRegistrationForm = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Test Registration Form</h1>
        <ClientRegistrationForm />
      </div>
    </div>
  );
};

export default TestRegistrationForm; 