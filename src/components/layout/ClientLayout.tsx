
import { ClientHeader } from "./ClientHeader";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <ClientHeader />
      <main>
        {children}
      </main>
    </div>
  );
};
