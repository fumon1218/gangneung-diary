import { useState } from 'react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, Plus, Trash2, CalendarDays } from 'lucide-react';

export const DailyView = () => {
    const { currentDate, todos, addTodo, toggleTodo, deleteTodo } = useStore();
    const navigate = useNavigate();
    const [newTodo, setNewTodo] = useState('');

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dailyTodos = todos.filter(t => t.date === dateStr);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        addTodo(currentDate, newTodo.trim());
        setNewTodo('');
    };

    return (
        <div className="w-full h-full flex flex-col pt-4">
            {/* 상단 헤더 영역 */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-paper-200">
                <div>
                    <h2 className="text-4xl font-extrabold text-ink-900 font-serif tracking-tight">
                        {format(currentDate, "d")}
                    </h2>
                    <p className="text-lg font-medium text-ink-500 mt-1 uppercase tracking-widest">
                        {format(currentDate, "EEEE, MMMM yyyy")}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-paper-100 text-ink-600 rounded-lg transition-colors font-medium text-sm"
                >
                    <CalendarDays size={18} />
                    <span>월간 달력으로</span>
                </button>
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
                        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
                            <input
                                type="text"
                                value={newTodo}
                                onChange={(e) => setNewTodo(e.target.value)}
                                placeholder="새로운 업무를 입력하고 Enter를 누르세요..."
                                className="flex-1 px-4 py-3 border border-paper-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ink-400 focus:border-transparent placeholder-ink-400/50 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!newTodo.trim()}
                                className="px-5 bg-ink-800 text-white font-bold rounded-xl hover:bg-ink-900 focus:ring-4 focus:ring-ink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus size={18} />
                                추가
                            </button>
                        </form>

                        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                            {dailyTodos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-ink-400 opacity-60">
                                    <p className="font-medium">등록된 할 일이 없습니다.</p>
                                    <p className="text-sm mt-1">오늘 처리해야 할 주요 업무를 기록해보세요.</p>
                                </div>
                            ) : (
                                dailyTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all border group
                      ${todo.isCompleted
                                                ? 'bg-paper-100/40 border-transparent text-ink-400/70'
                                                : 'bg-white border-paper-200/80 text-ink-800 hover:border-paper-300 hover:shadow-sm'
                                            }
                    `}
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

                                        <span className={`flex-1 font-medium text-[15px] ${todo.isCompleted ? 'line-through' : ''}`}>
                                            {todo.text}
                                        </span>

                                        <button
                                            onClick={() => deleteTodo(todo.id)}
                                            className="p-2 text-ink-400 opacity-0 group-hover:opacity-100 hover:text-accent-red hover:bg-paper-100 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
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
