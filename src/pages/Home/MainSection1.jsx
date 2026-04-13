// src/pages/Home/MainSection1.jsx

import React, { useMemo } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PredictiveChart from '../../components/dashboard/PredictiveChart';
import { generateHourlyDataWithTime } from '../../utils/datagenerator'; 
import './MainSection1.css';

const MainSection1 = ({ buildingHotspots }) => {
  const navigate = useNavigate();

  // 1. 컴포넌트 내부에서 5개 건물의 더미 데이터 생성
  const allBuildingData = useMemo(() => {
    const dataMap = {};
    buildingHotspots.forEach(b => {
      dataMap[b.name] = generateHourlyDataWithTime(1, 2);
    });
    return dataMap;
  }, [buildingHotspots]);

  const splitIndex = 24; 
  const fixedTime = "2026년 03월 04일 13:00";

  return (
    <div className="main-section-1">
      <div className="text-center mb-5">
        <h3 className="section-title-sketch">캠퍼스 전력 통합 비교</h3>
        <p className="hero-description">
          세종대학교 5개 주요 건물의 실시간 에너지 사용 트렌드를 한눈에 대조 분석합니다.
        </p>
        
        <Button 
          className="apple-pill-go-button" 
          onClick={() => navigate('/dashboard1')}
        >
          GO
        </Button>
      </div>

      {/* --- 첫 번째 행: 건물 2개 (상단 배치) --- */}
      <Row className="g-4 justify-content-center mb-4">
        {buildingHotspots.slice(0, 2).map((b) => (
          <Col key={b.name} xs={12} md={6} lg={4}> 
            <div className="chart-card-wrapper shadow-sm">
              <PredictiveChart 
                title={b.name}
                data={allBuildingData[b.name]} 
                splitIndex={splitIndex}
                selectedTime={fixedTime}
                themeColor={b.color}         
                isMini={true}                
                xPeriodType="short"          
                showArea={true}
                // [핵심 추가] 메인 화면 요약본이므로 컨트롤러(슬라이더, 문구) 숨김
                hideControls={true} 
              />
            </div>
          </Col>
        ))}
      </Row>

      {/* --- 두 번째 행: 건물 3개 (하단 배치) --- */}
      <Row className="g-4 justify-content-center">
        {buildingHotspots.slice(2, 5).map((b) => (
          <Col key={b.name} xs={12} md={6} lg={4}>
            <div className="chart-card-wrapper shadow-sm">
              <PredictiveChart 
                title={b.name}
                data={allBuildingData[b.name]} 
                splitIndex={splitIndex}
                selectedTime={fixedTime}
                themeColor={b.color}         
                isMini={true}                
                xPeriodType="short"          
                showArea={true}
                // [핵심 추가] 메인 화면 요약본이므로 컨트롤러(슬라이더, 문구) 숨김
                hideControls={true} 
              />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MainSection1;