/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState } from 'react';

export default function GTASValidatorPage() {
  const [erpFile, setErpFile] = useState<File | null>(null);
  const [gtasFile, setGtasFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!erpFile || !gtasFile) {
      setError('Please select both ERP and GTAS files.');
      return;
    }

    const formData = new FormData();
    formData.append('erp_file', erpFile);
    formData.append('gtas_file', gtasFile);

    setLoading(true);
    try {
      const response = await fetch('/gtas-validator/api', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unknown error occurred.');
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Network or server error.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (filePath: string, filename: string) => {
    const url = `/gtas-validator/download/${encodeURIComponent(filename)}`;
    window.open(url, '_blank');
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">GTAS Validator</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
        <label className="font-semibold">Upload ERP Trial Balances CSV:</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setErpFile(e.target.files ? e.target.files[0] : null)}
          className="border p-2"
        />

        <label className="font-semibold">Upload GTAS Output CSV:</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setGtasFile(e.target.files ? e.target.files[0] : null)}
          className="border p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white font-semibold py-3 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Validating...' : 'Validate Files'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-100 text-green-800 p-4 rounded">
          <h2 className="text-2xl font-bold mb-2">
            Validation {result.is_valid ? 'Passed ✅' : 'Failed ❌'}
          </h2>
          <p className="mb-2">
            Rows processed: {result.summary.total_rows}, Errors found: {result.summary.errors}
          </p>

          {!result.is_valid && result.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Errors:</h3>
              <ul className="list-disc list-inside mb-4">
                {result.errors.map((err: any, idx: number) => (
                  <li key={idx}>
                    Row {err.row}: {err.message || err.error_message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {result.fbdi_file && (
              <button
                onClick={() => downloadFile(result.fbdi_file, 'fbdi_journal_corrections.csv')}
                className="bg-gray-700 text-white font-semibold py-2 px-4 rounded hover:bg-gray-800"
              >
                Download Corrected FBDI
              </button>
            )}
            {result.exception_file && (
              <button
                onClick={() => downloadFile(result.exception_file, 'exception_report.csv')}
                className="bg-gray-700 text-white font-semibold py-2 px-4 rounded hover:bg-gray-800"
              >
                Download Exception Report
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}