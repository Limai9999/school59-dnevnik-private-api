import { LoginToNetcity } from '../types/Utils/LoginToNetcity';

type Session = {
  id: number
  endTime: number
  session: LoginToNetcity
}

type SecuritySkipInterval = {
  id: number
  interval: NodeJS.Timer;
}

class NetCitySession {
  sessions: Session[];

  securitySkipIntervals: SecuritySkipInterval[];

  constructor() {
    this.sessions = [];

    this.securitySkipIntervals = [];
  }

  addSession(session: LoginToNetcity): {id: number, endTime: number} {
    try {
      if (!session.status) {
        return {
          id: 0,
          endTime: 0,
        };
      }

      const id = Date.now();

      const autoCloseSessionTime = 1000 * 60 * 30;
      const endTime = id + autoCloseSessionTime;

      this.sessions.push({ id, session, endTime });

      setTimeout(() => {
        this.closeSession(id);
      }, autoCloseSessionTime);

      const securitySkipInterval = setInterval(() => {
        session.skipSecurityCheck();
      }, 15000);
      this.securitySkipIntervals.push({
        id,
        interval: securitySkipInterval,
      });

      console.log(`Добавлена сессия ${id} пользователя ${session.login}`);

      return {
        id,
        endTime,
      };
    } catch (error) {
      console.log('addSession error', error);

      return {
        id: 0,
        endTime: 0,
      };
    }
  }

  getSession(id: number): Session | undefined {
    const session = this.sessions.find((session) => session.id === id);
    return session;
  }

  async closeSession(id: number): Promise<boolean> {
    try {
      const session = this.getSession(id);
      if (!session) return false;

      setTimeout(() => {
        session.session.logoutAndCloseBrowser();
      }, 1000 * 60 * 1);

      const securitySkipInterval = this.securitySkipIntervals.find((intervals) => intervals.id === id);
      if (securitySkipInterval) clearInterval(securitySkipInterval.interval);

      this.sessions = this.sessions.filter((session) => session.id !== id);

      console.log(`Закрыта сессия ${id} пользователя ${session.session.login}`);

      return true;
    } catch (error) {
      console.log('closeSession error', error);
      return false;
    }
  }
}

export default NetCitySession;
