'use client';

import { useState, useEffect } from 'react';
import { useNotificationSettings } from '@/hooks/queries/useNotificationSettings';
import { useUpdateNotificationSettings } from '@/hooks/mutations/useUpdateNotificationSettings';
import { useLinkTelegram } from '@/hooks/mutations/useLinkTelegram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/stores/notifications.store';
import { Loader2, Bell, Mail, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function NotificationSettingsPage() {
  const { data: settings, isLoading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const linkTelegram = useLinkTelegram();
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
  const [verificationCode, setVerificationCode] = useState('');

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
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save notification settings. Please try again.',
      });
    }
  };

  const handleLinkTelegram = async () => {
    if (!verificationCode.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter a verification code.',
      });
      return;
    }

    try {
      await linkTelegram.mutateAsync({ verificationCode });
      setTelegramModalOpen(false);
      setVerificationCode('');
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Your Telegram account has been linked.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Invalid verification code. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load notification settings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>

      {/* Email Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which notifications you want to receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-daily"
              checked={formData.email.dailyExpirySum}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, dailyExpirySum: checked as boolean },
                }))
              }
            />
            <Label htmlFor="email-daily">Daily expiry summary (8:00 AM)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-today"
              checked={formData.email.expiringToday}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, expiringToday: checked as boolean },
                }))
              }
            />
            <Label htmlFor="email-today">Items expiring today</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-tomorrow"
              checked={formData.email.expiringTomorrow}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, expiringTomorrow: checked as boolean },
                }))
              }
            />
            <Label htmlFor="email-tomorrow">Items expiring tomorrow</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-weekly"
              checked={formData.email.weeklyInventoryReport}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, weeklyInventoryReport: checked as boolean },
                }))
              }
            />
            <Label htmlFor="email-weekly">Weekly inventory report</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-shopping"
              checked={formData.email.shoppingListReminders}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  email: { ...prev.email, shoppingListReminders: checked as boolean },
                }))
              }
            />
            <Label htmlFor="email-shopping">Shopping list reminders</Label>
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Configure which notifications you want to see in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inapp-expiry"
              checked={formData.inApp.realtimeExpiry}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  inApp: { ...prev.inApp, realtimeExpiry: checked as boolean },
                }))
              }
            />
            <Label htmlFor="inapp-expiry">Real-time expiry alerts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inapp-activity"
              checked={formData.inApp.memberActivity}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  inApp: { ...prev.inApp, memberActivity: checked as boolean },
                }))
              }
            />
            <Label htmlFor="inapp-activity">Member activity (items added/removed)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inapp-shopping"
              checked={formData.inApp.shoppingListUpdates}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  inApp: { ...prev.inApp, shoppingListUpdates: checked as boolean },
                }))
              }
            />
            <Label htmlFor="inapp-shopping">Shopping list updates</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inapp-recipes"
              checked={formData.inApp.recipeSuggestions}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  inApp: { ...prev.inApp, recipeSuggestions: checked as boolean },
                }))
              }
            />
            <Label htmlFor="inapp-recipes">Recipe suggestions</Label>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Bot */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Bot
          </CardTitle>
          <CardDescription>
            {settings?.telegram?.linked
              ? `Connected as ${settings.telegram.username}`
              : 'Connect your Telegram account to receive notifications on your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings?.telegram?.linked ? (
            <div className="text-sm text-muted-foreground">
              Your Telegram account is connected and will receive notifications.
            </div>
          ) : (
            <Button onClick={() => setTelegramModalOpen(true)}>
              Connect with Telegram
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warning-days">Expiration Warning Days</Label>
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
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Get notified when items expire within this many days
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred-time">Preferred Notification Time</Label>
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
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Time for daily summary notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending}
          size="lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>

      {/* Telegram Link Modal */}
      <Dialog open={telegramModalOpen} onOpenChange={setTelegramModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Telegram Account</DialogTitle>
            <DialogDescription>
              To connect your Telegram account:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Open Telegram and search for @FridgrBot</li>
                <li>Start a conversation with the bot</li>
                <li>Send /link command to get a verification code</li>
                <li>Enter the verification code below</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="col-span-3"
                placeholder="Enter verification code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTelegramModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkTelegram}
              disabled={linkTelegram.isPending || !verificationCode.trim()}
            >
              {linkTelegram.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                'Link Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}