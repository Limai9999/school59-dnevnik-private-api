import puppeteer from 'puppeteer';

export type LoginToNetcity = {
  status: boolean
  error?: string
  page: puppeteer.Page
  browser: puppeteer.Browser
  client: puppeteer.CDPSession
  at: string
  logoutAndCloseBrowser: () => Promise<boolean>
};
