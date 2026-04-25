import Hero from '../components/Home/Hero';
import Sections from '../components/Home/Sections';
import Navbar from '../components/Layout/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_48%,_#e5e7eb_100%)] text-slate-950">
      <Navbar />
      <main>
        <Hero />
        <Sections />
      </main>
    </div>
  );
};

export default Home;
