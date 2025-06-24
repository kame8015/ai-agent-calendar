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

    // より確実に会議を配置（ランダム性を調整）
    patterns.forEach((pattern, index) => {
      // 70%の確率で会議を配置（より高い確率）
      if (Math.random() > 0.3) {
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
      }
    });
  }

  console.log(
    `モック: ${userId}の会議イベント ${events.length}件を生成しました`
  );
  events.forEach(event => {
    console.log(
      `  - ${event.title}: ${new Date(event.start).toLocaleString()} - ${new Date(event.end).toLocaleString()}`
    );
  });

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

  console.log(`モック: ${userEmails.length}人のユーザーの空き状況を分析中...`);

  const userAvailabilities: UserAvailability[] = [];

  for (const emailOrName of userEmails) {
    // 参加者名が「名前（役職）」形式の場合、メールアドレスに変換
    let email = emailOrName;
    let userName = emailOrName;

    if (emailOrName.includes('（') && emailOrName.includes('）')) {
      // 「田中太郎（プロジェクトマネージャー）」形式から名前を抽出
      const nameMatch = emailOrName.match(/^([^（]+)/);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        // 名前からメールアドレスを検索
        const matchedUser = MOCK_USERS.find(
          user => user.name === extractedName
        );
        if (matchedUser) {
          email = matchedUser.email;
          userName = matchedUser.name;
        }
      }
    }

    const user = MOCK_USERS.find(u => u.email === email || u.name === userName);
    if (!user) {
      console.warn(`ユーザーが見つかりません: ${emailOrName}`);
      continue;
    }

    console.log(`${user.name} (${user.email}) の空き状況を分析中...`);

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
      email: user.email,
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
  console.log('参加者:', attendeeEmails);

  const userAvailabilities = await analyzeUserAvailability(
    accessToken,
    attendeeEmails,
    startDate,
    endDate
  );

  console.log('各ユーザーの空き状況:');
  userAvailabilities.forEach(user => {
    console.log(`  ${user.name} (${user.email}):`);
    console.log(`    忙しい時間: ${user.busySlots.length}件`);
    user.busySlots.forEach(busy => {
      console.log(
        `      - ${busy.title}: ${new Date(busy.start).toLocaleString()} - ${new Date(busy.end).toLocaleString()}`
      );
    });
    console.log(`    空き時間: ${user.availableSlots.length}件`);
    user.availableSlots.slice(0, 3).forEach(slot => {
      console.log(
        `      - ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}`
      );
    });
  });

  // 全員が空いている時間帯を見つける
  const commonAvailableSlots = findCommonAvailableSlots(
    userAvailabilities,
    durationMinutes
  );

  console.log(`共通の空き時間: ${commonAvailableSlots.length}件`);
  commonAvailableSlots.forEach((slot, index) => {
    console.log(
      `  ${index + 1}. ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()} (信頼度: ${Math.round(slot.confidence * 100)}%, 参加可能: ${slot.availableAttendees.length}名)`
    );
  });

  return commonAvailableSlots.map(slot => ({
    start: slot.start,
    end: slot.end,
    confidence: slot.confidence,
    availableAttendees: slot.availableAttendees.map(email => {
      const user = MOCK_USERS.find(u => u.email === email);
      return user ? `${user.name}（${user.jobTitle}）` : email;
    }),
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

  if (userAvailabilities.length === 0) return commonSlots;

  // 全ユーザーの空き時間スロットを収集
  const allAvailableSlots: Array<{
    start: Date;
    end: Date;
    userEmail: string;
  }> = [];

  userAvailabilities.forEach(user => {
    user.availableSlots.forEach(slot => {
      allAvailableSlots.push({
        start: new Date(slot.start),
        end: new Date(slot.end),
        userEmail: user.email,
      });
    });
  });

  // 時間軸上で重複する時間帯を見つける
  const timeSlots = new Map<string, string[]>();

  // 15分刻みで時間帯をチェック
  const minStartTime = Math.min(
    ...allAvailableSlots.map(slot => slot.start.getTime())
  );
  const maxEndTime = Math.max(
    ...allAvailableSlots.map(slot => slot.end.getTime())
  );

  for (
    let time = minStartTime;
    time < maxEndTime;
    time += 15 * 60 * 1000 // 15分刻み
  ) {
    const timeKey = new Date(time).toISOString();
    const availableUsers: string[] = [];

    allAvailableSlots.forEach(slot => {
      if (slot.start.getTime() <= time && slot.end.getTime() > time) {
        if (!availableUsers.includes(slot.userEmail)) {
          availableUsers.push(slot.userEmail);
        }
      }
    });

    if (availableUsers.length > 0) {
      timeSlots.set(timeKey, availableUsers);
    }
  }

  // 連続する時間帯を見つけて会議時間に十分な長さのスロットを作成
  const sortedTimes = Array.from(timeSlots.keys()).sort();

  for (let i = 0; i < sortedTimes.length; i++) {
    const startTime = new Date(sortedTimes[i]);
    const requiredEndTime = new Date(
      startTime.getTime() + durationMinutes * 60 * 1000
    );

    // この時間帯から必要な時間分、連続して空いているユーザーを確認
    const consistentlyAvailableUsers = timeSlots.get(sortedTimes[i]) || [];
    let validSlot = true;

    // 必要な時間分、連続してチェック
    for (
      let checkTime = startTime.getTime();
      checkTime < requiredEndTime.getTime();
      checkTime += 15 * 60 * 1000
    ) {
      const checkTimeKey = new Date(checkTime).toISOString();
      const usersAtThisTime = timeSlots.get(checkTimeKey) || [];

      // 最初の時間帯で空いていたユーザーが、この時間帯でも空いているかチェック
      const stillAvailable = consistentlyAvailableUsers.filter(user =>
        usersAtThisTime.includes(user)
      );

      if (stillAvailable.length < consistentlyAvailableUsers.length) {
        // 一部のユーザーが空いていない場合、利用可能ユーザーを更新
        consistentlyAvailableUsers.splice(
          0,
          consistentlyAvailableUsers.length,
          ...stillAvailable
        );
      }

      if (consistentlyAvailableUsers.length === 0) {
        validSlot = false;
        break;
      }
    }

    if (validSlot && consistentlyAvailableUsers.length > 0) {
      const confidence =
        consistentlyAvailableUsers.length / userAvailabilities.length;

      // 重複を避けるため、既存のスロットと重複していないかチェック
      const isOverlapping = commonSlots.some(existing => {
        const existingStart = new Date(existing.start);
        const existingEnd = new Date(existing.end);
        return startTime < existingEnd && requiredEndTime > existingStart;
      });

      if (!isOverlapping) {
        commonSlots.push({
          start: startTime.toISOString(),
          end: requiredEndTime.toISOString(),
          confidence,
          availableAttendees: consistentlyAvailableUsers,
        });
      }
    }
  }

  // 信頼度順にソートして上位5件を返す
  return commonSlots.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
