import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
    format,
    addWeeks,
    subWeeks,
    startOfWeek,
    endOfWeek,
    addDays,
    isToday,
    isSameMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getKoreanHoliday } from '../../utils/holidays';

export const WeeklyView = () => {
    const { currentDate, setCurrentDate, todos } = useStore();
    const navigate = useNavigate();

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);

    // 일주일치 날짜 배열 생성
    const weekDays = [];
    let day = weekStart;
    for (let i = 0; i < 7; i++) {
        weekDays.push(day);
        day = addDays(day, 1);
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">

            {/* 주간 뷰 헤더 */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl font-bold text-ink-900 font-serif tracking-tight">
                        {format(weekStart, "M월 d일")} - {format(weekEnd, "M월 d일")}
                    </h2>
                    <span className="text-sm font-medium text-ink-500 uppercase tracking-widest bg-paper-100/50 px-3 py-1 rounded-full border border-paper-200">
                        Weekly Plan
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleToday} className="px-4 py-1.5 text-sm font-bold bg-paper-100 hover:bg-paper-200 text-ink-700 rounded-full transition-colors">
                        Today
                    </button>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 h-full min-h-0 bg-white border border-paper-200 rounded-2xl p-4 md:p-6 shadow-sm">

                {/* 요일별 컬럼 (7개) */}
                <div className="w-full grid grid-cols-7 gap-3 md:gap-4 overflow-x-auto custom-scrollbar">
                    {weekDays.map((date) => {
                        const { isHoliday, name: holidayName } = getKoreanHoliday(date);

                        return (
                            <div
                                key={date.toString()}
                                className={`flex flex-col min-w-[140px] border border-paper-200/50 rounded-xl overflow-hidden transition-colors hover:border-paper-300 hover:shadow-sm bg-white group cursor-pointer
                ${isToday(date) ? 'ring-2 ring-accent-blue/30 border-transparent bg-blue-50/10' : ''}
              `}
                                onClick={() => {
                                    setCurrentDate(date);
                                    navigate('/daily');
                                }}
                            >
                                <div className="text-center py-3 border-b border-paper-200/50 bg-paper-50/50 relative">
                                    {/* 오늘 표시 뱃지 */}
                                    {isToday(date) && <div className="absolute top-0 inset-x-0 h-1 bg-accent-blue"></div>}

                                    <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${isHoliday ? 'text-accent-red' : 'text-ink-400'}`}>
                                        {format(date, 'EEEE')}
                                    </p>
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <div className="flex items-center justify-center gap-1">
                                            {!isSameMonth(date, weekStart) && !isHoliday && (
                                                <span className="text-xs font-bold text-ink-400">{format(date, 'M')}.</span>
                                            )}
                                            <span className={`text-2xl font-serif font-black ${isToday(date) ? 'text-accent-blue' : isHoliday ? 'text-accent-red' : 'text-ink-900'}`}>
                                                {format(date, 'd')}
                                            </span>
                                        </div>
                                        {holidayName && (
                                            <span className="text-[9px] text-accent-red font-bold leading-tight px-1 text-center truncate w-full">
                                                {holidayName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col p-3 pt-4 space-y-3 bg-transparent relative">
                                    {todos.filter(t => t.date === format(date, 'yyyy-MM-dd')).map((todo) => (
                                        <div key={todo.id} className="relative z-10 flex items-start gap-1.5">
                                            <div className={`mt-1 min-w-[4px] h-[4px] rounded-full ${todo.isCompleted ? 'bg-ink-300' : 'bg-accent-blue'}`}></div>
                                            <span className={`text-xs font-medium leading-tight line-clamp-2 ${todo.isCompleted ? 'line-through text-ink-300' : 'text-ink-700'}`}>
                                                {todo.text}
                                            </span>
                                        </div>
                                    ))}

                                    {/* 남은 공간 채우기 선 장식 */}
                                    <div className="absolute inset-x-3 inset-y-0 pt-4 pointer-events-none flex flex-col space-y-5 opacity-40">
                                        {Array.from({ length: 8 }).map((_, lineIdx) => (
                                            <div key={lineIdx} className="w-full border-b border-paper-200/70 group-hover:border-paper-300 transition-colors"></div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-center text-accent-blue">
                                        <CalendarDays size={14} />
                                        <span className="text-xs font-bold">상세 보기</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
