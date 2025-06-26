import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Modules from '../components/Modules';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer'; // <--- Import the Footer component

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Modules />
      <CallToAction />
      <Footer /> {/* <--- Add the Footer component here */}
    </main>
  );
}