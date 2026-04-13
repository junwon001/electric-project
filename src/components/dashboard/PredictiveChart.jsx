// src/components/dashboard/PredictiveChart.jsx

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from 'react-bootstrap';
import './PredictiveChart.css';

const PredictiveChart = ({ 
  title, data, splitIndex, showArea, xPeriodType, selectedTime,
  isMini = false, 
  themeColor = '#DC143C',
  hideControls = false // [추가] 슬라이더와 문구(범례) 표시 제어
}) => {
  
  // -----------------------------
  // [추가] 데이터 방어 코드
  // -----------------------------
  const safeData = Array.isArray(data) ? data : [];
  const safeLastIndex = Math.max(safeData.length - 1, 0);
  const safeSplitIndex = Math.min(Math.max(splitIndex ?? 0, 0), safeLastIndex);

  // 1. 데이터 및 요약 정보 계산 로직 (기존 유지)
  const { summary, formattedFullDate } = useMemo(() => {
    // 기존 코드
    // const currentVal = data[splitIndex].actualValue;
    // const nowObj = data[splitIndex].dateObj;

    // [수정] data가 비어 있거나 splitIndex가 범위를 벗어나도 안전하게 처리
    const fallbackDateObj = new Date();
    const currentItem = safeData?.[safeSplitIndex] ?? null;

    const currentVal = currentItem?.actualValue ?? 0;
    const nowObj = currentItem?.dateObj ?? fallbackDateObj;
    
    const fDate = `${nowObj.getFullYear()}년 ${String(nowObj.getMonth() + 1).padStart(2, '0')}월 ${String(nowObj.getDate()).padStart(2, '0')}일 ${String(nowObj.getHours()).padStart(2, '0')}:00`;

    let compareIndex = 0;
    if (xPeriodType === 'short') compareIndex = safeSplitIndex - 24;
    if (xPeriodType === 'medium') compareIndex = safeSplitIndex - (7 * 24);
    if (xPeriodType === 'long') compareIndex = safeSplitIndex - (30 * 24);

    // 기존 코드
    // const compareVal = data[compareIndex] ? data[compareIndex].actualValue : currentVal;

    // [수정] compareIndex 범위 보정
    compareIndex = Math.max(0, compareIndex);
    compareIndex = Math.min(compareIndex, safeLastIndex);

    const compareVal = safeData?.[compareIndex]?.actualValue ?? currentVal;
    
    const diff = parseFloat((currentVal - compareVal).toFixed(3));

    // [수정] 0으로 나누는 경우 방어
    const percent = compareVal !== 0
      ? parseFloat(((diff / compareVal) * 100).toFixed(3))
      : 0;
    
    return { 
      summary: { 
        currentVal, diff, percent, 
        color: diff >= 0 ? themeColor : '#007bff', 
        sign: diff >= 0 ? '+' : '', 
        periodName: xPeriodType === 'short' ? '1일 전' : xPeriodType === 'medium' ? '1주 전' : '1달 전' 
      },
      formattedFullDate: fDate
    };
  }, [safeData, safeSplitIndex, safeLastIndex, xPeriodType, themeColor]);

  // 2. ECharts 옵션 설정
  const option = useMemo(() => {
    const getRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const colors = { 
      actual: '#000000', 
      raw: '#a1a1a6', 
      llm: themeColor, 
      ci99: getRgba(themeColor, 0.15), 
      ci95: getRgba(themeColor, 0.3),
      now: '#1d1d1f',
      zoomFiller: 'rgba(206, 206, 206, 0.3)',
      zoomBackground: '#F5F5F7'
    };
    
    const names = {
      actual: isMini ? '실제값' : '실제 사용량', 
      raw: isMini ? '보정 전' : '보정 전 예측', 
      llm: isMini ? '보정 후' : '보정 후 예측',
      ci95: '95%구간', 
      ci99: '99%구간'
    };

    // 기존 코드
    // const currentTimeLabel = data[splitIndex].timeLabel;

    const currentTimeLabel = safeData?.[safeSplitIndex]?.timeLabel ?? '';

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        shadowBlur: 15,
        shadowColor: 'rgba(0,0,0,0.1)',
        confine: true,
        formatter: (params) => {
          // [수정] tooltip도 방어 처리
          if (!params || params.length === 0) return '';

          const dataIndex = params[0].dataIndex;
          const item = safeData?.[dataIndex] ?? {};
          
          let res = `<div style="font-weight:700; margin-bottom:8px; color:#1d1d1f">${params[0].axisValue ?? ''}</div>`;
          
          const orderMap = { [names.actual]: 1, [names.raw]: 2, [names.llm]: 3, [names.ci95]: 4, [names.ci99]: 5 };
          const sortedParams = [...params].filter(p => !p.seriesName.includes('Invisible')).sort((a, b) => (orderMap[a.seriesName] || 99) - (orderMap[b.seriesName] || 99));

          sortedParams.forEach(p => {
            let displayColor = '';
            let seriesName = p.seriesName;
            
            if (seriesName === names.actual) displayColor = colors.actual;
            else if (seriesName === names.raw) displayColor = colors.raw;
            else if (seriesName === names.llm) displayColor = colors.llm;
            else if (seriesName === names.ci99) displayColor = getRgba(themeColor, 0.45); 
            else if (seriesName === names.ci95) displayColor = getRgba(themeColor, 0.6);

            const isValid = (val) => typeof val === 'number' && !isNaN(val);
            let displayVal = "";
            if (seriesName === names.ci99 && item.ci99) {
              displayVal = (isValid(item.ci99[0]) && isValid(item.ci99[1])) ? `${item.ci99[0].toFixed(3)} ~ ${item.ci99[1].toFixed(3)}` : "-";
            } else if (seriesName === names.ci95 && item.ci95) {
              displayVal = (isValid(item.ci95[0]) && isValid(item.ci95[1])) ? `${item.ci95[0].toFixed(3)} ~ ${item.ci95[1].toFixed(3)}` : "-";
            } else {
              displayVal = isValid(p.value) ? `${p.value.toFixed(3)} MWh` : "-";
            }

            res += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:3px;">
                      <span style="color:${displayColor}">● ${seriesName}</span>
                      <span style="font-weight:700; color:#1d1d1f">${displayVal}</span>
                    </div>`;
          });
          return res;
        }
      },
      legend: {
        show: hideControls ? false : true, 
        data: [
          { name: names.actual, icon: 'circle', itemStyle: { color: colors.actual } },
          { name: names.raw, icon: 'circle', itemStyle: { color: colors.raw } },
          { name: names.llm, icon: 'circle', itemStyle: { color: colors.llm } },
          { name: names.ci95, icon: 'circle', itemStyle: { color: getRgba(themeColor, 0.6) } },
          { name: names.ci99, icon: 'circle', itemStyle: { color: getRgba(themeColor, 0.4) } }
        ],
        bottom: 0, 
        itemGap: isMini ? 10 : 20, 
        textStyle: { fontSize: isMini ? 9 : 11, color: '#86868b' }
      },
      grid: { 
        top: isMini ? 35 : 30, 
        left: isMini ? 25 : 10, 
        right: 20, 
        bottom: hideControls ? 30 : (isMini ? 60 : 105), 
        containLabel: true 
      },
      
      dataZoom: hideControls ? [] : [ 
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
          minSpan: 5
        },
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          bottom: isMini ? 35 : 45, 
          height: isMini ? 20 : 25,
          minSpan: 5,
          moveHandleSize: 0,
          handleIcon: 'path://M0 0h4v18h-4z',
          handleSize: '100%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetX: 1,
            shadowOffsetY: 1
          },
          fillerColor: colors.zoomFiller,
          borderColor: 'transparent',
          backgroundColor: colors.zoomBackground,
          showDetail: false,
          filterMode: 'none',
          dataBackground: {
            lineStyle: { color: '#000000', opacity: 0.2 },
            areaStyle: { color: '#000000', opacity: 0.05 }
          },
          selectedDataBackground: {
            lineStyle: { color: '#000000', opacity: 0.5 },
            areaStyle: { color: '#000000', opacity: 0.1 }
          }
        }
      ],
      
      xAxis: {
        type: 'category',
        // data: data.map(d => d.timeLabel),
        data: safeData.map(d => d?.timeLabel ?? d?.time ?? ''),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: !isMini },
        axisLabel: {
          show: true,
          interval: (index) => {
            // 기존 코드
            // const label = data[index].timeLabel;

            const item = safeData?.[index];
            const label = item?.timeLabel ?? item?.time ?? '';
            if (label === currentTimeLabel) return true;
            
            // [핵심 수정] 메인 화면 섹션 1(hideControls)일 때만 겹침 방지를 위해 24시간 간격으로 표시
            let step = 12;
            if (hideControls) {
              step = 24; 
            } else if (xPeriodType === 'short') {
              step = 6;
            } else if (xPeriodType === 'medium') {
              step = 24;
            } else if (xPeriodType === 'long') {
              step = 168; 
            }
            
            return index % step === 0;
          },
          color: (value) => value === currentTimeLabel ? colors.now : '#a1a1a6',
          fontSize: 9,
          formatter: (value, index) => {
            // 기존 코드
            // const d = data[index].dateObj;

            const d = safeData?.[index]?.dateObj;

            // [수정] dateObj가 없으면 원문 라벨만 표시
            if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
              return value;
            }

            // [핵심 수정] 메인 화면 섹션 1(hideControls)일 때는 글자 길이를 줄이기 위해 '일'만 표시
            if (hideControls) {
              return `${d.getDate()}일`;
            }
            return (xPeriodType === 'short')
              ? `${d.getDate()}일 ${d.getHours()}시` 
              : `${d.getMonth()+1}/${d.getDate()}`;
          }
        }
      },
      yAxis: { 
        type: 'value', 
        scale: true, 
        axisLabel: { show: true, color: '#a1a1a6', fontSize: 9 }, 
        splitLine: { show: !isMini, lineStyle: { type: 'dashed', color: '#f0f0f0' } } 
      },
      series: [
        { 
          // name: names.actual, type: 'line', data: data.map(d => d.actualValue), symbol: 'none',
          name: names.actual, type: 'line', data: safeData.map(d => d?.actualValue ?? null), symbol: 'none', 
          lineStyle: { color: colors.actual, width: isMini ? 1.5 : 2 }, z: 10 
        },
        { 
          // name: 'Invisible Base 99', type: 'line', data: data.map(d => d.ci99 ? d.ci99[0] : null),
          name: 'Invisible Base 99', type: 'line', data: safeData.map(d => d?.ci99 ? d.ci99[0] : null), 
          lineStyle: { opacity: 0 }, stack: 'ci99', symbol: 'none', silent: true 
        },
        { 
          // name: names.ci99, type: 'line', data: data.map(d => d.ci99 ? d.ci99[1] - d.ci99[0] : null),
          name: names.ci99, type: 'line', data: safeData.map(d => d?.ci99 ? d.ci99[1] - d.ci99[0] : null), 
          lineStyle: { opacity: 0 }, 
          areaStyle: { 
            color: colors.ci99, 
            opacity: showArea ? 0.6 : 0 
          }, 
          stack: 'ci99', symbol: 'none', z: 1, emphasis: { disabled: true }
        },
        { 
          // name: 'Invisible Base 95', type: 'line', data: data.map(d => d.ci95 ? d.ci95[0] : null),
          name: 'Invisible Base 95', type: 'line', data: safeData.map(d => d?.ci95 ? d.ci95[0] : null), 
          lineStyle: { opacity: 0 }, stack: 'ci95', symbol: 'none', silent: true 
        },
        { 
          // name: names.ci95, type: 'line', data: data.map(d => d.ci95 ? d.ci95[1] - d.ci95[0] : null),
          name: names.ci95, type: 'line', data: safeData.map(d => d?.ci95 ? d.ci95[1] - d.ci95[0] : null), 
          lineStyle: { opacity: 0 }, 
          areaStyle: { 
            color: colors.ci95, 
            opacity: showArea ? 0.7 : 0 
          }, 
          stack: 'ci95', symbol: 'none', z: 2, emphasis: { disabled: true }
        },
        { 
          // name: names.raw, type: 'line', data: data.map(d => d.rawPrediction), symbol: 'none',
          name: names.raw, type: 'line', data: safeData.map(d => d?.rawPrediction ?? null), symbol: 'none', 
          lineStyle: { color: colors.raw, width: 1, type: 'dashed' }, z: 5 
        },
        { 
          // name: names.llm, type: 'line', data: data.map(d => d.llmPrediction), symbol: 'none',
          name: names.llm, type: 'line', data: safeData.map(d => d?.llmPrediction ?? null), symbol: 'none', 
          lineStyle: { color: colors.llm, width: isMini ? 2 : 2.5 }, z: 15,
          markLine: {
            silent: true, symbol: 'none',
            lineStyle: { color: colors.now, width: 1.2, type: 'dashed' },
            label: { 
              show: true, 
              position: 'end', 
              formatter: '기준 시점', 
              fontSize: isMini ? 10 : 12, 
              color: colors.now,
              fontWeight: isMini ? 'bold' : 'normal'
            },
            // data: [{ xAxis: splitIndex }]
            data: [{ xAxis: safeSplitIndex }]
          }
        }
      ]
    };
  }, [safeData, safeSplitIndex, showArea, xPeriodType, themeColor, isMini, hideControls]);

  return (
    <Card className={`predictive-card mb-0 border-0 ${isMini ? 'is-mini' : ''}`}>
      <Card.Body className={isMini ? 'p-1 pb-3' : 'p-0'}>
        
        {isMini && (
          <div 
            className="d-flex align-items-center px-3 pt-2" 
            style={{ 
              gap: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: themeColor, flexShrink: 0 
              }} 
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#1d1d1f' }}>
                {title}
              </span>
              <span style={{ fontWeight: '700', fontSize: '15px', color: themeColor }}>
                {summary.currentVal.toFixed(3)}
                <span style={{ fontSize: '10px', color: '#a1a1a6', marginLeft: '2px', fontWeight: 'normal' }}>MWh</span>
              </span>
            </div>
          </div>
        )}

        {!isMini && (
          <div className="d-flex flex-column mb-3 p-3">
            <div className="d-flex align-items-center mb-2">
              <div className="chart-header-accent" style={{ backgroundColor: themeColor }}></div>
              <h5 className="chart-title m-0">{title}</h5>
              <span className="current-time-text ms-3">
                ({selectedTime ? selectedTime : formattedFullDate})
              </span>
            </div>
            <div className="ps-3 mt-1">
              <div className="value-display">
                {summary.currentVal.toFixed(3)}
                <span className="unit-text">MWh</span>
              </div>
              <div className="comparison-text" style={{ color: summary.color }}>
                {summary.periodName} 대비 {summary.sign}{summary.percent}% 
                ({summary.sign}{summary.diff.toLocaleString(undefined, {minimumFractionDigits: 3})} MWh)
              </div>
            </div>
          </div>
        )}

        <div className="echarts-container" style={{ height: isMini ? (hideControls ? '200px' : '280px') : '460px', marginTop: isMini ? '0' : '20px' }}>
          <ReactECharts option={option} style={{ height: '100%' }} notMerge={true} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default PredictiveChart;