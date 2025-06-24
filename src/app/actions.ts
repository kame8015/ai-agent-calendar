'use server';

import { mastra } from '../../mastra';
import {
  analyzeUserAvailability,
  suggestMeetingTimes,
} from './outlook-actions';

export interface MeetingAnalysisResult {
  nextActions: Array<{
    action: string;
    responsible: string[];
    deadline: string;
    meetingRequired: boolean;
    priority: '高' | '中' | '低';
    department?: string[];
  }>;
  suggestedMeetings: Array<{
    title: string;
    purpose: string;
    requiredAttendees: string[];
    estimatedDuration: number;
    suggestedDate: string;
    department?: string[];
  }>;
  message: string;
}

export interface AvailabilityResult {
  availableSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    attendees: string[];
  }>;
  message: string;
}

export interface MeetingCreationResult {
  meetingId: string;
  success: boolean;
  message: string;
}

export async function analyzeMeetingMinutes(
  meetingMinutes: string
): Promise<MeetingAnalysisResult> {
  try {
    const calendarAgent = mastra.getAgent('calendarAgent');

    // モックユーザーデータを取得してLLMに提供
    const { getOrganizationUsers } = await import('./outlook-actions');
    const mockUsers = await getOrganizationUsers();
    const userList = mockUsers
      .map(u => `${u.name}（${u.jobTitle}、${u.department}）`)
      .join('\n');

    // 構造化出力を使用してLLMから正確なJSONを取得
    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下の議事録を分析してください：

議事録：
${meetingMinutes}

利用可能な組織メンバー一覧：
${userList}

指示：
1. 議事録からネクストアクションを抽出してください
2. 必要な会議を特定してください
3. 参加者には上記の組織メンバー一覧から適切な人を選んでください
4. 役職や部署に基づいて最適なメンバーを選択してください
5. 参加者名は「名前（役職）」の形式で記載してください

例：「田中太郎（プロジェクトマネージャー）」`,
        },
      ],
      {
        output: {
          type: 'object',
          properties: {
            nextActions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  responsible: { type: 'array', items: { type: 'string' } },
                  deadline: { type: 'string' },
                  meetingRequired: { type: 'boolean' },
                  priority: { type: 'string', enum: ['高', '中', '低'] },
                  department: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'action',
                  'responsible',
                  'deadline',
                  'meetingRequired',
                  'priority',
                ],
              },
            },
            suggestedMeetings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  purpose: { type: 'string' },
                  requiredAttendees: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  estimatedDuration: { type: 'number' },
                  suggestedDate: { type: 'string' },
                  department: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'title',
                  'purpose',
                  'requiredAttendees',
                  'estimatedDuration',
                  'suggestedDate',
                ],
              },
            },
            message: { type: 'string' },
          },
          required: ['nextActions', 'suggestedMeetings', 'message'],
        },
      }
    );

    // LLMからの構造化された応答を使用
    if (result.object) {
      return result.object as MeetingAnalysisResult;
    } else {
      throw new Error('LLMからの構造化された応答を取得できませんでした。');
    }
  } catch (error) {
    console.error('議事録分析エラー:', error);
    throw new Error('議事録の分析に失敗しました。');
  }
}

export async function checkAvailability(
  attendees: string[],
  startDate: string,
  endDate: string,
  duration: number
): Promise<AvailabilityResult> {
  try {
    console.log('スケジュール確認を開始:', {
      attendees,
      startDate,
      endDate,
      duration,
    });

    // Outlookのモック機能を使用して実際の空き時間を分析
    const userAvailabilities = await analyzeUserAvailability(
      '', // accessToken（モックなので空文字）
      attendees,
      startDate,
      endDate
    );

    // 会議の最適な時間を提案
    const suggestedTimes = await suggestMeetingTimes(
      '', // accessToken（モックなので空文字）
      attendees,
      duration,
      startDate,
      endDate
    );

    // 結果をAvailabilityResult形式に変換
    const availableSlots = suggestedTimes.map(suggestion => {
      const startDateTime = new Date(suggestion.start);
      const endDateTime = new Date(suggestion.end);

      return {
        date: startDateTime.toISOString().split('T')[0],
        startTime: startDateTime.toTimeString().slice(0, 5),
        endTime: endDateTime.toTimeString().slice(0, 5),
        attendees: suggestion.availableAttendees,
      };
    });

    // 分析結果のサマリーメッセージを生成
    let message = `## 📅 スケジュール分析結果\n\n`;
    message += `**分析対象**: ${attendees.length}名の参加者\n`;
    message += `**期間**: ${startDate} ～ ${endDate}\n`;
    message += `**会議時間**: ${duration}分\n\n`;

    if (availableSlots.length > 0) {
      message += `### ✅ 提案可能な時間帯\n\n`;
      availableSlots.forEach((slot, index) => {
        const confidence = suggestedTimes[index]?.confidence || 0;
        const availableCount = slot.attendees.length;
        message += `**${index + 1}. ${slot.date} ${slot.startTime}-${slot.endTime}**\n`;
        message += `- 参加可能: ${availableCount}/${attendees.length}名 (${Math.round(confidence * 100)}%)\n`;
        message += `- 参加者: ${slot.attendees.join(', ')}\n\n`;
      });
    } else {
      message += `### ❌ 全員が参加可能な時間帯が見つかりませんでした\n\n`;
      message += `**個別の空き状況**:\n`;
      userAvailabilities.forEach(user => {
        message += `- **${user.name}**: `;
        if (user.availableSlots.length > 0) {
          message += `${user.availableSlots.length}個の空き時間帯あり\n`;
        } else {
          message += `空き時間なし\n`;
        }
      });
    }

    return {
      availableSlots,
      message,
    };
  } catch (error) {
    console.error('スケジュール確認エラー:', error);

    // エラーの場合はフォールバック（従来のLLMベース）
    const calendarAgent = mastra.getAgent('calendarAgent');
    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下の参加者の空き時間をチェックしてください：
        参加者: ${attendees.join(', ')}
        期間: ${startDate} から ${endDate}
        会議時間: ${duration}分
        
        注意: 実際のカレンダーデータが取得できないため、一般的な業務時間を考慮した提案をしてください。`,
        },
      ],
      {
        output: {
          type: 'object',
          properties: {
            availableSlots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: 'YYYY-MM-DD形式' },
                  startTime: { type: 'string', description: 'HH:MM形式' },
                  endTime: { type: 'string', description: 'HH:MM形式' },
                  attendees: { type: 'array', items: { type: 'string' } },
                },
                required: ['date', 'startTime', 'endTime', 'attendees'],
              },
            },
            message: { type: 'string' },
          },
          required: ['availableSlots', 'message'],
        },
      }
    );

    if (result.object) {
      return result.object as AvailabilityResult;
    } else {
      throw new Error('スケジュールの確認に失敗しました。');
    }
  }
}

export async function createMeeting(data: {
  title: string;
  description: string;
  attendees: string[];
  date: string;
  startTime: string;
  duration: number;
  location?: string;
}): Promise<MeetingCreationResult> {
  try {
    const calendarAgent = mastra.getAgent('calendarAgent');

    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下の情報で会議を作成してください：
        タイトル: ${data.title}
        説明: ${data.description}
        参加者: ${data.attendees.join(', ')}
        日時: ${data.date} ${data.startTime}
        時間: ${data.duration}分
        場所: ${data.location || '未設定'}`,
        },
      ],
      {
        output: {
          type: 'object',
          properties: {
            meetingId: { type: 'string' },
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['meetingId', 'success', 'message'],
        },
      }
    );

    if (result.object) {
      return result.object as MeetingCreationResult;
    } else {
      throw new Error('LLMからの構造化された応答を取得できませんでした。');
    }
  } catch (error) {
    console.error('会議作成エラー:', error);
    throw new Error('会議の作成に失敗しました。');
  }
}

export async function processFullMeetingSetup(meetingMinutes: string): Promise<{
  analysis: MeetingAnalysisResult;
  availability?: AvailabilityResult;
  createdMeetings?: MeetingCreationResult[];
}> {
  try {
    // 1. 議事録を分析
    const analysis = await analyzeMeetingMinutes(meetingMinutes);

    const result: {
      analysis: MeetingAnalysisResult;
      availability?: AvailabilityResult;
      createdMeetings?: MeetingCreationResult[];
    } = { analysis };

    // 2. 必要な会議があれば、スケジュールを確認
    if (analysis.suggestedMeetings.length > 0) {
      const firstMeeting = analysis.suggestedMeetings[0];
      const availability = await checkAvailability(
        firstMeeting.requiredAttendees,
        firstMeeting.suggestedDate,
        firstMeeting.suggestedDate,
        firstMeeting.estimatedDuration
      );
      result.availability = availability;

      // 3. 空きがあれば会議を作成
      if (availability.availableSlots.length > 0) {
        const firstSlot = availability.availableSlots[0];
        const createdMeeting = await createMeeting({
          title: firstMeeting.title,
          description: firstMeeting.purpose,
          attendees: firstMeeting.requiredAttendees,
          date: firstSlot.date,
          startTime: firstSlot.startTime,
          duration: firstMeeting.estimatedDuration,
        });
        result.createdMeetings = [createdMeeting];
      }
    }

    return result;
  } catch (error) {
    console.error('会議設定プロセスエラー:', error);
    throw new Error('会議設定プロセスに失敗しました。');
  }
}

export async function processChatRequest(
  userRequest: string,
  currentAnalysis?: MeetingAnalysisResult
): Promise<{
  message: string;
  updatedAnalysis?: MeetingAnalysisResult;
  actionTaken?: string;
}> {
  try {
    const calendarAgent = mastra.getAgent('calendarAgent');

    // モックユーザーデータを取得
    const { getOrganizationUsers } = await import('./outlook-actions');
    const mockUsers = await getOrganizationUsers();
    const userList = mockUsers
      .map(u => `${u.name}（${u.jobTitle}）`)
      .join(', ');

    const contextInfo = currentAnalysis
      ? `
現在の分析結果：
ネクストアクション: ${JSON.stringify(currentAnalysis.nextActions, null, 2)}
提案会議: ${JSON.stringify(currentAnalysis.suggestedMeetings, null, 2)}

利用可能なユーザー一覧:
${userList}
`
      : `
利用可能なユーザー一覧:
${userList}
`;

    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下のユーザー要求を処理してください：

${contextInfo}

ユーザー要求: "${userRequest}"

以下のような要求の場合は、会議の詳細を更新してJSONで返してください（実際の会議作成は行わない）：
- 会議時間の変更：estimatedDurationを更新
- 参加者の変更：requiredAttendeesを更新  
- 日程の変更：suggestedDateを更新
- 会議タイトルや目的の変更：titleやpurposeを更新

更新がある場合は、更新された会議情報を含む完全な分析結果を構造化出力で返してください。
更新がない場合は、現在の情報をそのまま返してください。

重要な注意事項：
- 参加者を追加する場合は、既存の参加者リストに新しい参加者を追加してください
- 参加者名は必ず上記の「利用可能なユーザー一覧」から選択してください
- 存在しないユーザー名は使用しないでください
- updatedAnalysisのmessageフィールドは省略してください

応答は日本語で、ユーザーの要求を理解した上で適切な変更内容を説明してください。`,
        },
      ],
      {
        output: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            hasUpdates: { type: 'boolean' },
            updatedAnalysis: {
              type: 'object',
              properties: {
                nextActions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      responsible: { type: 'array', items: { type: 'string' } },
                      deadline: { type: 'string' },
                      meetingRequired: { type: 'boolean' },
                      priority: { type: 'string', enum: ['高', '中', '低'] },
                      department: { type: 'array', items: { type: 'string' } },
                    },
                    required: [
                      'action',
                      'responsible',
                      'deadline',
                      'meetingRequired',
                      'priority',
                    ],
                  },
                },
                suggestedMeetings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      purpose: { type: 'string' },
                      requiredAttendees: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      estimatedDuration: { type: 'number' },
                      suggestedDate: { type: 'string' },
                      department: { type: 'array', items: { type: 'string' } },
                    },
                    required: [
                      'title',
                      'purpose',
                      'requiredAttendees',
                      'estimatedDuration',
                      'suggestedDate',
                    ],
                  },
                },
                message: { type: 'string' },
              },
              required: ['nextActions', 'suggestedMeetings'],
            },
          },
          required: ['message', 'hasUpdates'],
        },
      }
    );

    if (result.object) {
      const response = result.object as {
        message: string;
        hasUpdates: boolean;
        updatedAnalysis?: MeetingAnalysisResult;
      };

      return {
        message: response.message,
        updatedAnalysis: response.hasUpdates
          ? response.updatedAnalysis
          : currentAnalysis,
        actionTaken: 'chat_response',
      };
    } else {
      return {
        message: 'ご要求を処理しました。',
        updatedAnalysis: currentAnalysis,
        actionTaken: 'chat_response',
      };
    }
  } catch (error) {
    console.error('チャット要求処理エラー:', error);

    // スキーマエラーの場合は、シンプルな応答を返す
    if (error instanceof Error && error.message.includes('schema')) {
      console.log('スキーマエラーのため、フォールバック処理を実行します');

      // モックユーザーデータを取得
      const { getOrganizationUsers } = await import('./outlook-actions');
      const mockUsers = await getOrganizationUsers();

      // 簡単な文字列マッチングで基本的な更新を試行
      let updatedAnalysis = currentAnalysis;
      let responseMessage = 'ご要求を承りました。';

      if (currentAnalysis) {
        // 参加者追加の処理
        if (userRequest.includes('追加')) {
          // ユーザー要求から役職やキーワードを抽出して該当するユーザーを検索
          const findUserByKeywords = (keywords: string[]) => {
            return mockUsers.find(user => {
              const jobTitle = user.jobTitle?.toLowerCase() || '';
              const name = user.name.toLowerCase();
              const department = user.department?.toLowerCase() || '';

              return keywords.some(
                keyword =>
                  jobTitle.includes(keyword.toLowerCase()) ||
                  name.includes(keyword.toLowerCase()) ||
                  department.includes(keyword.toLowerCase())
              );
            });
          };

          // ユーザー要求から検索キーワードを抽出
          const extractKeywords = (request: string): string[] => {
            const keywords: string[] = [];
            const lowerRequest = request.toLowerCase();

            // 一般的な役職キーワード
            const jobKeywords = [
              'エンジニア',
              'engineer',
              'アーキテクト',
              'architect',
              'デザイナー',
              'designer',
              'マネージャー',
              'manager',
              'qa',
              'テスト',
              'test',
              'セキュリティ',
              'security',
              'マーケティング',
              'marketing',
              '営業',
              'sales',
            ];

            jobKeywords.forEach(keyword => {
              if (lowerRequest.includes(keyword.toLowerCase())) {
                keywords.push(keyword);
              }
            });

            return keywords;
          };

          const keywords = extractKeywords(userRequest);
          const foundUser = findUserByKeywords(keywords);

          if (foundUser) {
            const newAttendee = `${foundUser.name}（${foundUser.jobTitle}）`;

            // 会議に参加者を追加（適切な会議を選択）
            const findBestMeetingForAttendee = (
              meetings: any[],
              attendee: string,
              keywords: string[]
            ) => {
              // 1. キーワードに関連する会議を優先
              const keywordRelatedMeeting = meetings.find(meeting =>
                keywords.some(
                  keyword =>
                    meeting.title
                      .toLowerCase()
                      .includes(keyword.toLowerCase()) ||
                    meeting.purpose
                      .toLowerCase()
                      .includes(keyword.toLowerCase())
                )
              );

              // 2. 緊急性の高い会議を優先（タイトルに「緊急」「重要」「対策」などが含まれる）
              const urgentMeeting = meetings.find(meeting => {
                const title = meeting.title.toLowerCase();
                return (
                  title.includes('緊急') ||
                  title.includes('重要') ||
                  title.includes('対策') ||
                  title.includes('問題')
                );
              });

              // 3. 最初の会議をデフォルトとして選択
              return keywordRelatedMeeting || urgentMeeting || meetings[0];
            };

            const targetMeeting = findBestMeetingForAttendee(
              currentAnalysis.suggestedMeetings,
              newAttendee,
              keywords
            );

            updatedAnalysis = {
              ...currentAnalysis,
              suggestedMeetings: currentAnalysis.suggestedMeetings.map(
                meeting => {
                  if (
                    meeting === targetMeeting &&
                    !meeting.requiredAttendees.includes(newAttendee)
                  ) {
                    return {
                      ...meeting,
                      requiredAttendees: [
                        ...meeting.requiredAttendees,
                        newAttendee,
                      ],
                    };
                  }
                  return meeting;
                }
              ),
            };

            responseMessage = `${targetMeeting.title}に${newAttendee}を追加しました。`;
          } else {
            responseMessage = `申し訳ございません。「${keywords.join(', ')}」に該当するユーザーが見つかりませんでした。`;
          }
        }

        // 時間変更の処理
        else if (
          userRequest.includes('時間') &&
          (userRequest.includes('変更') || userRequest.includes('分'))
        ) {
          const timeMatch = userRequest.match(/(\d+)分/);
          if (timeMatch) {
            const newDuration = parseInt(timeMatch[1]);
            updatedAnalysis = {
              ...currentAnalysis,
              suggestedMeetings: currentAnalysis.suggestedMeetings.map(
                meeting => ({
                  ...meeting,
                  estimatedDuration: newDuration,
                })
              ),
            };
            responseMessage = `会議時間を${newDuration}分に変更しました。`;
          }
        }

        // 日程変更の処理
        else if (userRequest.includes('日程') || userRequest.includes('日時')) {
          const dateMatch = userRequest.match(
            /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/
          );
          if (dateMatch) {
            const newDate = dateMatch[1].replace(/\//g, '-');
            updatedAnalysis = {
              ...currentAnalysis,
              suggestedMeetings: currentAnalysis.suggestedMeetings.map(
                meeting => ({
                  ...meeting,
                  suggestedDate: newDate,
                })
              ),
            };
            responseMessage = `会議日程を${newDate}に変更しました。`;
          }
        }
      }

      return {
        message: responseMessage,
        updatedAnalysis,
        actionTaken: 'chat_response_fallback',
      };
    }

    throw new Error('チャット要求の処理に失敗しました。');
  }
}
