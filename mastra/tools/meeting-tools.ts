import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 議事録からネクストアクションを抽出するツール
export const extractNextActionsTool = createTool({
  id: 'extract-next-actions',
  description: '議事録からネクストアクションを抽出し、必要な会議を特定します',
  inputSchema: z.object({
    meetingMinutes: z.string().describe('議事録の内容'),
  }),
  outputSchema: z.object({
    nextActions: z.array(
      z.object({
        action: z.string(),
        responsible: z.array(z.string()),
        deadline: z.string(),
        meetingRequired: z.boolean(),
        priority: z.enum(['高', '中', '低']),
        department: z.array(z.string()).optional(),
      })
    ),
    suggestedMeetings: z.array(
      z.object({
        title: z.string(),
        purpose: z.string(),
        requiredAttendees: z.array(z.string()),
        estimatedDuration: z.number(),
        suggestedDate: z.string(),
        department: z.array(z.string()).optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    // この部分は実際のAI処理ロジックを実装
    // 今回はモック実装として、議事録を解析したふりをします
    console.log(
      '議事録を解析中:',
      context.meetingMinutes.substring(0, 100) + '...'
    );

    // AIによる議事録解析をシミュレート
    const mockNextActions = [
      {
        action: '新機能の仕様書作成',
        responsible: ['田中', '佐藤'],
        deadline: '2024-02-15',
        meetingRequired: true,
        priority: '高' as const,
        department: ['開発', '企画'],
      },
      {
        action: '予算承認の手続き',
        responsible: ['山田'],
        deadline: '2024-02-10',
        meetingRequired: true,
        priority: '高' as const,
        department: ['経理', '管理'],
      },
    ];

    const mockMeetings = [
      {
        title: '新機能仕様検討会議',
        purpose: '新機能の詳細仕様を決定するため',
        requiredAttendees: ['田中', '佐藤', '鈴木'],
        estimatedDuration: 90,
        suggestedDate: '2024-02-12',
        department: ['開発', '企画'],
      },
      {
        title: '予算承認会議',
        purpose: 'プロジェクト予算の承認を得るため',
        requiredAttendees: ['山田', '部長', '経理担当'],
        estimatedDuration: 60,
        suggestedDate: '2024-02-08',
        department: ['経理', '管理'],
      },
    ];

    return {
      nextActions: mockNextActions,
      suggestedMeetings: mockMeetings,
    };
  },
});

// カレンダー空き時間チェックツール
export const checkAvailabilityTool = createTool({
  id: 'check-availability',
  description: '指定された参加者のカレンダーの空き時間をチェックします',
  inputSchema: z.object({
    attendees: z.array(z.string()).describe('参加者のリスト'),
    startDate: z.string().describe('開始日'),
    endDate: z.string().describe('終了日'),
    duration: z.number().describe('会議の予定時間（分）'),
  }),
  outputSchema: z.object({
    availableSlots: z.array(
      z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        attendees: z.array(z.string()),
      })
    ),
  }),
  execute: async ({ context }) => {
    // Outlookカレンダーとの連携をシミュレート
    // 実際の実装では Microsoft Graph API を使用
    const mockAvailability = [
      {
        date: '2024-02-12',
        startTime: '10:00',
        endTime: '11:30',
        attendees: context.attendees,
      },
      {
        date: '2024-02-12',
        startTime: '14:00',
        endTime: '15:30',
        attendees: context.attendees,
      },
      {
        date: '2024-02-13',
        startTime: '09:00',
        endTime: '10:30',
        attendees: context.attendees,
      },
    ];

    return {
      availableSlots: mockAvailability,
    };
  },
});

// 会議作成ツール
export const createMeetingTool = createTool({
  id: 'create-meeting',
  description: 'Outlookカレンダーに会議を作成します',
  inputSchema: z.object({
    title: z.string(),
    description: z.string(),
    attendees: z.array(z.string()),
    date: z.string(),
    startTime: z.string(),
    duration: z.number(),
    location: z.string().optional(),
  }),
  outputSchema: z.object({
    meetingId: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    // Microsoft Graph API との連携をシミュレート
    const meetingId = `meeting_${Date.now()}`;

    console.log(`会議を作成しました:
      タイトル: ${context.title}
      日時: ${context.date} ${context.startTime}
      参加者: ${context.attendees.join(', ')}
      時間: ${context.duration}分`);

    return {
      meetingId,
      success: true,
      message: '会議が正常に作成されました。',
    };
  },
});
