import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const { filename } = params;
  const filePath = path.join(os.tmpdir(), filename);

  try {
    const fileBuffer = await fs.readFile(filePath);

    let mimeType = 'application/octet-stream';
    if (filename.endsWith('.xlsx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (filename.endsWith('.csv')) {
      mimeType = 'text/csv';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(`Error serving file ${filename}:`, error);
    return NextResponse.json({ message: 'File not found or could not be accessed.' }, { status: 404 });
  }
}