import { NextRequest, NextResponse } from 'next/server';
import { ConfidentialClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    authority: 'https://login.microsoftonline.com/common',
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    // 認証URLを生成してリダイレクト
    const authCodeUrlParameters = {
      scopes: [
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Calendars.Read.Shared',
        'https://graph.microsoft.com/User.Read.All',
      ],
      redirectUri: `${process.env.NEXTAUTH_URL}/auth/microsoft`,
      state: state || 'default_state',
    };

    try {
      const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
      return NextResponse.redirect(authUrl);
    } catch (error) {
      console.error('認証URL生成エラー:', error);
      return NextResponse.json(
        { error: '認証URL生成に失敗しました' },
        { status: 500 }
      );
    }
  }

  // 認証コードを使ってアクセストークンを取得
  const tokenRequest = {
    code,
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Calendars.Read.Shared',
      'https://graph.microsoft.com/User.Read.All',
    ],
    redirectUri: `${process.env.NEXTAUTH_URL}/auth/microsoft`,
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);

    if (response) {
      // トークンをセッションに保存（実際の実装では適切なセッション管理を使用）
      const redirectUrl = new URL('/', process.env.NEXTAUTH_URL!);
      redirectUrl.searchParams.set('access_token', response.accessToken);

      return NextResponse.redirect(redirectUrl);
    } else {
      return NextResponse.json(
        { error: 'トークン取得に失敗しました' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('トークン取得エラー:', error);
    return NextResponse.json(
      { error: 'トークン取得に失敗しました' },
      { status: 500 }
    );
  }
}
