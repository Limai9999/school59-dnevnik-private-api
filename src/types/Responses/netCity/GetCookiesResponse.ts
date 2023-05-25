import { Protocol } from 'puppeteer';

export type SimplifiedSession = {
  status: boolean
  peerId: number
  login: string,
  password: string,
  error?: string
  session: {
    id: number
    endTime: number
  }
  at: string
  cookies: Protocol.Network.Cookie[]
}
