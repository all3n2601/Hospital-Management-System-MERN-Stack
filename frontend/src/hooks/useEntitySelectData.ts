import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Drug } from '@/types/pharmacy';

export interface PatientSelectRow {
  _id: string;
  patientId: string;
  userId?: { firstName?: string; lastName?: string; email?: string };
}

export interface DoctorSelectRow {
  _id: string;
  specialization?: string;
  userId?: { firstName?: string; lastName?: string; email?: string };
}

export interface NurseStaffRow {
  _id: string;
  userId?: { _id?: string; firstName?: string; lastName?: string; email?: string };
}

export interface DoctorProfileBundle {
  user: { _id: string; role?: string };
  profile: { _id: string } | null;
}

export function patientSelectLabel(p: PatientSelectRow): string {
  const name = `${p.userId?.firstName ?? ''} ${p.userId?.lastName ?? ''}`.trim();
  return name ? `${name} (${p.patientId})` : p.patientId;
}

export function doctorSelectLabel(d: DoctorSelectRow): string {
  const name = `${d.userId?.firstName ?? ''} ${d.userId?.lastName ?? ''}`.trim();
  const spec = d.specialization ? ` — ${d.specialization}` : '';
  return name ? `Dr. ${name}${spec}` : d._id;
}

export function usePatientsSelectQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['entity-select', 'patients'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PatientSelectRow[] }>('/patients?limit=500');
      return res.data.data ?? [];
    },
    enabled,
  });
}

export function useDoctorsSelectQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['entity-select', 'doctors'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DoctorSelectRow[] }>(
        '/doctors?isActive=true&limit=500'
      );
      return res.data.data ?? [];
    },
    enabled,
  });
}

export function useDrugsSelectQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['entity-select', 'drugs'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Drug[] }>('/pharmacy/drugs');
      return res.data.data ?? [];
    },
    enabled,
  });
}

/** Lab technician = user id; list active nurses (admin lab). */
export function useNurseUsersSelectQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['entity-select', 'nurses'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: NurseStaffRow[] }>(
        '/staff?role=nurse&isActive=true&limit=500'
      );
      return res.data.data ?? [];
    },
    enabled,
  });
}

export function nurseUserSelectLabel(n: NurseStaffRow): string {
  const u = n.userId;
  const name = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
  return name || '—';
}

/** User account id (for lab technician field). */
export function nurseStaffUserId(n: NurseStaffRow): string | null {
  const u = n.userId;
  if (!u || typeof u !== 'object') return null;
  const raw = (u as { _id?: unknown })._id;
  if (raw == null) return null;
  return typeof raw === 'string' ? raw : String(raw);
}

export function useMyDoctorProfileId(userId: string | undefined, role: string | undefined) {
  return useQuery({
    queryKey: ['entity-select', 'my-doctor-profile', userId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DoctorProfileBundle }>(`/doctors/${userId}`);
      return res.data.data;
    },
    enabled: !!userId && role === 'doctor',
    select: (data) => data?.profile?._id ?? null,
  });
}
