import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useStore } from '../store';

let unsubscribeSnapshot: (() => void) | null = null;
let unsubscribeStore: (() => void) | null = null;
let isUpdatingFromFirebase = false;

export const startSync = (uid: string) => {
    // 1. 기존 리스너가 있다면 정리
    stopSync();

    const userDocRef = doc(db, 'users', uid);

    // 2. Firebase 클라우드 데이터 읽기 구독 (다른 기기에서 변경 시 로컬 스토어 덮어쓰기)
    unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            isUpdatingFromFirebase = true; // Firebase에 의한 변경임을 플래그로 기록
            useStore.setState({
                todos: data.todos || [],
                drawings: data.drawings || {},
                monthlyNotes: data.monthlyNotes || {},
                appPin: data.appPin !== undefined ? data.appPin : null,
            });
            // 약간의 지연 후 플래그 해제 (Store 구독자가 실행된 이후)
            setTimeout(() => {
                isUpdatingFromFirebase = false;
            }, 50);
        }
    });

    // 3. 로컬 스토어 데이터 쓰기 구독 (내가 무언가를 쓰거나 그리면 Firebase로 전송)
    unsubscribeStore = useStore.subscribe((state, prevState) => {
        // Firebase에서 내려온 업데이트 때문에 스토어가 변한 거라면 다시 무한루프 전송하지 않음
        if (isUpdatingFromFirebase) return;

        const payload = {
            todos: state.todos,
            drawings: state.drawings,
            monthlyNotes: state.monthlyNotes,
            appPin: state.appPin
        };
        const prevPayload = {
            todos: prevState.todos,
            drawings: prevState.drawings,
            monthlyNotes: prevState.monthlyNotes,
            appPin: prevState.appPin
        };

        // 객체 참조 변경이 아닌 실제 "내용"이 변했을 때만 전송 (무한 로딩 방지 핵심)
        if (JSON.stringify(payload) !== JSON.stringify(prevPayload)) {
            console.log("[Sync] Local changes detected, syncing to Firestore...");
            useStore.setState({ isSyncing: true });

            try {
                // Firestore는 undefined 값을 허용하지 않으므로, JSON 직렬화/역직렬화를 통해 
                // undefined 프로퍼티가 완전히 제거된 순수 객체(Clean POJO)를 생성하여 전송합니다.
                const cleanPayload = JSON.parse(JSON.stringify(payload));

                setDoc(userDocRef, {
                    ...cleanPayload,
                    updatedAt: new Date().toISOString()
                }, { merge: true })
                    .then(() => console.log("[Sync] Successfully synced to Firestore!"))
                    .catch((error) => console.error("[Sync] Firebase sync error:", error))
                    .finally(() => useStore.setState({ isSyncing: false }));
            } catch (error) {
                console.error("[Sync] Synchronous error preparing/sending to Firestore:", error);
                useStore.setState({ isSyncing: false });
            }
        }
    });
};

export const stopSync = () => {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
};
