import { useEffect, useState } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, provider } from '../../lib/firebase';
import { useStore } from '../../store';
import { startSync, stopSync } from '../../lib/sync';
import { LogIn, LogOut, Cloud, CloudOff, Loader2 } from 'lucide-react';

export const AuthButton = () => {
    const { isSyncing } = useStore();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);

            if (currentUser) {
                useStore.setState({ currentUserUid: currentUser.uid });
                startSync(currentUser.uid);
            } else {
                useStore.setState({ currentUserUid: null });
                stopSync();
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
            alert('로그인에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        if (window.confirm('로그아웃 하시겠습니까? 기기 실시간 연동이 중지됩니다.')) {
            try {
                await signOut(auth);
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <button disabled className="p-2 ml-2 bg-white rounded-full border border-[var(--color-paper-200)] text-[var(--color-ink-300)] flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
            </button>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-2 ml-2 relative group">
                {/* 동기화 상태 인디케이터 */}
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isSyncing ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'} flex items-center gap-1 transition-colors duration-300`}>
                    {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                    {isSyncing ? '동기화 중...' : '연동 됨'}
                </span>

                <button
                    onClick={handleLogout}
                    className="p-1 px-3 bg-white rounded-full border border-[var(--color-paper-200)] text-[var(--color-ink-500)] hover:text-red-500 hover:border-red-200 hover:shadow-sm transition-all flex items-center gap-2"
                    title="로그아웃 (구글 계정)"
                >
                    {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />}
                    <LogOut size={16} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className="p-1.5 px-3 ml-2 bg-[var(--color-ink-900)] text-white rounded-full border border-[var(--color-ink-900)] hover:bg-[var(--color-ink-700)] hover:shadow-sm transition-all flex items-center gap-2 text-sm font-bold"
            title="구글 계정으로 로그인하여 기기 간 실시간 연동 켜기"
        >
            <CloudOff size={16} />
            <LogIn size={16} />
            <span>클라우드 동기화 켜기</span>
        </button>
    );
};
