import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Eraser, Trash2, Pen } from 'lucide-react';

interface DrawingCanvasProps {
    dateStr: string;
    width: number;
    height: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ dateStr, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEraser, setIsEraser] = useState(false);
    const { drawings, saveDrawing, clearDrawing } = useStore();

    // 초기 및 저장된 그림 로드
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 캔버스 초기화 (투명 배경)
        ctx.clearRect(0, 0, width, height);

        // 저장된 그림이 있다면 불러오기
        const savedDataUrl = drawings[dateStr];
        if (savedDataUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = savedDataUrl;
        }
    }, [dateStr, width, height, drawings]);

    // 선 그리기 시작 위치 포착 및 스크롤 방지
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e, canvas);

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    // 선 그리기 로직
    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);

        // 펜 스타일 설정
        ctx.lineTo(offsetX, offsetY);
        // 지우개 모드일 경우 destination-out으로 선을 투명하게 지움
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : '#1a202c'; // 잉크 색 (ink-900)
        ctx.lineWidth = isEraser ? 20 : 2; // 지우개는 두껍게
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    // 그리기 종료 및 Zustand 저장
    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Data URL 형태로 추출하여 Store에 저장
        const dataUrl = canvas.toDataURL('image/png');
        saveDrawing(dateStr, dataUrl);
    };

    // 마우스/터치 좌표 추출 헬퍼 (CSS 렌더링 크기와 실제 캔버스 해상도 간의 비율 보정 추가)
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();

        // 실제 화면에 표시되는 크기 대비 내부 캔버스 해상도의 비율 계산
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if ('touches' in e) { // TouchEvent
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else { // MouseEvent
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            offsetX: (clientX - rect.left) * scaleX,
            offsetY: (clientY - rect.top) * scaleY
        };
    };

    const handleClear = () => {
        if (window.confirm('이 칸의 판서 내용을 모두 지우시겠습니까?')) {
            clearDrawing(dateStr);
            setIsEraser(false);
        }
    };

    return (
        <div className="relative group/canvas w-full h-full" style={{ touchAction: 'none' }}>
            {/* 상단 툴 레이어 (호버 시에만 나타나도록 설정) */}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/canvas:opacity-100 transition-opacity z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsEraser(!isEraser); }}
                    className={`p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-colors
                        ${isEraser ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white/80 text-ink-500 border-paper-200 hover:bg-paper-100'}
                    `}
                    title="지우개 토글"
                >
                    {isEraser ? <Pen size={14} /> : <Eraser size={14} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    className="p-1.5 bg-white/80 backdrop-blur-sm text-accent-red hover:bg-red-50 border border-red-100 rounded-full shadow-sm transition-colors"
                    title="전체 지우기"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                onTouchCancel={endDrawing}
                className={`w-full h-full bg-transparent absolute inset-0 z-10 ${isEraser ? 'cursor-[url(/eraser.png),_pointer]' : 'cursor-crosshair'}`}
                style={{ touchAction: 'none' }} // 브라우저 스크롤 제스처 억제
            />
        </div>
    );
};
