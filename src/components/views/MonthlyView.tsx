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
    const { currentDate, setCurrentDate, todos, weatherCache, monthlyNotes, setMonthlyNote } = useStore();
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
        const weekStartDay = day;
        const weekEndDay = addDays(weekStartDay, 6);

        // 1. 이번 주에 걸치는 모든 일정 수집
        const weekEvents = todos.filter(t => {
            const start = t.date;
            const end = t.endDate || t.date;
            return start <= format(weekEndDay, 'yyyy-MM-dd') && end >= format(weekStartDay, 'yyyy-MM-dd');
        });

        // 2. 먼저 시작하고, 더 길게 지속되는 순으로 정렬 (레이아웃 안정성)
        weekEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            const aLen = (new Date(a.endDate || a.date).getTime() - new Date(a.date).getTime());
            const bLen = (new Date(b.endDate || b.date).getTime() - new Date(b.date).getTime());
            return bLen - aLen;
        });

        // 3. 요일별(7일) 슬롯 할당 (하루 최대 3칸의 슬롯)
        const weekSlots: Record<string, (typeof todos[0] | null)[]> = {};
        const extraCount: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const dStr = format(addDays(weekStartDay, i), 'yyyy-MM-dd');
            weekSlots[dStr] = [null, null, null];
            extraCount[dStr] = 0;
        }

        weekEvents.forEach(evt => {
            const evtStart = evt.date;
            const evtEnd = evt.endDate || evt.date;

            // 해당 이벤트가 이번 주에서 차지하는 날짜 배열
            const coveredDays: string[] = [];
            for (let i = 0; i < 7; i++) {
                const dateStr = format(addDays(weekStartDay, i), 'yyyy-MM-dd');
                if (dateStr >= evtStart && dateStr <= evtEnd) {
                    coveredDays.push(dateStr);
                }
            }

            // 겹치지 않는 빈 슬롯 찾기
            let assignedSlot = -1;
            for (let s = 0; s < 3; s++) {
                let isFree = true;
                for (const dStr of coveredDays) {
                    if (weekSlots[dStr][s] !== null) {
                        isFree = false;
                        break;
                    }
                }
                if (isFree) {
                    assignedSlot = s;
                    break;
                }
            }

            // 빈 슬롯이 있으면 삽입, 없으면 extra(더보기) 카운트 증가
            if (assignedSlot !== -1) {
                for (const dStr of coveredDays) {
                    weekSlots[dStr][assignedSlot] = evt;
                }
            } else {
                for (const dStr of coveredDays) {
                    extraCount[dStr]++;
                }
            }
        });

        // 4. 셀 렌더링
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;
            const dateStr = format(cloneDay, 'yyyy-MM-dd');
            const { isHoliday, name: holidayName } = getKoreanHoliday(day);

            const daySlots = weekSlots[dateStr];
            const extras = extraCount[dateStr];

            // 불필요한 빈 슬롯 공백을 그리지 않기 위해 마지막으로 유효한 슬롯 번호 계산
            const lastValidIdx = daySlots.reduce((acc, curr, idx) => curr !== null ? idx : acc, -1);
            const visibleSlots = daySlots.slice(0, lastValidIdx + 1);

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => {
                        setCurrentDate(cloneDay);
                        navigate('/daily');
                    }}
                    className={`border-r border-b border-paper-200 p-2 min-h-[120px] cursor-pointer transition-colors relative group overflow-hidden
            ${!isSameMonth(day, monthStart) ? 'bg-paper-50/50 text-ink-400 opacity-60' : 'bg-white text-ink-700 hover:bg-paper-50'}
          `}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className={`text-sm font-semibold shrink-0 ${isToday(day) ? 'bg-accent-blue text-white w-6 h-6 rounded-full flex items-center justify-center' : ''} ${isHoliday ? 'text-accent-red' : ''}`}>
                                    {formattedDate}
                                </span>
                                {weatherCache[dateStr] && <span className="text-[12px] opacity-90 pb-0.5">{weatherCache[dateStr]}</span>}
                            </div>
                            {holidayName && (
                                <span className={`text-[9px] mt-0.5 font-bold line-clamp-1 break-all pr-1 ${!isSameMonth(day, monthStart) ? 'text-accent-red/50' : 'text-accent-red'}`}>
                                    {holidayName}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 일정/투두 목록 (연속 띠 렌더링 결합) */}
                    <div className="mt-2 flex flex-col gap-1 w-full">
                        {visibleSlots.map((slotEvt, idx) => {
                            if (!slotEvt) {
                                // 빈 슬롯 플레이스홀더
                                return <div key={`empty-${idx}`} className="h-[18px]"></div>;
                            }

                            const isMultiDay = slotEvt.date !== (slotEvt.endDate || slotEvt.date);
                            const isStart = slotEvt.date === dateStr;
                            const isEnd = (slotEvt.endDate || slotEvt.date) === dateStr;
                            const isWeekStart = i === 0;

                            // 단일 일정 (점 모양)
                            if (!isMultiDay) {
                                return (
                                    <div key={slotEvt.id} className="flex items-center gap-1.5 px-0.5 w-full h-[18px]">
                                        <div className={`w-1 h-1 rounded-full shrink-0 ${slotEvt.isCompleted ? 'bg-ink-300' : 'bg-accent-blue'}`}></div>
                                        <span className={`text-[10px] font-medium truncate w-full ${slotEvt.isCompleted ? 'line-through text-ink-300' : 'text-ink-600'}`}>
                                            {slotEvt.text}
                                        </span>
                                    </div>
                                );
                            }

                            // 다중 일정 (가로 띠 모양)
                            let marginLeft = '-ml-2';
                            let marginRight = '-mr-2';
                            let paddingLeft = 'pl-2';
                            let paddingRight = 'pr-2';
                            let roundedClass = '';

                            if (isStart) {
                                marginLeft = 'ml-0';
                                paddingLeft = 'pl-1.5';
                                roundedClass += ' rounded-l-md';
                            } else {
                                roundedClass += ' rounded-l-none border-l border-white/20'; // 잘린 느낌의 아주 미세한 경계선
                            }

                            if (isEnd) {
                                marginRight = 'mr-0';
                                paddingRight = 'pr-1.5';
                                roundedClass += ' rounded-r-md';
                            } else {
                                roundedClass += ' rounded-r-none border-r border-white/20';
                            }

                            // 텍스트는 일정의 시작점이거나, 해당 주차의 첫 날인 경우에만 출력 (중복 방지)
                            const showText = isStart || isWeekStart;

                            return (
                                <div
                                    key={slotEvt.id}
                                    className={`h-[18px] flex items-center ${marginLeft} ${marginRight} ${paddingLeft} ${paddingRight} ${roundedClass}`}
                                    style={{ backgroundColor: slotEvt.color || '#A7C7E7', opacity: slotEvt.isCompleted ? 0.6 : 1 }}
                                >
                                    {showText && (
                                        <span className={`text-[10px] font-bold text-ink-800 truncate ${slotEvt.isCompleted ? 'line-through opacity-70' : ''}`}>
                                            {slotEvt.text}
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        {extras > 0 && (
                            <div className="text-[9px] text-ink-400 font-bold pl-1 pt-0.5">
                                +{extras} more
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

            <div className="flex-1 flex flex-col xl:flex-row gap-4 h-full min-h-0 overflow-y-auto custom-scrollbar xl:overflow-hidden pb-4 xl:pb-0">

                {/* 아날로그 다이어리처럼 좌측 자유 메모/주간 목표 라인 + 펜 판서 영역 */}
                <div className="flex w-full xl:w-64 border border-paper-200 rounded-xl bg-white p-4 flex-col shadow-sm relative overflow-hidden shrink-0 min-h-[400px] xl:min-h-0">
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
                <div className="flex-1 border border-paper-200 rounded-xl bg-white flex flex-col shadow-sm overflow-hidden min-h-[500px]">
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
