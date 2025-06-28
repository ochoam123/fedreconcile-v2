import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const { filename } = params;
  const filePath = path.join(os.tmpdir(), filename);

  console.log(`Download API: Attempting to serve file from: ${filePath}`); // <--- ADD THIS LOG

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
    console.error(`Download API: Error serving file ${filename}:`, error); // <--- LOG ERROR HERE
    return NextResponse.json({ message: 'File not found or could not be accessed.' }, { status: 404 });
  }
}