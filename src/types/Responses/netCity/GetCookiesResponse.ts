import {Protocol} from 'puppeteer';

export type GetCookiesResponse = {
  status: boolean
  login: string,
  password: string,
  error?: string
  session?: {
    id: number
    endTime: number
  }
  at?: string
  cookies?: Protocol.Network.Cookie[]
}
