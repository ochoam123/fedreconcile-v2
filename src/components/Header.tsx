export default function Header() {
  return (
    <header className="w-full bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">
          FedReconcile
        </div>
        <div>
          <a href="#" className="px-3 hover:text-gray-300">Home</a>
          <a href="#" className="px-3 hover:text-gray-300">Dashboard</a>
          <a href="#" className="px-3 hover:text-gray-300">Login</a>
        </div>
      </nav>
    </header>
  );
}