import { Zap, CheckCircle, BarChart2 } from 'lucide-react'; // Import the icons you want to use

export default function Features() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Why Choose FedReconcile?
        </h2>
        <p className="text-gray-600 mb-12 max-w-3xl mx-auto">
          We provide a comprehensive suite of tools designed to simplify complex financial operations and ensure regulatory compliance with ease.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Feature 1: Automation */}
          <div className="flex flex-col items-center">
            {/* Replace "A" with Zap icon */}
            <div className="bg-blue-100 text-blue-600 rounded-full h-16 w-16 flex items-center justify-center font-bold text-2xl mb-4">
              <Zap size={32} /> {/* Using Zap icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Automation</h3>
            <p className="text-gray-600">
              Automate repetitive reconciliation tasks to reduce manual errors and save hundreds of hours per year.
            </p>
          </div>

          {/* Feature 2: Compliance */}
          <div className="flex flex-col items-center">
            {/* Replace "C" with CheckCircle icon */}
            <div className="bg-green-100 text-green-600 rounded-full h-16 w-16 flex items-center justify-center font-bold text-2xl mb-4">
              <CheckCircle size={32} /> {/* Using CheckCircle icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Compliance</h3>
            <p className="text-gray-600">
              Stay ahead of regulatory changes with up-to-date compliance checks and detailed audit trail reporting.
            </p>
          </div>

          {/* Feature 3: Insights */}
          <div className="flex flex-col items-center">
            {/* Replace "I" with BarChart2 icon */}
            <div className="bg-purple-100 text-purple-600 rounded-full h-16 w-16 flex items-center justify-center font-bold text-2xl mb-4">
              <BarChart2 size={32} /> {/* Using BarChart2 icon */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Insights</h3>
            <p className="text-gray-600">
              Gain valuable financial insights through powerful analytics and customizable dashboard visualizations.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}