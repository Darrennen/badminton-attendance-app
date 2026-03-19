export type AttendanceStatus = 'present' | 'absent' | 'late' | 'none';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  avatar?: string;
  status: AttendanceStatus;
  group?: string;
}

export interface RegisteredStudent {
  id: string;
  name: string;
  studentId: string;       // auto-generated e.g. #000001
  icNumber: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  sessionIds: string[];
  avatar?: string;
  group?: string;
  registeredAt: string;
}

export interface RegisteredCoach {
  id: string;
  name: string;
  icNumber: string;
  phone: string;
  sessionIds: string[];
  initials: string;
  coachStatus: 'active' | 'on-break' | 'replace';
  registeredAt: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface Session {
  id: string;
  title: string;
  room: string;
  time: string;
  date: string;
  instructor: string;
  instructorAvatar: string;
  studentCount: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'urgent';
}

export interface Coach {
  id: string;
  name: string;
  initials: string;
  session: string;
  status: 'active' | 'on-break' | 'replace';
}

export interface ReplacementRequest {
  id: string;
  class: string;
  requestedBy: string;
  time: string;
  urgent: boolean;
  icon: string;
}

export interface PastReplacement {
  id: string;
  class: string;
  instructor: string;
  replacement: string;
  replacementAvatar: string;
  status: 'completed';
}

export interface AvailableStaff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
}
