import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { YearlyView } from './components/views/YearlyView';
import { MonthlyView } from './components/views/MonthlyView';
import { WeeklyView } from './components/views/WeeklyView';
import { DailyView } from './components/views/DailyView';
import { Calendar, CalendarDays, ListTodo, CalendarRange, Shield } from 'lucide-react';
import { useStore } from './store';
import { LockScreen } from './components/common/LockScreen';
import { SecuritySettingsModal } from './components/common/SecuritySettingsModal';
import { AuthButton } from './components/common/AuthButton';
import { RefreshCw } from 'lucide-react';
import { useWeather } from './hooks/useWeather';
import { useNotifications } from './hooks/useNotifications';

const clearCacheAndReload = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    } catch (err) {
      console.error('SW unregister error', err);
    }
  }
  // 캐시를 부수기 위해 URL 쿼리에 타임스탬프를 부여하고, 곧바로 이동 (reload와 충돌 방지)
  const newUrl = window.location.href.split('?')[0].split('#')[0] + '?t=' + new Date().getTime() + window.location.hash;
  window.location.replace(newUrl);
};

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

const appVersion = import.meta.env.VITE_APP_VERSION || '1.5.9';

function App() {
  const { isLocked } = useStore();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // 최초 1회 현재 위치 기반 날씨 캐싱 호출
  useWeather();

  // 브라우저 네이티브 알림(Notification) 감시 타이머 실행
  useNotifications();

  return (
    <div className="min-h-screen bg-[var(--color-paper-50)] flex flex-col items-center py-6 px-4 md:py-10">

      {/* 잠금 화면 (최우선 렌더링) */}
      {isLocked && <LockScreen />}

      <header className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-bold text-[var(--color-ink-900)] tracking-tight">강릉분원 업무수첩</h1>
            <span className="text-xs font-black text-accent-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
              v{appVersion}
            </span>
          </div>
          <p className="text-sm text-[var(--color-ink-500)] mt-1 font-medium">Gangneung Branch Work Diary</p>
        </div>

        <div className="flex items-center gap-2">
          <Navigation />

          {/* 강제 새로고침(캐시 비우기) 버튼 */}
          <button
            onClick={clearCacheAndReload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-red/10 text-accent-red rounded-full border border-accent-red/20 font-bold text-xs hover:bg-accent-red hover:text-white transition-all shadow-sm shrink-0"
            title="앱 최신 버전으로 강제 업데이트"
          >
            <RefreshCw size={14} />
            <span className="hidden md:inline">앱 업데이트</span>
          </button>

          {/* 클라우드 동기화 (구글 로그인) 버튼 */}
          <AuthButton />

          {/* 보안 설정(자물쇠) 버튼 */}
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="p-2 ml-1 bg-white rounded-full border border-[var(--color-paper-200)] text-[var(--color-ink-500)] hover:text-accent-blue hover:border-blue-200 hover:shadow-sm transition-all"
            title="보안 (PIN 잠금) 설정"
          >
            <Shield size={18} />
          </button>
        </div>
      </header>

      <main className={`w-full max-w-6xl flex-1 diary-page p-6 md:p-8 relative ${isLocked ? 'blur-md pointer-events-none opacity-50' : ''}`}>
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

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}

export default App;
