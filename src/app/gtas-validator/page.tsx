'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface ValidationResults {
  success: boolean;
  message: string;
  exceptionReportUrl?: string;
  fbdiJournalUrl?: string;
}

export default function GtasValidatorPage() {
  const [gtasFile, setGtasFile] = useState<File | null>(null);
  const [erpFile, setErpFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ValidationResults | null>(null);

  const { isLoggedIn } = useAuth();
  const router = useRouter();

  console.log('GTAS Validator Page: Component rendered. isLoggedIn:', isLoggedIn); // <--- DEBUG LOG

  // Redirect if not logged in
  useEffect(() => {
    console.log('GTAS Validator Page useEffect: isLoggedIn changed to', isLoggedIn); // <--- DEBUG LOG
    if (!isLoggedIn) {
      console.log('GTAS Validator Page: Not logged in. Redirecting to /login'); // <--- DEBUG LOG
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const handleGtasFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setGtasFile(event.target.files[0]);
    }
  };

  const handleErpFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setErpFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!gtasFile || !erpFile) {
      alert('Please select both GTAS and ERP files.');
      return;
    }

    setLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append('gtas', gtasFile);
    formData.append('erp', erpFile);

    // --- Security: Include Authorization header with JWT ---
    const token = typeof window !== 'undefined' ? localStorage.getItem('mockAuthToken') : null;
    if (!token) {
        setResults({ success: false, message: 'Authentication token not found. Please log in again.' });
        setLoading(false);
        router.push('/login'); // Redirect if token missing
        return;
    }
    // --- End Security ---

    try {
      const response = await fetch('/gtas-validator/api', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server responded with an error.');
      }

      const data: ValidationResults = await response.json();
      setResults(data);

    } catch (error: any) {
      console.error('Validation failed:', error);
      setResults({ success: false, message: `Validation failed: ${error.message || 'Unknown error.'}` });
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, render a redirect message while the useEffect handles the actual routing
  if (!isLoggedIn) {
    console.log('GTAS Validator Page: Rendering Access Denied message.'); // <--- DEBUG LOG
    return (
        <>
            <Header />
            <main className="flex-grow flex items-center justify-center bg-gray-50 py-16 md:py-24">
                <div className="text-center text-gray-700">Access Denied. Redirecting to login...</div>
            </main>
            <Footer />
        </>
    );
  }

  // Render the GTAS Validator content only if logged in
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
            GTAS Validator
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Upload your GTAS and ERP balance files to automatically identify discrepancies and generate correction reports.
          </p>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-xl mx-auto">
            <div className="mb-6 text-left">
              <label htmlFor="gtasFile" className="block text-gray-700 text-sm font-bold mb-2">
                GTAS Report File (CSV/XLSX)
              </label>
              <input
                type="file"
                id="gtasFile"
                accept=".csv,.xlsx"
                onChange={handleGtasFileChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-8 text-left">
              <label htmlFor="erpFile" className="block text-gray-700 text-sm font-bold mb-2">
                ERP Balances File (CSV/XML)
              </label>
              <input
                type="file"
                id="erpFile"
                accept=".csv,.xml"
                onChange={handleErpFileChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <button
              type="submit"
              className="bg-[#3A7CA5] hover:bg-[#2A6C95] text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Run Validation'}
            </button>
          </form>

          {results && (
            <div className={`mt-10 p-6 rounded-lg shadow-md ${results.success ? 'bg-green-50' : 'bg-red-50'} max-w-xl mx-auto`}>
              <h3 className={`text-xl font-bold mb-4 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                {results.success ? 'Validation Successful!' : 'Validation Failed'}
              </h3>
              <p className={`mb-4 ${results.success ? 'text-green-700' : 'text-red-700'}`}>{results.message}</p>
              {results.success && (
                <div className="flex flex-col space-y-4">
                  <a
                    href={results.exceptionReportUrl}
                    download="exception_report.xlsx"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center transition duration-300"
                  >
                    Download Exception Report
                  </a>
                  <a
                    href={results.fbdiJournalUrl}
                    download="fbdi_journal_corrections.csv"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center transition duration-300"
                  >
                    Download FBDI Journal Corrections
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}