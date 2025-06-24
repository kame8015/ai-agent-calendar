import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Microsoft Graph API用の認証プロバイダー
class CustomAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

// ユーザー情報の型定義
export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

// カレンダーイベントの型定義
export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  organizer?: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
}

// 空き時間情報の型定義
export interface FreeBusyInfo {
  email: string;
  freeBusyViewType: string;
  freeBusyStatus: string[];
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    const authProvider = new CustomAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({ authProvider });
  }

  /**
   * 組織内のユーザー一覧を取得
   */
  async getUsers(limit: number = 50): Promise<GraphUser[]> {
    try {
      const response = await this.client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department')
        .top(limit)
        .get();

      return response.value as GraphUser[];
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗:', error);
      throw new Error('ユーザー一覧の取得に失敗しました');
    }
  }

  /**
   * 特定ユーザーのカレンダーイベントを取得
   */
  async getUserCalendarEvents(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.client
        .api(`/users/${userId}/calendar/events`)
        .filter(
          `start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`
        )
        .select('id,subject,start,end,attendees,organizer')
        .orderby('start/dateTime')
        .get();

      return response.value as CalendarEvent[];
    } catch (error) {
      console.error(`ユーザー ${userId} のカレンダー取得に失敗:`, error);
      throw new Error(`ユーザーのカレンダー取得に失敗しました: ${userId}`);
    }
  }

  /**
   * 複数ユーザーの空き時間を一括取得
   */
  async getFreeBusyInfo(
    emails: string[],
    startDate: string,
    endDate: string,
    intervalMinutes: number = 30
  ): Promise<FreeBusyInfo[]> {
    try {
      const requestBody = {
        schedules: emails,
        startTime: {
          dateTime: startDate,
          timeZone: 'Asia/Tokyo',
        },
        endTime: {
          dateTime: endDate,
          timeZone: 'Asia/Tokyo',
        },
        availabilityViewInterval: intervalMinutes,
      };

      const response = await this.client
        .api('/me/calendar/getSchedule')
        .post(requestBody);

      return response.value as FreeBusyInfo[];
    } catch (error) {
      console.error('空き時間情報の取得に失敗:', error);
      throw new Error('空き時間情報の取得に失敗しました');
    }
  }

  /**
   * 現在のユーザーがアクセス可能な他のユーザーのカレンダーを検索
   */
  async getAccessibleCalendars(): Promise<GraphUser[]> {
    try {
      // まず組織内のユーザー一覧を取得
      const users = await this.getUsers();

      // 各ユーザーのカレンダーにアクセス可能かチェック
      const accessibleUsers: GraphUser[] = [];

      for (const user of users) {
        try {
          // テスト用に今日から1日分のイベントを取得してみる
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          await this.getUserCalendarEvents(
            user.id,
            `${today}T00:00:00.000Z`,
            `${tomorrow}T00:00:00.000Z`
          );

          accessibleUsers.push(user);
        } catch (error) {
          // アクセスできない場合はスキップ
          console.log(
            `ユーザー ${user.displayName} のカレンダーにはアクセスできません`
          );
        }
      }

      return accessibleUsers;
    } catch (error) {
      console.error('アクセス可能なカレンダーの検索に失敗:', error);
      throw new Error('アクセス可能なカレンダーの検索に失敗しました');
    }
  }

  /**
   * 会議の最適な時間帯を提案
   */
  async findMeetingTimes(
    attendeeEmails: string[],
    durationMinutes: number,
    startDate: string,
    endDate: string
  ) {
    try {
      const requestBody = {
        attendees: attendeeEmails.map(email => ({
          emailAddress: { address: email },
        })),
        timeConstraint: {
          timeslots: [
            {
              start: {
                dateTime: startDate,
                timeZone: 'Asia/Tokyo',
              },
              end: {
                dateTime: endDate,
                timeZone: 'Asia/Tokyo',
              },
            },
          ],
        },
        meetingDuration: `PT${durationMinutes}M`,
        maxCandidates: 10,
      };

      const response = await this.client
        .api('/me/calendar/getSchedule')
        .post(requestBody);

      return response;
    } catch (error) {
      console.error('会議時間の提案に失敗:', error);
      throw new Error('会議時間の提案に失敗しました');
    }
  }
}
