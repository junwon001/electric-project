// src/pages/Dashboard/Dashboard.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Form, Button, ButtonGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import PredictiveChart from '../../components/dashboard/PredictiveChart';
import './Dashboard.css';

const BUILDING_COLORS = {
  "광개토관": "#DC143C",
  "충무관": "#003cff",
  "대양AI센터": "#FFCC00",
  "대양AI관": "#FFCC00",
  "집현관": "#34C759",
  "학생회관": "#b450f2",
  "종합 분석": "#8B4513"
};

const VIEW_CONFIG = {
  short: {
    label: '단기',
    horizon: 24 * 2,
    contextHours: 24 * 85,
    displayPastHours: 24,
    xPeriodType: 'short',
  },
  medium: {
    label: '중기',
    horizon: 24 * 7,
    contextHours: 24 * 85,
    displayPastHours: 24 * 7,
    xPeriodType: 'medium',
  },
  long: {
    label: '장기',
    horizon: 24 * 30,
    contextHours: 24 * 85,
    displayPastHours: 24 * 60,
    xPeriodType: 'long',
  },
};

const Dashboard = () => {
  const { buildingName } = useParams();

  const [isTimeSet, setIsTimeSet] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [hour, setHour] = useState('13');
  const [viewType, setViewType] = useState('short');
  const [appliedParams, setAppliedParams] = useState(null);

  const [predictBundle, setPredictBundle] = useState(null);

  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictError, setPredictError] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const [academicData, setAcademicData] = useState(null);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [academicError, setAcademicError] = useState(null);

  const [progressInfo, setProgressInfo] = useState({
    startedAt: null,
    shortDoneAt: null,
    mediumDoneAt: null,
    longDoneAt: null,
  });
  const [elapsedMs, setElapsedMs] = useState(0);

  const currentBuilding = buildingName || "종합 분석";
  const titleColor = BUILDING_COLORS[currentBuilding] || "#1d1d1f";

  useEffect(() => {
    setIsTimeSet(false);
    setAppliedParams(null);
    setPredictBundle(null);
    setPredictError(null);
    setWeatherData(null);
    setWeatherError(null);
    setAcademicData(null);
    setAcademicError(null);
    setViewType('short');
    setProgressInfo({
      startedAt: null,
      shortDoneAt: null,
      mediumDoneAt: null,
      longDoneAt: null,
    });
    setElapsedMs(0);
  }, [buildingName]);

  useEffect(() => {
    if (!progressInfo.startedAt) {
      setElapsedMs(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedMs(Date.now() - progressInfo.startedAt);
    }, 500);

    return () => clearInterval(timer);
  }, [progressInfo.startedAt]);

  const formattedAppliedDate = useMemo(() => {
    if (!appliedParams) return "";
    const { date, hour: h } = appliedParams;
    return `${date.getFullYear()}년 ${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}월 ${date.getDate().toString().padStart(2, '0')}일 ${h}:00`;
  }, [appliedParams]);

  const apiDateTime = useMemo(() => {
    if (!appliedParams) return "";
    const time = new Date(appliedParams.date);
    time.setHours(parseInt(appliedParams.hour, 10), 0, 0, 0);

    const yyyy = time.getFullYear();
    const mm = String(time.getMonth() + 1).padStart(2, '0');
    const dd = String(time.getDate()).padStart(2, '0');
    const hh = String(time.getHours()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:00:00`;
  }, [appliedParams]);

  const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)}초`;

  const getStepText = (label, status, doneAt) => {
    if (!progressInfo.startedAt) return `${label}: 대기`;

    if (status === 'done' && doneAt) {
      return `${label}: 완료 (${formatSeconds(doneAt - progressInfo.startedAt)})`;
    }

    if (status === 'loading') {
      return `${label}: 계산 중... (${formatSeconds(elapsedMs)})`;
    }

    if (status === 'error') {
      return `${label}: 오류`;
    }

    if (status === 'not_requested') {
      return `${label}: 대기`;
    }

    return `${label}: 대기`;
  };

  const mergeBundleState = (prev, next) => {
    if (!prev) return next;
    return {
      ...prev,
      short: next.short ?? prev.short,
      medium: next.medium ?? prev.medium,
      long: next.long ?? prev.long,
      short_status: next.short_status ?? prev.short_status,
      medium_status: next.medium_status ?? prev.medium_status,
      long_status: next.long_status ?? prev.long_status,
      building: next.building ?? prev.building,
      datetime: next.datetime ?? prev.datetime,
      context_hours: next.context_hours ?? prev.context_hours,
    };
  };

  const fetchCachedPredict = async (requestedViewType, paramsOverride = null, shouldUpdateState = true) => {
    const params = paramsOverride || appliedParams;
    if (!params) return null;

    const selectedDateTime = new Date(params.date);
    selectedDateTime.setHours(parseInt(params.hour, 10), 0, 0, 0);

    const yyyy = selectedDateTime.getFullYear();
    const mm = String(selectedDateTime.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDateTime.getDate()).padStart(2, '0');
    const hh = String(selectedDateTime.getHours()).padStart(2, '0');

    const requestDateTime = `${yyyy}-${mm}-${dd} ${hh}:00:00`;

    const response = await fetch("http://127.0.0.1:8000/api/power/predict_cached", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        building: currentBuilding,
        datetime: requestDateTime,
        context_hours: 24 * 85,
        view_type: requestedViewType
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`예측 캐시 데이터를 불러오지 못했습니다. (${response.status}) ${errorText}`);
    }

    const result = await response.json();
    console.log("cached result:", requestedViewType, result);

    if (shouldUpdateState) {
      setPredictBundle((prev) => mergeBundleState(prev, result));
    }

    return result;
  };

  const prefillSequentialCache = async (paramsForAnalyze) => {
    try {
      setPredictBundle((prev) => prev ? { ...prev, medium_status: prev.medium ? prev.medium_status : 'loading' } : prev);
      const mediumResult = await fetchCachedPredict('medium', paramsForAnalyze, false);
      setPredictBundle((prev) => mergeBundleState(prev, mediumResult));
      setProgressInfo((prev) => ({
        ...prev,
        mediumDoneAt: Date.now(),
      }));

      setPredictBundle((prev) => prev ? { ...prev, long_status: prev.long ? prev.long_status : 'loading' } : prev);
      const longResult = await fetchCachedPredict('long', paramsForAnalyze, false);
      setPredictBundle((prev) => mergeBundleState(prev, longResult));
      setProgressInfo((prev) => ({
        ...prev,
        longDoneAt: Date.now(),
      }));
    } catch (error) {
      console.error("sequential cache fill error:", error);
    }
  };

  const handleAnalyze = async () => {
    const nextAppliedParams = {
      date: startDate,
      hour: hour
    };

    const startedAt = Date.now();

    setAppliedParams(nextAppliedParams);
    setIsTimeSet(true);
    setViewType('short');
    setProgressInfo({
      startedAt,
      shortDoneAt: null,
      mediumDoneAt: null,
      longDoneAt: null,
    });

    if (currentBuilding === "종합 분석") {
      setPredictError("종합 분석은 현재 예측 API에서 지원하지 않습니다. 건물을 선택해주세요.");
      setPredictBundle(null);
      return;
    }

    try {
      setLoadingPredict(true);
      setPredictError(null);
      setPredictBundle(null);

      const shortResult = await fetchCachedPredict('short', nextAppliedParams, false);
      setPredictBundle(shortResult);
      setProgressInfo((prev) => ({
        ...prev,
        shortDoneAt: Date.now(),
      }));
    } catch (error) {
      console.error("predict cached fetch error:", error);
      setPredictError(error.message);
      setPredictBundle(null);
    } finally {
      setLoadingPredict(false);
    }

    prefillSequentialCache(nextAppliedParams);
  };

  useEffect(() => {
    if (!isTimeSet || !appliedParams || !apiDateTime) return;

    const fetchWeatherData = async () => {
      try {
        setLoadingWeather(true);
        setWeatherError(null);

        const response = await fetch(
          `http://127.0.0.1:8000/api/weather?datetime=${encodeURIComponent(apiDateTime)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`날씨 데이터를 불러오지 못했습니다. (${response.status}) ${errorText}`);
        }

        const result = await response.json();
        setWeatherData(result);
      } catch (error) {
        console.error("weather fetch error:", error);
        setWeatherError(error.message);
        setWeatherData(null);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeatherData();
  }, [isTimeSet, appliedParams, apiDateTime]);

  useEffect(() => {
    if (!isTimeSet || !appliedParams || !apiDateTime) return;

    const fetchAcademicData = async () => {
      try {
        setLoadingAcademic(true);
        setAcademicError(null);

        const response = await fetch(
          `http://127.0.0.1:8000/api/academic_information?datetime=${encodeURIComponent(apiDateTime)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`학사정보 데이터를 불러오지 못했습니다. (${response.status}) ${errorText}`);
        }

        const result = await response.json();
        setAcademicData(result);
      } catch (error) {
        console.error("academic fetch error:", error);
        setAcademicError(error.message);
        setAcademicData(null);
      } finally {
        setLoadingAcademic(false);
      }
    };

    fetchAcademicData();
  }, [isTimeSet, appliedParams, apiDateTime]);

  const handleChangeView = async (nextViewType) => {
    setViewType(nextViewType);

    if (!predictBundle) return;
    if (predictBundle[nextViewType]) return;

    try {
      setLoadingPredict(true);
      setPredictError(null);

      setPredictBundle((prev) =>
        prev ? { ...prev, [`${nextViewType}_status`]: 'loading' } : prev
      );

      const result = await fetchCachedPredict(nextViewType, null, false);
      setPredictBundle((prev) => mergeBundleState(prev, result));

      if (nextViewType === 'short') {
        setProgressInfo((prev) => ({ ...prev, shortDoneAt: prev.shortDoneAt || Date.now() }));
      } else if (nextViewType === 'medium') {
        setProgressInfo((prev) => ({ ...prev, mediumDoneAt: prev.mediumDoneAt || Date.now() }));
      } else if (nextViewType === 'long') {
        setProgressInfo((prev) => ({ ...prev, longDoneAt: prev.longDoneAt || Date.now() }));
      }
    } catch (error) {
      console.error("view change cached fetch error:", error);
      setPredictError(error.message);
    } finally {
      setLoadingPredict(false);
    }
  };

  const currentPredictData = useMemo(() => {
    if (!predictBundle) return null;
    return predictBundle[viewType] || null;
  }, [predictBundle, viewType]);

  const currentStatus = useMemo(() => {
    if (!predictBundle) return "not_requested";
    return predictBundle[`${viewType}_status`] || "not_requested";
  }, [predictBundle, viewType]);

  const mergedChartData = useMemo(() => {
    if (!currentPredictData) return [];

    const config = VIEW_CONFIG[viewType];
    const historySource = currentPredictData.history || [];
    const forecastSource = currentPredictData.forecast || [];

    const visibleHistory = historySource.slice(-config.displayPastHours);
    const visibleForecast = forecastSource.slice(0, config.horizon);

    const historyPart = visibleHistory.map((item) => {
      const dateObj = new Date(item.time);
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');

      return {
        time: item.time,
        timeLabel: `${month}/${day} ${hh}:00`,
        dateObj,
        actualValue: item.value,
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

    const forecastPart = visibleForecast.map((item) => {
      const dateObj = new Date(item.time);
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');

      return {
        time: item.time,
        timeLabel: `${month}/${day} ${hh}:00`,
        dateObj,
        actualValue: null,
        rawPrediction: item.value,
        llmPrediction: null,
        ci95: null,
        ci99: null,
        ci95Upper: null,
        ci95Lower: null,
        ci99Upper: null,
        ci99Lower: null,
      };
    });

    const mergedHistoryPart = [...historyPart];

    if (mergedHistoryPart.length > 0) {
      const lastIndex = mergedHistoryPart.length - 1;
      mergedHistoryPart[lastIndex] = {
        ...mergedHistoryPart[lastIndex],
        rawPrediction: mergedHistoryPart[lastIndex].actualValue,
      };
    }

    return [...mergedHistoryPart, ...forecastPart];
  }, [currentPredictData, viewType]);

  const chartSplitIndex = useMemo(() => {
    const config = VIEW_CONFIG[viewType];
    const visibleHistoryLength = Math.min(
      (currentPredictData?.history || []).length,
      config.displayPastHours
    );
    return Math.max(visibleHistoryLength - 1, 0);
  }, [currentPredictData, viewType]);

  return (
    <div className="dashboard-page" style={{ '--btn-color': titleColor }}>
      <Container>
        <header className="dashboard-header text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1
              className="dashboard-title"
              style={{
                color: titleColor,
                transition: 'color 0.4s ease',
                textShadow: titleColor === "#FFCC00" ? '0px 0px 1px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {currentBuilding.toUpperCase()}
            </h1>
            <p className="dashboard-subtitle">
              {currentBuilding} 실시간 전력 수요 예측 및 XAI 신뢰구간 분석 시스템
            </p>
          </motion.div>
        </header>

        <section className="time-selector-card shadow-sm">
          <Row className="justify-content-center align-items-end gap-5">
            <Col md="auto">
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

            <Col md="auto">
              <Form.Group>
                <Form.Label className="picker-label">시간 설정</Form.Label>
                <Form.Select
                  className="apple-select"
                  style={{ width: '200px' }}
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i}시 00분
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md="auto">
              <Button
                className="btn-analyze-start"
                style={{
                  width: '220px',
                  backgroundColor: titleColor,
                  borderColor: titleColor,
                  color: '#ffffff',
                  transition: 'all 0.4s ease',
                  textShadow: titleColor === "#FFCC00" ? '0px 0px 1px rgba(0,0,0,0.2)' : 'none'
                }}
                onClick={handleAnalyze}
              >
                데이터 분석 시작
              </Button>
            </Col>
          </Row>
        </section>

        <AnimatePresence mode="wait">
          {isTimeSet && appliedParams ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                style={{
                  marginBottom: '12px',
                  padding: '12px 16px',
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  color: '#ddd',
                  fontSize: '0.95rem',
                  lineHeight: '1.8'
                }}
              >
                <div>{getStepText('단기', predictBundle?.short_status, progressInfo.shortDoneAt)}</div>
                <div>{getStepText('중기', predictBundle?.medium_status, progressInfo.mediumDoneAt)}</div>
                <div>{getStepText('장기', predictBundle?.long_status, progressInfo.longDoneAt)}</div>
              </div>

              <div className="chart-main-section shadow-sm mb-4">
                <div className="chart-header-wrapper d-flex justify-content-between align-items-center mb-4">
                  <h3 className="chart-card-title">
                    {viewType === 'short'
                      ? `⚡ ${currentBuilding} 단기 예측`
                      : viewType === 'medium'
                        ? `📅 ${currentBuilding} 중기 예측`
                        : `📈 ${currentBuilding} 장기 예측`}
                  </h3>

                  <ButtonGroup className="apple-segmented-control">
                    <Button
                      className={viewType === 'short' ? 'active' : ''}
                      onClick={() => handleChangeView('short')}
                    >
                      단기
                    </Button>
                    <Button
                      className={viewType === 'medium' ? 'active' : ''}
                      onClick={() => handleChangeView('medium')}
                    >
                      중기
                    </Button>
                    <Button
                      className={viewType === 'long' ? 'active' : ''}
                      onClick={() => handleChangeView('long')}
                    >
                      장기
                    </Button>
                  </ButtonGroup>
                </div>

                {loadingPredict && (
                  <div style={{ marginBottom: '12px', color: '#999' }}>
                    예측 모델 실행 중...
                  </div>
                )}

                {predictError && (
                  <div style={{ marginBottom: '12px', color: '#ff6b6b' }}>
                    {predictError}
                  </div>
                )}

                {!loadingPredict && currentStatus !== 'done' && (
                  <div style={{ marginBottom: '12px', color: '#999' }}>
                    {VIEW_CONFIG[viewType].label} 예측 계산 중...
                  </div>
                )}

                <div className="chart-display-area">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewType}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentPredictData ? (
                        <PredictiveChart
                          title={`${currentBuilding} ${VIEW_CONFIG[viewType].label} 예측`}
                          buildingName={currentBuilding}
                          selectedTime={formattedAppliedDate}
                          data={mergedChartData}
                          splitIndex={chartSplitIndex}
                          showArea={true}
                          xPeriodType={VIEW_CONFIG[viewType].xPeriodType}
                          themeColor={titleColor}
                        />
                      ) : (
                        <div style={{ color: '#999', padding: '40px 0', textAlign: 'center' }}>
                          {VIEW_CONFIG[viewType].label} 데이터가 아직 없습니다.
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <Row className="g-4">
                <Col xs={12}>
                  <div className="info-card shadow-sm">
                    <h5 className="info-card-title">🤖 LLM 분석 리포트</h5>
                    <div className="info-card-content">
                      <div className="llm-report-box-wide">
                        "선택하신 <strong>{appliedParams.hour}시</strong>를 기준으로 분석한 결과, <strong style={{ color: titleColor }}>{currentBuilding}</strong>의 전력 사용 패턴은..."
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-card shadow-sm">
                    <h5 className="info-card-title">🌡️ 실시간 기온</h5>
                    <div className="info-card-content">
                      {loadingWeather ? (
                        <span className="weather-temp">불러오는 중...</span>
                      ) : weatherError ? (
                        <span className="weather-temp" style={{ color: '#ff6b6b', fontSize: '1rem' }}>
                          데이터 없음
                        </span>
                      ) : weatherData ? (
                        <div>
                          <span className="weather-temp">
                            {weatherData.temperature !== null ? `${weatherData.temperature}°C` : '기온 없음'}
                          </span>
                          <div style={{ marginTop: '10px', fontSize: '0.95rem', color: '#cfcfcf', lineHeight: '1.7' }}>
                            <div>습도: {weatherData.humidity !== null ? `${weatherData.humidity}%` : '-'}</div>
                            <div>풍속: {weatherData.wind_speed !== null ? `${weatherData.wind_speed} m/s` : '-'}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="weather-temp">데이터 없음</span>
                      )}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-card shadow-sm">
                    <h5 className="info-card-title">🏫 학사 정보</h5>
                    <div className="info-card-content">
                      {loadingAcademic ? (
                        <div>불러오는 중...</div>
                      ) : academicError ? (
                        <div style={{ color: '#ff6b6b' }}>데이터 없음</div>
                      ) : academicData ? (
                        <ul className="academic-info-list">
                          <li>• 학사일정: {academicData.academicEvent || '-'}</li>
                          <li>• 개강여부: {academicData.semesterStatus || '-'}</li>
                          <li>• 코로나 지표: {academicData.covid !== null ? academicData.covid : '-'}</li>
                        </ul>
                      ) : (
                        <div>데이터 없음</div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </motion.div>
          ) : (
            <motion.div key="placeholder" className="analysis-placeholder">
              <div className="placeholder-content text-center">
                <div className="icon-clock">🕒</div>
                <h2 style={{ color: titleColor }}>{currentBuilding} 분석 시점을 선택해주세요</h2>
                <p className="text-muted">날짜와 시간을 설정한 후 '데이터 분석 시작' 버튼을 눌러주세요.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Dashboard;