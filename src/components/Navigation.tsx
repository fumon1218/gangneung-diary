import { Calendar, CalendarDays, LayoutList, ListTodo } from 'lucide-react';
import { useStore, ViewMode } from '../store';

export const Navigation = () => {
    const { viewMode, setViewMode } = useStore();

    const tabs: { id: ViewMode; label: string; icon: React.FC<any> }[] = [
        { id: 'yearly', label: '연간', icon: Calendar },
        { id: 'monthly', label: '월간', icon: CalendarDays },
        { id: 'weekly', label: '주간', icon: LayoutList },
        { id: 'daily', label: '일간', icon: ListTodo },
    ];

    return (
        <nav className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-paper-200">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                ? 'bg-paper-100 text-ink-900 shadow-sm ring-1 ring-black/5'
                                : 'text-ink-400 hover:text-ink-700 hover:bg-paper-50/50'
                            }`}
                    >
                        <Icon size={18} className={isActive ? 'text-ink-700' : 'text-ink-400'} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
