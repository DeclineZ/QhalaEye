// 30 days of realistic patient improvement data (seeded for consistency)
const seed = 42;
function seededRandom(s: number) {
  let x = Math.sin(s) * 10000;
  return x - Math.floor(x);
}

function generateTrend(
  start: number,
  end: number,
  days: number,
  noise: number,
  seedOffset = 0
): number[] {
  return Array.from({ length: days }, (_, i) => {
    const progress = i / (days - 1);
    // easeInOut curve for natural improvement
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const trend = start + (end - start) * eased;
    const n = (seededRandom(seed + seedOffset + i) - 0.5) * 2 * noise;
    return Math.round(trend + n);
  });
}

const today = new Date();

export const historicalLabels: string[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

/** Saccadic latency in ms — trending DOWN (improvement) */
export const historicalSaccadic: number[] = generateTrend(460, 205, 30, 28, 0);

/** Convergence break point (IPD px) — trending UP (improvement) */
export const historicalConvergence: number[] = generateTrend(82, 148, 30, 7, 100);

/** Smooth pursuit accuracy % — trending UP (improvement) */
export const historicalPursuit: number[] = generateTrend(48, 87, 30, 5, 200);

export interface ChartDataPoint {
  date: string;
  saccadic: number;
  convergence: number;
  pursuit: number;
}

export const historicalChartData: ChartDataPoint[] = historicalLabels.map((date, i) => ({
  date,
  saccadic: historicalSaccadic[i],
  convergence: historicalConvergence[i],
  pursuit: historicalPursuit[i],
}));
