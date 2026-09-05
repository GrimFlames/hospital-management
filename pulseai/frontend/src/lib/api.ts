import { TriageRecord, IntakeFormData } from '@/types/triage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchTriageRecords(): Promise<TriageRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/records`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch triage records: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching records:', error);
    return [];
  }
}

export async function submitIntakeForm(data: IntakeFormData): Promise<TriageRecord> {
  const formData = new FormData();
  formData.append('patient_name', data.patient_name);
  formData.append('age', data.age.toString());
  formData.append('gender', data.gender);
  formData.append('symptoms', data.symptoms);

  if (data.file) {
    formData.append('file', data.file);
  }

  const res = await fetch(`${API_BASE_URL}/api/triage`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || 'Failed to process clinical triage.');
  }

  return await res.json();
}

export async function confirmAppointment(recordId: string, status: 'CONFIRMED' | 'RESOLVED' = 'CONFIRMED'): Promise<TriageRecord> {
  const res = await fetch(`${API_BASE_URL}/api/records/${recordId}/confirm`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Failed to update appointment status.');
  }

  return await res.json();
}

export async function deleteRecord(recordId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/records/${recordId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete triage record.');
  }
}
