import { ClientHeader } from "@/components/layout/ClientHeader";

const ClientView = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Your Dashboard</h1>
        {/* Add client dashboard content here */}
      </main>
    </div>
  );
};

export default ClientView; 