// src/pages/Home/Home.jsx
import React, { useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Home.css';

import MainSection1 from './MainSection1'; 
import MainSection3 from './MainSection3'; 
import campusMap from '../../assets/images/campus-map.png';

// 건물 이미지 Import
import imgGwanggaeto from '../../assets/images/광개토관.png';
import imgDaeyang from '../../assets/images/대양AI센터.png';
import imgJiphyeon from '../../assets/images/집현관.png';
import imgChungmu from '../../assets/images/충무관.png';
import imgStudent from '../../assets/images/학생회관.png';

const Home = () => {
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

  // '개별' 분석 메뉴와 동일하게 이동 (지도 선택 페이지로)
  const handleGoClick = () => {
    navigate('/individual-select');
  };

  const scrollReveal = {
    initial: { opacity: 0, y: 100 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.2 },
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <div className="home-container">
      {/* --- Section 0: Hero --- */}
      <section className="hero-section text-center">
        <Container>
          <motion.div {...scrollReveal}>
            <h2 className="hero-subtitle">Sejong Univ. AI Energy</h2>
            <h1 className="hero-title">에너지의 미래를 <br/>데이터로 읽다.</h1>
            <p className="hero-description">설명 가능한 AI(XAI)와 정밀한 분석으로 세종대학교의 전력 수요를 예측합니다.</p>
          </motion.div>
          <motion.div className="hero-image-container" {...scrollReveal}>
            <div className="hero-map-wrapper shadow-lg" ref={mapRef}>
               <img src={campusMap} alt="Sejong Campus Map" className="campus-map-img" />
               {buildingHotspots.map((b) => (
                 <React.Fragment key={b.name}>
                   {/* 1. 클릭 가능한 투명 영역 (App.jsx 경로에 맞게 수정됨) */}
                   <div 
                     className="map-hotspot" 
                     style={{
                       position: 'absolute',
                       top: 0, left: 0, width: '100%', height: '100%', 
                       clipPath: b.shape,
                       backgroundColor: 'transparent',
                       cursor: 'pointer',
                       zIndex: 10
                     }} 
                     onClick={() => navigate(`/individual/${b.name}`)}
                   />
                   
                   {/* 2. 별도의 이름 라벨 */}
                   <span 
                     className="hotspot-label"
                     style={{
                       position: 'absolute',
                       top: b.labelTop,
                       left: b.labelLeft,
                       '--hotspot-color': b.color 
                     }}
                   >
                     {b.name}
                   </span>
                 </React.Fragment>
               ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* --- Section 1: 캠퍼스 전력 통합 비교 --- */}
      <section className="full-width-bg-section">
        <motion.div className="section-inner-content" {...scrollReveal}>
          <Container><MainSection1 buildingHotspots={buildingHotspots} /></Container>
        </motion.div>
      </section>

      {/* --- Section 2: 건물별 전력 분석 --- */}
      <section className="full-width-bg-section">
        <motion.div className="section-inner-content" {...scrollReveal}>
          <Container>
            <div className="text-center">
              <h3 className="section-title-sketch">건물별 전력 분석</h3>
              
              <Button 
                className="apple-pill-go-button is-active" 
                onClick={handleGoClick} 
              >
                GO
              </Button>
              
              <Row className="g-4 mt-5 justify-content-center">
                {buildingHotspots.map((b, idx) => {
                  return (
                    <Col key={idx} xs={6} md={4} lg={true}>
                      <motion.div 
                        className="sketch-mini-card"
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        // [수정] Dashboard로 연결되는 /individual/:name 경로 적용
                        onClick={() => navigate(`/individual/${b.name}`)}
                      >
                        <div 
                          className="sketch-img-box"
                          style={{
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={b.image} alt={b.name} className="sketch-building-img" />
                          <div className="building-accent-bar" style={{ backgroundColor: b.color }}></div>
                        </div>
                        <span className="sketch-label" style={{ color: '#333' }}>
                          {b.name}
                        </span>
                      </motion.div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Container>
        </motion.div>
      </section>

      {/* --- Section 3 --- */}
      <section className="full-width-bg-section mb-5">
        <motion.div className="section-inner-content" {...scrollReveal}>
          <MainSection3 />
        </motion.div>
      </section>
    </div>
  );
};

export default Home;