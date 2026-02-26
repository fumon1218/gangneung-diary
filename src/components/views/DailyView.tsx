import { useState } from 'react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { Check, Plus, Trash2, CalendarDays, ChevronLeft, ChevronRight, CalendarCheck, Palette, Edit2, Clock } from 'lucide-react';
import { getKoreanHoliday } from '../../utils/holidays';

const PASTEL_COLORS = [
    { value: '#A7C7E7', name: '스카이블루' },
    { value: '#F4C2C2', name: '연핑크' },
    { value: '#B2EBF2', name: '민트그린' },
    { value: '#E6E6FA', name: '라일락' },
    { value: '#FFFACD', name: '레몬옐로우' },
];

/**
 * iOS Safari 등에서 <input type="time">의 비표준 동작(오전/오후 강제 한글 맵핑, value 붕괴 등)을
 * 원천 회피하기 위해 제작된 커스텀 시간 선택기입니다.
 */
const TimeSelector = ({ value, onChange, onEnter }: { value: string, onChange: (val: string) => void, onEnter?: () => void }) => {
    // value는 "14:30" 형태
    const [h, m] = value ? value.split(':') : ['', ''];

    const handleHour = (newH: string) => {
        if (!newH && !m) onChange('');
        else onChange(`${newH || '00'}:${m || '00'}`);
    };

    const handleMin = (newM: string) => {
        if (!h && !newM) onChange('');
        else onChange(`${h || '00'}:${newM || '00'}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
        }
    };

    return (
        <div className="flex items-center gap-0.5 bg-paper-100 rounded-md border border-paper-300 px-1 py-0.5" onKeyDown={handleKeyDown}>
            <Clock size={12} className="text-ink-400 ml-1" />
            <select
                value={h}
                onChange={(e) => handleHour(e.target.value)}
                className="bg-transparent text-xs font-bold text-ink-700 outline-none cursor-pointer appearance-none pl-1"
            >
                <option value="">--시</option>
                {Array.from({ length: 24 }).map((_, i) => {
                    const val = String(i).padStart(2, '0');
                    return <option key={`h-${val}`} value={val}>{val}시</option>;
                })}
            </select>
            <span className="text-ink-400 font-bold">:</span>
            <select
                value={m}
                onChange={(e) => handleMin(e.target.value)}
                className="bg-transparent text-xs font-bold text-ink-700 outline-none cursor-pointer appearance-none pl-1 pr-1"
            >
                <option value="">--분</option>
                {Array.from({ length: 12 }).map((_, i) => {
                    const val = String(i * 5).padStart(2, '0'); // 5분 단위
                    return <option key={`m-${val}`} value={val}>{val}분</option>;
                })}
            </select>
        </div>
    );
};

export const DailyView = () => {
    const { currentDate, setCurrentDate, todos, addTodo, toggleTodo, deleteTodo, updateTodo, weatherCache } = useStore();
    const navigate = useNavigate();
    const [newTodo, setNewTodo] = useState('');
    const [newEndDate, setNewEndDate] = useState<Date | null>(null);
    const [newColor, setNewColor] = useState(PASTEL_COLORS[0].value);
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');

    // 인라인 수정 모드 상태
    const [editTodoId, setEditTodoId] = useState<string | null>(null);
    const [editTodoText, setEditTodoText] = useState('');
    const [editEndDate, setEditEndDate] = useState<Date | null>(null);
    const [editColor, setEditColor] = useState(PASTEL_COLORS[0].value);
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');

    // 날짜가 넘어가면 종료일 초기화를 위해 렌더 트리거용 state
    const effectiveEndDate = newEndDate && newEndDate >= currentDate ? newEndDate : currentDate;

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dailyTodos = todos.filter(t => t.date === dateStr);
    const { isHoliday, name: holidayName } = getKoreanHoliday(currentDate);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        const endStr = format(effectiveEndDate, 'yyyy-MM-dd');
        addTodo(currentDate, newTodo.trim(), endStr, newColor, newStartTime, newEndTime);
        setNewTodo('');
        setNewEndDate(null); // 추가 후 기본값으로 초기화
        setNewColor(PASTEL_COLORS[0].value);
        setNewStartTime('');
        setNewEndTime('');
    };

    const handleEditStart = (todo: typeof todos[0]) => {
        setEditTodoId(todo.id);
        setEditTodoText(todo.text);
        setEditEndDate(todo.endDate ? parseISO(todo.endDate) : null);
        setEditColor(todo.color || PASTEL_COLORS[0].value);
        setEditStartTime(todo.startTime || '');
        setEditEndTime(todo.endTime || '');
    };

    // 브라우저에 따라 "오후 12:30" 등 다국어가 섞여 들어올(또는 화면상 표시될) 경우를 대비하여, 
    // State에 들어온 문자열에서 숫자와 콜론(HH:mm)만 강제 추출하는 헬퍼 함수
    const extractTimeForm = (timeStr: string) => {
        if (!timeStr) return '';
        // "14:30", "02:30 PM", "오후 12:30" 등에서 정규식으로 00:00 패턴 체득 시도
        const match = timeStr.match(/\d{1,2}:\d{2}/);
        if (match) {
            // 시간 파싱 보정 (예: PM이 있거나 오후가 있으면 12시간 더하기)
            let [h, m] = match[0].split(':').map(Number);
            if (timeStr.includes('PM') || timeStr.includes('오후')) {
                if (h < 12) h += 12;
            } else if (timeStr.includes('AM') || timeStr.includes('오전')) {
                if (h === 12) h = 0;
            }
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        return timeStr; // 매칭 안되면 원본(사실 time input의 value는 무조건 HH:mm 이어야 함)
    };

    const handleEditSave = (id: string) => {
        if (!editTodoText.trim()) return;

        const effectiveEnd = editEndDate && editEndDate >= currentDate ? editEndDate : currentDate;
        const endStr = format(effectiveEnd, 'yyyy-MM-dd');

        updateTodo(id, {
            text: editTodoText.trim(),
            endDate: endStr,
            color: editColor,
            startTime: extractTimeForm(editStartTime) || undefined,
            endTime: extractTimeForm(editEndTime) || undefined
        });
        setEditTodoId(null);
    };

    const handleEditCancel = () => {
        setEditTodoId(null);
    };

    return (
        <div className="w-full h-full flex flex-col pt-4">
            {/* 상단 헤더 영역 */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-paper-200">
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        <button
                            onClick={() => setCurrentDate(subDays(currentDate, 1))}
                            className="p-1 text-ink-400 hover:text-ink-800 hover:bg-paper-100 rounded-lg transition-colors"
                            title="이전 날짜"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <h2 className={`text-4xl font-extrabold font-serif tracking-tight px-2 flex items-center gap-3 ${isHoliday ? 'text-accent-red' : 'text-ink-900'}`}>
                            {format(currentDate, "d")}
                            {weatherCache[format(currentDate, 'yyyy-MM-dd')] && (
                                <span className="text-3xl drop-shadow-sm opacity-90 pb-1">
                                    {weatherCache[format(currentDate, 'yyyy-MM-dd')]}
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, 1))}
                            className="p-1 text-ink-400 hover:text-ink-800 hover:bg-paper-100 rounded-lg transition-colors"
                            title="다음 날짜"
                        >
                            <ChevronRight size={28} />
                        </button>

                        {holidayName && (
                            <span className="px-2 py-0.5 mt-1 text-xs font-bold bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-md whitespace-nowrap">
                                {holidayName}
                            </span>
                        )}
                    </div>
                    <p className={`text-lg font-medium mt-1 uppercase tracking-widest ${isHoliday ? 'text-accent-red/80' : 'text-ink-500'}`}>
                        {format(currentDate, "EEEE, MMMM yyyy")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isToday(currentDate) && (
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="flex items-center gap-1.5 px-3 py-2 bg-paper-100 hover:bg-paper-200 text-ink-700 rounded-lg transition-colors font-bold text-sm tracking-wide border border-paper-200"
                        >
                            <CalendarCheck size={16} />
                            <span>오늘</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-paper-100 text-ink-600 rounded-lg transition-colors font-medium text-sm"
                    >
                        <CalendarDays size={18} />
                        <span>월간 달력</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8">
                {/* 투두 리스트 영역 */}
                <div className="flex-[3] flex flex-col bg-white border border-paper-200 shadow-sm rounded-2xl overflow-hidden relative">

                    <div className="bg-paper-100/50 p-5 border-b border-paper-200">
                        <h3 className="font-bold text-lg text-ink-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-accent-blue rounded-full block"></span>
                            오늘의 할 일 (To-Do)
                        </h3>
                    </div>

                    <div className="p-6 flex-1 flex flex-col bg-paper-50 bg-opacity-30">
                        <div className="flex flex-col gap-3 mb-6">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(e); }}
                                    placeholder="새로운 업무를 입력하고 Enter를 누르세요..."
                                    className="flex-1 px-4 py-3 border border-paper-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ink-400 focus:border-transparent placeholder-ink-400/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={!newTodo.trim()}
                                    className="px-5 bg-ink-800 text-white font-bold rounded-xl hover:bg-ink-900 focus:ring-4 focus:ring-ink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                                >
                                    <Plus size={18} />
                                    추가
                                </button>
                            </div>

                            {/* 다일정(Multi-day) 옵션 바 */}
                            <div className="flex items-center gap-4 px-1 py-1 bg-white/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-ink-500 bg-paper-200 px-2 py-1 rounded text-nowrap">종료일</span>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={format(effectiveEndDate, 'yyyy-MM-dd')}
                                            min={format(currentDate, 'yyyy-MM-dd')}
                                            onChange={(e) => e.target.value ? setNewEndDate(parseISO(e.target.value)) : setNewEndDate(null)}
                                            className="text-sm font-medium bg-transparent text-ink-700 outline-none border-b border-paper-300 focus:border-ink-500 py-0.5"
                                        />
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-paper-300"></div>
                                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
                                    <span className="flex items-center gap-1 text-xs font-bold text-ink-500 bg-paper-200 px-2 py-1 rounded text-nowrap shrink-0">
                                        <Palette size={12} /> 색상
                                    </span>
                                    <div className="flex gap-1.5 shrink-0">
                                        {PASTEL_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setNewColor(color.value)}
                                                className={`w-6 h-6 rounded-full transition-all border-2 ${newColor === color.value ? 'border-ink-700 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-paper-300"></div>
                                {/* 시간(Time) 옵션 (선택형) */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-ink-500 bg-paper-200 px-2 py-1 rounded text-nowrap">시간(선택)</span>
                                    <div className="flex items-center gap-1">
                                        <TimeSelector
                                            value={newStartTime}
                                            onChange={setNewStartTime}
                                        />
                                        <span className="text-ink-400 font-bold text-xs mx-1">~</span>
                                        <TimeSelector
                                            value={newEndTime}
                                            onChange={setNewEndTime}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                            {dailyTodos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-ink-400 opacity-60">
                                    <p className="font-medium">등록된 할 일이 없습니다.</p>
                                    <p className="text-sm mt-1">오늘 처리해야 할 주요 업무를 기록해보세요.</p>
                                </div>
                            ) : (
                                dailyTodos.map(todo =>
                                    editTodoId === todo.id ? (
                                        // 인라인 수정 폼
                                        <div key={todo.id} className="p-4 bg-paper-100/50 rounded-xl border border-paper-300 shadow-sm flex flex-col gap-3">
                                            <input
                                                type="text"
                                                value={editTodoText}
                                                onChange={(e) => setEditTodoText(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(todo.id); }}
                                                className="w-full px-3 py-2 border border-paper-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ink-400 font-medium"
                                                autoFocus
                                            />
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-ink-500 bg-paper-200 px-2 py-0.5 rounded text-nowrap">종료일</span>
                                                    <input
                                                        type="date"
                                                        value={editEndDate ? format(editEndDate, 'yyyy-MM-dd') : dateStr}
                                                        min={dateStr}
                                                        onChange={(e) => e.target.value ? setEditEndDate(parseISO(e.target.value)) : setEditEndDate(null)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(todo.id); }}
                                                        className="text-xs font-medium bg-transparent text-ink-700 outline-none border-b border-paper-300 py-0.5"
                                                    />
                                                </div>
                                                <div className="w-px h-4 bg-paper-300"></div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    {PASTEL_COLORS.map(color => (
                                                        <button
                                                            key={color.value}
                                                            type="button"
                                                            onClick={() => setEditColor(color.value)}
                                                            className={`w-5 h-5 rounded-full transition-all border-2 ${editColor === color.value ? 'border-ink-700 scale-110' : 'border-transparent'}`}
                                                            style={{ backgroundColor: color.value }}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="w-px h-4 bg-paper-300"></div>
                                                <div className="flex items-center gap-1">
                                                    <TimeSelector
                                                        value={editStartTime}
                                                        onChange={setEditStartTime}
                                                        onEnter={() => handleEditSave(todo.id)}
                                                    />
                                                    <span className="text-ink-400 font-bold text-xs mx-1">~</span>
                                                    <TimeSelector
                                                        value={editEndTime}
                                                        onChange={setEditEndTime}
                                                        onEnter={() => handleEditSave(todo.id)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-1">
                                                <button onClick={handleEditCancel} className="px-3 py-1.5 text-xs font-bold text-ink-500 hover:bg-paper-200 rounded-lg transition-colors">취소</button>
                                                <button onClick={() => handleEditSave(todo.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-ink-800 hover:bg-ink-900 rounded-lg transition-colors">저장</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // 일반 보기 항목
                                        <div
                                            key={todo.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl transition-all border group
                                                ${todo.isCompleted
                                                    ? 'bg-paper-100/40 border-transparent text-ink-400/70'
                                                    : 'bg-white border-paper-200/80 text-ink-800 hover:border-paper-300 hover:shadow-sm'
                                                }
                                            `}
                                            style={!todo.isCompleted && todo.endDate && todo.endDate !== todo.date ? { borderLeftWidth: '6px', borderLeftColor: todo.color } : {}}
                                        >
                                            <button
                                                onClick={() => toggleTodo(todo.id)}
                                                className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors
                                                    ${todo.isCompleted
                                                        ? 'bg-ink-400 border-ink-400 text-white'
                                                        : 'border-paper-400 bg-paper-50 group-hover:border-paper-500'
                                                    }
                                                `}
                                            >
                                                {todo.isCompleted && <Check size={14} strokeWidth={3} />}
                                            </button>

                                            <div className="flex-1 flex flex-col">
                                                <span className={`font-medium text-[15px] ${todo.isCompleted ? 'line-through' : ''}`}>
                                                    {todo.text}
                                                </span>
                                                {(todo.startTime || (todo.endDate && todo.endDate !== todo.date)) && (
                                                    <span className="text-[11px] text-ink-500 mt-0.5 font-bold">
                                                        {todo.endDate && todo.endDate !== todo.date ? `${format(parseISO(todo.date), 'M/d')} ~ ${format(parseISO(todo.endDate), 'M/d')} ` : ''}
                                                        {todo.startTime ? `${todo.startTime}${todo.endTime ? ` - ${todo.endTime}` : ''}` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditStart(todo)}
                                                    className="p-2 text-ink-400 hover:text-accent-blue hover:bg-blue-50 rounded-lg transition-all"
                                                    title="수정"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="p-2 text-ink-400 hover:text-accent-red hover:bg-paper-100 rounded-lg transition-all"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* 우측 여백/메모 영역 (종이 질감 노트 스타일) */}
                <div className="flex-[2] flex flex-col">
                    <div className="flex-1 bg-white border border-paper-200 rounded-2xl flex flex-col relative shadow-sm overflow-hidden">

                        {/* 상단 포인트 */}
                        <div className="h-14 bg-[#c95151] opacity-5 border-b border-paper-200/50"></div>

                        <div className="absolute top-4 left-6 right-6 flex items-center justify-between">
                            <h3 className="font-extrabold text-[#c95151] font-serif tracking-wide text-sm opacity-80">FREE NOTE</h3>
                            <span className="text-xs font-bold text-ink-400 font-serif">No. 01</span>
                        </div>

                        <div className="flex-1 p-6 pt-8 pr-4">
                            <textarea
                                className="w-full h-full bg-transparent resize-none focus:outline-none text-ink-700 font-serif"
                                placeholder="오늘의 이슈나 떠오르는 아이디어를 자유롭게 메모하세요."
                                style={{
                                    backgroundImage: 'linear-gradient(transparent, transparent 31px, rgba(232, 229, 217, 0.7) 32px)',
                                    backgroundSize: '100% 32px',
                                    lineHeight: '32px',
                                    paddingTop: '2px'
                                }}
                            ></textarea>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
