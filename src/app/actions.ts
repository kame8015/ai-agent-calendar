'use server';

import { mastra } from '../../mastra';

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

    // 構造化出力を使用してLLMから正確なJSONを取得
    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下の議事録を分析してください：\n\n${meetingMinutes}`,
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
    const calendarAgent = mastra.getAgent('calendarAgent');

    const result = await calendarAgent.generate(
      [
        {
          role: 'user',
          content: `以下の参加者の空き時間をチェックしてください：
        参加者: ${attendees.join(', ')}
        期間: ${startDate} から ${endDate}
        会議時間: ${duration}分`,
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
      throw new Error('LLMからの構造化された応答を取得できませんでした。');
    }
  } catch (error) {
    console.error('スケジュール確認エラー:', error);
    throw new Error('スケジュールの確認に失敗しました。');
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

    const contextInfo = currentAnalysis
      ? `
現在の分析結果：
ネクストアクション: ${JSON.stringify(currentAnalysis.nextActions, null, 2)}
提案会議: ${JSON.stringify(currentAnalysis.suggestedMeetings, null, 2)}
`
      : '';

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
              required: ['nextActions', 'suggestedMeetings', 'message'],
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
    throw new Error('チャット要求の処理に失敗しました。');
  }
}
