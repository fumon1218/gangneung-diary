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
import { ChevronLeft, ChevronRight, Maximize2, Pen, MousePointer2 } from 'lucide-react';
import { getKoreanHoliday } from '../../utils/holidays';
import { useState } from 'react';
import { DrawingCanvas } from '../common/DrawingCanvas';

const WideTabletIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="3" ry="3" />
        <line x1="12" x2="12.01" y1="16" y2="16" strokeWidth="3.5" />
    </svg>
);

const NarrowPhoneIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="3" ry="3" />
        <line x1="12" x2="12.01" y1="18" y2="18" strokeWidth="3.5" />
    </svg>
);

export const WeeklyView = () => {
    const { currentDate, setCurrentDate, todos, weeklyViewMode, setWeeklyViewMode, weatherCache } = useStore();
    const navigate = useNavigate();

    const [isDrawingMode, setIsDrawingMode] = useState(false);

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);

    // 일주일치 날짜 배열 생성
    const weekDays: Date[] = [];
    let day = weekStart;
    for (let i = 0; i < 7; i++) {
        weekDays.push(day);
        day = addDays(day, 1);
    }

    // --- 주간 스패닝(Spanning) 이벤트 슬롯 배분 (종일 일정만) ---
    const allDayEvents = todos.filter(t => {
        const start = t.date;
        const end = t.endDate || t.date;
        return !t.startTime && start <= format(weekEnd, 'yyyy-MM-dd') && end >= format(weekStart, 'yyyy-MM-dd');
    });

    const timeEvents = todos.filter(t => {
        const start = t.date;
        const end = t.endDate || t.date;
        return !!t.startTime && start <= format(weekEnd, 'yyyy-MM-dd') && end >= format(weekStart, 'yyyy-MM-dd');
    });

    allDayEvents.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        const aLen = (new Date(a.endDate || a.date).getTime() - new Date(a.date).getTime());
        const bLen = (new Date(b.endDate || b.date).getTime() - new Date(b.date).getTime());
        return bLen - aLen;
    });

    const weekSlots: Record<string, (typeof todos[0] | null)[]> = {};
    for (let i = 0; i < 7; i++) {
        const dStr = format(addDays(weekStart, i), 'yyyy-MM-dd');
        weekSlots[dStr] = []; // 가변 길이 슬롯 배열 (크게 제한 안 둠)
    }

    allDayEvents.forEach(evt => {
        const evtStart = evt.date;
        const evtEnd = evt.endDate || evt.date;

        const coveredDays: string[] = [];
        for (let i = 0; i < 7; i++) {
            const dateStr = format(addDays(weekStart, i), 'yyyy-MM-dd');
            if (dateStr >= evtStart && dateStr <= evtEnd) {
                coveredDays.push(dateStr);
            }
        }

        // 빈 슬롯 찾기
        let assignedSlot = 0;
        while (true) {
            let isFree = true;
            for (const dStr of coveredDays) {
                if (weekSlots[dStr][assignedSlot] !== undefined && weekSlots[dStr][assignedSlot] !== null) {
                    isFree = false;
                    break;
                }
            }
            if (isFree) {
                break;
            }
            assignedSlot++;
        }

        // 슬롯 할당
        for (const dStr of coveredDays) {
            while (weekSlots[dStr].length <= assignedSlot) {
                weekSlots[dStr].push(null);
            }
            weekSlots[dStr][assignedSlot] = evt;
        }
    });

    // 주간 활성 슬롯의 최대 개수 계산 (격자 정렬을 위한 높이 확보)
    let maxSlots = 0;
    for (let i = 0; i < 7; i++) {
        const dStr = format(addDays(weekStart, i), 'yyyy-MM-dd');
        const daySlots = weekSlots[dStr] || [];
        const lastValidIdx = daySlots.reduce((acc, curr, idx) => curr !== null ? idx : acc, -1);
        if (lastValidIdx + 1 > maxSlots) maxSlots = lastValidIdx + 1;
    }
    // 기본적으로 최소 1줄 이상의 여백 유지
    const allDaySectionHeight = Math.max(1, maxSlots) * (weeklyViewMode === 'mobile' ? 34 : 26) + 16;
    // --- 슬롯 배분 끝 ---

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
                    {/* 판서/스크롤 모드 전환 토글 (신규 추가) */}
                    <div className="flex bg-paper-100 p-0.5 rounded-md border border-paper-200 mr-1 xl:mr-2">
                        <button
                            onClick={() => setIsDrawingMode(false)}
                            className={`p-1 rounded transition-colors ${!isDrawingMode ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                            title="일반(스크롤) 모드"
                        >
                            <MousePointer2 size={16} />
                        </button>
                        <button
                            onClick={() => setIsDrawingMode(true)}
                            className={`p-1 rounded transition-colors ${isDrawingMode ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                            title="펜 그리기 모드"
                        >
                            <Pen size={16} />
                        </button>
                    </div>

                    {/* 뷰 모드 전환 토글 (태블릿/모바일) */}
                    <div className="flex bg-paper-100 p-1 rounded-full border border-paper-200 mr-2">
                        <button
                            onClick={() => setWeeklyViewMode('tablet')}
                            className={`p-1.5 rounded-full transition-colors ${weeklyViewMode === 'tablet' ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                            title="태블릿 모드 (가로 7일 나열)"
                        >
                            <WideTabletIcon size={18} />
                        </button>
                        <button
                            onClick={() => setWeeklyViewMode('mobile')}
                            className={`p-1.5 rounded-full transition-colors ${weeklyViewMode === 'mobile' ? 'bg-white shadow-sm text-accent-blue' : 'text-ink-400 hover:text-ink-600'}`}
                            title="모바일 모드 (세로 1줄 나열)"
                        >
                            <NarrowPhoneIcon size={18} />
                        </button>
                    </div>

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

            {/* 확장 가능한 주간 그리드 영역 (세로 스크롤 지원) */}
            <div className={`flex-1 flex gap-4 h-full min-h-0 bg-white border border-paper-200 rounded-2xl p-4 md:p-6 shadow-sm overflow-y-auto custom-scrollbar ${weeklyViewMode === 'mobile' ? 'flex-col' : ''}`}>

                {/* 요일별 컬럼 (태블릿: 7개 가로 나열, 모바일: 세로 한 줄 나열) */}
                <div className={`w-full ${weeklyViewMode === 'tablet' ? 'grid grid-cols-7 gap-3 md:gap-4 overflow-x-auto min-h-[600px]' : 'flex flex-col gap-6'}`}>
                    {weekDays.map((date) => {
                        const { isHoliday, name: holidayName } = getKoreanHoliday(date);

                        return (
                            <div
                                key={date.toString()}
                                className={`flex flex-col border border-paper-200/50 rounded-xl overflow-hidden bg-white
                ${weeklyViewMode === 'tablet' ? 'min-w-[140px]' : 'w-full min-h-[500px] shadow-sm'}
                ${isToday(date) ? 'ring-2 ring-accent-blue/30 border-transparent bg-blue-50/10' : ''}
              `}
                            >
                                {/* 상단 날짜 헤더 (이 영역을 클릭해야 일간 뷰로 이동함) */}
                                <div
                                    className="text-center py-3 border-b border-paper-200/50 bg-paper-50/50 relative cursor-pointer hover:bg-paper-100 transition-colors group/header"
                                    onClick={() => {
                                        setCurrentDate(date);
                                        navigate('/daily');
                                    }}
                                    title="일간 뷰 (상세 보기)로 이동"
                                >
                                    {/* 상세 보기 아이콘 오버레이 */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 transition-opacity text-ink-400">
                                        <Maximize2 size={12} />
                                    </div>

                                    {/* 오늘 표시 뱃지 */}
                                    {isToday(date) && <div className="absolute top-0 inset-x-0 h-1 bg-accent-blue"></div>}

                                    <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${isHoliday ? 'text-accent-red' : 'text-ink-400'}`}>
                                        {format(date, 'EEEE')}
                                    </p>
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <div className="flex items-center justify-center gap-1 relative">
                                            {!isSameMonth(date, weekStart) && !isHoliday && (
                                                <span className="text-xs font-bold text-ink-400">{format(date, 'M')}.</span>
                                            )}
                                            <span className={`text-2xl font-serif font-black ${isToday(date) ? 'text-accent-blue' : isHoliday ? 'text-accent-red' : 'text-ink-900'}`}>
                                                {format(date, 'd')}
                                                {weatherCache[format(date, 'yyyy-MM-dd')] && (
                                                    <span className="absolute -right-5 top-0 text-[13px] opacity-90 drop-shadow-sm pointer-events-none">
                                                        {weatherCache[format(date, 'yyyy-MM-dd')]}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {holidayName && (
                                            <span className="text-[9px] text-accent-red font-bold leading-tight px-1 text-center truncate w-full">
                                                {holidayName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 하단 메인 바디 (투두 리스트 렌더링 + 판서 캔버스 중첩) */}
                                <div className="flex-1 relative flex flex-col py-0 pr-3 pl-8 bg-transparent">

                                    {/* 1. 종일(All-day) 투두 리스트 렌더링 (고정 높이 할당 영역) */}
                                    <div
                                        className="relative z-10 w-full pointer-events-none pr-1 pt-3 pb-2 border-b border-paper-300 border-dashed shrink-0"
                                        style={{ height: `${allDaySectionHeight}px` }}
                                    >
                                        {/* 할당된 슬롯 배열에서 유효한 끝 슬롯까지만 순회 */}
                                        {(() => {
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const daySlots = weekSlots[dateStr] || [];
                                            const lastValidIdx = daySlots.reduce((acc, curr, idx) => curr !== null ? idx : acc, -1);
                                            const visibleSlots = daySlots.slice(0, lastValidIdx + 1);

                                            return visibleSlots.map((slotEvt, idx) => {
                                                if (!slotEvt) {
                                                    // 빈 슬롯은 높이만 차지
                                                    return <div key={`empty-${idx}`} className={`${weeklyViewMode === 'mobile' ? 'h-[24px]' : 'h-[20px]'} w-full`}></div>;
                                                }

                                                const isMultiDay = slotEvt.date !== (slotEvt.endDate || slotEvt.date);
                                                const isStart = slotEvt.date === dateStr;
                                                const isEnd = (slotEvt.endDate || slotEvt.date) === dateStr;

                                                // 주(Week)의 첫날/마지막날 판별 (현재 칸이 date와 일치하는 인덱스를 찾음)
                                                // 여기서는 map의 index를 i로 넘기지 못했으므로 다시 찾음
                                                const dayIndexInWeek = weekDays.findIndex(wd => format(wd, 'yyyy-MM-dd') === dateStr);
                                                const isWeekStart = dayIndexInWeek === 0;

                                                // ① 단일 일정일 경우 (기존 점 모양)
                                                if (!isMultiDay) {
                                                    return (
                                                        <div key={slotEvt.id} className={`flex items-start ${weeklyViewMode === 'mobile' ? 'gap-2 mb-2.5 h-[24px]' : 'gap-1.5 mb-1.5 h-[20px]'}`}>
                                                            <div className={`shrink-0 flex-none rounded-full ${weeklyViewMode === 'mobile' ? 'mt-1.5 w-1.5 h-1.5' : 'mt-1 w-1 h-1'} ${slotEvt.isCompleted ? 'bg-ink-300' : 'bg-accent-blue'}`}></div>
                                                            <span className={`font-medium break-words leading-snug ${weeklyViewMode === 'mobile' ? 'text-[14px] whitespace-pre-wrap' : 'text-xs line-clamp-3'} ${slotEvt.isCompleted ? 'line-through text-ink-300' : 'text-ink-700'}`}>
                                                                {slotEvt.text}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                // ② 다중 일정일 경우 (띠 모양 Band)
                                                let marginLeft = '-ml-8';
                                                let marginRight = '-mr-3'; // pr-3 돌파
                                                let paddingLeft = 'pl-3';
                                                let paddingRight = 'pr-3';
                                                let roundedClass = '';

                                                // 띠 앞부분 모서리 처리
                                                if (isStart || (weeklyViewMode === 'mobile')) {
                                                    marginLeft = 'ml-0';
                                                    paddingLeft = 'pl-2';
                                                    roundedClass += ' rounded-l-md';
                                                } else {
                                                    roundedClass += ' rounded-l-none border-l border-white/20';
                                                }

                                                // 띠 뒷부분 모서리 처리
                                                if (isEnd || (weeklyViewMode === 'mobile')) {
                                                    marginRight = 'mr-0';
                                                    paddingRight = 'pr-2';
                                                    roundedClass += ' rounded-r-md';
                                                } else {
                                                    roundedClass += ' rounded-r-none border-r border-white/20';
                                                }

                                                // 텍스트 표출 조건: 일정 시작일, 또는 주의 시작일, 또는 뷰 모드가 모바일(1칸씩 나열)인 경우 모두 표출
                                                const showText = isStart || isWeekStart || weeklyViewMode === 'mobile';

                                                return (
                                                    <div
                                                        key={slotEvt.id}
                                                        className={`flex items-center ${marginLeft} ${marginRight} ${paddingLeft} ${paddingRight} ${roundedClass} ${weeklyViewMode === 'mobile' ? 'min-h-[24px] mb-2' : 'h-[20px] mb-1'}`}
                                                        style={{ backgroundColor: slotEvt.color || '#A7C7E7', opacity: slotEvt.isCompleted ? 0.6 : 1 }}
                                                    >
                                                        {showText && (
                                                            <span className={`font-bold text-ink-800 break-words leading-snug ${weeklyViewMode === 'mobile' ? 'text-[14px] whitespace-pre-wrap py-1' : 'text-[11px] truncate'} ${slotEvt.isCompleted ? 'line-through opacity-70' : ''}`}>
                                                                {slotEvt.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* 2+3. 타임라인 하단 구역 (격자 장식 및 지정 시간 블록) */}
                                    <div className="relative flex-1 w-full min-h-[600px] mt-2 mb-2">
                                        {/* 1시간 단위 격자 장식 */}
                                        <div className="absolute inset-0 pointer-events-none flex flex-col opacity-60">
                                            {Array.from({ length: 24 }).map((_, lineIdx) => (
                                                <div key={lineIdx} className="w-full flex-1 border-t border-paper-200/80 relative">
                                                    <span className="absolute -top-[7px] left-1 text-[8px] font-semibold text-ink-300/80 bg-white/90 px-1 rounded-sm">
                                                        {String(lineIdx).padStart(2, '0')}:00
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 시간대 지정(Time-based) 투두 리스트 렌더링 */}
                                        <div className="absolute inset-x-0 inset-y-0 right-3 pointer-events-none">
                                            {timeEvents.filter(t => {
                                                const sDate = t.date;
                                                const eDate = t.endDate || t.date;
                                                const targetDate = format(date, 'yyyy-MM-dd');
                                                return sDate <= targetDate && eDate >= targetDate;
                                            }).map(evt => {
                                                const [startH, startM] = evt.startTime!.split(':').map(Number);
                                                // 종료 시간이 없으면 기본 1시간 차지로 간주
                                                let endH = startH + 1;
                                                let endM = startM;
                                                if (evt.endTime) {
                                                    [endH, endM] = evt.endTime.split(':').map(Number);
                                                }

                                                const startFraction = startH + startM / 60;
                                                const endFraction = endH + endM / 60;
                                                const duration = Math.max(0.25, endFraction - startFraction); // 최소 15분 크기 보장

                                                // 전체 24시간 중 절대 위치 퍼센티지 계산
                                                const topPct = (startFraction / 24) * 100;
                                                const heightPct = (duration / 24) * 100;

                                                return (
                                                    <div
                                                        key={evt.id}
                                                        className="absolute left-8 right-1 px-2.5 py-1.5 flex flex-col items-start justify-start overflow-hidden rounded-lg border-l-[3px] border-white/60 shadow-md pointer-events-auto transition-all hover:z-20 hover:shadow-lg hover:-translate-y-0.5"
                                                        style={{
                                                            top: `${topPct}%`,
                                                            height: `${heightPct}%`,
                                                            backgroundColor: evt.color || '#A7C7E7',
                                                            opacity: evt.isCompleted ? 0.5 : 0.95,
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <span className={`text-[12px] font-extrabold text-[#111111] break-words leading-tight ${evt.isCompleted ? 'line-through opacity-70 text-ink-400' : ''}`}>
                                                            {evt.text}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* 4. 투명 판서 캔버스 컴포넌트 (최상단, 터치/드래그 제어) */}
                                        <div className={`absolute inset-0 z-10 w-full h-full ${!isDrawingMode ? 'pointer-events-none' : ''}`}>
                                            {/* CSS 캔버스 해상도 고정 트릭 (예: 140x500 픽셀 기준) 
                                            실제 컨테이너 크기에 맞춰 width/height는 Canvas 내부로 전달됨 */}
                                            <DrawingCanvas dateStr={format(date, 'yyyy-MM-dd')} width={weeklyViewMode === 'mobile' ? 600 : 200} height={700} />
                                        </div>

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
