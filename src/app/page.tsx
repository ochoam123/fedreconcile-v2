import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Modules from '../components/Modules';
import CallToAction from '../components/CallToAction'; // <--- Import the CallToAction component

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Modules />
      <CallToAction /> {/* <--- Add the CallToAction component here */}
    </main>
  );
}