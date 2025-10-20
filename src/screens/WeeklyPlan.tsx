import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTodayKey } from '../utils/date';
import { generateWeeklyPlan } from '../utils/api';
import { PlanDay, GeneratePlanRequest } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function WeeklyPlan() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState<PlanDay[]>([]);

  const [formData, setFormData] = useState<GeneratePlanRequest>({
    minutes: 40,
    days: 3,
    goal: 'recomp',
    style: 'hybrid',
    intensity: 'moderate',
    experience: 'intermediate',
    focus: [],
    equipment: [],
  });

  const [focusInput, setFocusInput] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await generateWeeklyPlan(formData);

    if (result.success && result.data) {
      setWeek(result.data.week);
    } else {
      setError(result.error || 'Failed to generate plan');
    }

    setLoading(false);
  }

  async function addDayToToday(day: PlanDay) {
    if (!user) {
      alert('Please sign in to add workouts');
      return;
    }

    const dateKey = getTodayKey();

    for (const block of day.blocks) {
      const minutes = block.minutes || 10;
      const caloriesBurned = Math.round(minutes * 7);

      await supabase.from('workouts').insert({
        user_id: user.id,
        date: dateKey,
        activity: `${block.kind}: ${block.text}`,
        minutes,
        calories_burned: caloriesBurned,
        intensity: formData.intensity,
        notes: block.coach || '',
        source: 'plan',
      });
    }

    alert('Workout added to today!');
  }

  async function savePlan(day: PlanDay) {
    if (!user) {
      alert('Please sign in to save workouts');
      return;
    }

    await supabase.from('saved_workouts').insert({
      user_id: user.id,
      name: day.title,
      plan: day,
    });

    alert('Workout saved!');
  }

  function addFocusArea() {
    if (focusInput.trim()) {
      setFormData({
        ...formData,
        focus: [...formData.focus, focusInput.trim()],
      });
      setFocusInput('');
    }
  }

  function removeFocusArea(index: number) {
    setFormData({
      ...formData,
      focus: formData.focus.filter((_, i) => i !== index),
    });
  }

  function addEquipment() {
    if (equipmentInput.trim()) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, equipmentInput.trim()],
      });
      setEquipmentInput('');
    }
  }

  function removeEquipment(index: number) {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Weekly Plan</h1>

      <Card>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Goal</label>
              <select
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value as GeneratePlanRequest['goal'] })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cut">Cut</option>
                <option value="lean">Lean</option>
                <option value="bulk">Bulk</option>
                <option value="recomp">Recomp</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Style</label>
              <select
                value={formData.style}
                onChange={(e) =>
                  setFormData({ ...formData, style: e.target.value as GeneratePlanRequest['style'] })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="strength">Strength</option>
                <option value="hybrid">Hybrid</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="cardio">Cardio</option>
                <option value="crossfit">CrossFit</option>
                <option value="circuit">Circuit</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Experience</label>
              <select
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value as GeneratePlanRequest['experience'] })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Intensity</label>
              <select
                value={formData.intensity}
                onChange={(e) =>
                  setFormData({ ...formData, intensity: e.target.value as GeneratePlanRequest['intensity'] })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Days Per Week"
              type="number"
              min="2"
              max="10"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 3 })}
            />

            <Input
              label="Minutes Per Day"
              type="number"
              min="20"
              max="90"
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 40 })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Focus Areas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                placeholder="e.g., upper body, core"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" onClick={addFocusArea}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.focus.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center gap-2"
                >
                  {f}
                  <button type="button" onClick={() => removeFocusArea(i)} className="hover:text-gray-300">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Equipment</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                placeholder="e.g., dumbbells, barbell"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" onClick={addEquipment}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment.map((e, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-2"
                >
                  {e}
                  <button type="button" onClick={() => removeEquipment(i)} className="hover:text-gray-300">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Plan'}
          </Button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </Card>

      {week.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Weekly Plan</h2>
          {week.map((day) => (
            <Card key={day.id}>
              <h3 className="text-lg font-bold mb-2">{day.title}</h3>
              {day.summary && <p className="text-sm text-gray-400 mb-3">{day.summary}</p>}
              {day.minutes && (
                <p className="text-sm text-blue-400 mb-3">Estimated duration: {day.minutes} minutes</p>
              )}

              <div className="space-y-2 mb-4">
                {day.blocks.map((block, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded">
                    <div className="font-semibold text-sm text-blue-400 uppercase mb-1">{block.kind}</div>
                    <div className="text-sm">{block.text}</div>
                    {block.loadRx && <div className="text-xs text-gray-500 mt-1">Load: {block.loadRx}</div>}
                    {block.coach && <div className="text-xs text-gray-400 mt-1 italic">{block.coach}</div>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => addDayToToday(day)} className="flex-1">
                  Add to Today
                </Button>
                <Button onClick={() => savePlan(day)} variant="secondary" className="flex-1">
                  Save
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
