import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { YearlyView } from './components/views/YearlyView';
import { MonthlyView } from './components/views/MonthlyView';
import { WeeklyView } from './components/views/WeeklyView';
import { DailyView } from './components/views/DailyView';
import { Calendar, CalendarDays, ListTodo, CalendarRange } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { name: 'Yearly', path: '/yearly', icon: <CalendarRange size={16} />, label: '연간' },
    { name: 'Monthly', path: '/', icon: <Calendar size={16} />, label: '월간' },
    { name: 'Weekly', path: '/weekly', icon: <CalendarDays size={16} />, label: '주간' },
    { name: 'Daily', path: '/daily', icon: <ListTodo size={16} />, label: '일간' }
  ];

  return (
    <nav className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[var(--color-paper-200)] shadow-sm">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path || (currentPath === '/' && tab.path === '/');

        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 
              ${isActive
                ? 'bg-[var(--color-paper-50)] text-[var(--color-ink-900)] shadow-sm'
                : 'text-[var(--color-ink-400)] hover:text-[var(--color-ink-600)] hover:bg-[var(--color-paper-50)]/50'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const appVersion = import.meta.env.VITE_APP_VERSION || '1.1.0';

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-paper-50)] flex flex-col items-center py-6 px-4 md:py-10">
      <header className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-ink-900)] tracking-tight">강릉분원 업무수첩</h1>
          <p className="text-sm text-[var(--color-ink-500)] mt-1 font-medium">Gangneung Branch Work Diary</p>
        </div>
        <Navigation />
      </header>

      <main className="w-full max-w-6xl flex-1 diary-page p-6 md:p-8 relative">
        <Routes>
          <Route path="/" element={<MonthlyView />} />
          <Route path="/yearly" element={<YearlyView />} />
          <Route path="/weekly" element={<WeeklyView />} />
          <Route path="/daily" element={<DailyView />} />
        </Routes>
      </main>

      {/* 우측 하단 버전 표시 배지 */}
      <div className="fixed bottom-4 right-4 px-2 py-1 text-[11px] font-bold text-ink-300 font-mono tracking-wider pointer-events-none select-none z-50 opacity-60">
        v{appVersion}
      </div>
    </div>
  );
}

export default App;
