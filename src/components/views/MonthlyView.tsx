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
    addDays,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Pen, Type } from 'lucide-react';
import { getKoreanHoliday } from '../../utils/holidays';
import { useState } from 'react';
import { DrawingCanvas } from '../common/DrawingCanvas';

export const MonthlyView = () => {
    const { currentDate, setCurrentDate, todos, monthlyNotes, setMonthlyNote } = useStore();
    const navigate = useNavigate();

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const [isTextMode, setIsTextMode] = useState(true);
    const monthKey = format(currentDate, 'yyyy-MM');
    const currentNoteObj = monthlyNotes?.[monthKey] || '';

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
            const { isHoliday, name: holidayName } = getKoreanHoliday(day);

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
                        <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${isToday(day) ? 'bg-accent-blue text-white w-6 h-6 rounded-full flex items-center justify-center' : ''} ${isHoliday ? 'text-accent-red' : ''}`}>
                                {formattedDate}
                            </span>
                            {holidayName && (
                                <span className={`text-[9px] mt-0.5 font-bold ${!isSameMonth(day, monthStart) ? 'text-accent-red/50' : 'text-accent-red'}`}>
                                    {holidayName}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* 일정/투두 목록 표시 */}
                    <div className="mt-2 flex flex-col gap-1 w-full overflow-hidden">
                        {todos
                            .filter(t => t.date === format(cloneDay, 'yyyy-MM-dd'))
                            .slice(0, 3) // 월간 뷰에서는 최대 3개만 표시
                            .map(todo => (
                                <div key={todo.id} className="flex items-center gap-1.5 px-0.5 w-full">
                                    <div className={`w-1 h-1 rounded-full shrink-0 ${todo.isCompleted ? 'bg-ink-300' : 'bg-accent-blue'}`}></div>
                                    <span className={`text-[10px] font-medium truncate w-full ${todo.isCompleted ? 'line-through text-ink-300' : 'text-ink-600'}`}>
                                        {todo.text}
                                    </span>
                                </div>
                            ))
                        }
                        {todos.filter(t => t.date === format(cloneDay, 'yyyy-MM-dd')).length > 3 && (
                            <div className="text-[9px] text-ink-400 font-bold pl-2.5">
                                +{todos.filter(t => t.date === format(cloneDay, 'yyyy-MM-dd')).length - 3} more
                            </div>
                        )}
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

                {/* 아날로그 다이어리처럼 좌측 자유 메모/주간 목표 라인 + 펜 판서 영역 */}
                <div className="hidden lg:flex w-52 border border-paper-200 rounded-xl bg-white p-4 flex-col shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-20 bg-white/50 backdrop-blur-sm rounded-lg px-2">
                        <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider">Monthly Notes</h3>
                        <div className="flex bg-paper-100 p-0.5 rounded-md border border-paper-200">
                            <button
                                onClick={() => setIsTextMode(true)}
                                className={`p-1 rounded transition-colors ${isTextMode ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                                title="텍스트 입력 모드"
                            >
                                <Type size={14} />
                            </button>
                            <button
                                onClick={() => setIsTextMode(false)}
                                className={`p-1 rounded transition-colors ${!isTextMode ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                                title="펜 그리기 모드"
                            >
                                <Pen size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col pt-2 relative">
                        {/* 1. 배경 줄무늬 */}
                        <div className="absolute inset-0 z-0 pointer-events-none w-full">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="diary-line w-full h-[2rem]"></div>
                            ))}
                        </div>

                        {/* 2. 텍스트 입력 레이어 */}
                        <textarea
                            value={currentNoteObj}
                            onChange={(e) => setMonthlyNote(monthKey, e.target.value)}
                            className={`absolute inset-0 z-10 w-full h-full bg-transparent resize-none outline-none text-ink-700 text-sm font-medium leading-[2rem] px-2 py-0 custom-scrollbar ${!isTextMode ? 'pointer-events-none' : ''}`}
                            placeholder={isTextMode ? "메모를 남겨보세요..." : ""}
                            style={{
                                lineHeight: '2rem',
                                backgroundAttachment: 'local'
                            }}
                        />

                        {/* 3. 펜 그리기 레이어 */}
                        <div className={`absolute inset-0 z-10 w-full h-full ${isTextMode ? 'pointer-events-none' : ''}`}>
                            {/* width: 200 정도로 임의 추산, 높이는 부모에 맞춰지도록 내부에서 100% 처리, 해상도는 200x600 부여 */}
                            <DrawingCanvas dateStr={`${monthKey}-note`} width={200} height={600} />
                        </div>
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
