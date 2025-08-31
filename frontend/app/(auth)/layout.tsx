import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fridgr - Authentication',
  description: 'Keep your food fresh, waste less',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        {/* Logo and tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            🥦 Fridgr
          </h1>
          <p className="text-gray-600">Keep your food fresh, waste less</p>
        </div>
        
        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}