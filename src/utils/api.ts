import { GeneratePlanRequest, GeneratePlanResponse } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function generateWeeklyPlan(
  request: GeneratePlanRequest
): Promise<GeneratePlanResponse> {
  try {
    const apiUrl = `${SUPABASE_URL}/functions/v1/plan-week`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate plan' }));
      return { success: false, error: error.error || 'Failed to generate plan' };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function checkHealth(): Promise<{ ok: boolean; t: number }> {
  const apiUrl = `${SUPABASE_URL}/functions/v1/health`;

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  return response.json();
}
