'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Check, X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import useAuthStore from '@/stores/auth.store';

// Common timezones list
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Beijing' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
];

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      householdName: '',
      timezone: 'America/New_York',
      agreeToTerms: false,
    },
  });

  const password = form.watch('password');

  // Password strength indicators
  const passwordValidations = [
    { regex: /.{8,}/, text: '8+ characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[0-9]/, text: 'One number' },
  ];

  const onSubmit = async (data: SignupFormData) => {
    try {
      clearError();
      await register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        timezone: data.timezone,
        householdName: data.householdName,
      });
      router.replace('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <>
      <div className="space-y-2 text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Join the fresh crew!</h2>
        <p className="text-gray-500">Start tracking & save your food today</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Your Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What should we call you?"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-danger-600 font-medium" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-danger-600 font-medium" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-danger-600 font-medium" />
                {password && (
                  <div className="mt-3 space-y-1.5 p-3 bg-gray-50 rounded-xl">
                    {passwordValidations.map((validation, index) => {
                      const isValid = validation.regex.test(password);
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                            isValid ? 'text-primary-600' : 'text-gray-400'
                          }`}
                        >
                          {isValid ? (
                            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-600" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <X className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                          {validation.text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="householdName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Household Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., The Smith Kitchen"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-danger-600 font-medium" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Timezone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-2">
                    {TIMEZONES.map((tz) => (
                      <SelectItem
                        key={tz.value}
                        value={tz.value}
                        className="rounded-lg focus:bg-primary-50 focus:text-primary-700"
                      >
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-danger-600 font-medium" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5 rounded-md border-2 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-gray-600">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage className="text-danger-600 font-medium" />
                </div>
              </FormItem>
            )}
          />

          {error && (
            <div className="bg-danger-50 border-2 border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm font-medium animate-bounce-in">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Get Started
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <Link
          href="/login"
          className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </>
  );
}
