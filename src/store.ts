import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';



export interface Todo {
    id: string;
    date: string; // yyyy-MM-dd
    text: string;
    isCompleted: boolean;
}

interface AppState {

    currentDate: Date;
    todos: Todo[];
    drawings: Record<string, string>;
    monthlyNotes: Record<string, string>; // yyyy-MM
    weeklyViewMode: 'tablet' | 'mobile';
    appPin: string | null;     // 사용자가 설정한 4자리 비밀번호 (storage)
    isLocked: boolean;         // 현재 앱 잠금 화면 표시 여부 (메모리 전용)

    // Actions

    setCurrentDate: (date: Date) => void;
    addTodo: (date: Date, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    saveDrawing: (dateStr: string, dataUrl: string) => void;
    clearDrawing: (dateStr: string) => void;
    setMonthlyNote: (monthStr: string, text: string) => void;
    setWeeklyViewMode: (mode: 'tablet' | 'mobile') => void;
    setAppPin: (pin: string | null) => void;
    verifyPin: (pin: string) => boolean;
    lockApp: () => void;
    unlockApp: () => void; // 일시적인 수동 해제나 초기 렌더링 검사용
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            currentDate: new Date(),
            todos: [],
            drawings: {},
            monthlyNotes: {},
            weeklyViewMode: 'tablet', // 기본 모드는 태블릿(가로 넓게)
            appPin: null,
            isLocked: false,          // 초기값은 false이나, persist onRehydrateStorage 등에 의해 덮어씌워질 것임. 일단 기본 상태 정의.

            setCurrentDate: (date) => set({ currentDate: date }),

            addTodo: (date, text) => set((state) => {
                const newTodo: Todo = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: format(date, 'yyyy-MM-dd'),
                    text,
                    isCompleted: false
                };
                return { todos: [...state.todos, newTodo] };
            }),

            toggleTodo: (id) => set((state) => ({
                todos: state.todos.map(todo =>
                    todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
                )
            })),

            deleteTodo: (id) => set((state) => ({
                todos: state.todos.filter(todo => todo.id !== id)
            })),

            saveDrawing: (dateStr, dataUrl) => set((state) => ({
                drawings: { ...state.drawings, [dateStr]: dataUrl }
            })),

            clearDrawing: (dateStr) => set((state) => {
                const newDrawings = { ...state.drawings };
                delete newDrawings[dateStr];
                return { drawings: newDrawings };
            }),

            setMonthlyNote: (monthStr, text) => set((state) => ({
                monthlyNotes: { ...state.monthlyNotes, [monthStr]: text }
            })),

            setWeeklyViewMode: (mode) => set({ weeklyViewMode: mode }),

            setAppPin: (pin) => set(() => ({
                appPin: pin,
                isLocked: pin !== null // 비밀번호를 새롭게 걸면 즉시(또는 새로고침 시) 잠금 모드로 진입
            })),

            verifyPin: (pin) => {
                let success = false;
                set((state) => {
                    if (state.appPin === pin) {
                        success = true;
                        return { isLocked: false };
                    }
                    return { isLocked: true };
                });
                return success;
            },

            lockApp: () => set((state) => ({
                isLocked: state.appPin !== null
            })),

            unlockApp: () => set({ isLocked: false })
        }),
        {
            name: 'gangneung-diary-storage',
            partialize: (state) => ({
                todos: state.todos,
                drawings: state.drawings,
                monthlyNotes: state.monthlyNotes,
                weeklyViewMode: state.weeklyViewMode,
                appPin: state.appPin
                // 주의: isLocked는 새로고침 시 메모리 해제되며, 브라우저가 다시 켜질 때 onRehydrateStorage에서 appPin이 있으면 무조건 true로 강제하는 보안 설계가 필요합니다.
            }),
            onRehydrateStorage: () => (state) => {
                // 저장소에서 데이터를 성공적으로 다 불러온 뒤 실행되는 콜백. 
                // 만약 appPin이 존재한다면 즉시 (hydrate 완료 후) isLocked를 true로 변경하여 리액트 컴포넌트가 잠금 렌더링을 알도록 합니다.
                if (state && state.appPin !== null) {
                    useStore.setState({ isLocked: true });
                }
            }
        }
    )
);
