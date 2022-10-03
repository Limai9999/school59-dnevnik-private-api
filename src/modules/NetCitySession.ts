import {LoginToNetcity} from '../types/Responses/LoginToNetcity';

type Session = {
  id: number
  endTime: number
  session: LoginToNetcity
}

class NetCitySession {
  sessions: Session[];

  constructor() {
    this.sessions = [];
  }

  addSession(session: LoginToNetcity): {id: number, endTime: number} {
    if (!session.status) {
      return {
        id: 0,
        endTime: 0,
      };
    }

    const id = Date.now();

    const autoCloseSessionTime = 1000 * 60 * 15;
    const endTime = id + autoCloseSessionTime;

    this.sessions.push({id, session, endTime});

    setTimeout(() => {
      this.closeSession(id);
    }, autoCloseSessionTime);

    return {
      id,
      endTime,
    };
  }

  getSession(id: number): Session | undefined {
    const session = this.sessions.find((session) => session.id === id);
    return session;
  }

  async closeSession(id: number): Promise<boolean> {
    const session = this.getSession(id);
    if (!session) return false;

    await session.session.logoutAndCloseBrowser();

    return true;
  }
}

export default NetCitySession;
