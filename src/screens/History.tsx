import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDisplayDate } from '../utils/date';
import { DayTotals } from '../types';
import { Card } from '../components/Card';

interface DayEntry {
  date: string;
  totals: DayTotals;
}

export function History() {
  const { user } = useAuth();
  const [days, setDays] = useState<DayEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<{
    foods: any[];
    workouts: any[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    if (!user) return;

    const { data } = await supabase
      .from('days')
      .select('date, totals')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (data) {
      setDays(data.map((d) => ({ date: d.date, totals: d.totals as DayTotals })));
    }
  }

  async function loadDayDetails(date: string) {
    if (!user) return;

    const [foodsRes, workoutsRes] = await Promise.all([
      supabase.from('foods').select('*').eq('user_id', user.id).eq('date', date),
      supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', date),
    ]);

    setDayDetails({
      foods: foodsRes.data || [],
      workouts: workoutsRes.data || [],
    });
    setSelectedDate(date);
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-center text-gray-400">Sign in to view your history</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">History</h1>

      {days.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center">No history yet. Start logging today!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {days.map((day) => (
            <Card
              key={day.date}
              className="cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => loadDayDetails(day.date)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{formatDisplayDate(day.date)}</div>
                  <div className="text-sm text-gray-400">
                    {day.totals.food_cals} cal • {day.totals.remaining} remaining
                  </div>
                </div>
                <div className="text-2xl text-gray-500">›</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedDate && dayDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{formatDisplayDate(selectedDate)}</h2>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setDayDetails(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Foods</h3>
                {dayDetails.foods.length === 0 ? (
                  <p className="text-gray-500 text-sm">No foods logged</p>
                ) : (
                  <ul className="space-y-2">
                    {dayDetails.foods.map((food) => (
                      <li key={food.id} className="bg-gray-900 p-2 rounded">
                        <div className="font-medium">{food.name}</div>
                        <div className="text-sm text-gray-400">{food.calories} cal</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Workouts</h3>
                {dayDetails.workouts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No workouts logged</p>
                ) : (
                  <ul className="space-y-2">
                    {dayDetails.workouts.map((workout) => (
                      <li key={workout.id} className="bg-gray-900 p-2 rounded">
                        <div className="font-medium">{workout.activity}</div>
                        <div className="text-sm text-gray-400">
                          {workout.minutes} min • {workout.calories_burned} cal
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
