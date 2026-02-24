import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MonthlyView = () => {
    const { currentDate, setCurrentDate } = useStore();
    const navigate = useNavigate();

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => {
                        setCurrentDate(cloneDay);
                        navigate('/daily');
                    }}
                    className={`border-r border-b border-paper-200 p-2 min-h-[120px] cursor-pointer transition-colors relative group
            ${!isSameMonth(day, monthStart) ? 'bg-paper-50/50 text-ink-400 opacity-60' : 'bg-white text-ink-700 hover:bg-paper-50'}
          `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-semibold ${isToday(day) ? 'bg-accent-blue text-white w-6 h-6 rounded-full flex items-center justify-center' : ''} ${i === 0 ? 'text-accent-red' : ''}`}>
                            {formattedDate}
                        </span>
                    </div>
                    {/* 일정/투두 요약 위치 */}
                    <div className="mt-2 space-y-1">
                        <div className="diary-line pb-4 opacity-50 group-hover:border-paper-300 transition-colors"></div>
                        <div className="diary-line pb-4 opacity-50 group-hover:border-paper-300 transition-colors"></div>
                        <div className="diary-line pb-4 opacity-50 group-hover:border-paper-300 transition-colors"></div>
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7 flex-1" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">

            {/* 달력 헤더 */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-bold text-ink-900 font-serif tracking-tight">
                        {format(currentDate, "M")}
                    </h2>
                    <span className="text-lg font-medium text-ink-500 uppercase tracking-widest">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold bg-paper-100 hover:bg-paper-200 text-ink-700 rounded-full transition-colors">
                        Today
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 h-full min-h-0">

                {/* 아날로그 다이어리처럼 좌측 자유 메모/주간 목표 라인 */}
                <div className="hidden lg:flex w-48 border border-paper-200 rounded-xl bg-white p-4 flex-col shadow-sm">
                    <h3 className="text-xs font-bold text-ink-400 mb-4 uppercase tracking-wider text-center">Monthly Notes</h3>
                    <div className="flex-1 flex flex-col pt-2">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="diary-line flex-1 min-h-[2rem]"></div>
                        ))}
                    </div>
                </div>

                {/* 달력 그리드 */}
                <div className="flex-1 border border-paper-200 rounded-xl bg-white flex flex-col shadow-sm overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-paper-200 bg-paper-50/50">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                            <div key={day} className={`py-2.5 text-center text-xs font-bold ${idx === 0 ? 'text-accent-red' : 'text-ink-400'}`}>
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 flex flex-col">
                        {rows}
                    </div>
                </div>

            </div>
        </div>
    );
};
