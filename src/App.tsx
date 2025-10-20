import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Today } from './screens/Today';
import { History } from './screens/History';
import { Targets } from './screens/Targets';
import { WeeklyPlan } from './screens/WeeklyPlan';
import { Saved } from './screens/Saved';
import { TabName } from './types';

function AppContent() {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-xl font-bold">My Fitness AI Coach</h1>
          {user ? (
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {activeTab === 'today' && <Today />}
        {activeTab === 'history' && <History />}
        {activeTab === 'targets' && <Targets />}
        {activeTab === 'weekly-plan' && <WeeklyPlan />}
        {activeTab === 'saved' && <Saved />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 safe-area-inset-bottom z-50">
        <div className="max-w-4xl mx-auto flex justify-around">
          <TabButton
            active={activeTab === 'today'}
            onClick={() => setActiveTab('today')}
            label="Today"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            label="History"
          />
          <TabButton
            active={activeTab === 'targets'}
            onClick={() => setActiveTab('targets')}
            label="Targets"
          />
          <TabButton
            active={activeTab === 'weekly-plan'}
            onClick={() => setActiveTab('weekly-plan')}
            label="Weekly Plan"
          />
          <TabButton
            active={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
            label="Saved"
          />
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} signIn={signIn} signUp={signUp} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        active ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function AuthModal({
  onClose,
  signIn,
  signUp,
}: {
  onClose: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
    } else {
      onClose();
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-gray-400 hover:text-white"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
