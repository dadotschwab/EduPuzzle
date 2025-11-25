/**
 * Performance insights data structure
 */
export interface PerformanceInsightsData {
  /** Total words learned by user */
  totalLearned: number
  /** Overall success rate percentage */
  successRate: number
  /** Puzzles completed this week */
  weeklyPuzzles: number
  /** Best learning time data */
  bestLearningTime: BestLearningTimeResult | null
  /** Word distribution across SRS stages */
  stageDistribution: StageData[]
  /** Words needing improvement */
  weakestWords: WeakWord[]
  /** Daily activity for past week */
  weeklyActivity: ActivityData[]
  /** Hourly success rate data */
  learningTimeData: LearningTimeData[]
  /** Trend indicators */
  trends: TrendsData
}

/**
 * Word stage distribution data point
 */
export interface StageData {
  /** SRS stage (0-6) */
  stage: number
  /** Number of words in this stage */
  count: number
}

/**
 * Daily activity data point
 */
export interface ActivityData {
  /** Day name (Monday, Tuesday, etc.) */
  day: string
  /** Puzzles completed on this day */
  puzzles: number
}

/**
 * Learning time analysis data point
 */
export interface LearningTimeData {
  /** Hour of day (0-23) */
  hour: number
  /** Success rate for this hour */
  successRate: number
}

/**
 * Weak word identification
 */
export interface WeakWord {
  /** Unique word identifier */
  id: string
  /** The word text */
  word: string
  /** Number of review attempts */
  attempts: number
  /** Accuracy percentage */
  accuracy: number
}

/**
 * Best learning time result from database function
 */
export interface BestLearningTimeResult {
  /** Hour with highest success rate */
  hour: number
  /** Success rate percentage for this hour */
  success_rate: number
}

/**
 * Trend indicators for performance metrics
 */
export interface TrendsData {
  /** Change in total learned words */
  learned: number
  /** Change in success rate */
  successRate: number
  /** Change in weekly puzzles */
  puzzles: number
}
