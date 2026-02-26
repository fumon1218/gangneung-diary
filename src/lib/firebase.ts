import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// .env 파일에 설정할 파이어베이스 접근 키들
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 파이어베이스 앱 초기화
export const app = initializeApp(firebaseConfig);

// 데이터베이스(Firestore) 객체 추출
export const db = getFirestore(app);

// 인증(Auth) 객체 추출 및 구글 로그인 프로바이더 전역 초기화
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
