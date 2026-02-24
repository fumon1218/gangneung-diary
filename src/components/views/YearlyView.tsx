import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
    format,
    addYears,
    subYears,
    startOfYear,
    eachMonthOfInterval,
    endOfYear,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const YearlyView = () => {
    const { currentDate, setCurrentDate } = useStore();
    const navigate = useNavigate();

    const handlePrevYear = () => setCurrentDate(subYears(currentDate, 1));
    const handleNextYear = () => setCurrentDate(addYears(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);

    // 1월부터 12월까지의 시작일 배열
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // 특정 달의 미니 달력 그리드를 렌더링하는 헬퍼 함수
    const renderMiniCalendar = (monthStart: Date) => {
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentDate(cloneDay);
                            navigate('/daily'); // 일간 뷰로 바로가기
                        }}
                        className={`text-center py-1 text-[11px] font-medium cursor-pointer rounded-sm transition-colors
              ${!isCurrentMonth ? 'text-paper-300 opacity-50' : i === 0 ? 'text-accent-red font-bold' : 'text-ink-700 hover:bg-paper-100'}
              ${isToday(day) ? 'bg-accent-blue/10 text-accent-blue font-bold ring-1 ring-accent-blue/50' : ''}
            `}
                    >
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div className="flex flex-col h-full bg-white border border-paper-200/70 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:border-paper-300 cursor-pointer group"
                onClick={() => {
                    setCurrentDate(monthStart);
                    navigate('/');
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-xl text-ink-900 group-hover:text-accent-blue transition-colors">
                        {format(monthStart, 'M')} <span className="text-sm font-sans font-medium text-ink-400 ml-1">{format(monthStart, 'MMMM')}</span>
                    </h3>
                </div>

                <div className="grid grid-cols-7 mb-1 pb-1 border-b border-paper-100">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                        <div key={idx} className={`text-center text-[9px] font-bold ${idx === 0 ? 'text-accent-red' : 'text-ink-400'}`}>
                            {dayName}
                        </div>
                    ))}
                </div>

                <div className="flex-1">
                    {rows}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col pt-2">

            {/* 연간 뷰 헤더 */}
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-4xl font-extrabold text-ink-900 font-serif tracking-widest flex items-baseline gap-4">
                    {format(currentDate, "yyyy")}
                    <span className="text-base font-medium text-ink-400 tracking-normal font-sans">연간 캘린더</span>
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevYear} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleToday} className="px-4 py-1.5 text-sm font-bold bg-paper-100 hover:bg-paper-200 text-ink-700 rounded-full transition-colors">
                        This Year
                    </button>
                    <button onClick={handleNextYear} className="p-2 hover:bg-paper-100 rounded-full text-ink-500 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* 12개월 타일 그리드 */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 overflow-y-auto custom-scrollbar pb-6 px-1">
                {months.map(month => (
                    <div key={month.toString()}>
                        {renderMiniCalendar(month)}
                    </div>
                ))}
            </div>

        </div>
    );
};
