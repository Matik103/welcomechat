
import { ClientHeader } from "./ClientHeader";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <ClientHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
