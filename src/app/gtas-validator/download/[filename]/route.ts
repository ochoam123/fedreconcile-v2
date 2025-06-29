import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as fsSync from 'fs';

export async function GET(
  request: Request,
  context: { params: { filename: string } }
) {
  const { filename } = context.params;
  const filePath = path.join(os.tmpdir(), filename);

  console.log(`Download API: Attempting to serve file from: ${filePath}`);

  try {
    // Check if file exists before trying to read it
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

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(`Download API: Error serving file ${filename}:`, error);
    return NextResponse.json({ message: 'Server error during file download.' }, { status: 500 });
  }
}