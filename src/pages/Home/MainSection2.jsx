// src/components/pages/Home/MainSection2.jsx

import React, { useRef } from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './MainSection2.css';

// 이미지 임포트
import campusMapImg from '../../assets/images/campus-map.png';
import imgGwanggaeto from '../../assets/images/광개토관.png';
import imgDaeyang from '../../assets/images/대양AI센터.png';
import imgJiphyeon from '../../assets/images/집현관.png';
import imgChungmu from '../../assets/images/충무관.png';
import imgStudent from '../../assets/images/학생회관.png';

const MainSection2 = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const buildingHotspots = [
    { 
      name: "광개토관", color: "#DC143C", image: imgGwanggaeto,
      labelTop: "32%", labelLeft: "38%",
      shape: "polygon(38% 20%, 40% 22%, 40% 23%, 43% 29%, 44% 40%, 42% 43%, 39% 40%, 39% 42%, 38% 41%, 38% 40%, 34% 45%, 32% 42%, 32% 27%, 34% 24%, 36% 26%, 38% 23%)" 
    },
    { 
      name: "충무관", color: "#003cff", image: imgChungmu,
      labelTop: "46%", labelLeft: "68%",
      shape: "polygon(65% 41%, 67% 38%, 67% 37%, 68% 35%, 70% 35%, 71% 34%, 72% 36%, 72% 48%, 69% 54%, 69% 55%, 68% 57%, 65% 54%)" 
    },
    { 
      name: "대양AI센터", color: "#FFCC00", image: imgDaeyang,
      labelTop: "78%", labelLeft: "48%",
      shape: "polygon(48% 68%, 51% 72%, 51% 75%, 53% 78%, 53% 81%, 50% 86%, 49% 83%, 47% 87%, 45% 84%, 45% 82%, 44% 81%, 44% 80%, 44% 79%, 44% 74%)" 
    },
    { 
      name: "집현관", color: "#34C759", image: imgJiphyeon,
      labelTop: "44%", labelLeft: "21%",
      shape: "polygon(25% 33%, 25% 41%, 25% 48%, 22% 48%, 22% 55%, 20% 55%, 20% 52%, 20% 50%, 19% 50%, 19% 46%, 18% 46%, 18% 33%)" 
    },
    { 
      name: "학생회관", color: "#b450f2", image: imgStudent,
      labelTop: "76%", labelLeft: "33%",
      shape: "polygon(37% 72%, 37% 77%, 36% 80%, 36% 83%, 31% 79%, 29% 76%, 29% 74%, 28% 73%, 29% 69%, 30% 69%, 30% 70%, 30% 69%, 33% 71%, 34% 72%, 34% 70%)" 
    },
  ];

  // 건물 클릭 시 상세 페이지 이동
  const handleBuildingClick = (name) => {
    navigate(`/individual/${name}`);
  };

  return (
    <div className="main-section-2-wrapper py-5">
      <Container className="text-center">
        {/* 상단 안내 섹션 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}

          className="mb-5 mt-5 pt-5"
        >
          <h2 className="fw-bold mb-3 display-6" style={{ letterSpacing: '-1.5px' }}>개별 건물 분석</h2>
          <p className="text-muted mb-4">원하시는 건물을 지도에서 선택하여 실시간 예측 데이터를 확인하세요.</p>
        </motion.div>

        {/* 지도 섹션 (하단 지도는 개별 선택 페이지에서 직접 볼 때 사용됨) */}
        <div className="map-scroll-target" ref={mapRef}>
          <div className="campus-map-relative-container shadow-lg rounded-4 overflow-hidden">
            <img src={campusMapImg} alt="Sejong Campus Map" className="w-100 h-auto d-block" />

            {buildingHotspots.map((b) => (
              <React.Fragment key={b.name}>
                <div
                  className="building-hotspot"
                  style={{
                    clipPath: b.shape,
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 2
                  }}
                  onClick={() => handleBuildingClick(b.name)}
                  title={`${b.name} 분석하기`}
                />
                
                <div
                  className="building-label shadow-sm"
                  style={{
                    position: 'absolute',
                    top: b.labelTop,
                    left: b.labelLeft,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: b.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    zIndex: 3,
                    pointerEvents: 'none',
                    border: `1.5px solid ${b.color}`
                  }}
                >
                  {b.name}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MainSection2;