export type LessonWithGrade = {
  grades: string[]
  lesson: string
}

export type DayData = {
  month: string
  day: string
  lessonsWithGrades: LessonWithGrade[]
}

export type AverageGrade = {
  lesson: string
  average: string
}

export type ReportResult = {
  status: boolean,
  error?: string,
  info: string[],
  result: {
    daysData: DayData[],
    averageGrades: AverageGrade[],
  },
  screenshot?: string,
};
