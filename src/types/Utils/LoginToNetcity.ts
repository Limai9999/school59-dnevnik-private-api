import puppeteer from 'puppeteer';

export type LoginToNetcity = {
  status: boolean
  login: string
  password: string
  error?: string
  page: puppeteer.Page
  browser: puppeteer.Browser
  client: puppeteer.CDPSession
  at: string
  logoutAndCloseBrowser: () => Promise<boolean>
  skipSecurityCheck: () => Promise<boolean>
};
