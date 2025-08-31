'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Settings, Users, Shield, Eye } from 'lucide-react';

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

export default function HouseholdSettingsPage() {
  const { currentHouseholdId, households, user } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  // Get current household details
  const currentHousehold = households.find(h => h.id === currentHouseholdId);
  const isAdmin = currentHousehold?.role === 'admin';
  const isMember = currentHousehold?.role === 'member';

  const handleInviteMember = () => {
    // This will be implemented in Task 3
    console.log('Inviting member:', { email: inviteEmail, role: inviteRole });
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'member':
        return <Users className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Household Settings</h1>
          <p className="text-gray-600 mt-1">{currentHousehold?.name || 'No household selected'}</p>
        </div>
        {isAdmin && (
          <Button className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Household
          </Button>
        )}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {mockMembers.length} members in this household
              </CardDescription>
            </div>
            {/* Only show invite button for admins */}
            {isAdmin && (
              <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex items-center gap-2"
                    data-testid="invite-member-button"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="invite-member-modal">
                  <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your household.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                      >
                        <option value="admin">Admin - Full access</option>
                        <option value="member">Member - Can add/edit items</option>
                        <option value="viewer">Viewer - Read-only access</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteMember}>
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="members-list">
            {mockMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                data-testid={`member-${member.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                  {isAdmin && member.id !== user?.id && (
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Household Information */}
      <Card>
        <CardHeader>
          <CardTitle>Household Information</CardTitle>
          <CardDescription>
            General information about your household
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Household Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentHousehold?.name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Your Role</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(currentHousehold?.role || 'viewer')}`}>
                  {getRoleIcon(currentHousehold?.role || 'viewer')}
                  {currentHousehold?.role || 'Unknown'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Members</dt>
              <dd className="mt-1 text-sm text-gray-900">{mockMembers.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">January 1, 2024</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for Admins */}
      {isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this household
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Leave Household
              </Button>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 ml-3">
                Delete Household
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Warning: Deleting a household will permanently remove all data associated with it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}