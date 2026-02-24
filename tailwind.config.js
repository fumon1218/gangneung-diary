/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: {
                    50: '#faf9f6',   // 가장 밝은 미색 (다이어리 기본 배경)
                    100: '#f4f2eb',  // 약간 타버린 종이 느낌 (사이드바, 헤더 헤딩)
                    200: '#e8e5d9',  // 연한 테두리
                    300: '#d7d2c1',  // 중간 톤 테두리
                    400: '#b8b29d',
                    500: '#9b947c',
                },
                ink: {
                    400: '#737a86',
                    500: '#525b6a',  // 보조 텍스트 (날짜, 라벨 등)
                    600: '#3e4653',
                    700: '#2b313b',  // 일반 본문 색상 (아주 진한 회색-네이비)
                    800: '#1b1e24',
                    900: '#0f1115',  // 강조 텍스트, 타이틀
                },
                accent: {
                    red: '#c95151',  // 토/일 공휴일 표시용 차분한 빨강
                    blue: '#476dbd', // 체크, 포인트용 차분한 파랑
                }
            },
            fontFamily: {
                sans: [
                    '"Pretendard Variable"',
                    'Pretendard',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'system-ui',
                    'Roboto',
                    '"Helvetica Neue"',
                    '"Segoe UI"',
                    '"Apple SD Gothic Neo"',
                    '"Noto Sans KR"',
                    '"Malgun Gothic"',
                    'sans-serif'
                ],
                serif: ['"Noto Serif KR"', 'serif'],
            },
        },
    },
    plugins: [],
}
