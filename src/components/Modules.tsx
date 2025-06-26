import { BarChart2, Banknote, ClipboardCheck, Users } from 'lucide-react';
import Link from 'next/link'; // <--- Import Link

export default function Modules() {
  return (
    <section className="w-full bg-[#F8F9FA] py-16 md:py-24">
      <div className="container mx-auto px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Our Core Modules
        </h2>
        <p className="text-gray-600 mb-12 max-w-3xl mx-auto">
          FedReconcile provides specialized modules designed to address key federal financial reconciliation challenges.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Module 1: GTAS - NOW CLICKABLE! */}
          <Link href="/gtas-validator" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-[#3A7CA5] text-white rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <BarChart2 size={32} /> {/* GTAS icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">GTAS</h3>
            <p className="text-gray-600">
              Automate the reconciliation and validation of Governmentwide Treasury Account Symbol (GTAS) trial balances.
            </p>
          </Link>

          {/* Module 2: CARS (unchanged for now) */}
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-[#3A7CA5] text-white rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Banknote size={32} /> {/* CARS icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">CARS</h3>
            <p className="text-gray-600">
              Streamline reconciliation processes related to the Central Accounting and Reporting System (CARS).
            </p>
          </div>

          {/* Module 3: SBR + SF-133 (unchanged for now) */}
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-[#3A7CA5] text-white rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <ClipboardCheck size={32} /> {/* SBR + SF-133 icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">SBR + SF-133</h3>
            <p className="text-gray-600">
              Ensure accurate reporting for Statement of Budgetary Resources and SF-133 (Budget Execution and Budgetary Resources).
            </p>
          </div>

          {/* Module 4: IntraGov (unchanged for now) */}
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-[#3A7CA5] text-white rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Users size={32} /> {/* IntraGov icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">IntraGov</h3>
            <p className="text-gray-600">
              Simplify the reconciliation and resolution of intra-governmental transactions and balances.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}