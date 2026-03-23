import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, setLoading } from '@/store/authSlice';
import axios from 'axios';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Attempt to restore session via refresh cookie on mount
    axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        if (data?.data?.accessToken) {
          // Get user info with the new token
          return axios.get('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${data.data.accessToken}` },
            withCredentials: true,
          }).then(({ data: meData }) => {
            dispatch(setCredentials({
              user: meData.data.user,
              accessToken: data.data.accessToken,
            }));
          });
        }
      })
      .catch(() => {
        // No valid session — that's fine, user will be redirected to sign-in
      })
      .finally(() => {
        dispatch(setLoading(false));
      });
  }, [dispatch]);

  return <>{children}</>;
}
