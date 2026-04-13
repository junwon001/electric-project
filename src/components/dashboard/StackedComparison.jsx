// src/components/dashboard/StackedComparison.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import PredictiveChart from './PredictiveChart';

const StackedComparison = ({ allData, buildings, selectedTime, splitIndex, period }) => {
  return (
    <div className="stacked-comparison-wrapper">
      {buildings.map((b, idx) => (
        <motion.div
          key={b.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          className="mb-3" // 차트 간 간격
        >
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            {/* PredictiveChart 내부에서 점+이름+수치를 한 줄로 출력하므로 
               여기서는 레이아웃과 높이만 관리합니다.
            */}
            <div style={{ height: '320px', width: '100%' }}>
              <PredictiveChart 
                title={b.name}
                data={allData[b.name]}
                splitIndex={splitIndex}
                selectedTime={selectedTime}
                themeColor={b.color}
                isMini={true} 
                showArea={true}
                // [수정] "short" 고정 대신 부모로부터 받은 period(short, medium, long)를 적용
                xPeriodType={period} 
                hideXAxis={idx !== buildings.length - 1} 
              />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StackedComparison;