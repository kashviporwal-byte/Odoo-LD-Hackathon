import { NextRequest, NextResponse } from 'next/server';
import { googleLoginAction } from '@/lib/auth-actions';

/**
 * Next.js App Router Route Handler for Google OAuth / Credentials callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await googleLoginAction(body.credential || body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to process Google authentication callback.' },
      { status: 500 }
    );
  }
}
