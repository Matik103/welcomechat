import { Header } from "@/components/layout/Header";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        {/* Add admin dashboard content here */}
      </main>
    </div>
  );
};

export default AdminDashboard; 