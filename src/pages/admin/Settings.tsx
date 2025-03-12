import { Header } from "@/components/layout/Header";

const AdminSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {/* Add admin settings features here */}
          <p className="text-gray-600">Admin settings features coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings; 