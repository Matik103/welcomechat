import { Header } from "@/components/layout/Header";

const AdminClients = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Client Management</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {/* Add client list and management features here */}
          <p className="text-gray-600">Client management features coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default AdminClients; 