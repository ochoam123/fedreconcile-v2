import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-[#e0f2f7] to-[#d0eff7] text-gray-800 py-20 md:py-32"> {/* New light blue gradient background, dark text */}
      <div className="container mx-auto px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
          AI-Driven Reconciliation <br /> for Federal ERP
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-600"> {/* Adjusted paragraph text color */}
          Streamline your federal financial operations, reduce errors, and ensure compliance with intelligent automation.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="#"
            className="bg-[#3A7CA5] hover:bg-[#2A6C95] text-white font-bold py-3 px-8 rounded-full transition duration-300" // Keep accent button color
          >
            Request a Demo
          </Link>
          <Link
            href="#"
            className="border border-gray-400 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-100 hover:text-gray-900 transition duration-300" // Adjusted border and hover for light background
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}