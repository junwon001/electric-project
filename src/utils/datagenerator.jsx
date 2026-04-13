// src/utils/datagenerator.jsx 수정 부분

export const generateHourlyDataWithTime = (pastDays, futureDays, baseTime, buildingName) => {
  const data = [];
  const now = baseTime instanceof Date ? baseTime : new Date(); 
  
  const pastHours = Math.max(1, pastDays * 24);
  const futureHours = Math.max(1, futureDays * 24);
  const totalHours = pastHours + futureHours;
  
  // 시작 시점을 pastHours만큼 뒤로 밀어서 i = pastHours일 때 정확히 baseTime이 되게 함
  const startTime = new Date(now.getTime() - pastHours * 60 * 60 * 1000);
  
  const buildingBaseMap = { /* ... 기존과 동일 ... */ };
  let baseUsage = buildingBaseMap[buildingName] || 150;

  for (let i = 0; i <= totalHours; i++) { // 미래 데이터까지 포함되도록 i <= totalHours
    const currentTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
    const timeStr = `${currentTime.getMonth() + 1}/${currentTime.getDate()} ${currentTime.getHours()}시`;
    
    const hourFactor = currentTime.getHours();
    const dailyPattern = Math.sin((hourFactor - 6) * (Math.PI / 12)) * 45;
    const noise = (Math.random() - 0.5) * 10; 
    const commonValue = baseUsage + dailyPattern + noise;
    
    let obj = {
      timeLabel: timeStr, 
      dateObj: currentTime,
      actualValue: null,
      rawPrediction: null,
      llmPrediction: null,
      ci99: null,
      ci95: null
    };

    // [수정 핵심] i가 pastHours 이하일 때까지 실제값(Actual)을 채웁니다.
    // 이렇게 하면 data[pastHours]가 정확히 사용자가 선택한 시간이 됩니다.
    if (i <= pastHours) {
      obj.actualValue = parseFloat(commonValue.toFixed(3));
    }

    // [수정 핵심] i가 pastHours 이상일 때부터 예측값을 채웁니다. (접점 포함)
    if (i >= pastHours) { 
      const startValue = (i === pastHours) 
        ? obj.actualValue 
        : parseFloat((commonValue + (Math.random() - 0.5) * 15).toFixed(3));
      
      obj.rawPrediction = startValue;

      const correction = (i === pastHours) ? 0 : (Math.sin(i * 0.2) * 12 + 5);
      const llmVal = parseFloat((startValue + correction).toFixed(3));
      obj.llmPrediction = llmVal;

      const spread = 8 + Math.sin(i * 0.1) * 3; 
      obj.ci99 = [
        parseFloat((llmVal - spread * 1.6).toFixed(3)), 
        parseFloat((llmVal + spread * 1.6).toFixed(3))
      ];
      obj.ci95 = [
        parseFloat((llmVal - spread * 0.8).toFixed(3)), 
        parseFloat((llmVal + spread * 0.8).toFixed(3))
      ];
    }
    
    data.push(obj);
  }
  
  return data;
};