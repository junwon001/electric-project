// src/components/pages/Home/MainSection3.jsx

import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PredictiveChart from '../../components/dashboard/PredictiveChart';
import { generateHourlyDataWithTime } from '../../utils/datagenerator';
import './MainSection3.css';

const MainSection3 = () => {
  const navigate = useNavigate();

  // 1. 단기 1:2 비율 적용 (과거 1일 + 미래 2일 = 총 3일 데이터)
  const previewData = generateHourlyDataWithTime(1, 2);

  // 2. 고정 시점 설정
  const fixedTime = "2026년 03월 04일 13:00";

  // [추가] 종합 분석 전용 색상 정의
  const TOTAL_ANALYSIS_COLOR = "#8B4513";

  return (
    <section className="main-section-3">
      <div className="container text-center mb-5">
        <h2 className="section-main-title">종합 전력비교</h2>
        <Button 
          className="btn-go-dashboard" 
          onClick={() => navigate('/dashboard')}
        >
          GO
        </Button>
      </div>

      <div className="container">
        <Row className="align-items-center g-5">
          {/* 왼쪽: 실제 그래프 미리보기 */}
          <Col lg={8}>
            <div className="preview-chart-container shadow-sm">
              <PredictiveChart 
                title="단기 예측" 
                buildingName="종합 분석" // [수정] 명칭 일관성 유지
                selectedTime={fixedTime}
                data={previewData}
                splitIndex={24} 
                showArea={true}
                xPeriodType="short"
                themeColor={TOTAL_ANALYSIS_COLOR} // [핵심 수정] 정해진 브라운 색상 전달
              />
            </div>
          </Col>

          {/* 오른쪽: 실시간 분석 텍스트 정보 */}
          <Col lg={4}>
            <div className="section-info-text text-start">
              <h3 className="info-title">실시간 분석</h3>
              <p className="info-desc">
                캠퍼스 전력 데이터를 XAI 기반으로 분석합니다.<br/>
                과거의 사용 패턴과 미래의 예측치를 대조하여<br/>
                최적의 에너지 가이드를 제공합니다.
              </p>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default MainSection3;