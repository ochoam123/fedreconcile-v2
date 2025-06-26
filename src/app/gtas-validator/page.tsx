'use client'; // This directive indicates that this component should run on the client-side

import { useState } from 'react';
import Header from '../../components/Header'; // Adjust path if Header is not one level up from app
import Footer from '../../components/Footer'; // Adjust path if Footer is not one level up from app

export default function GtasValidatorPage() {
  const [gtasFile, setGtasFile] = useState<File | null>(null);
  const [erpFile, setErpFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null); // To store results from the API

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

    // --- Placeholder for API Call ---
    // In a real scenario, you would send these files to your Python backend API.
    // For now, we'll simulate a delay and some mock results.
    console.log('Simulating file upload and validation...');
    const formData = new FormData();
    formData.append('gtas', gtasFile);
    formData.append('erp', erpFile);

    try {
      // Replace this with your actual API endpoint call
      // const response = await fetch('/api/gtas-validate', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      // setResults(data);

      // --- Mocking API response for now ---
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      setResults({
        success: true,
        exceptionReportUrl: '#', // Placeholder URL for download
        fbdiJournalUrl: '#',    // Placeholder URL for download
        message: 'Validation complete. Download reports below.'
      });
      // --- End Mocking ---

    } catch (error) {
      console.error('Validation failed:', error);
      setResults({ success: false, message: 'Validation failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header /> {/* Using the shared Header component */}
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
      <Footer /> {/* Using the shared Footer component */}
    </>
  );
}