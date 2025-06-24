'use server';

// モック用のダミーデータ
const MOCK_USERS: OutlookUser[] = [
  {
    id: 'user1',
    name: '田中太郎',
    email: 'tanaka@company.com',
    jobTitle: 'プロジェクトマネージャー',
    department: '開発部',
  },
  {
    id: 'user2',
    name: '佐藤花子',
    email: 'sato@company.com',
    jobTitle: 'シニアエンジニア',
    department: '開発部',
  },
  {
    id: 'user3',
    name: '鈴木一郎',
    email: 'suzuki@company.com',
    jobTitle: 'デザイナー',
    department: 'デザイン部',
  },
  {
    id: 'user4',
    name: '高橋美咲',
    email: 'takahashi@company.com',
    jobTitle: '営業マネージャー',
    department: '営業部',
  },
  {
    id: 'user5',
    name: '渡辺健二',
    email: 'watanabe@company.com',
    jobTitle: 'システムアーキテクト',
    department: '開発部',
  },
  {
    id: 'user6',
    name: '中村優子',
    email: 'nakamura@company.com',
    jobTitle: 'マーケティング担当',
    department: 'マーケティング部',
  },
  {
    id: 'user7',
    name: '伊藤大輔',
    email: 'ito@company.com',
    jobTitle: 'QAエンジニア',
    department: '品質保証部',
  },
  {
    id: 'user8',
    name: '松本愛',
    email: 'matsumoto@company.com',
    jobTitle: 'セキュリティ担当',
    department: 'IT部',
  },
];

// モック用の会議データを生成する関数
function generateMockCalendarEvents(
  userId: string,
  startDate: string,
  endDate: string
): OutlookCalendarEvent[] {
  const events: OutlookCalendarEvent[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // ユーザーごとに異なる会議パターンを生成
  const userMeetingPatterns: Record<
    string,
    Array<{
      time: string;
      duration: number;
      title: string;
      attendees: string[];
    }>
  > = {
    user1: [
      {
        time: '09:00',
        duration: 60,
        title: 'プロジェクト定例会議',
        attendees: [
          'tanaka@company.com',
          'sato@company.com',
          'watanabe@company.com',
        ],
      },
      {
        time: '14:00',
        duration: 90,
        title: 'クライアント打ち合わせ',
        attendees: ['tanaka@company.com', 'takahashi@company.com'],
      },
    ],
    user2: [
      {
        time: '10:30',
        duration: 60,
        title: '技術レビュー会議',
        attendees: [
          'sato@company.com',
          'watanabe@company.com',
          'ito@company.com',
        ],
      },
      {
        time: '15:30',
        duration: 30,
        title: '1on1ミーティング',
        attendees: ['sato@company.com', 'tanaka@company.com'],
      },
    ],
    user3: [
      {
        time: '11:00',
        duration: 120,
        title: 'UI/UXデザインレビュー',
        attendees: ['suzuki@company.com', 'nakamura@company.com'],
      },
      {
        time: '16:00',
        duration: 60,
        title: 'デザインチーム会議',
        attendees: ['suzuki@company.com'],
      },
    ],
    user4: [
      {
        time: '09:30',
        duration: 60,
        title: '営業戦略会議',
        attendees: ['takahashi@company.com', 'nakamura@company.com'],
      },
      {
        time: '13:00',
        duration: 90,
        title: '顧客訪問',
        attendees: ['takahashi@company.com'],
      },
    ],
    user5: [
      {
        time: '10:00',
        duration: 90,
        title: 'アーキテクチャ設計会議',
        attendees: [
          'watanabe@company.com',
          'sato@company.com',
          'matsumoto@company.com',
        ],
      },
      {
        time: '16:30',
        duration: 60,
        title: 'セキュリティレビュー',
        attendees: ['watanabe@company.com', 'matsumoto@company.com'],
      },
    ],
    user6: [
      {
        time: '11:30',
        duration: 60,
        title: 'マーケティング企画会議',
        attendees: ['nakamura@company.com', 'takahashi@company.com'],
      },
      {
        time: '14:30',
        duration: 60,
        title: 'ブランディング検討会',
        attendees: ['nakamura@company.com', 'suzuki@company.com'],
      },
    ],
    user7: [
      {
        time: '09:00',
        duration: 60,
        title: 'QA定例会議',
        attendees: ['ito@company.com', 'sato@company.com'],
      },
      {
        time: '15:00',
        duration: 90,
        title: 'テスト計画レビュー',
        attendees: ['ito@company.com', 'watanabe@company.com'],
      },
    ],
    user8: [
      {
        time: '10:30',
        duration: 90,
        title: 'セキュリティ監査会議',
        attendees: [
          'matsumoto@company.com',
          'watanabe@company.com',
          'tanaka@company.com',
        ],
      },
      {
        time: '14:00',
        duration: 60,
        title: 'インシデント対応会議',
        attendees: ['matsumoto@company.com'],
      },
    ],
  };

  const patterns = userMeetingPatterns[userId] || [];

  // 指定期間内の各営業日に会議を生成
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // 土日をスキップ
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // ランダムに会議を配置（全ての会議が毎日あるわけではない）
    patterns.forEach((pattern, index) => {
      // 50%の確率で会議を配置
      if (Math.random() > 0.5) return;

      const meetingDate = new Date(d);
      const [hours, minutes] = pattern.time.split(':').map(Number);
      meetingDate.setHours(hours, minutes, 0, 0);

      const endTime = new Date(
        meetingDate.getTime() + pattern.duration * 60 * 1000
      );

      events.push({
        id: `event_${userId}_${d.toISOString().split('T')[0]}_${index}`,
        title: pattern.title,
        start: meetingDate.toISOString(),
        end: endTime.toISOString(),
        attendees: pattern.attendees,
        organizer: MOCK_USERS.find(u => u.id === userId)?.email || '',
      });
    });
  }

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

export interface OutlookUser {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

export interface OutlookCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  organizer: string;
}

export interface UserAvailability {
  email: string;
  name: string;
  availableSlots: Array<{
    start: string;
    end: string;
  }>;
  busySlots: Array<{
    start: string;
    end: string;
    title: string;
  }>;
}

/**
 * 組織内のユーザー一覧を取得（モック版）
 */
export async function getOrganizationUsers(
  accessToken?: string
): Promise<OutlookUser[]> {
  // モック実装：実際のAPIコールをシミュレート
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('モック: 組織ユーザー一覧を取得中...');
  return MOCK_USERS;
}

/**
 * アクセス可能なカレンダーを持つユーザーを取得（モック版）
 */
export async function getAccessibleCalendarUsers(
  accessToken?: string
): Promise<OutlookUser[]> {
  // モック実装：一部のユーザーのみアクセス可能とする
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('モック: アクセス可能なカレンダーユーザーを取得中...');
  return MOCK_USERS.filter(user =>
    ['user1', 'user2', 'user3', 'user4', 'user5'].includes(user.id)
  );
}

/**
 * 特定ユーザーのカレンダーイベントを取得（モック版）
 */
export async function getUserCalendarEvents(
  accessToken: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<OutlookCalendarEvent[]> {
  // モック実装
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log(`モック: ユーザー ${userId} のカレンダーイベントを取得中...`);
  return generateMockCalendarEvents(userId, startDate, endDate);
}

/**
 * 複数ユーザーの空き時間を分析（モック版）
 */
export async function analyzeUserAvailability(
  accessToken: string,
  userEmails: string[],
  startDate: string,
  endDate: string
): Promise<UserAvailability[]> {
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`モック: ${userEmails.length}人のユーザーの空き時間を分析中...`);

  const userAvailabilities: UserAvailability[] = [];

  for (const email of userEmails) {
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) continue;

    // モックイベントを取得
    const events = generateMockCalendarEvents(user.id, startDate, endDate);

    // 忙しい時間帯を抽出
    const busySlots = events.map(event => ({
      start: event.start,
      end: event.end,
      title: event.title,
    }));

    // 空き時間を計算
    const availableSlots = calculateAvailableSlots(
      startDate,
      endDate,
      busySlots
    );

    userAvailabilities.push({
      email,
      name: user.name,
      availableSlots,
      busySlots,
    });
  }

  return userAvailabilities;
}

/**
 * 会議の最適な時間を提案（モック版）
 */
export async function suggestMeetingTimes(
  accessToken: string,
  attendeeEmails: string[],
  durationMinutes: number,
  startDate: string,
  endDate: string
): Promise<
  Array<{
    start: string;
    end: string;
    confidence: number;
    availableAttendees: string[];
  }>
> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(
    `モック: ${attendeeEmails.length}人の参加者で${durationMinutes}分の会議時間を提案中...`
  );

  const userAvailabilities = await analyzeUserAvailability(
    accessToken,
    attendeeEmails,
    startDate,
    endDate
  );

  // 全員が空いている時間帯を見つける
  const commonAvailableSlots = findCommonAvailableSlots(
    userAvailabilities,
    durationMinutes
  );

  return commonAvailableSlots.map(slot => ({
    start: slot.start,
    end: slot.end,
    confidence: slot.confidence,
    availableAttendees: slot.availableAttendees,
  }));
}

/**
 * 空き時間を計算するヘルパー関数
 */
function calculateAvailableSlots(
  startDate: string,
  endDate: string,
  busySlots: Array<{ start: string; end: string; title: string }>
): Array<{ start: string; end: string }> {
  const availableSlots: Array<{ start: string; end: string }> = [];

  // 業務時間（9:00-18:00）で空き時間を計算
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // 土日をスキップ
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dayStart = new Date(d);
    dayStart.setHours(9, 0, 0, 0);

    const dayEnd = new Date(d);
    dayEnd.setHours(18, 0, 0, 0);

    // その日の忙しい時間帯を取得
    const dayBusySlots = busySlots
      .filter(slot => {
        const slotStart = new Date(slot.start);
        return slotStart.toDateString() === d.toDateString();
      })
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

    // 空き時間を計算
    let currentTime = dayStart;

    for (const busySlot of dayBusySlots) {
      const busyStart = new Date(busySlot.start);
      const busyEnd = new Date(busySlot.end);

      if (currentTime < busyStart) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: busyStart.toISOString(),
        });
      }

      currentTime = busyEnd > currentTime ? busyEnd : currentTime;
    }

    if (currentTime < dayEnd) {
      availableSlots.push({
        start: currentTime.toISOString(),
        end: dayEnd.toISOString(),
      });
    }
  }

  return availableSlots;
}

/**
 * 共通の空き時間を見つけるヘルパー関数
 */
function findCommonAvailableSlots(
  userAvailabilities: UserAvailability[],
  durationMinutes: number
): Array<{
  start: string;
  end: string;
  confidence: number;
  availableAttendees: string[];
}> {
  const commonSlots: Array<{
    start: string;
    end: string;
    confidence: number;
    availableAttendees: string[];
  }> = [];

  // 全ユーザーの空き時間を統合して共通部分を見つける
  if (userAvailabilities.length === 0) return commonSlots;

  const baseUser = userAvailabilities[0];

  for (const slot of baseUser.availableSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const slotDuration =
      (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);

    if (slotDuration < durationMinutes) continue;

    const availableAttendees = [baseUser.email];

    // 他のユーザーもこの時間帯が空いているかチェック
    for (let i = 1; i < userAvailabilities.length; i++) {
      const otherUser = userAvailabilities[i];
      const isAvailable = otherUser.availableSlots.some(otherSlot => {
        const otherStart = new Date(otherSlot.start);
        const otherEnd = new Date(otherSlot.end);
        return otherStart <= slotStart && otherEnd >= slotEnd;
      });

      if (isAvailable) {
        availableAttendees.push(otherUser.email);
      }
    }

    // 信頼度を計算（参加可能な人数の割合）
    const confidence = availableAttendees.length / userAvailabilities.length;

    commonSlots.push({
      start: slot.start,
      end: new Date(
        slotStart.getTime() + durationMinutes * 60 * 1000
      ).toISOString(),
      confidence,
      availableAttendees,
    });
  }

  // 信頼度順にソート
  return commonSlots.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
