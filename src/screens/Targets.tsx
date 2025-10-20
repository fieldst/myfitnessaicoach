import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTodayKey } from '../utils/date';
import { Targets as TargetsType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function Targets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<TargetsType>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
    label: 'recomp',
  });

  useEffect(() => {
    if (user) {
      loadTargets();
    }
  }, [user]);

  async function loadTargets() {
    if (!user) return;

    const { data } = await supabase
      .from('days')
      .select('targets')
      .eq('user_id', user.id)
      .eq('date', getTodayKey())
      .maybeSingle();

    if (data?.targets) {
      setTargets(data.targets as TargetsType);
    }
  }

  async function saveTargets(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const dateKey = getTodayKey();

    await supabase.from('days').upsert({
      user_id: user.id,
      date: dateKey,
      targets,
      updated_at: new Date().toISOString(),
    });

    alert('Targets saved successfully!');
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-center text-gray-400">Sign in to set your targets</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Daily Targets</h1>

      <Card>
        <form onSubmit={saveTargets} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Goal Type</label>
            <select
              value={targets.label || 'recomp'}
              onChange={(e) => setTargets({ ...targets, label: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cut">Cut (Fat Loss)</option>
              <option value="recomp">Recomp (Maintain)</option>
              <option value="lean">Lean Bulk</option>
              <option value="bulk">Bulk (Mass Gain)</option>
            </select>
          </div>

          <Input
            label="Daily Calories"
            type="number"
            value={targets.calories}
            onChange={(e) => setTargets({ ...targets, calories: parseInt(e.target.value) || 0 })}
            required
          />

          <Input
            label="Protein (g)"
            type="number"
            value={targets.protein}
            onChange={(e) => setTargets({ ...targets, protein: parseInt(e.target.value) || 0 })}
            required
          />

          <Input
            label="Carbs (g)"
            type="number"
            value={targets.carbs}
            onChange={(e) => setTargets({ ...targets, carbs: parseInt(e.target.value) || 0 })}
            required
          />

          <Input
            label="Fat (g)"
            type="number"
            value={targets.fat}
            onChange={(e) => setTargets({ ...targets, fat: parseInt(e.target.value) || 0 })}
            required
          />

          <Button type="submit" className="w-full">
            Save Targets
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">AI Coach Suggestion</h3>
        <p className="text-sm text-gray-400">
          Based on your goals and activity level, we recommend adjusting your macros to match your training days.
          Consider increasing protein to support recovery and muscle growth.
        </p>
      </Card>
    </div>
  );
}
