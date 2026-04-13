// src/pages/Dashboard/Dashboard1.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Form, Card, Button, ButtonGroup, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import StackedComparison from '../../components/dashboard/StackedComparison';
import './Dashboard1.css';

const BUILDING_LIST = [
  { name: "광개토관", color: "#DC143C" },
  { name: "충무관", color: "#003cff" },
  { name: "대양AI센터", color: "#FFCC00" },
  { name: "집현관", color: "#34C759" },
  { name: "학생회관", color: "#b450f2" }
];

const API_BASE_URL = 'http://127.0.0.1:8000';

const Dashboard1 = () => {
  const [startDate, setStartDate] = useState(new Date("2026-03-10"));
  const [selectedHour, setSelectedHour] = useState("14");
  const [period, setPeriod] = useState('short');

  const [appliedParams, setAppliedParams] = useState({
    date: new Date("2026-03-10"),
    hour: "14",
    period: 'short'
  });

  const [allBuildingData, setAllBuildingData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(null);

  const handleUpdate = () => {
    setAppliedParams({
      date: startDate,
      hour: selectedHour,
      period: period
    });
  };

  const formatBaseDatetime = (date, hour) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:00:00`;
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      const startedAt = performance.now();

      try {
        setLoading(true);
        setError(null);

        const baseDatetime = formatBaseDatetime(appliedParams.date, appliedParams.hour);

        // 현재는 short만 테스트
        const fixedPeriod = 'short';

        const response = await fetch(
          `${API_BASE_URL}/api/comparison?datetime=${encodeURIComponent(baseDatetime)}&period=${encodeURIComponent(fixedPeriod)}`
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || '비교 데이터를 불러오지 못했습니다.');
        }

        const json = await response.json();
        const buildingsData = json.buildings || {};
        const dataMap = {};

        BUILDING_LIST.forEach((building) => {
          const item = buildingsData[building.name];

          if (!item || item.error || item.loading) {
            dataMap[building.name] = [];
            return;
          }

          const rawHistory = item.history || [];
          const rawForecast = item.forecast || [];

          // 단기(short): 과거 24시간 + 미래 48시간만 표시
          const displayHistory = rawHistory.slice(-24);
          const displayForecast = rawForecast.slice(0, 48);

          const historyPart = displayHistory.map((row) => {
            const dateObj = new Date(row.time);
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');

            return {
              time: row.time,
              timeLabel: `${month}/${day} ${hh}:00`,
              dateObj,

              actualValue: row.value,
              rawPrediction: null,
              llmPrediction: null,

              ci95: null,
              ci99: null,
              ci95Upper: null,
              ci95Lower: null,
              ci99Upper: null,
              ci99Lower: null,
            };
          });

          const forecastPart = displayForecast.map((row) => {
            const dateObj = new Date(row.time);
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');

            return {
              time: row.time,
              timeLabel: `${month}/${day} ${hh}:00`,
              dateObj,

              actualValue: null,
              rawPrediction: row.value,
              llmPrediction: null,

              ci95: null,
              ci99: null,
              ci95Upper: null,
              ci95Lower: null,
              ci99Upper: null,
              ci99Lower: null,
            };
          });

          // 실측선과 예측선 연결용 브리지 포인트
          let mergedData = [...historyPart];

          if (historyPart.length > 0 && forecastPart.length > 0) {
            const lastHistory = historyPart[historyPart.length - 1];

            const bridgePoint = {
              ...lastHistory,
              rawPrediction: lastHistory.actualValue,
            };

            mergedData.push(bridgePoint);
          }

          mergedData = [...mergedData, ...forecastPart];

          dataMap[building.name] = mergedData;
        });

        setAllBuildingData(dataMap);
      } catch (err) {
        console.error(err);
        setError(err.message || '비교 데이터를 불러오지 못했습니다.');
        setAllBuildingData({});
      } finally {
        const endedAt = performance.now();
        setElapsedSec(((endedAt - startedAt) / 1000).toFixed(1));
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [appliedParams]);

  const splitIndex = useMemo(() => {
    // short: 과거 24시간
    return 24;
  }, []);

  const formattedTime = useMemo(() => {
    const { date, hour } = appliedParams;
    return `${date.getFullYear()}. ${(date.getMonth() + 1).toString().padStart(2, '0')}. ${date.getDate().toString().padStart(2, '0')}. ${hour}:00`;
  }, [appliedParams]);

  return (
    <div className="dashboard1-container">
      <Container className="py-5" fluid style={{ maxWidth: '1600px' }}>
        <header className="dashboard-header text-center mb-5">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="fw-bold display-5 mb-2" style={{ letterSpacing: '-2px' }}>
              캠퍼스 에너지 통합 비교
            </h1>
            <p className="text-muted">
              단기 비교 기준: 과거 1일 + 미래 2일
            </p>
          </motion.div>
        </header>

        <section className="time-selector-card shadow-sm mb-5">
          <Row className="justify-content-center align-items-end g-3">
            <Col xs="auto">
              <Form.Group>
                <Form.Label className="picker-label">날짜 선택</Form.Label>
                <div className="apple-datepicker-wrapper">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy년 MM월 dd일"
                    className="apple-date-input"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </Form.Group>
            </Col>

            <Col xs="auto">
              <Form.Group>
                <Form.Label className="picker-label">시간 설정</Form.Label>
                <Form.Select
                  className="apple-select"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i}시 00분
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs="auto">
              <Form.Group>
                <Form.Label className="picker-label">분석 범위</Form.Label>
                <div>
                  <ButtonGroup className="apple-period-group">
                    <Button
                      variant={period === 'short' ? 'dark' : 'outline-dark'}
                      onClick={() => setPeriod('short')}
                    >
                      단기
                    </Button>
                    <Button
                      variant={period === 'medium' ? 'dark' : 'outline-dark'}
                      onClick={() => setPeriod('medium')}
                    >
                      중기
                    </Button>
                    <Button
                      variant={period === 'long' ? 'dark' : 'outline-dark'}
                      onClick={() => setPeriod('long')}
                    >
                      장기
                    </Button>
                  </ButtonGroup>
                </div>
              </Form.Group>
            </Col>

            <Col xs="auto">
              <Button
                className="btn-analyze-start"
                style={{
                  height: '45px',
                  width: '180px',
                  color: '#ffffff',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  background: '#1d1d1f'
                }}
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? '불러오는 중...' : '통합 분석 업데이트'}
              </Button>
            </Col>
          </Row>
        </section>

        <section className="comparison-content-area mb-5">
          <Row className="g-4">
            <Col lg={9}>
              <div className="mb-4 px-2 d-flex justify-content-between align-items-end">
                <div>
                  <h3 className="fw-bold m-0" style={{ letterSpacing: '-1px' }}>
                    건물별 수요 패턴 수직 비교
                  </h3>
                  <p className="text-muted small m-0">
                    현재는 단기(short)만 확인 중이며, 과거 24시간 + 미래 48시간만 표시합니다.
                  </p>
                </div>
                <div className="text-muted small">
                  단기 비교 · 단위: MWh
                </div>
              </div>

              <div className="bg-white p-4 rounded-4 shadow-sm" style={{ minHeight: '720px' }}>
                {loading ? (
                  <div
                    className="d-flex flex-column justify-content-center align-items-center"
                    style={{ minHeight: '600px' }}
                  >
                    <Spinner animation="border" variant="dark" className="mb-3" />
                    <div className="text-muted">건물별 short 비교 데이터를 불러오는 중입니다.</div>
                  </div>
                ) : error ? (
                  <Alert variant="danger" className="mb-0">
                    {error}
                  </Alert>
                ) : (
                  <StackedComparison
                    allData={allBuildingData}
                    buildings={BUILDING_LIST}
                    selectedTime={formattedTime}
                    splitIndex={splitIndex}
                    period="short"
                  />
                )}
              </div>
            </Col>

            <Col lg={3}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-100"
              >
                <Card
                  className="border-0 shadow-sm rounded-4 h-100 overflow-hidden text-white"
                  style={{ background: '#1d1d1f' }}
                >
                  <Card.Header className="p-4 border-secondary bg-transparent">
                    <h4 className="fw-bold m-0">AI 분석 리포트</h4>
                    <p className="text-secondary small m-0 mt-2">{formattedTime} 기준</p>
                  </Card.Header>

                  <Card.Body className="p-4">
                    <div className="mb-5">
                      <h6 className="text-uppercase text-secondary fw-bold small mb-3">
                        테스트 범위
                      </h6>
                      <p className="lead fs-5">
                        현재는 <span className="text-info fw-bold">단기(short)</span>만 확인 중입니다.
                      </p>
                    </div>

                    <div className="mb-5">
                      <h6 className="text-uppercase text-secondary fw-bold small mb-3">
                        표시 구간
                      </h6>
                      <p className="lead fs-5">
                        과거 <span className="text-warning fw-bold">1일</span> + 미래 <span className="text-warning fw-bold">2일</span>
                      </p>
                    </div>

                    <div className="mb-5">
                      <h6 className="text-uppercase text-secondary fw-bold small mb-3">
                        로딩 시간
                      </h6>
                      <p className="lead fs-5">
                        {elapsedSec ? `${elapsedSec}초` : '-'}
                      </p>
                    </div>

                    <div className="mb-5">
                      <h6 className="text-uppercase text-secondary fw-bold small mb-3">
                        비교 대상
                      </h6>
                      <p className="opacity-75">
                        총 {BUILDING_LIST.length}개 건물의 전력 패턴을 비교합니다.
                      </p>
                    </div>

                    <div>
                      <h6 className="text-uppercase text-secondary fw-bold small mb-3">
                        참고
                      </h6>
                      <p className="opacity-75">
                        short가 정상 동작하면 그다음 medium, long으로 확장하면 됩니다.
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </section>
      </Container>
    </div>
  );
};

export default Dashboard1;