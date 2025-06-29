import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as fsSync from 'fs';

// Change: Access params from a 'context' object
export async function GET(request: Request, context: { params: { filename: string } }) { // <--- FIXED SIGNATURE
  const { filename } = context.params; // <--- Access params from context
  const filePath = path.join(os.tmpdir(), filename);

  console.log(`Download API: Attempting to serve file from: ${filePath}`);

  try {
    if (!fsSync.existsSync(filePath)) {
        console.error(`Download API: File does NOT exist at path: ${filePath}`);
        return NextResponse.json({ message: 'File not found on server.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    console.log(`Download API: Successfully read file: ${filePath}`);

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
    console.error(`Download API: Error serving file ${filename}:`, error);
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ message: 'File not found on server (ENOENT).' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Server error during file download.' }, { status: 500 });
  }
}