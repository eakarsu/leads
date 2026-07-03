import { NextResponse } from 'next/server';

const authCookieNames = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
];

export async function POST() {
  const response = NextResponse.json({ success: true });

  authCookieNames.forEach((name) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: name.startsWith('__Secure') || name.startsWith('__Host'),
      path: '/',
      maxAge: 0,
    });
  });

  return response;
}
