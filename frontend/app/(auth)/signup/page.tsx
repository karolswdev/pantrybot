'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
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
  const { register, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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
      });
      // Note: In a real app, we might want to create the household separately
      // For now, the backend creates a default household
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the store
      console.error('Registration error:', error);
    }
  };

  return (
    <>
      <div className="space-y-2 text-center mb-6">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-gray-600">Join Fridgr and reduce food waste</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordValidations.map((validation, index) => {
                      const isValid = validation.regex.test(password);
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${
                            isValid ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {isValid ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
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
                <FormLabel>Household Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Smith Family"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign in
        </Link>
      </div>
    </>
  );
}