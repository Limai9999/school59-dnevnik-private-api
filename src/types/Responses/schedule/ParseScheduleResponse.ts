export type ParseScheduleResponse = {
  status: boolean
  filename?: string
  error?: string
  isPreview: boolean
  schedule?: {
    distant: boolean
    schedule: string[]
    objectedSchedule: {
      time: string
      lesson: string | null
      room: string | null
    }[]
    startTime: string
    totalLessons: number
    date: string | null
    filename: string
    room?: string
    creationTime: number
  }
};
