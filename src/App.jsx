// src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './styles/global.css'; 

import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import Home from './pages/Home/Home';

// [페이지 및 컴포넌트 임포트]
import Dashboard1 from './pages/Dashboard/Dashboard1'; // 비교/개별 상세용
import Dashboard from './pages/Dashboard/Dashboard';   // 종합 분석용
import MainSection2 from './pages/Home/MainSection2'; // [추가] 개별 건물 선택 페이지

/**
 * 페이지 이동 시 스크롤을 맨 위로 올리는 컴포넌트
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop /> 
      
      <div className="App">
        <Navigation />

        <main style={{ minHeight: '100vh' }}>
          <Routes>
            {/* 1. 홈 페이지 */}
            <Route path="/" element={<Home />} />

            {/* 2. 개별 건물 선택: 네비바 '개별' 클릭 시 이동 */}
            <Route path="/individual-select" element={<MainSection2 />} />

            {/* 3. 비교 분석 / 개별 상세 분석: /dashboard1 
                (?building=... 파라미터 유무에 따라 Dashboard1 내부에서 처리) */}
            <Route path="/dashboard1" element={<Dashboard1 />} />

            {/* 4. 종합 분석: /dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 5. 기존 지도 클릭 연동 (유지) */}
            <Route path="/individual/:buildingName" element={<Dashboard />} />

            {/* 잘못된 경로 접속 시 홈으로 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;