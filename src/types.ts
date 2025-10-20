export interface WorkoutItem {
  activity: string;
  minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
  order_index?: number;
  source?: 'plan' | 'manual';
}

export interface FoodItem {
  name: string;
  calories: number;
}

export interface DayTotals {
  food_cals: number;
  workout_cals: number;
  allowance: number;
  remaining: number;
  locked_remaining?: boolean;
  remaining_override?: number | null;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  label?: string;
}

export type PlanBlockKind =
  | 'warmup'
  | 'strength'
  | 'metcon'
  | 'skill'
  | 'finisher'
  | 'cooldown'
  | 'circuit'
  | 'workout';

export interface PlanBlock {
  kind: PlanBlockKind;
  text: string;
  minutes?: number;
  loadRx?: string | null;
  equipment?: string[];
  scale?: string | null;
  coach?: string | null;
}

export interface PlanDay {
  id: string;
  title: string;
  summary?: string;
  minutes?: number;
  focus?: string[];
  tags?: string[];
  blocks: PlanBlock[];
}

export interface SavedWorkout {
  id: string;
  name: string;
  plan: any;
  created_at: string;
}

export type TabName = 'today' | 'history' | 'targets' | 'weekly-plan' | 'saved';

export interface GeneratePlanRequest {
  minutes: number;
  days: number;
  goal: 'cut' | 'lean' | 'bulk' | 'recomp';
  style: 'strength' | 'hybrid' | 'bodyweight' | 'cardio' | 'crossfit' | 'emom' | 'tabata' | 'interval' | 'conditioning' | 'finisher' | 'mobility' | 'skill' | 'circuit';
  intensity: 'low' | 'moderate' | 'high';
  experience: 'beginner' | 'intermediate' | 'advanced';
  focus: string[];
  equipment: string[];
}

export interface GeneratePlanResponse {
  success: boolean;
  data?: {
    week: PlanDay[];
  };
  error?: string;
}
