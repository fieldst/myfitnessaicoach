import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTodayKey, formatDisplayDate } from '../utils/date';
import { DayTotals, Targets, WorkoutItem, FoodItem } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function Today() {
  const { user } = useAuth();
  const [dateKey] = useState(getTodayKey());
  const [totals, setTotals] = useState<DayTotals>({
    food_cals: 0,
    workout_cals: 0,
    allowance: 2000,
    remaining: 2000,
  });
  const [targets, setTargets] = useState<Targets>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
  });
  const [foods, setFoods] = useState<(FoodItem & { id: string })[]>([]);
  const [workouts, setWorkouts] = useState<(WorkoutItem & { id: string })[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);

  useEffect(() => {
    if (user) {
      loadDayData();
      loadFoods();
      loadWorkouts();
    }
  }, [user, dateKey]);

  async function loadDayData() {
    if (!user) return;

    const { data } = await supabase
      .from('days')
      .select('totals, targets')
      .eq('user_id', user.id)
      .eq('date', dateKey)
      .maybeSingle();

    if (data) {
      if (data.totals) setTotals(data.totals as DayTotals);
      if (data.targets) setTargets(data.targets as Targets);
    }
  }

  async function loadFoods() {
    if (!user) return;

    const { data } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateKey)
      .order('created_at', { ascending: true });

    if (data) {
      setFoods(data);
    }
  }

  async function loadWorkouts() {
    if (!user) return;

    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateKey)
      .order('order_index', { ascending: true });

    if (data) {
      setWorkouts(
        data.map((w) => ({
          id: w.id,
          activity: w.activity,
          minutes: w.minutes || undefined,
          calories_burned: w.calories_burned || undefined,
          intensity: w.intensity || undefined,
          notes: w.notes || undefined,
          order_index: w.order_index || undefined,
          source: (w.source as 'plan' | 'manual') || undefined,
        }))
      );
    }
  }

  async function recalculateTotals() {
    if (!user) return;

    await loadFoods();
    await loadWorkouts();

    const foodCals = foods.reduce((sum, f) => sum + f.calories, 0);
    const workoutCals = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
    const allowance = targets.calories + workoutCals;
    const remaining = allowance - foodCals;

    const newTotals: DayTotals = {
      food_cals: foodCals,
      workout_cals: workoutCals,
      allowance,
      remaining,
    };

    setTotals(newTotals);

    await supabase.from('days').upsert({
      user_id: user.id,
      date: dateKey,
      totals: newTotals,
      targets,
      updated_at: new Date().toISOString(),
    });
  }

  async function addFood(name: string, calories: number) {
    if (!user) return;

    await supabase.from('foods').insert({
      user_id: user.id,
      date: dateKey,
      name,
      calories,
    });

    await recalculateTotals();
    setShowAddFood(false);
  }

  async function addWorkout(workout: WorkoutItem) {
    if (!user) return;

    await supabase.from('workouts').insert({
      user_id: user.id,
      date: dateKey,
      activity: workout.activity,
      minutes: workout.minutes || 0,
      calories_burned: workout.calories_burned || 0,
      intensity: workout.intensity || '',
      notes: workout.notes || '',
      order_index: workout.order_index || 0,
      source: workout.source || 'manual',
    });

    await recalculateTotals();
    setShowAddWorkout(false);
  }

  async function deleteFood(id: string) {
    if (!user) return;
    await supabase.from('foods').delete().eq('id', id);
    await recalculateTotals();
  }

  async function deleteWorkout(id: string) {
    if (!user) return;
    await supabase.from('workouts').delete().eq('id', id);
    await recalculateTotals();
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-center text-gray-400">Sign in to track your fitness data</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">{formatDisplayDate(dateKey)}</h1>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Daily Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400">Target</div>
            <div className="text-xl font-bold">{targets.calories} cal</div>
          </div>
          <div>
            <div className="text-gray-400">Remaining</div>
            <div className="text-xl font-bold text-green-400">{totals.remaining} cal</div>
          </div>
          <div>
            <div className="text-gray-400">Food</div>
            <div className="font-semibold">{totals.food_cals} cal</div>
          </div>
          <div>
            <div className="text-gray-400">Exercise</div>
            <div className="font-semibold text-blue-400">+{totals.workout_cals} cal</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Food Log</h2>
          <Button size="sm" onClick={() => setShowAddFood(true)}>
            Add Food
          </Button>
        </div>
        {foods.length === 0 ? (
          <p className="text-gray-500 text-sm">No foods logged yet</p>
        ) : (
          <ul className="space-y-2">
            {foods.map((food) => (
              <li key={food.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                <div>
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-gray-400">{food.calories} cal</div>
                </div>
                <Button size="sm" variant="danger" onClick={() => deleteFood(food.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Workouts</h2>
          <Button size="sm" onClick={() => setShowAddWorkout(true)}>
            Add Workout
          </Button>
        </div>
        {workouts.length === 0 ? (
          <p className="text-gray-500 text-sm">No workouts logged yet</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((workout) => (
              <li key={workout.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                <div>
                  <div className="font-medium">{workout.activity}</div>
                  <div className="text-sm text-gray-400">
                    {workout.minutes} min • {workout.calories_burned} cal
                    {workout.intensity && ` • ${workout.intensity}`}
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => deleteWorkout(workout.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showAddFood && <AddFoodModal onAdd={addFood} onClose={() => setShowAddFood(false)} />}
      {showAddWorkout && <AddWorkoutModal onAdd={addWorkout} onClose={() => setShowAddWorkout(false)} />}
    </div>
  );
}

function AddFoodModal({ onAdd, onClose }: { onAdd: (name: string, calories: number) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && calories) {
      onAdd(name, parseInt(calories));
      setName('');
      setCalories('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add Food</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Food Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Calories"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AddWorkoutModal({
  onAdd,
  onClose,
}: {
  onAdd: (workout: WorkoutItem) => void;
  onClose: () => void;
}) {
  const [activity, setActivity] = useState('');
  const [minutes, setMinutes] = useState('');
  const [calories, setCalories] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activity && minutes && calories) {
      onAdd({
        activity,
        minutes: parseInt(minutes),
        calories_burned: parseInt(calories),
        intensity,
        notes,
        source: 'manual',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add Workout</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Activity" value={activity} onChange={(e) => setActivity(e.target.value)} required />
          <Input
            label="Minutes"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            required
          />
          <Input
            label="Calories Burned"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Intensity</label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
