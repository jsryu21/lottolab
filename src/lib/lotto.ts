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

export const mockLottoDraws: LottoDraw[] = [
  { drwNo: 1124, drwNoDate: "2024-06-15", no1: 3, no2: 8, no3: 17, no4: 30, no5: 33, no6: 34, bonusNo: 41, totSellAmnt: 111425890000, firstWinAmnt: 2623547285, firstPrzWnerCo: 10 },
  { drwNo: 1123, drwNoDate: "2024-06-08", no1: 13, no2: 16, no3: 23, no4: 31, no5: 36, no6: 44, bonusNo: 38, totSellAmnt: 110900000000, firstWinAmnt: 1891000000, firstPrzWnerCo: 14 },
  { drwNo: 1122, drwNoDate: "2024-06-01", no1: 3, no2: 6, no3: 21, no4: 30, no5: 34, no6: 42, bonusNo: 22, totSellAmnt: 111320000000, firstWinAmnt: 2541000000, firstPrzWnerCo: 11 },
  { drwNo: 1121, drwNoDate: "2024-05-25", no1: 6, no2: 24, no3: 31, no4: 32, no5: 38, no6: 44, bonusNo: 8, totSellAmnt: 111250000000, firstWinAmnt: 1584000000, firstPrzWnerCo: 17 },
  { drwNo: 1120, drwNoDate: "2024-05-18", no1: 2, no2: 19, no3: 26, no4: 31, no5: 38, no6: 45, bonusNo: 1, totSellAmnt: 112340000000, firstWinAmnt: 2456000000, firstPrzWnerCo: 11 },
  { drwNo: 1119, drwNoDate: "2024-05-11", no1: 9, no2: 12, no3: 15, no4: 25, no5: 34, no6: 36, bonusNo: 3, totSellAmnt: 110500000000, firstWinAmnt: 2891000000, firstPrzWnerCo: 9 },
  { drwNo: 1118, drwNoDate: "2024-05-04", no1: 11, no2: 13, no3: 14, no4: 15, no5: 16, no6: 45, bonusNo: 3, totSellAmnt: 111450000000, firstWinAmnt: 1478000000, firstPrzWnerCo: 19 },
  { drwNo: 1117, drwNoDate: "2024-04-27", no1: 3, no2: 4, no3: 9, no4: 30, no5: 33, no6: 36, bonusNo: 35, totSellAmnt: 110800000000, firstWinAmnt: 2981000000, firstPrzWnerCo: 9 },
  { drwNo: 1116, drwNoDate: "2024-04-20", no1: 15, no2: 16, no3: 17, no4: 25, no5: 30, no6: 31, bonusNo: 32, totSellAmnt: 111890000000, firstWinAmnt: 2612000000, firstPrzWnerCo: 10 },
  { drwNo: 1115, drwNoDate: "2024-04-13", no1: 7, no2: 12, no3: 23, no4: 32, no5: 34, no6: 36, bonusNo: 8, totSellAmnt: 112100000000, firstWinAmnt: 2210000000, firstPrzWnerCo: 12 },
  { drwNo: 1114, drwNoDate: "2024-04-06", no1: 10, no2: 16, no3: 19, no4: 32, no5: 33, no6: 40, bonusNo: 30, totSellAmnt: 113400000000, firstWinAmnt: 1584000000, firstPrzWnerCo: 17 },
  { drwNo: 1113, drwNoDate: "2024-03-30", no1: 11, no2: 13, no3: 20, no4: 21, no5: 32, no6: 44, bonusNo: 8, totSellAmnt: 112900000000, firstWinAmnt: 1982000000, firstPrzWnerCo: 14 },
  { drwNo: 1112, drwNoDate: "2024-03-23", no1: 16, no2: 20, no3: 26, no4: 36, no5: 44, no6: 45, bonusNo: 24, totSellAmnt: 111950000000, firstWinAmnt: 2801000000, firstPrzWnerCo: 10 },
  { drwNo: 1111, drwNoDate: "2024-03-16", no1: 3, no2: 13, no3: 30, no4: 33, no5: 43, no6: 45, bonusNo: 4, totSellAmnt: 113500000000, firstWinAmnt: 1714000000, firstPrzWnerCo: 16 },
  { drwNo: 1110, drwNoDate: "2024-03-09", no1: 3, no2: 7, no3: 11, no4: 20, no5: 22, no6: 41, bonusNo: 24, totSellAmnt: 111800000000, firstWinAmnt: 2510000000, firstPrzWnerCo: 10 },
  { drwNo: 1109, drwNoDate: "2024-03-02", no1: 10, no2: 12, no3: 13, no4: 19, no5: 33, no6: 40, bonusNo: 2, totSellAmnt: 112100000000, firstWinAmnt: 1584000000, firstPrzWnerCo: 17 },
  { drwNo: 1108, drwNoDate: "2024-02-24", no1: 7, no2: 19, no3: 26, no4: 37, no5: 39, no6: 44, bonusNo: 27, totSellAmnt: 113100000000, firstWinAmnt: 1950000000, firstPrzWnerCo: 14 },
  { drwNo: 1107, drwNoDate: "2024-02-17", no1: 6, no2: 14, no3: 30, no4: 31, no5: 40, no6: 41, bonusNo: 29, totSellAmnt: 112400000000, firstWinAmnt: 2791000000, firstPrzWnerCo: 9 },
  { drwNo: 1106, drwNoDate: "2024-02-10", no1: 1, no2: 3, no3: 4, no4: 29, no5: 42, no6: 45, bonusNo: 36, totSellAmnt: 113900000000, firstWinAmnt: 2289000000, firstPrzWnerCo: 11 },
  { drwNo: 1105, drwNoDate: "2024-02-03", no1: 6, no2: 16, no3: 34, no4: 37, no5: 39, no6: 40, bonusNo: 11, totSellAmnt: 112800000000, firstWinAmnt: 1681000000, firstPrzWnerCo: 15 },
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
