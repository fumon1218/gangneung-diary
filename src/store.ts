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
    weeklyViewMode: 'tablet' | 'mobile';

    // Actions

    setCurrentDate: (date: Date) => void;
    addTodo: (date: Date, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    saveDrawing: (dateStr: string, dataUrl: string) => void;
    clearDrawing: (dateStr: string) => void;
    setWeeklyViewMode: (mode: 'tablet' | 'mobile') => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            currentDate: new Date(),
            todos: [],
            drawings: {},
            weeklyViewMode: 'tablet', // 기본 모드는 태블릿(가로 넓게)

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

            setWeeklyViewMode: (mode) => set({ weeklyViewMode: mode })
        }),
        {
            name: 'gangneung-diary-storage',
            partialize: (state) => ({
                todos: state.todos,
                drawings: state.drawings,
                weeklyViewMode: state.weeklyViewMode
            }),
        }
    )
);
