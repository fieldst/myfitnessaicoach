import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTodayKey } from '../utils/date';
import { SavedWorkout, PlanDay } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Saved() {
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSavedWorkouts();
    }
  }, [user]);

  async function loadSavedWorkouts() {
    if (!user) return;

    const { data } = await supabase
      .from('saved_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setSavedWorkouts(data);
    }
  }

  async function addToToday(workout: SavedWorkout) {
    if (!user) return;

    const plan = workout.plan as PlanDay;
    const dateKey = getTodayKey();

    for (const block of plan.blocks) {
      const minutes = block.minutes || 10;
      const caloriesBurned = Math.round(minutes * 7);

      await supabase.from('workouts').insert({
        user_id: user.id,
        date: dateKey,
        activity: `${block.kind}: ${block.text}`,
        minutes,
        calories_burned: caloriesBurned,
        notes: block.coach || '',
        source: 'plan',
      });
    }

    alert('Workout added to today!');
  }

  async function removeWorkout(id: string) {
    if (!user) return;

    await supabase.from('saved_workouts').delete().eq('id', id);
    await loadSavedWorkouts();
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-center text-gray-400">Sign in to view saved workouts</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Saved Workouts</h1>

      {savedWorkouts.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center">No saved workouts yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedWorkouts.map((workout) => {
            const plan = workout.plan as PlanDay;
            const isExpanded = expandedId === workout.id;

            return (
              <Card key={workout.id}>
                <div
                  className="flex justify-between items-start cursor-pointer mb-3"
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                >
                  <div>
                    <h3 className="font-bold">{workout.name}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(workout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-2xl text-gray-500">{isExpanded ? '−' : '+'}</div>
                </div>

                {isExpanded && plan.blocks && (
                  <div className="space-y-2 mb-4">
                    {plan.summary && <p className="text-sm text-gray-400 mb-2">{plan.summary}</p>}
                    {plan.blocks.map((block, i) => (
                      <div key={i} className="bg-gray-900 p-2 rounded text-sm">
                        <div className="font-semibold text-blue-400 uppercase text-xs mb-1">{block.kind}</div>
                        <div>{block.text}</div>
                        {block.coach && <div className="text-xs text-gray-400 mt-1 italic">{block.coach}</div>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => addToToday(workout)} className="flex-1">
                    Add to Today
                  </Button>
                  <Button onClick={() => removeWorkout(workout.id)} variant="danger" className="flex-1">
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
