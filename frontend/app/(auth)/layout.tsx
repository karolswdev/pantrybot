import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pantrybot - Authentication',
  description: 'Keep your food fresh, waste less',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100" />

      {/* Decorative floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left blob */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl animate-pulse-soft" />
        {/* Top right blob */}
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-secondary-200/40 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        {/* Bottom blob */}
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />

        {/* Floating food emojis */}
        <span className="absolute top-[15%] left-[10%] text-4xl animate-float opacity-60" style={{ animationDelay: '0s' }}>🥑</span>
        <span className="absolute top-[25%] right-[15%] text-3xl animate-float opacity-50" style={{ animationDelay: '0.5s' }}>🍎</span>
        <span className="absolute bottom-[20%] left-[8%] text-3xl animate-float opacity-50" style={{ animationDelay: '1s' }}>🥕</span>
        <span className="absolute bottom-[30%] right-[10%] text-4xl animate-float opacity-60" style={{ animationDelay: '1.5s' }}>🥦</span>
        <span className="absolute top-[60%] left-[20%] text-2xl animate-float opacity-40" style={{ animationDelay: '2s' }}>🍋</span>
        <span className="absolute top-[10%] right-[30%] text-2xl animate-float opacity-40" style={{ animationDelay: '2.5s' }}>🧀</span>
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        {/* Logo and tagline */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-block mb-4">
            <div className="relative">
              <span className="text-6xl filter drop-shadow-lg">🥦</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-primary-500/20 rounded-full blur-sm" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
            Pantrybot
          </h1>
          <p className="text-gray-600 font-medium">Keep your food fresh, waste less</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary-500/10 p-8 border border-white/50 animate-scale-in">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Made with 💚 for fresher food
        </p>
      </div>
    </div>
  );
}
