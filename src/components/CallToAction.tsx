import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="w-full bg-[#1A3B5B] text-white py-16 md:py-24 text-center"> {/* Dark blue background */}
      <div className="container mx-auto px-8">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
          Ready to Streamline Your Federal Reconciliation?
        </h2>
        <p className="text-lg md:text-xl text-[#D0D0D0] mb-8 max-w-3xl mx-auto">
          Contact us today to schedule a personalized demo and see how FedReconcile can transform your financial operations.
        </p>
        <Link
          href="#"
          className="bg-[#3A7CA5] hover:bg-[#2A6C95] text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300" // Branded accent button
        >
          Request a Free Demo
        </Link>
      </div>
    </section>
  );
}