import Link from 'next/link'; // <--- Make sure this line is present!
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full bg-[#1A3B5B] text-white py-4 shadow-md">
      <div className="container mx-auto px-8 flex justify-between items-center">
        <Link href="/">
          {/* Ensure your logo file path and dimensions are correct here */}
          <Image
            src="/fedreconcile-logo.png"
            alt="FedReconcile Logo"
            width={180} // Adjust width as needed
            height={40} // Adjust height as needed
            priority
          />
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="#" className="hover:text-gray-300">
                Features
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-gray-300">
                Solutions
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-gray-300">
                Contact
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-gray-300">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}