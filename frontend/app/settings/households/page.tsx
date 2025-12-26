'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Settings, Users, Shield, Eye, Trash2, LogOut, Crown, Sparkles, PartyPopper, AlertTriangle, Calendar, Home } from 'lucide-react';

interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

// Mock data for household members
const mockMembers: HouseholdMember[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'admin', joinedAt: '2024-01-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', joinedAt: '2024-01-01' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'member', joinedAt: '2024-01-15' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'viewer', joinedAt: '2024-02-01' },
];

// Avatar colors for members
const avatarColors = [
  'from-primary-400 to-primary-600',
  'from-secondary-400 to-secondary-600',
  'from-accent-400 to-accent-600',
  'from-fresh-400 to-fresh-600',
  'from-warning-400 to-warning-600',
  'from-danger-400 to-danger-500',
];

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

export default function HouseholdSettingsPage() {
  const { currentHouseholdId, households, user } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  // Get current household details
  const currentHousehold = households.find(h => h.id === currentHouseholdId);
  const isAdmin = currentHousehold?.role === 'admin';

  const handleInviteMember = () => {
    // This will be implemented in Task 3
    console.log('Inviting member:', { email: inviteEmail, role: inviteRole });
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 border border-primary-300 shadow-sm';
      case 'member':
        return 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700 border border-secondary-300 shadow-sm';
      case 'viewer':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-300 shadow-sm';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3.5 w-3.5" />;
      case 'member':
        return <Users className="h-3.5 w-3.5" />;
      case 'viewer':
        return <Eye className="h-3.5 w-3.5" />;
      default:
        return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'member':
        return '🏠';
      case 'viewer':
        return '👀';
      default:
        return '👤';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header with gradient */}
      <div className="flex justify-between items-start animate-slide-down">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-glow-primary animate-float">
            <span className="text-4xl">🏠</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
              Household Settings
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Home className="h-4 w-4" />
              {currentHousehold?.name || 'No household selected'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-secondary-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <Settings className="h-4 w-4 mr-2" />
            Manage Household
          </Button>
        )}
      </div>

      {/* Members List */}
      <Card className="rounded-3xl border-2 border-primary-100 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-primary-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <CardTitle className="text-lg text-gray-800">Members</CardTitle>
                <CardDescription className="text-gray-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {mockMembers.length} awesome people in this household
                </CardDescription>
              </div>
            </div>
            {/* Only show invite button for admins */}
            {isAdmin && (
              <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                    data-testid="invite-member-button"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-testid="invite-member-modal"
                  className="rounded-3xl border-2 border-primary-200 shadow-playful-xl backdrop-blur-sm bg-white/95"
                >
                  <DialogHeader>
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="p-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg animate-bounce-in">
                          <UserPlus className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                          <PartyPopper className="h-6 w-6 text-warning-500" />
                        </div>
                      </div>
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-gray-800">
                      Invite New Member 🎉
                    </DialogTitle>
                    <DialogDescription className="text-center">
                      Grow your household family! Send an invitation to a new member.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span>📧</span>
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="friend@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span>🎭</span>
                        Role
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'admin', label: 'Admin', emoji: '👑', desc: 'Full access', color: 'primary' },
                          { value: 'member', label: 'Member', emoji: '🏠', desc: 'Add/edit', color: 'secondary' },
                          { value: 'viewer', label: 'Viewer', emoji: '👀', desc: 'Read-only', color: 'gray' },
                        ].map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setInviteRole(role.value as 'admin' | 'member' | 'viewer')}
                            className={`
                              p-3 rounded-xl border-2 transition-all duration-200
                              ${inviteRole === role.value
                                ? role.color === 'primary'
                                  ? 'border-primary-500 bg-primary-50 shadow-glow-primary'
                                  : role.color === 'secondary'
                                  ? 'border-secondary-500 bg-secondary-50 shadow-glow-secondary'
                                  : 'border-gray-400 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="text-2xl mb-1">{role.emoji}</div>
                            <div className="text-sm font-semibold text-gray-800">{role.label}</div>
                            <div className="text-xs text-gray-500">{role.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="rounded-xl border-2 hover:bg-gray-50 font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInviteMember}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <PartyPopper className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3" data-testid="members-list">
            {mockMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-200 hover:-translate-y-0.5 group"
                data-testid={`member-${member.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200`}>
                    <span className="text-white font-bold text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      {member.name}
                      {member.role === 'admin' && <span className="text-sm">👑</span>}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </span>
                  {isAdmin && member.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Household Information */}
      <Card className="rounded-3xl border-2 border-secondary-100 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="bg-gradient-to-r from-secondary-50 to-accent-50 border-b border-secondary-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">Household Information</CardTitle>
              <CardDescription className="text-gray-500">
                General information about your household
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl border border-primary-100">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Home className="h-4 w-4 text-primary-500" />
                Household Name
              </dt>
              <dd className="text-lg font-semibold text-gray-800">{currentHousehold?.name || 'Not set'}</dd>
            </div>
            <div className="p-4 bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-100">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-secondary-500" />
                Your Role
              </dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${getRoleBadgeStyle(currentHousehold?.role || 'viewer')}`}>
                  <span>{getRoleEmoji(currentHousehold?.role || 'viewer')}</span>
                  {getRoleIcon(currentHousehold?.role || 'viewer')}
                  <span className="capitalize">{currentHousehold?.role || 'Unknown'}</span>
                </span>
              </dd>
            </div>
            <div className="p-4 bg-gradient-to-br from-accent-50 to-warning-50 rounded-2xl border border-accent-100">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-accent-500" />
                Total Members
              </dt>
              <dd className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {mockMembers.length}
                <span className="text-sm font-normal text-gray-500">awesome people</span>
              </dd>
            </div>
            <div className="p-4 bg-gradient-to-br from-fresh-50 to-fresh-100/50 rounded-2xl border border-fresh-200">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-fresh-500" />
                Created
              </dt>
              <dd className="text-lg font-semibold text-gray-800">January 1, 2024</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for Admins */}
      {isAdmin && (
        <Card className="rounded-3xl border-2 border-danger-200 shadow-playful hover:shadow-playful-lg transition-all duration-300 overflow-hidden animate-bounce-in bg-gradient-to-br from-white to-danger-50/30" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="bg-gradient-to-r from-danger-50 to-danger-100/50 border-b border-danger-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-danger-200">
                <AlertTriangle className="h-5 w-5 text-danger-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-danger-600 flex items-center gap-2">
                  Danger Zone
                  <span className="text-sm">⚠️</span>
                </CardTitle>
                <CardDescription className="text-danger-400">
                  Careful! These actions cannot be undone
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-danger-100 bg-white hover:border-danger-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger-100 rounded-xl">
                    <LogOut className="h-5 w-5 text-danger-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Leave Household</p>
                    <p className="text-sm text-gray-500">Remove yourself from this household</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-danger-600 border-2 border-danger-200 hover:bg-danger-50 hover:border-danger-300 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-danger-200 bg-danger-50/50 hover:border-danger-300 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger-200 rounded-xl">
                    <Trash2 className="h-5 w-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-danger-700">Delete Household</p>
                    <p className="text-sm text-danger-500">Permanently delete this household and all its data</p>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white font-semibold rounded-xl shadow-lg shadow-danger-500/30 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-warning-50 rounded-xl border border-warning-200 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-warning-700">
                <strong>Tip:</strong> Deleting a household will permanently remove all inventory items, shopping lists, and member data. Make sure to export any important information first!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
