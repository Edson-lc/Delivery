import { useCurrentUser as useCurrentUserFromContext, useAuthActions as useAuthActionsFromContext } from '@/contexts/AuthContext';

export function useCurrentUser() {
  return useCurrentUserFromContext();
}

export function useAuthActions() {
  return useAuthActionsFromContext();
}
