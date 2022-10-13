import {Protocol} from 'puppeteer';

export type GetCookiesResponse = {
  status: boolean
  error?: string
  session?: {
    id: number
    endTime: number
  }
  at?: string
  cookies?: Protocol.Network.Cookie[]
}
