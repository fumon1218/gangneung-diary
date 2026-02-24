import { create } from 'zustand';
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

    // Actions

    setCurrentDate: (date: Date) => void;
    addTodo: (date: Date, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({

    currentDate: new Date(),
    todos: [], // 초기 메모/할일 배열


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
    }))
}));
