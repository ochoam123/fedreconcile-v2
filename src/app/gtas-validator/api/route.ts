import { NextResponse } from 'next/server';
import path from 'path';
import * as fsPromises from 'fs/promises';
import * as fsSync from 'fs';
import os from 'os';
import { verifyMockJwt } from '../../../lib/jwt';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: Request) {
  // --- Security: JWT Validation (User-facing Auth from frontend) ---
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Authentication required. No token provided.' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const decodedToken = verifyMockJwt(token);

  if (!decodedToken) {
    return NextResponse.json({ success: false, message: 'Invalid or expired authentication token.' }, { status: 401 });
  }

  if (decodedToken.role !== 'admin' && decodedToken.role !== 'gtas_analyst') {
    return NextResponse.json({ success: false, message: 'Access denied. Insufficient privileges.' }, { status: 403 });
  }
  console.log(`User ${decodedToken.userId} (${decodedToken.role}) authenticated and authorized for API access.`);
  // --- End Security (User-facing Auth) ---


  // --- Security: Authenticating to Google Cloud Run Service (Service-to-Service Auth) ---
  const cloudFunctionUrl = 'https://us-central1-fedreconcile-prototype.cloudfunctions.net/gtas-validator-http'; // YOUR ACTUAL LIVE CLOUD RUN URL

  const auth = new GoogleAuth();
  let gcfAuthToken: string | undefined;
  try {
    const client = await auth.getIdTokenClient(cloudFunctionUrl);
    const headers = await client.getRequestHeaders();
    const authorizationHeaderValue = headers.get('Authorization');
    gcfAuthToken = authorizationHeaderValue?.split(' ')[1];
    console.log('Successfully obtained GCF authentication token for Cloud Run invocation.');
  } catch (gcfAuthError) {
    console.error('Error obtaining GCF authentication token for Cloud Run:', gcfAuthError);
    return NextResponse.json({ success: false, message: 'Failed to authenticate to backend service (Cloud Run).' }, { status: 500 });
  }
  // --- End Security (Service-to-Service Auth) ---


  const tempDir = os.tmpdir();
  let gtasTempInputPath: string | undefined;
  let erpTempInputPath: string | undefined;
  let exceptionReportLocalPath: string | undefined;
  let fbdiJournalLocalPath: string | undefined;

  try {
    const formData = await request.formData();
    const gtasFile = formData.get('gtas') as File | null;
    const erpFile = formData.get('erp') as File | null;

    if (!gtasFile || !erpFile) {
      return NextResponse.json({ success: false, message: 'Both GTAS and ERP files are required.' }, { status: 400 });
    }

    const gtasBuffer = Buffer.from(await gtasFile.arrayBuffer());
    const erpBuffer = Buffer.from(await erpFile.arrayBuffer());

    const gtasFileB64 = gtasBuffer.toString('base64');
    const erpFileB64 = erpBuffer.toString('base64');

    gtasTempInputPath = path.join(tempDir, gtasFile.name);
    erpTempInputPath = path.join(tempDir, erpFile.name);
    await fsPromises.writeFile(gtasTempInputPath, gtasBuffer);
    await fsPromises.writeFile(erpTempInputPath, erpBuffer);
    // console.log(`Input files temporarily saved for local review: ${gtasTempInputPath}, ${erpTempInputPath}`); // REMOVED LOG


    const pythonApiPayload = {
      gtas_file_b64: gtasFileB64,
      erp_file_b64: erpFileB64,
      gtas_file_name: gtasFile.name,
      erp_file_name: erpFile.name
    };

    const cloudFnResponse = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gcfAuthToken}`
      },
      body: JSON.stringify(pythonApiPayload),
    });

    if (!cloudFnResponse.ok) {
      const errorText = await cloudFnResponse.text();
      console.error('Cloud Run Service Error Response:', errorText);
      throw new Error(`Cloud Run Service responded with an error: ${cloudFnResponse.status} - ${errorText}`);
    }

    const cloudFnData = await cloudFnResponse.json();
    // console.log('Cloud Run Service Response Data:', cloudFnData); // REMOVED LOG

    const exceptionReportB64 = cloudFnData.exceptionReportB64;
    const fbdiJournalB64 = cloudFnData.fbdiJournalB64;
    const exceptionReportFilename = cloudFnData.exceptionReportFileName || 'exception_report.xlsx';
    const fbdiJournalFilename = cloudFnData.fbdiJournalFileName || 'fbdi_journal_corrections.csv';


    exceptionReportLocalPath = path.join(tempDir, exceptionReportFilename);
    fbdiJournalLocalPath = path.join(tempDir, fbdiJournalFilename);

    if (exceptionReportB64) {
      await fsPromises.writeFile(exceptionReportLocalPath, Buffer.from(exceptionReportB64, 'base64'));
      // console.log(`Saved exception report to: ${exceptionReportLocalPath}`); // REMOVED LOG
    } else {
        // console.warn('Exception report B64 data missing from Cloud Run response.'); // REMOVED WARNING
    }
    if (fbdiJournalB64) {
      await fsPromises.writeFile(fbdiJournalLocalPath, Buffer.from(fbdiJournalB64, 'base64'));
      // console.log(`Saved FBDI journal to: ${fbdiJournalLocalPath}`); // REMOVED LOG
    } else {
        // console.warn('FBDI journal B64 data missing from Cloud Run response.'); // REMOVED WARNING
    }


    return NextResponse.json({
      success: true,
      message: cloudFnData.message || 'Validation complete. Reports generated by Cloud Run Service.',
      exceptionReportUrl: `/gtas-validator/download/${encodeURIComponent(exceptionReportFilename)}`,
      fbdiJournalUrl: `/gtas-validator/download/${encodeURIComponent(fbdiJournalFilename)}`,
    });

  } catch (error: any) {
    console.error('Error calling Cloud Run Service:', error);
    // REMOVED TEMPORARY DEBUGGING BLOCK:
    // if (gtasTempInputPath && fsSync.existsSync(gtasTempInputPath)) {
    //     await fsPromises.unlink(gtasTempInputPath).catch(() => {});
    // }
    // if (erpTempInputPath && fsSync.existsSync(erpTempInputPath)) {
    //     await fsPromises.unlink(erpTempInputPath).catch(() => {});
    // }
    // if (exceptionReportLocalPath && fsSync.existsSync(exceptionReportLocalPath)) {
    //     await fsPromises.unlink(exceptionReportLocalPath).catch(() => {});
    // }
    // if (fbdiJournalLocalPath && fsSync.existsSync(fbdiJournalLocalPath)) {
    //     await fsPromises.unlink(fbdiJournalLocalPath).catch(() => {});
    // }

    return NextResponse.json({ success: false, message: error.message || 'Internal server error calling Cloud Run Service.' }, { status: 500 });
  } finally {
    // TEMPORARY FILE CLEANUP: Added a short delay for downloads to complete.
    // Files are deleted after a short timeout to allow browser to fetch them.
    const filesToClean = [gtasTempInputPath, erpTempInputPath, exceptionReportLocalPath, fbdiJournalLocalPath];
    setTimeout(async () => {
        for (const filePath of filesToClean) {
            if (filePath && fsSync.existsSync(filePath)) {
                try {
                    await fsPromises.unlink(filePath);
                    // console.log(`Cleaned up temporary file: ${filePath}`); // Optional log
                } catch (cleanupErr) {
                    // console.error(`Error cleaning up temporary file ${filePath}:`, cleanupErr); // Optional log
                }
            }
        }
    }, 5000); // Clean up after 5 seconds
  }
}