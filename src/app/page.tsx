'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  analyzeMeetingMinutes,
  processFullMeetingSetup,
  checkAvailability,
  createMeeting,
  processChatRequest,
  MeetingAnalysisResult,
  AvailabilityResult,
  MeetingCreationResult,
} from './actions';
import {
  getOrganizationUsers,
  getAccessibleCalendarUsers,
  OutlookUser,
} from './outlook-actions';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  data?: MeetingAnalysisResult;
}

export default function Home() {
  const [meetingMinutes, setMeetingMinutes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    analysis: MeetingAnalysisResult;
    availability?: AvailabilityResult;
    createdMeetings?: MeetingCreationResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingMeeting, setCreatingMeeting] = useState<string | null>(null);

  // チャット関連のstate
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Outlookユーザー関連のstate
  const [outlookUsers, setOutlookUsers] = useState<OutlookUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // 従来の完全自動処理（現在は使用していないが将来的に使用可能）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAnalyze = async () => {
    if (!meetingMinutes.trim()) {
      setError('議事録を入力してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await processFullMeetingSetup(meetingMinutes);
      setResult(analysisResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '処理中にエラーが発生しました。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpleAnalyze = async () => {
    if (!meetingMinutes.trim()) {
      setError('議事録を入力してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeMeetingMinutes(meetingMinutes);
      setResult({ analysis: analysisResult });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '処理中にエラーが発生しました。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!meetingMinutes.trim()) {
      setError('議事録を入力してください。');
      return;
    }

    setIsChatMode(true);
    setChatLoading(true);
    setError(null);

    // 初期メッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `以下の議事録を分析して、会議設定を手伝ってください：\n\n${meetingMinutes}`,
    };

    setChatMessages([userMessage]);

    try {
      const analysisResult = await analyzeMeetingMinutes(meetingMinutes);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `## 📊 議事録分析が完了しました

${analysisResult.message}

以下のネクストアクションと会議提案を抽出しました。どの会議から設定を始めますか？`,
        data: analysisResult,
      };

      setChatMessages([userMessage, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `申し訳ございません。分析中にエラーが発生しました：${err instanceof Error ? err.message : '不明なエラー'}`,
      };
      setChatMessages([userMessage, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
    };

    const currentInput = chatInput;
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // 最新の分析データを取得（逆順で検索して最後のdataを持つメッセージを取得）
      const latestAnalysis = [...chatMessages]
        .reverse()
        .find(msg => msg.data)?.data;

      // 新しいserver actionを使用してチャット要求を処理
      const result = await processChatRequest(currentInput, latestAnalysis);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.message,
        data: result.updatedAnalysis,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `申し訳ございません。処理中にエラーが発生しました。`,
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateMeeting = async (meeting: {
    title: string;
    purpose: string;
    requiredAttendees: string[];
    estimatedDuration: number;
    suggestedDate: string;
  }) => {
    setCreatingMeeting(meeting.title);
    setError(null);

    try {
      // まず空き時間をチェック
      const availability = await checkAvailability(
        meeting.requiredAttendees,
        meeting.suggestedDate,
        meeting.suggestedDate,
        meeting.estimatedDuration
      );

      if (availability.availableSlots.length > 0) {
        const firstSlot = availability.availableSlots[0];
        const createdMeeting = await createMeeting({
          title: meeting.title,
          description: meeting.purpose,
          attendees: meeting.requiredAttendees,
          date: firstSlot.date,
          startTime: firstSlot.startTime,
          duration: meeting.estimatedDuration,
        });

        // 結果を更新
        setResult(prev =>
          prev
            ? {
                ...prev,
                availability,
                createdMeetings: [
                  ...(prev.createdMeetings || []),
                  createdMeeting,
                ],
              }
            : null
        );
      } else {
        setError('指定された参加者の空き時間が見つかりませんでした。');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '会議作成中にエラーが発生しました。'
      );
    } finally {
      setCreatingMeeting(null);
    }
  };

  // Outlookユーザー一覧を取得
  const handleLoadOutlookUsers = async () => {
    setLoadingUsers(true);
    setError(null);

    try {
      const users = await getOrganizationUsers();
      setOutlookUsers(users);
      setShowUserSelection(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ユーザー一覧の取得に失敗しました。'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ユーザー選択の切り替え
  const handleUserSelection = (email: string) => {
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="h-full max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            AI会議設定エージェント
          </h1>

          {!isChatMode ? (
            <>
              <div className="mb-6">
                <label
                  htmlFor="meetingMinutes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  議事録を入力してください
                </label>
                <textarea
                  id="meetingMinutes"
                  value={meetingMinutes}
                  onChange={e => setMeetingMinutes(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="議事録の内容をここに入力してください...

例：
2024年2月5日 プロジェクト会議
参加者: 田中、佐藤、鈴木
議題: 新機能開発について
決定事項:
- 新機能の仕様書を田中と佐藤で作成する（期限: 2/15）
- 予算承認を山田が手続きする（期限: 2/10）
- 次回、仕様検討会議を開催予定"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleSimpleAnalyze}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? '分析中...' : '議事録分析のみ'}
                </button>

                <button
                  onClick={handleStartChat}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? '処理中...' : 'チャットで会議設定'}
                </button>
              </div>

              {/* Outlookユーザー選択セクション */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    📧 Outlookユーザー選択
                  </h3>
                  <button
                    onClick={handleLoadOutlookUsers}
                    disabled={loadingUsers}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingUsers ? '読み込み中...' : '組織ユーザーを取得'}
                  </button>
                </div>

                {showUserSelection && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      会議に参加可能なユーザーを選択してください（
                      {selectedUsers.length}名選択中）
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {outlookUsers.map(user => (
                        <div
                          key={user.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedUsers.includes(user.email)
                              ? 'bg-purple-100 border-purple-500'
                              : 'bg-white border-gray-300 hover:border-purple-300'
                          }`}
                          onClick={() => handleUserSelection(user.email)}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-2 ${
                                selectedUsers.includes(user.email)
                                  ? 'bg-purple-500'
                                  : 'bg-gray-300'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                              {user.jobTitle && (
                                <p className="text-xs text-gray-400 truncate">
                                  {user.jobTitle}{' '}
                                  {user.department && `• ${user.department}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="mt-3 p-2 bg-purple-50 rounded border">
                        <p className="text-sm text-purple-800">
                          <strong>選択中:</strong> {selectedUsers.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* チャット履歴 */}
              <div className="h-[calc(100vh-250px)] overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50 mb-4">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-3xl p-3 rounded-lg text-left ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      {message.type === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}

                      {/* 分析データがある場合は表示 */}
                      {message.data && (
                        <div className="mt-4 space-y-3">
                          {/* ネクストアクション */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              ネクストアクション
                            </h4>
                            <div className="space-y-2">
                              {message.data.nextActions.map(
                                (action, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-gray-50 p-2 rounded text-sm"
                                  >
                                    <div className="font-medium">
                                      {action.action}
                                    </div>
                                    <div className="text-gray-600">
                                      担当: {action.responsible.join(', ')} |
                                      期限: {action.deadline} | 優先度:{' '}
                                      {action.priority}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* 提案会議 */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              提案される会議
                            </h4>
                            <div className="space-y-2">
                              {message.data.suggestedMeetings.map(
                                (meeting, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-gray-50 p-2 rounded text-sm"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="font-medium">
                                        {meeting.title}
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCreateMeeting(meeting)
                                        }
                                        disabled={
                                          creatingMeeting === meeting.title
                                        }
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        {creatingMeeting === meeting.title
                                          ? '作成中...'
                                          : '会議を作成'}
                                      </button>
                                    </div>
                                    <div className="text-gray-600">
                                      {meeting.purpose} | 参加者:{' '}
                                      {meeting.requiredAttendees.join(', ')} |
                                      {meeting.estimatedDuration}分
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="text-left">
                    <div className="inline-block bg-white text-gray-900 border p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        処理中...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* チャット入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="メッセージを入力してください..."
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </div>

              {/* リセットボタン */}
              <button
                onClick={() => {
                  setIsChatMode(false);
                  setChatMessages([]);
                  setChatInput('');
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 mt-4"
              >
                新しい議事録で開始
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {result && !isChatMode && (
            <div className="space-y-6">
              {/* 分析結果 */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  📊 分析結果
                </h2>

                {/* ネクストアクション */}
                <div className="mb-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    ネクストアクション
                  </h3>
                  <div className="space-y-2">
                    {result.analysis.nextActions.map((action, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {action.action}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              action.priority === '高'
                                ? 'bg-red-100 text-red-800'
                                : action.priority === '中'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {action.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          担当者: {action.responsible.join(', ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          期限: {action.deadline}
                        </p>
                        {action.department && (
                          <p className="text-sm text-gray-600">
                            部門: {action.department.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 提案会議 */}
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">
                    提案される会議
                  </h3>
                  <div className="space-y-2">
                    {result.analysis.suggestedMeetings.map((meeting, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {meeting.title}
                          </h4>
                          <button
                            onClick={() => handleCreateMeeting(meeting)}
                            disabled={creatingMeeting === meeting.title}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {creatingMeeting === meeting.title
                              ? '作成中...'
                              : '会議を作成'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {meeting.purpose}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>参加者: {meeting.requiredAttendees.join(', ')}</p>
                          <p>時間: {meeting.estimatedDuration}分</p>
                          <p>予定日: {meeting.suggestedDate}</p>
                          {meeting.department && (
                            <p>部門: {meeting.department.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* スケジュール確認結果 */}
              {result.availability && (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h2 className="text-lg font-semibold text-yellow-900 mb-3">
                    スケジュール確認
                  </h2>
                  <div className="text-yellow-800 mb-4 prose prose-sm max-w-none prose-headings:text-yellow-900 prose-strong:text-yellow-900 prose-li:text-yellow-800">
                    <ReactMarkdown>{result.availability.message}</ReactMarkdown>
                  </div>

                  <div>
                    <h3 className="font-medium text-yellow-900 mb-2">
                      空き時間
                    </h3>
                    <div className="space-y-2">
                      {result.availability.availableSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border"
                        >
                          <div className="grid grid-cols-3 gap-2 text-sm text-gray-900">
                            <p>
                              <strong>日付:</strong> {slot.date}
                            </p>
                            <p>
                              <strong>時間:</strong> {slot.startTime} -{' '}
                              {slot.endTime}
                            </p>
                            <p>
                              <strong>参加者:</strong>{' '}
                              {slot.attendees.join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 作成された会議 */}
              {result.createdMeetings && result.createdMeetings.length > 0 && (
                <div className="bg-green-50 p-4 rounded-md">
                  <h2 className="text-lg font-semibold text-green-900 mb-3">
                    作成された会議
                  </h2>

                  <div className="space-y-2">
                    {result.createdMeetings.map((meeting, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">
                            会議ID: {meeting.meetingId}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              meeting.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {meeting.success ? '成功' : '失敗'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-600">
                          <ReactMarkdown>{meeting.message}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
