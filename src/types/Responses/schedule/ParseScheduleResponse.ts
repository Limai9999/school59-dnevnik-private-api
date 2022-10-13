export type ParseScheduleResponse = {
  status: boolean
  filename?: string
  error?: string
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
    date: string
    filename: string
    room?: number
    creationTime: number
  }
};
