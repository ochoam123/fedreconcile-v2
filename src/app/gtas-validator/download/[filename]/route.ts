import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import * as fsSync from 'fs'; // <--- NEW: Import fsSync for existsSync

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const { filename } = params;
  const filePath = path.join(os.tmpdir(), filename);

  console.log(`Download API: Attempting to serve file from: ${filePath}`);

  try {
    // Check if file exists before trying to read it
    if (!fsSync.existsSync(filePath)) { // <--- NEW: Add this check
        console.error(`Download API: File does NOT exist at path: ${filePath}`); // <--- NEW: Log if file missing
        return NextResponse.json({ message: 'File not found on server.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    console.log(`Download API: Successfully read file: ${filePath}`); // <--- NEW: Log successful read

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
    // Explicitly check for ENOENT if the error type allows (though existsSync should prevent this specific one)
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ message: 'File not found on server (ENOENT).' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Server error during file download.' }, { status: 500 });
  }
}