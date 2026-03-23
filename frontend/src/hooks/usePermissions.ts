import { useAppSelector } from '@/store/hooks';

type Role = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 5, doctor: 4, nurse: 3, receptionist: 2, patient: 1,
};

export function usePermissions() {
  const user = useAppSelector(s => s.auth.user);

  const hasRole = (role: Role): boolean => user?.role === role;

  const hasMinRole = (minRole: Role): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  };

  const isAdmin = hasRole('admin');
  const isDoctor = hasRole('doctor');
  const isNurse = hasRole('nurse');
  const isReceptionist = hasRole('receptionist');
  const isPatient = hasRole('patient');

  return { user, hasRole, hasMinRole, isAdmin, isDoctor, isNurse, isReceptionist, isPatient };
}
