import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Shield, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface SecuritySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SetupStep = 'none' | 'verify_old' | 'enter_new' | 'confirm_new';

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
    const { appPin, setAppPin, verifyPin } = useStore();

    const [step, setStep] = useState<SetupStep>('none');
    const [inputPin, setInputPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // 모달이 열릴 때 초기 상태 세팅 (기존 비밀번호 유무에 따라)
    useEffect(() => {
        if (isOpen) {
            setInputPin('');
            setNewPin('');
            setErrorMsg('');
            setStep('none');
        }
    }, [isOpen]);

    // 공통 숫자 입력 핸들러
    const handleNumberClick = (num: number) => {
        if (inputPin.length < 4) {
            setInputPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setInputPin(prev => prev.slice(0, -1));
    };

    // 4자리 입력 완료 시 각 스텝에 따른 검증 로직 수행
    useEffect(() => {
        if (inputPin.length === 4) {
            // 1) 기존 비밀번호 해제/변경을 위한 확인 단계
            if (step === 'verify_old') {
                const isCorrect = verifyPin(inputPin);
                if (isCorrect) {
                    // 해제 처리
                    setInputPin('');
                    setAppPin(null);
                    alert('앱 잠금이 해제되었습니다.');
                    onClose();
                } else {
                    setErrorMsg('기존 비밀번호가 일치하지 않습니다.');
                    setInputPin('');
                }
            }
            // 2) 새 비밀번호 1차 입력 단계
            else if (step === 'enter_new') {
                setNewPin(inputPin);
                setStep('confirm_new');
                setInputPin('');
                setErrorMsg('');
            }
            // 3) 새 비밀번호 2차 확인 단계
            else if (step === 'confirm_new') {
                if (inputPin === newPin) {
                    setInputPin('');
                    setStep('none');
                    setAppPin(newPin);
                    alert('새로운 잠금 비밀번호가 설정되었습니다.');
                    onClose();
                } else {
                    setErrorMsg('입력한 비밀번호가 서로 다릅니다. 처음부터 다시 입력해주세요.');
                    setStep('enter_new');
                    setInputPin('');
                    setNewPin('');
                }
            }
        }
    }, [inputPin, step, newPin, verifyPin, setAppPin, onClose]);

    if (!isOpen) return null;

    // 키패드 공통 렌더러
    const renderKeypad = () => (
        <div className="flex flex-col items-center mt-6">
            <div className="flex gap-4 mb-6">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all ${index < inputPin.length ? 'bg-accent-blue scale-125' : 'bg-paper-200'
                            }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium text-ink-800 bg-paper-50 hover:bg-paper-100 active:bg-paper-200 transition-colors"
                    >
                        {num}
                    </button>
                ))}
                <div className="w-14 h-14"></div>
                <button
                    onClick={() => handleNumberClick(0)}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium text-ink-800 bg-paper-50 hover:bg-paper-100 active:bg-paper-200 transition-colors"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-ink-500 hover:bg-paper-100 transition-colors text-sm font-bold"
                >
                    지우기
                </button>
            </div>

            {errorMsg && (
                <p className="text-accent-red text-xs mt-4 font-bold animate-pulse">{errorMsg}</p>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] bg-ink-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
                {/* Header */}
                <div className="bg-paper-50 px-5 py-4 flex items-center justify-between border-b border-paper-200">
                    <div className="flex items-center gap-2">
                        {appPin ? <ShieldCheck className="text-accent-blue" size={20} /> : <ShieldAlert className="text-ink-400" size={20} />}
                        <h2 className="font-bold text-ink-800">보안 설정 (App Lock)</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-ink-400 hover:bg-paper-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 pb-8">
                    {step === 'none' ? (
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${appPin ? 'bg-blue-50 text-accent-blue' : 'bg-paper-100 text-ink-400'}`}>
                                <Shield size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-ink-900 mb-2">
                                {appPin ? '앱이 안전하게 보호되고 있습니다.' : '일정 보안을 위한 잠금 설정'}
                            </h3>
                            <p className="text-sm text-ink-500 mb-8 max-w-[240px]">
                                {appPin
                                    ? '다이어리를 볼 때나 접속할 때 4자리 비밀번호 확인을 거칩니다.'
                                    : '추후 접속 시 앱 화면을 보이지 않게 잠글 4자리 비밀번호(PIN)를 등록합니다.'}
                            </p>

                            {appPin ? (
                                <button
                                    onClick={() => setStep('verify_old')}
                                    className="w-full py-3 rounded-xl bg-paper-100 text-ink-700 font-bold hover:bg-paper-200 transition-colors border border-paper-200"
                                >
                                    잠금 비밀번호 해제하기
                                </button>
                            ) : (
                                <button
                                    onClick={() => setStep('enter_new')}
                                    className="w-full py-3 rounded-xl bg-accent-blue text-white font-bold hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    비밀번호 새로 설정하기
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-ink-900 mb-1">
                                {step === 'verify_old' && '기존 비밀번호 확인'}
                                {step === 'enter_new' && '새 비밀번호 4자리'}
                                {step === 'confirm_new' && '비밀번호 재입력'}
                            </h3>
                            <p className="text-xs text-ink-500">
                                {step === 'verify_old' && '잠금을 풀려면 현재 비밀번호를 입력해주세요.'}
                                {step === 'enter_new' && '사용하실 4자리 숫자를 입력해주세요.'}
                                {step === 'confirm_new' && '설정한 비밀번호를 다시 한 번 눌러주세요.'}
                            </p>

                            {renderKeypad()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
