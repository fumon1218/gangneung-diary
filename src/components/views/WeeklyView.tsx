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
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { getKoreanHoliday } from '../../utils/holidays';
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
    const { currentDate, setCurrentDate, todos, weeklyViewMode, setWeeklyViewMode } = useStore();
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
                    {/* 뷰 모드 전환 토글 */}
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

                                {/* 하단 메인 바디 (투두 리스트 렌더링 + 판서 캔버스 중첩) */}
                                <div className="flex-1 relative flex flex-col p-3 pt-4 space-y-3 bg-transparent">

                                    {/* 1. 배경 선 장식 (최하단) */}
                                    <div className="absolute inset-x-3 inset-y-0 pt-4 pointer-events-none flex flex-col space-y-7 opacity-40">
                                        {Array.from({ length: 12 }).map((_, lineIdx) => (
                                            <div key={lineIdx} className="w-full border-b border-paper-200/70"></div>
                                        ))}
                                    </div>

                                    {/* 2. 저장된 투두 리스트 렌더링 (그 위) */}
                                    <div className="relative z-0 pointer-events-none">
                                        {todos.filter(t => t.date === format(date, 'yyyy-MM-dd')).map((todo) => (
                                            <div key={todo.id} className="flex items-start gap-1.5 mb-2">
                                                <div className={`mt-1 min-w-[4px] h-[4px] rounded-full ${todo.isCompleted ? 'bg-ink-300' : 'bg-accent-blue'}`}></div>
                                                <span className={`text-xs font-medium leading-tight line-clamp-2 ${todo.isCompleted ? 'line-through text-ink-300' : 'text-ink-700'}`}>
                                                    {todo.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 3. 투명 판서 캔버스 컴포넌트 (최상단, 터치/드래그 전담) */}
                                    <div className="absolute inset-0 z-10 w-full h-full">
                                        {/* CSS 캔버스 해상도 고정 트릭 (예: 140x500 픽셀 기준) 
                                            실제 컨테이너 크기에 맞춰 width/height는 Canvas 내부로 전달됨 */}
                                        <DrawingCanvas dateStr={format(date, 'yyyy-MM-dd')} width={weeklyViewMode === 'mobile' ? 600 : 200} height={700} />
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
