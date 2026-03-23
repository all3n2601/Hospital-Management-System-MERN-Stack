import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCredentials, setCredentials, AuthUser } from '@/store/authSlice';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, accessToken, isAuthenticated } = useAppSelector(s => s.auth);

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<{ data: { user: AuthUser; accessToken: string } }>('/auth/login', data),
    onSuccess: ({ data }) => {
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      dispatch(clearCredentials());
      disconnectSocket();
    },
  });

  return { user, accessToken, isAuthenticated, loginMutation, logoutMutation };
}
