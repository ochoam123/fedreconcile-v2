import { NextRequest, NextResponse } from 'next/server';

// @ts-expect-error Next.js infers context params at runtime
export async function GET(req: NextRequest, context) {
  const { filename } = context.params;

  return new NextResponse(`Download request for file: ${filename}`);
}