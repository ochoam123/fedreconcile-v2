import Header from '@/components/Header';

export default function Home() {
  return (
    // The main container now has a dark background
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center flex-grow p-8">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
          Streamline Federal Reconciliation
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl">
          Our platform provides a robust, automated solution to manage and reconcile federal transactions with unparalleled accuracy and efficiency.
        </p>
        <a 
          href="/dashboard" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out"
        >
          Get Started
        </a>
      </section>
    </main>
  );
}