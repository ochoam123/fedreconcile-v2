export default function Footer() {
  const currentYear = new Date().getFullYear(); // Dynamically get the current year

  return (
    <footer className="w-full bg-[#1A3B5B] text-white py-8 text-center"> {/* Dark blue background */}
      <div className="container mx-auto px-8">
        <p className="text-sm">
          &copy; {currentYear} FedReconcile. All rights reserved.
        </p>
        {/* You can add more links here later, e.g., Privacy Policy, Terms of Service */}
      </div>
    </footer>
  );
}