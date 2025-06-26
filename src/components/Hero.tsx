import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-[#1A3B5B] text-white py-20 md:py-32">
      <div className="container mx-auto px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
          AI-Driven Reconciliation <br /> for Federal ERP
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-[#D0D0D0]">
          Streamline your federal financial operations, reduce errors, and ensure compliance with intelligent automation.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="#"
            className="bg-[#3A7CA5] hover:bg-[#2A6C95] text-white font-bold py-3 px-8 rounded-full transition duration-300"
          >
            Request a Demo
          </Link>
          <Link
            href="#"
            className="border border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-[#1A3B5B] transition duration-300"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}