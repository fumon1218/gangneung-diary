import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// [PWA 캐시 무효화 강제화] 
// 이전 배포 버전의 서비스 워커가 새 소스코드 로드를 막는 현상을 원천 방지하기 위해 로드 즉시 모든 캐시 브리지를 끊어냅니다.
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
    }).catch(function (err) {
      console.log('Service Worker unregistration failed: ', err);
    });
  }
} catch (e) {
  console.warn('ServiceWorker access denied:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
