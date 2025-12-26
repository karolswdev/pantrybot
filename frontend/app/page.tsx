'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { Sparkles, ArrowRight, Package, Bell, BarChart3, Users } from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Track Everything',
    description: 'Keep tabs on all your food items across fridge, freezer, and pantry.',
    color: 'primary',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified before items expire so nothing goes to waste.',
    color: 'secondary',
  },
  {
    icon: BarChart3,
    title: 'Waste Reports',
    description: 'See how much you save and reduce food waste over time.',
    color: 'accent',
  },
  {
    icon: Users,
    title: 'Family Sharing',
    description: 'Manage your household inventory together with your family.',
    color: 'fresh',
  },
];

const colorStyles: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary-100', icon: 'text-primary-600' },
  secondary: { bg: 'bg-secondary-100', icon: 'text-secondary-600' },
  accent: { bg: 'bg-accent-100', icon: 'text-accent-600' },
  fresh: { bg: 'bg-fresh-100', icon: 'text-fresh-600' },
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-40 w-80 h-80 bg-secondary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-accent-200/20 rounded-full blur-3xl" />
      </div>

      {/* Floating food emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-[10%] left-[5%] text-5xl animate-float opacity-40" style={{ animationDelay: '0s' }}>🥑</span>
        <span className="absolute top-[15%] right-[10%] text-4xl animate-float opacity-30" style={{ animationDelay: '0.5s' }}>🍎</span>
        <span className="absolute bottom-[25%] left-[8%] text-4xl animate-float opacity-30" style={{ animationDelay: '1s' }}>🥕</span>
        <span className="absolute bottom-[15%] right-[5%] text-5xl animate-float opacity-40" style={{ animationDelay: '1.5s' }}>🥦</span>
        <span className="absolute top-[40%] left-[15%] text-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}>🍋</span>
        <span className="absolute top-[60%] right-[15%] text-3xl animate-float opacity-20" style={{ animationDelay: '2.5s' }}>🧀</span>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-4xl transition-transform group-hover:scale-110">🥦</span>
            <span className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Pantrybot
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-bold">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="font-bold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-bounce-in">
              <span className="text-8xl mb-8 block filter drop-shadow-lg">🥦</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 animate-slide-up">
              Keep Food Fresh,
              <br />
              <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                Waste Less
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Your fun &amp; easy kitchen companion for tracking food, reducing waste, and saving money!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/signup">
                <Button size="xl" className="w-full sm:w-auto">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start For Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  I Already Have An Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
              Everything You Need to
              <span className="text-primary-500"> Stay Fresh</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const styles = colorStyles[feature.color];
                return (
                  <div
                    key={feature.title}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 stagger-item"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-14 h-14 ${styles.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${styles.icon}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 rounded-3xl p-10 text-center text-white shadow-2xl shadow-primary-500/30">
              <h2 className="text-3xl font-extrabold mb-4">
                Ready to reduce food waste?
              </h2>
              <p className="text-primary-100 mb-8 max-w-lg mx-auto">
                Join thousands of households already saving money and reducing waste with Pantrybot.
              </p>
              <Link href="/signup">
                <Button size="xl" variant="secondary" className="bg-white text-primary-600 hover:bg-gray-100">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started For Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <span className="font-bold text-gray-600">Pantrybot</span>
          </div>
          <p className="text-sm text-gray-500">
            Made with 💚 for fresher food
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
