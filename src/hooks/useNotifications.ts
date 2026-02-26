import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';

export const useNotifications = () => {
    const { todos, notifiedTodoIds, addNotifiedTodoId, clearExpiredNotifications } = useStore();
    const isPermissionRequested = useRef(false);

    useEffect(() => {
        // 권한 요청 (최초 1회)
        if ('Notification' in window && Notification.permission === 'default' && !isPermissionRequested.current) {
            isPermissionRequested.current = true;
            try {
                const permissionPromise = Notification.requestPermission();
                if (permissionPromise && typeof permissionPromise.catch === 'function') {
                    permissionPromise.catch(console.warn);
                }
            } catch (error) {
                console.warn('Error requesting notification permission:', error);
            }
        }
    }, []);

    useEffect(() => {
        // 타이머 설정 (매 분마다 검사)
        const checkNotifications = () => {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;

            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            // 시간 비교를 쉽게 하기 위해 분으로 환산
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            todos.forEach(todo => {
                // 이미 알림이 울린 일정이거나, 완료된 일정, 또는 시간 지정이 없는 종일 일정은 패스
                if (notifiedTodoIds.includes(todo.id) || todo.isCompleted || !todo.startTime) return;

                // 시작 날짜가 오늘보다 미래이거나(endDate 포함 복잡도 제외, 최우선적으로 startTime 기준 알림)
                // 단순히 오늘 날짜에 지정된 시작 시간이 현재 시간과 "일치(또는 1분 이내로 지남)"하는지 검사

                // 편의상 투두가 오늘(혹은 진행중인) 일정인지 여부는 date 만 기준으로 단순화하여 알림을 줌
                if (todo.date === todayStr) {
                    const [startH, startM] = todo.startTime.split(':').map(Number);
                    const todoTotalMinutes = startH * 60 + startM;

                    // 정각 알림: 현재 시간이 일정 시간과 같거나, 최대 1분 이내로 지났을 때 1회 발송
                    if (currentTotalMinutes === todoTotalMinutes) {
                        addNotifiedTodoId(todo.id, todo.text);
                    }
                }
            });

            // 만료된(이미 지워지거나 없어진) 알림 ID 정리
            clearExpiredNotifications();
        };

        // 처음 마운트 될 때 즉시 한 번 검사
        checkNotifications();

        // 30초마다 검사 실행 (1분마다 하면 타이머 오차로 인해 정각을 놓칠 가능성 대비)
        const intervalId = setInterval(checkNotifications, 30000);

        return () => clearInterval(intervalId);
    }, [todos, notifiedTodoIds, addNotifiedTodoId, clearExpiredNotifications]);
};
