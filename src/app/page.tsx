import Header from '../components/Header';    // The Header component
import Hero from '../components/Hero';        // The newly created Hero component
import Features from '../components/Features'; // The Features component

export default function Home() {
  return (
    // The main tag here mainly serves as a wrapper for the sections.
    // The background color is handled by the Header, Hero, and other sections themselves.
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
    </main>
  );
}