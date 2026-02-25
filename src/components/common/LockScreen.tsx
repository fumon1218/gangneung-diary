import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Lock, Delete } from 'lucide-react';

export const LockScreen: React.FC = () => {
    const { verifyPin } = useStore();
    const [inputPin, setInputPin] = useState('');
    const [error, setError] = useState(false);

    // 4자리가 입력되면 자동으로 검증 수행
    useEffect(() => {
        if (inputPin.length === 4) {
            const isSuccess = verifyPin(inputPin);
            if (!isSuccess) {
                setError(true);
                setTimeout(() => {
                    setInputPin('');
                    setError(false);
                }, 500); // 0.5초(흔들림 애니메이션 등의 시간) 후 입력칸 초기화
            } else {
                setInputPin('');
            }
        }
    }, [inputPin, verifyPin]);

    const handleNumberClick = (num: number) => {
        if (inputPin.length < 4) {
            setInputPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setInputPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-paper-50)] backdrop-blur-md">
            <div className={`flex flex-col items-center w-full max-w-sm px-6 ${error ? 'animate-shake' : ''}`}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-accent-blue border border-paper-200">
                    <Lock size={32} />
                </div>

                <h1 className="text-2xl font-bold text-ink-900 mb-2">앱이 잠겨있습니다</h1>
                <p className="text-ink-500 text-sm mb-10 text-center">
                    설정하신 보안 비밀번호(PIN) 4자리를<br />입력해 주세요.
                </p>

                {/* 4자리 입력 표시 창 */}
                <div className="flex gap-4 mb-12">
                    {[0, 1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className={`w-4 h-4 rounded-full transition-all duration-200 ${index < inputPin.length
                                ? error ? 'bg-accent-red' : 'bg-accent-blue scale-110'
                                : 'bg-paper-200'
                                }`}
                        />
                    ))}
                </div>

                {/* 다이얼 키패드 */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-[240px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-ink-800 bg-white shadow-sm hover:bg-paper-100 active:bg-paper-200 transition-colors border border-paper-200/50 focus:outline-none"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="w-16 h-16"></div> {/* 왼쪽 빈칸 */}
                    <button
                        onClick={() => handleNumberClick(0)}
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-ink-800 bg-white shadow-sm hover:bg-paper-100 active:bg-paper-200 transition-colors border border-paper-200/50 focus:outline-none"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 rounded-full flex items-center justify-center text-ink-600 hover:bg-paper-100 active:bg-paper-200 transition-colors focus:outline-none"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                {error && (
                    <p className="text-accent-red text-sm font-bold mt-8 animate-pulse">
                        비밀번호가 일치하지 않습니다.
                    </p>
                )}
            </div>
        </div>
    );
};
