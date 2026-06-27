export interface LottoFilters {
  fixedNumbers: number[];
  excludedNumbers: number[];
  oddEvenRatio: string; // "all", "3:3", "2:4", "4:2", "1:5", "5:1", "0:6", "6:0"
  sumRange: { min: number; max: number } | null;
  consecutiveLimit?: number; // 0: 제한없음, 2: 2연속 이상 차단, 3: 3연속 이상 차단
  endingSumRange?: { min: number; max: number } | null;
}

export interface SavedNumber {
  id: string;
  numbers: number[];
  createdAt: string;
  memo?: string;
}

export interface LottoDraw {
  drwNo: number;
  drwNoDate: string;
  no1: number;
  no2: number;
  no3: number;
  no4: number;
  no5: number;
  no6: number;
  bonusNo: number;
  totSellAmnt?: number;
  firstWinAmnt?: number;
  firstPrzWnerCo?: number;
}

// 1. 계산 유틸리티
export function calculateOddEven(numbers: number[]): { odd: number; even: number } {
  let odd = 0;
  let even = 0;
  numbers.forEach((n) => {
    if (n % 2 === 0) even++;
    else odd++;
  });
  return { odd, even };
}

export function calculateSum(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

// 최대 연속 수 계산 (예: [1, 2, 4, 5, 6] -> 4,5,6이 연속하므로 3 반환)
export function getMaxConsecutiveCount(numbers: number[]): number {
  let maxSeq = 1;
  let currentSeq = 1;
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentSeq++;
    } else {
      maxSeq = Math.max(maxSeq, currentSeq);
      currentSeq = 1;
    }
  }
  return Math.max(maxSeq, currentSeq);
}

// 끝수 합 계산 (예: [12, 13, 25] -> 2+3+5 = 10)
export function calculateEndingSum(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + (curr % 10), 0);
}

// 2. 필터 검증기
export function isValidCombination(numbers: number[], filters: LottoFilters): boolean {
  // 2.1 고정수 포함 여부 검증
  for (const fixed of filters.fixedNumbers) {
    if (!numbers.includes(fixed)) return false;
  }

  // 2.2 제외수 미포함 여부 검증
  for (const excluded of filters.excludedNumbers) {
    if (numbers.includes(excluded)) return false;
  }

  // 2.3 홀짝 비율 검증
  if (filters.oddEvenRatio !== "all") {
    const { odd, even } = calculateOddEven(numbers);
    const ratioStr = `${odd}:${even}`;
    if (ratioStr !== filters.oddEvenRatio) return false;
  }

  // 2.4 합계 범위 검증
  if (filters.sumRange) {
    const sum = calculateSum(numbers);
    if (sum < filters.sumRange.min || sum > filters.sumRange.max) return false;
  }

  // 2.5 연속 번호 제한 검증
  if (filters.consecutiveLimit && filters.consecutiveLimit > 0) {
    const maxConsecutive = getMaxConsecutiveCount(numbers);
    if (maxConsecutive >= filters.consecutiveLimit) return false;
  }

  // 2.6 끝수 합 범위 검증
  if (filters.endingSumRange) {
    const endingSum = calculateEndingSum(numbers);
    if (endingSum < filters.endingSumRange.min || endingSum > filters.endingSumRange.max) return false;
  }

  return true;
}

// 3. 번호 추천 생성기 (최대 1000번 루프 돌며 필터 조건에 부합하는 수 생성)
export function generateLottoNumbers(
  count: number,
  filters: LottoFilters
): number[][] {
  const result: number[][] = [];
  const maxAttempts = 10000;
  let attempts = 0;

  // 선택 불가능한 경우 방지 (고정수와 제외수에 겹치는 수가 있거나, 고정수가 6개 초과인 경우 등)
  const intersect = filters.fixedNumbers.filter((n) =>
    filters.excludedNumbers.includes(n)
  );
  if (intersect.length > 0 || filters.fixedNumbers.length > 6) {
    // 필터를 해제하여 무작위 번호 반환
    return Array.from({ length: count }, () => generateRandomSet());
  }

  // 제외수를 뺀 가용 숫자 리스트
  const availablePool: number[] = [];
  for (let i = 1; i <= 45; i++) {
    if (!filters.excludedNumbers.includes(i) && !filters.fixedNumbers.includes(i)) {
      availablePool.push(i);
    }
  }

  // 남은 슬롯 수 계산
  const remainingCount = 6 - filters.fixedNumbers.length;
  if (availablePool.length < remainingCount) {
    // 가용 풀이 너무 적으면 그냥 리턴
    return Array.from({ length: count }, () => generateRandomSet());
  }

  while (result.length < count && attempts < maxAttempts) {
    attempts++;
    // 고정수를 복사하여 시작
    const currentSet = [...filters.fixedNumbers];
    
    // 남은 슬롯 채우기 위해 풀 셔플
    const shuffledPool = [...availablePool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < remainingCount; i++) {
      currentSet.push(shuffledPool[i]);
    }
    
    // 오름차순 정렬
    currentSet.sort((a, b) => a - b);

    // 필터 조건 체크
    if (isValidCombination(currentSet, filters)) {
      // 중복 조합 방지
      const key = currentSet.join(",");
      const isDuplicate = result.some((set) => set.join(",") === key);
      if (!isDuplicate) {
        result.push(currentSet);
      }
    }
  }

  // 조건이 너무 까다로워 최대 루프 돌 때까지 다 채우지 못한 경우, 무작위로 빈 자리 채움
  while (result.length < count) {
    const randomSet = generateRandomSet();
    const isDuplicate = result.some((set) => set.join(",") === randomSet.join(","));
    if (!isDuplicate) {
      result.push(randomSet);
    }
  }

  return result;
}

// 4. 완전 무작위 6개 세트 생성
export function generateRandomSet(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(randomIndex, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

// 5. 로컬 모드를 위한 기본 꿈 풀이 매핑 테이블 (Gemini API가 없거나 실패 시 백업용)
export const presetDreamKeywords: Record<string, number[]> = {
  돼지: [8, 12, 24, 38],
  돈: [7, 15, 23, 33],
  황금: [7, 18, 29, 45],
  하늘: [3, 11, 28, 37],
  날다: [2, 14, 25, 41],
  물: [1, 10, 22, 39],
  불: [4, 15, 26, 40],
  대통령: [1, 9, 10, 41],
  뱀: [4, 19, 28, 44],
  집: [2, 13, 21, 35],
  조상: [1, 8, 19, 30],
  피: [5, 17, 26, 34],
  화장실: [6, 16, 25, 33],
  보석: [7, 18, 31, 45],
  똥: [4, 15, 25, 33, 40],
};

// 폴백용 샘플 데이터 (DB 연동 및 크롤링 완료 전 UI 미리보기용)
// 실제 당첨 번호는 DB 크롤링 후 자동 대체됨
export const mockLottoDraws: LottoDraw[] = [
  { drwNo: 1229, drwNoDate: "2026-06-20", no1: 3, no2: 14, no3: 22, no4: 30, no5: 38, no6: 44, bonusNo: 17, totSellAmnt: 115200000000, firstWinAmnt: 2341000000, firstPrzWnerCo: 12 },
  { drwNo: 1228, drwNoDate: "2026-06-13", no1: 6, no2: 11, no3: 19, no4: 28, no5: 37, no6: 43, bonusNo: 2, totSellAmnt: 114900000000, firstWinAmnt: 3012000000, firstPrzWnerCo: 9 },
  { drwNo: 1227, drwNoDate: "2026-06-06", no1: 1, no2: 13, no3: 24, no4: 31, no5: 39, no6: 45, bonusNo: 8, totSellAmnt: 115600000000, firstWinAmnt: 1892000000, firstPrzWnerCo: 14 },
  { drwNo: 1226, drwNoDate: "2026-05-30", no1: 5, no2: 16, no3: 20, no4: 27, no5: 36, no6: 41, bonusNo: 33, totSellAmnt: 114300000000, firstWinAmnt: 2654000000, firstPrzWnerCo: 10 },
  { drwNo: 1225, drwNoDate: "2026-05-23", no1: 4, no2: 9, no3: 21, no4: 32, no5: 40, no6: 44, bonusNo: 15, totSellAmnt: 115100000000, firstWinAmnt: 1743000000, firstPrzWnerCo: 16 },
  { drwNo: 1224, drwNoDate: "2026-05-16", no1: 7, no2: 18, no3: 23, no4: 29, no5: 35, no6: 42, bonusNo: 11, totSellAmnt: 114700000000, firstWinAmnt: 2890000000, firstPrzWnerCo: 9 },
  { drwNo: 1223, drwNoDate: "2026-05-09", no1: 2, no2: 10, no3: 17, no4: 26, no5: 34, no6: 43, bonusNo: 39, totSellAmnt: 115400000000, firstWinAmnt: 2103000000, firstPrzWnerCo: 12 },
  { drwNo: 1222, drwNoDate: "2026-05-02", no1: 8, no2: 15, no3: 25, no4: 33, no5: 38, no6: 45, bonusNo: 20, totSellAmnt: 114800000000, firstWinAmnt: 1560000000, firstPrzWnerCo: 18 },
  { drwNo: 1221, drwNoDate: "2026-04-25", no1: 3, no2: 12, no3: 22, no4: 28, no5: 36, no6: 41, bonusNo: 5, totSellAmnt: 115900000000, firstWinAmnt: 3250000000, firstPrzWnerCo: 8 },
  { drwNo: 1220, drwNoDate: "2026-04-18", no1: 6, no2: 19, no3: 24, no4: 30, no5: 37, no6: 44, bonusNo: 13, totSellAmnt: 115200000000, firstWinAmnt: 2430000000, firstPrzWnerCo: 11 },
  { drwNo: 1219, drwNoDate: "2026-04-11", no1: 1, no2: 8, no3: 16, no4: 27, no5: 35, no6: 42, bonusNo: 23, totSellAmnt: 114600000000, firstWinAmnt: 1981000000, firstPrzWnerCo: 13 },
  { drwNo: 1218, drwNoDate: "2026-04-04", no1: 4, no2: 14, no3: 21, no4: 31, no5: 39, no6: 45, bonusNo: 9, totSellAmnt: 115300000000, firstWinAmnt: 2761000000, firstPrzWnerCo: 9 },
  { drwNo: 1217, drwNoDate: "2026-03-28", no1: 7, no2: 11, no3: 18, no4: 26, no5: 33, no6: 40, bonusNo: 36, totSellAmnt: 114400000000, firstWinAmnt: 1620000000, firstPrzWnerCo: 17 },
  { drwNo: 1216, drwNoDate: "2026-03-21", no1: 2, no2: 13, no3: 23, no4: 29, no5: 38, no6: 43, bonusNo: 6, totSellAmnt: 115700000000, firstWinAmnt: 2980000000, firstPrzWnerCo: 9 },
  { drwNo: 1215, drwNoDate: "2026-03-14", no1: 5, no2: 17, no3: 22, no4: 32, no5: 37, no6: 44, bonusNo: 28, totSellAmnt: 114100000000, firstWinAmnt: 1840000000, firstPrzWnerCo: 14 },
  { drwNo: 1214, drwNoDate: "2026-03-07", no1: 3, no2: 10, no3: 20, no4: 25, no5: 34, no6: 41, bonusNo: 16, totSellAmnt: 115500000000, firstWinAmnt: 2210000000, firstPrzWnerCo: 12 },
  { drwNo: 1213, drwNoDate: "2026-02-28", no1: 9, no2: 15, no3: 24, no4: 30, no5: 36, no6: 42, bonusNo: 19, totSellAmnt: 114200000000, firstWinAmnt: 3100000000, firstPrzWnerCo: 8 },
  { drwNo: 1212, drwNoDate: "2026-02-21", no1: 4, no2: 12, no3: 21, no4: 28, no5: 35, no6: 45, bonusNo: 7, totSellAmnt: 115000000000, firstWinAmnt: 1720000000, firstPrzWnerCo: 16 },
  { drwNo: 1211, drwNoDate: "2026-02-14", no1: 1, no2: 16, no3: 23, no4: 31, no5: 38, no6: 43, bonusNo: 10, totSellAmnt: 114800000000, firstWinAmnt: 2560000000, firstPrzWnerCo: 10 },
  { drwNo: 1210, drwNoDate: "2026-02-07", no1: 6, no2: 14, no3: 19, no4: 27, no5: 33, no6: 40, bonusNo: 44, totSellAmnt: 115100000000, firstWinAmnt: 1930000000, firstPrzWnerCo: 13 },
];

export interface PerformanceReport {
  highestRank: string;
  highestDrawNo: number | null;
  highestDate: string | null;
  counts: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
  };
}

export function checkHistoricalPerformance(set: number[], drawsList: LottoDraw[]): PerformanceReport {
  let highestRankVal = 6; // 6: 낙첨/매칭없음, 1~5: 1등~5등
  let highestDrawNo: number | null = null;
  let highestDate: string | null = null;
  
  const counts = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
  
  drawsList.forEach((d) => {
    const winningNumbers = [d.no1, d.no2, d.no3, d.no4, d.no5, d.no6];
    const matchCount = set.filter((n) => winningNumbers.includes(n)).length;
    const matchBonus = set.includes(d.bonusNo);
    
    let rank = 6;
    if (matchCount === 6) {
      rank = 1;
      counts.first++;
    } else if (matchCount === 5 && matchBonus) {
      rank = 2;
      counts.second++;
    } else if (matchCount === 5) {
      rank = 3;
      counts.third++;
    } else if (matchCount === 4) {
      rank = 4;
      counts.fourth++;
    } else if (matchCount === 3) {
      rank = 5;
      counts.fifth++;
    }
    
    if (rank < highestRankVal) {
      highestRankVal = rank;
      highestDrawNo = d.drwNo;
      highestDate = d.drwNoDate;
    }
  });
  
  const rankLabels = ["", "1등", "2등", "3등", "4등", "5등", "없음"];
  
  return {
    highestRank: rankLabels[highestRankVal],
    highestDrawNo,
    highestDate,
    counts,
  };
}
