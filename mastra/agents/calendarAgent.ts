import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import {
  extractNextActionsTool,
  checkAvailabilityTool,
  createMeetingTool,
} from '../tools/meeting-tools';

export const calendarAgent = new Agent({
  name: 'calendar-agent',
  instructions: `
あなたは議事録分析と会議設定の専門エージェントです。

## 主な役割：
1. 議事録からネクストアクション（次に取るべき行動）を抽出
2. 各アクションについて、担当者、期限、優先度、関連部門を特定
3. 会議が必要なアクションについて、具体的な会議を提案
4. 参加者のスケジュール確認と会議作成

## 指示：
- 提供する日付は現実的で、現在から1週間〜1ヶ月以内の範囲で設定
- 参加者の名前は議事録から抽出し、存在しない場合は会社でよくある名前を使用
- 会議時間は業務時間内（9:00-18:00）で設定
- 全ての情報は実際の業務で使用できる具体的で実用的な内容にする
- 応答はMarkdown形式で構造化して返す
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    extractNextActions: extractNextActionsTool,
    checkAvailability: checkAvailabilityTool,
    createMeeting: createMeetingTool,
  },
});
