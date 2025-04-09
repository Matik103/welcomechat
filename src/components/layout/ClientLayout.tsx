import { ClientHeader } from "./ClientHeader";
import { ErrorBoundary } from '../ErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <ClientHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
};
