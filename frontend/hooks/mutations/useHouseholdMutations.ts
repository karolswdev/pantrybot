import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

// Types
interface CreateHouseholdData {
  name: string;
  description?: string;
}

interface InviteMemberData {
  householdId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface CreateHouseholdResponse {
  household: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
  };
}

interface InviteMemberResponse {
  invitation: {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  };
}

// Create Household Mutation
export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { setCurrentHousehold } = useAuthStore();

  return useMutation<CreateHouseholdResponse, Error, CreateHouseholdData>({
    mutationFn: async (data) => {
      const response = await api.households.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate households query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['households'] });
      
      // Set the new household as active
      setCurrentHousehold(data.household.id);
      
      // Show success message (could be a toast in production)
      console.log('Household created successfully:', data.household.name);
    },
    onError: (error) => {
      console.error('Failed to create household:', error);
    },
  });
}

// Invite Member Mutation
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation<InviteMemberResponse, Error, InviteMemberData>({
    mutationFn: async ({ householdId, email, role }) => {
      const response = await apiClient.post(`/api/v1/households/${householdId}/members`, {
        email,
        role,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate household members query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['household', variables.householdId, 'members'] });
      
      // Also invalidate the household details
      queryClient.invalidateQueries({ queryKey: ['household', variables.householdId] });
      
      // Show success message
      console.log(`Invitation sent to ${data.invitation.email}`);
    },
    onError: (error) => {
      console.error('Failed to invite member:', error);
    },
  });
}

// Remove Member Mutation
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { householdId: string; memberId: string }>({
    mutationFn: async ({ householdId, memberId }) => {
      await apiClient.delete(`/api/v1/households/${householdId}/members/${memberId}`);
    },
    onSuccess: (_, variables) => {
      // Invalidate household members query
      queryClient.invalidateQueries({ queryKey: ['household', variables.householdId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['household', variables.householdId] });
      
      console.log('Member removed successfully');
    },
    onError: (error) => {
      console.error('Failed to remove member:', error);
    },
  });
}

// Update Member Role Mutation
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { householdId: string; memberId: string; role: 'admin' | 'member' | 'viewer' }>({
    mutationFn: async ({ householdId, memberId, role }) => {
      await apiClient.patch(`/api/v1/households/${householdId}/members/${memberId}`, { role });
    },
    onSuccess: (_, variables) => {
      // Invalidate household members query
      queryClient.invalidateQueries({ queryKey: ['household', variables.householdId, 'members'] });
      
      console.log('Member role updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update member role:', error);
    },
  });
}

// Leave Household Mutation
export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  const { setCurrentHousehold, households } = useAuthStore();

  return useMutation<void, Error, string>({
    mutationFn: async (householdId) => {
      await apiClient.delete(`/api/v1/households/${householdId}/leave`);
    },
    onSuccess: (_, householdId) => {
      // Invalidate households query
      queryClient.invalidateQueries({ queryKey: ['households'] });
      
      // Switch to another household if available
      const remainingHouseholds = households.filter(h => h.id !== householdId);
      if (remainingHouseholds.length > 0) {
        setCurrentHousehold(remainingHouseholds[0].id);
      } else {
        setCurrentHousehold('');
      }
      
      console.log('Successfully left household');
    },
    onError: (error) => {
      console.error('Failed to leave household:', error);
    },
  });
}

// Delete Household Mutation (admin only)
export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  const { setCurrentHousehold, households } = useAuthStore();

  return useMutation<void, Error, string>({
    mutationFn: async (householdId) => {
      await apiClient.delete(`/api/v1/households/${householdId}`);
    },
    onSuccess: (_, householdId) => {
      // Invalidate households query
      queryClient.invalidateQueries({ queryKey: ['households'] });
      
      // Switch to another household if available
      const remainingHouseholds = households.filter(h => h.id !== householdId);
      if (remainingHouseholds.length > 0) {
        setCurrentHousehold(remainingHouseholds[0].id);
      } else {
        setCurrentHousehold('');
      }
      
      console.log('Household deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete household:', error);
    },
  });
}