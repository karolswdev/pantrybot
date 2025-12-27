'use client';

import { useState, useEffect } from 'react';
import { useNotificationSettings } from '@/hooks/queries/useNotificationSettings';
import { useUpdateNotificationSettings } from '@/hooks/mutations/useUpdateNotificationSettings';
import { useGenerateTelegramLinkCode, useTelegramLinkStatus, useUnlinkTelegram } from '@/hooks/mutations/useTelegramIntegration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/stores/notifications.store';
import { Loader2, Bell, Mail, Send, Settings, Clock, Calendar, ShoppingCart, Users, Sparkles, Bot, Check, ExternalLink } from 'lucide-react';
import { TelegramIcon, TelegramBrandIcon } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Custom toggle switch component with playful styling
function PlayfulToggle({
  checked,
  onCheckedChange,
  disabled = false,
  id
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full
        border-2 border-transparent transition-all duration-300 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'}
        ${checked
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-glow-primary'
          : 'bg-gray-200'
        }
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
          ring-0 transition-transform duration-300 ease-in-out
          ${checked ? 'translate-x-6' : 'translate-x-1'}
          ${checked ? 'shadow-primary-500/30' : ''}
        `}
      >
        {checked && (
          <Check className="h-3 w-3 text-primary-500 absolute top-1 left-1" />
        )}
      </span>
    </button>
  );
}

// Custom checkbox with playful styling
function PlayfulCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  label,
  icon: Icon
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id: string;
  label: string;
  icon?: React.ElementType;
}) {
  return (
    <label
      htmlFor={id}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-50 hover:-translate-y-0.5'}
        ${checked && !disabled ? 'bg-primary-50' : ''}
      `}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`
          flex items-center justify-center h-6 w-6 rounded-lg border-2 transition-all duration-200
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${checked
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 shadow-glow-primary'
            : 'border-gray-300 bg-white hover:border-primary-400'
          }
        `}
      >
        {checked && <Check className="h-4 w-4 text-white" />}
      </button>
      {Icon && <Icon className={`h-4 w-4 ${checked ? 'text-primary-600' : 'text-gray-400'}`} />}
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : checked ? 'text-gray-800' : 'text-gray-600'}`}>
        {label}
      </span>
    </label>
  );
}

export default function NotificationSettingsPage() {
  const { data: settings, isLoading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const generateLinkCode = useGenerateTelegramLinkCode();
  const { data: telegramLinkStatus } = useTelegramLinkStatus();
  const unlinkTelegram = useUnlinkTelegram();
  const { showToast } = useNotificationStore();

  const [formData, setFormData] = useState({
    email: {
      enabled: true,
      dailyExpirySum: true,
      expiringToday: true,
      expiringTomorrow: true,
      weeklyInventoryReport: false,
      shoppingListReminders: true,
    },
    inApp: {
      enabled: true,
      realtimeExpiry: true,
      memberActivity: true,
      shoppingListUpdates: true,
      recipeSuggestions: false,
    },
    preferences: {
      expirationWarningDays: 3,
      preferredTime: '09:00',
    },
  });

  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeExpiresAt, setLinkCodeExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        email: {
          enabled: settings.email?.enabled ?? true,
          dailyExpirySum: settings.preferences?.notificationTypes?.includes('dailyExpirySum') ?? true,
          expiringToday: settings.preferences?.notificationTypes?.includes('expiration') ?? true,
          expiringTomorrow: settings.preferences?.notificationTypes?.includes('expiration') ?? true,
          weeklyInventoryReport: settings.preferences?.notificationTypes?.includes('weeklyInventoryReport') ?? false,
          shoppingListReminders: settings.preferences?.notificationTypes?.includes('shoppingReminder') ?? true,
        },
        inApp: {
          enabled: settings.inApp?.enabled ?? true,
          realtimeExpiry: settings.preferences?.notificationTypes?.includes('expiration') ?? true,
          memberActivity: settings.preferences?.notificationTypes?.includes('memberActivity') ?? true,
          shoppingListUpdates: settings.preferences?.notificationTypes?.includes('shoppingReminder') ?? true,
          recipeSuggestions: settings.preferences?.notificationTypes?.includes('recipeSuggestions') ?? false,
        },
        preferences: {
          expirationWarningDays: settings.preferences?.expirationWarningDays ?? 3,
          preferredTime: settings.preferences?.preferredTime ?? '09:00',
        },
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      const notificationTypes = [];

      if (formData.email.dailyExpirySum) notificationTypes.push('dailyExpirySum');
      if (formData.email.expiringToday || formData.email.expiringTomorrow) notificationTypes.push('expiration');
      if (formData.email.weeklyInventoryReport) notificationTypes.push('weeklyInventoryReport');
      if (formData.email.shoppingListReminders) notificationTypes.push('shoppingReminder');
      if (formData.inApp.memberActivity) notificationTypes.push('memberActivity');
      if (formData.inApp.recipeSuggestions) notificationTypes.push('recipeSuggestions');

      await updateSettings.mutateAsync({
        email: {
          enabled: formData.email.enabled,
        },
        inApp: {
          enabled: formData.inApp.enabled,
        },
        telegram: {
          enabled: settings?.telegram?.linked ?? false,
        },
        preferences: {
          expirationWarningDays: formData.preferences.expirationWarningDays,
          notificationTypes,
          preferredTime: formData.preferences.preferredTime,
        },
      });

      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Your notification preferences have been updated.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save notification settings. Please try again.',
      });
    }
  };

  const handleGenerateLinkCode = async () => {
    try {
      const result = await generateLinkCode.mutateAsync();
      setLinkCode(result.code);
      setLinkCodeExpiresAt(result.expiresAt);
      setTelegramModalOpen(true);
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate link code. Please try again.',
      });
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await unlinkTelegram.mutateAsync();
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Telegram account has been unlinked.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to unlink Telegram. Please try again.',
      });
    }
  };

  const copyLinkCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(`/link ${linkCode}`);
      showToast({
        type: 'success',
        title: 'Copied!',
        message: 'Link command copied to clipboard.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 animate-pulse-soft" />
          <Loader2 className="h-8 w-8 animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Loading your preferences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-8 bg-danger-50 rounded-3xl border-2 border-danger-200">
          <div className="text-4xl mb-4">😔</div>
          <h3 className="text-lg font-bold text-danger-600 mb-2">Oops! Something went wrong</h3>
          <p className="text-danger-500">
            Failed to load notification settings. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with gradient */}
      <div className="mb-8 animate-slide-down">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-glow-primary">
            <Bell className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
              Notification Settings
            </h1>
            <p className="text-gray-500 mt-1">Stay updated your way! 🔔</p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <Card className="mb-6 rounded-3xl border-2 border-primary-100 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <span className="text-2xl">📧</span>
              </div>
              <div>
                <CardTitle className="text-lg text-gray-800">Email Notifications</CardTitle>
                <CardDescription className="text-gray-500">
                  Get updates delivered to your inbox
                </CardDescription>
              </div>
            </div>
            <PlayfulToggle
              id="email-notifications"
              checked={formData.email.enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: checked },
                }))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-1">
          <PlayfulCheckbox
            id="email-daily"
            checked={formData.email.dailyExpirySum}
            disabled={!formData.email.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                email: { ...prev.email, dailyExpirySum: checked },
              }))
            }
            label="Daily expiry summary (8:00 AM)"
            icon={Calendar}
          />
          <PlayfulCheckbox
            id="email-today"
            checked={formData.email.expiringToday}
            disabled={!formData.email.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                email: { ...prev.email, expiringToday: checked },
              }))
            }
            label="Items expiring today"
            icon={Clock}
          />
          <PlayfulCheckbox
            id="email-tomorrow"
            checked={formData.email.expiringTomorrow}
            disabled={!formData.email.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                email: { ...prev.email, expiringTomorrow: checked },
              }))
            }
            label="Items expiring tomorrow"
            icon={Clock}
          />
          <PlayfulCheckbox
            id="email-weekly"
            checked={formData.email.weeklyInventoryReport}
            disabled={!formData.email.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                email: { ...prev.email, weeklyInventoryReport: checked },
              }))
            }
            label="Weekly inventory report"
            icon={Calendar}
          />
          <PlayfulCheckbox
            id="email-shopping"
            checked={formData.email.shoppingListReminders}
            disabled={!formData.email.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                email: { ...prev.email, shoppingListReminders: checked },
              }))
            }
            label="Shopping list reminders"
            icon={ShoppingCart}
          />
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="mb-6 rounded-3xl border-2 border-secondary-100 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 border-b border-secondary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <span className="text-2xl">🔔</span>
              </div>
              <div>
                <CardTitle className="text-lg text-gray-800">In-App Notifications</CardTitle>
                <CardDescription className="text-gray-500">
                  Real-time updates while you browse
                </CardDescription>
              </div>
            </div>
            <PlayfulToggle
              id="in-app-notifications"
              checked={formData.inApp.enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  inApp: { ...prev.inApp, enabled: checked },
                }))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-1">
          <PlayfulCheckbox
            id="inapp-expiry"
            checked={formData.inApp.realtimeExpiry}
            disabled={!formData.inApp.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                inApp: { ...prev.inApp, realtimeExpiry: checked },
              }))
            }
            label="Real-time expiry alerts"
            icon={Bell}
          />
          <PlayfulCheckbox
            id="inapp-activity"
            checked={formData.inApp.memberActivity}
            disabled={!formData.inApp.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                inApp: { ...prev.inApp, memberActivity: checked },
              }))
            }
            label="Member activity (items added/removed)"
            icon={Users}
          />
          <PlayfulCheckbox
            id="inapp-shopping"
            checked={formData.inApp.shoppingListUpdates}
            disabled={!formData.inApp.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                inApp: { ...prev.inApp, shoppingListUpdates: checked },
              }))
            }
            label="Shopping list updates"
            icon={ShoppingCart}
          />
          <PlayfulCheckbox
            id="inapp-recipes"
            checked={formData.inApp.recipeSuggestions}
            disabled={!formData.inApp.enabled}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                inApp: { ...prev.inApp, recipeSuggestions: checked },
              }))
            }
            label="Recipe suggestions"
            icon={Sparkles}
          />
        </CardContent>
      </Card>

      {/* Telegram Bot */}
      <Card className="mb-6 rounded-3xl border-2 border-[#2AABEE]/30 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="bg-gradient-to-r from-[#2AABEE]/10 to-[#1E96C8]/10 border-b border-[#2AABEE]/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <TelegramBrandIcon size={28} />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                Telegram Bot
                {telegramLinkStatus?.linked && (
                  <span className="px-2 py-0.5 bg-[#2AABEE]/15 text-[#1E96C8] text-xs font-semibold rounded-full">
                    Connected
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {telegramLinkStatus?.linked
                  ? 'Manage your inventory with natural language!'
                  : 'Get notifications and manage inventory via chat!'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {telegramLinkStatus?.linked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#2AABEE]/10 to-[#1E96C8]/5 rounded-2xl border border-[#2AABEE]/20">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <TelegramBrandIcon size={32} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">You&apos;re all set!</p>
                  <p className="text-sm text-gray-500">
                    Chat with <span className="font-medium text-[#2AABEE]">@PantrybotBot</span> to manage your inventory.
                  </p>
                </div>
                <a
                  href="https://t.me/PantrybotBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-[#2AABEE]/10 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-[#2AABEE]" />
                </a>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleUnlinkTelegram}
                  variant="outline"
                  disabled={unlinkTelegram.isPending}
                  className="text-danger-600 border-danger-200 hover:bg-danger-50 rounded-xl"
                >
                  {unlinkTelegram.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unlinking...
                    </>
                  ) : (
                    'Unlink Telegram'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Telegram bot illustration with official branding */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] rounded-3xl rotate-3 flex items-center justify-center shadow-lg shadow-[#2AABEE]/30 animate-float">
                    <TelegramIcon size={48} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce border-2 border-[#2AABEE]">
                    <Send className="h-4 w-4 text-[#2AABEE]" />
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 max-w-sm mx-auto">
                Connect your Telegram to manage your inventory with natural language - just say &quot;I bought milk and eggs&quot;!
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateLinkCode}
                  disabled={generateLinkCode.isPending}
                  type="button"
                  className="bg-gradient-to-r from-[#37AEE2] to-[#1E96C8] hover:from-[#2AABEE] hover:to-[#1A8ABB] text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-[#2AABEE]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  {generateLinkCode.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TelegramIcon size={18} className="mr-2" />
                      Connect with Telegram
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mb-6 rounded-3xl border-2 border-accent-100 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="bg-gradient-to-r from-accent-50 to-warning-50 border-b border-accent-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">Preferences</CardTitle>
              <CardDescription className="text-gray-500">
                Customize when and how you get notified
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="warning-days" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-500" />
              Expiration Warning Days
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="warning-days"
                type="number"
                min="1"
                max="30"
                value={formData.preferences.expirationWarningDays}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      expirationWarningDays: parseInt(e.target.value) || 3,
                    },
                  }))
                }
                className="w-24 rounded-xl border-2 border-gray-200 focus:border-accent-400 focus:ring-accent-400 text-center font-semibold text-lg"
              />
              <span className="text-gray-500">days before expiry</span>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Get notified when items are about to expire
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="preferred-time" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-500" />
              Preferred Notification Time
            </Label>
            <Input
              id="preferred-time"
              type="time"
              value={formData.preferences.preferredTime}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    preferredTime: e.target.value,
                  },
                }))
              }
              className="w-36 rounded-xl border-2 border-gray-200 focus:border-accent-400 focus:ring-accent-400 font-semibold"
            />
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Time for daily summary notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending}
          size="lg"
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all duration-200 text-lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Telegram Link Modal */}
      <Dialog open={telegramModalOpen} onOpenChange={setTelegramModalOpen}>
        <DialogContent className="rounded-3xl border-2 border-[#2AABEE]/30 shadow-playful-xl backdrop-blur-sm bg-white/95">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] rounded-2xl shadow-lg shadow-[#2AABEE]/30 animate-bounce-in">
                <TelegramIcon size={40} className="text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">
              Connect Telegram Account
            </DialogTitle>
            <DialogDescription className="text-center">
              Follow these simple steps to link your account:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ol className="space-y-3">
              {[
                { step: 1, text: 'Open Telegram and search for', highlight: '@PantrybotBot' },
                { step: 2, text: 'Start a conversation with the bot', highlight: null },
                { step: 3, text: 'Send the command below to link your account', highlight: null },
              ].map(({ step, text, highlight }) => (
                <li key={step} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#37AEE2] to-[#1E96C8] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {step}
                  </span>
                  <span className="text-gray-700">
                    {text} {highlight && <span className="font-semibold text-[#2AABEE]">{highlight}</span>}
                  </span>
                  {step === 1 && (
                    <a
                      href="https://t.me/PantrybotBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto p-1.5 hover:bg-[#2AABEE]/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-[#2AABEE]" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {linkCode && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Your Link Command
              </Label>
              <div
                onClick={copyLinkCode}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#2AABEE]/10 to-[#1E96C8]/5 rounded-xl border-2 border-[#2AABEE]/30 cursor-pointer hover:border-[#2AABEE] transition-colors group"
              >
                <code className="text-lg font-mono font-bold text-gray-800">
                  /link {linkCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#2AABEE] hover:text-[#1E96C8] hover:bg-[#2AABEE]/10"
                >
                  Copy
                </Button>
              </div>
              {linkCodeExpiresAt && (
                <p className="text-xs text-gray-500 text-center">
                  Code expires in 10 minutes
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setTelegramModalOpen(false);
                setLinkCode(null);
              }}
              className="rounded-xl border-2 hover:bg-gray-50 font-semibold flex-1"
            >
              Close
            </Button>
            <Button
              onClick={copyLinkCode}
              disabled={!linkCode}
              className="bg-gradient-to-r from-[#37AEE2] to-[#1E96C8] hover:from-[#2AABEE] hover:to-[#1A8ABB] text-white font-semibold rounded-xl shadow-lg shadow-[#2AABEE]/30 hover:shadow-xl transition-all duration-200 flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Copy Command
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
