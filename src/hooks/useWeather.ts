import { useEffect, useState } from 'react';
import { useStore } from '../store';

// WMO 날씨 코드를 이모지로 변환하는 헬퍼 함수
export const getWeatherEmoji = (code: number): string => {
    if (code === 0) return '☀️'; // 맑음
    if (code === 1 || code === 2 || code === 3) return '⛅'; // 대체로 맑음, 구름조금, 흐림
    if (code === 45 || code === 48) return '🌫️'; // 안개
    if (code >= 51 && code <= 57) return '🌧️'; // 이슬비
    if (code >= 61 && code <= 67) return '☔'; // 비
    if (code >= 71 && code <= 77) return '❄️'; // 눈
    if (code >= 80 && code <= 82) return '🌦️'; // 소나기
    if (code >= 85 && code <= 86) return '🌨️'; // 눈보라
    if (code >= 95 && code <= 99) return '⛈️'; // 뇌우
    return '☁️'; // 기본값 (흐림/알수없음)
};

export const useWeather = () => {
    const { weatherCache, setWeatherCache } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 이미 날씨 데이터 캐시가 7개 이상 차있다면 최신화 불필요로 간주
        if (Object.keys(weatherCache).length > 7) {
            return;
        }

        const fetchWeather = async (lat: number, lon: number) => {
            setIsLoading(true);
            try {
                // Open-Meteo API 호출 (과거 14일 ~ 미래 14일의 날씨 코드)
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code&timezone=auto&past_days=14&forecast_days=14`);

                if (!res.ok) throw new Error('Failed to fetch weather data');

                const data = await res.json();

                if (data.daily && data.daily.time && data.daily.weather_code) {
                    const newCache: Record<string, string> = {};

                    data.daily.time.forEach((dateStr: string, idx: number) => {
                        const code = data.daily.weather_code[idx];
                        newCache[dateStr] = getWeatherEmoji(code);
                    });

                    setWeatherCache(newCache);
                }
            } catch (err) {
                console.error("Weather fetch error:", err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        // 브라우저 Geolocation API를 통해 위경도 획득
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocation permission denied or failed:", err);
                    setError("Location access denied.");
                },
                { timeout: 10000, maximumAge: 3600000 } // 1시간 동안 위치 캐시 유지
            );
        } else {
            setError("Geolocation not supported by this browser.");
        }
    }, [weatherCache, setWeatherCache]);

    return { isLoading, error };
};
