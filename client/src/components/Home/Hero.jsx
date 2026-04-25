import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CirclePlay, ShieldCheck, TrendingUp } from 'lucide-react';

const carouselImages = [
  {
    src: '/images/carousel/food-delivery-guy.jpg',
    alt: 'Pakistani food delivery rider using FairGig on a phone',
  },
  {
    src: '/images/carousel/gig-workers.jpg',
    alt: 'Pakistani gig workers standing together with confidence',
  },
  {
    src: '/images/carousel/uber-guy.jpg',
    alt: 'Pakistani ride-hailing driver checking verified earnings',
  },
];

const cardStyles = [
  'z-30 translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100',
  'z-20 translate-x-18 translate-y-6 rotate-[9deg] scale-[0.92] opacity-95',
  'z-10 -translate-x-18 translate-y-8 -rotate-[9deg] scale-[0.9] opacity-85',
];

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % carouselImages.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  const orderedImages = carouselImages.map((_, offset) => carouselImages[(activeIndex + offset) % carouselImages.length]);

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_right,_rgba(17,24,39,0.16),_transparent_34%),radial-gradient(circle_at_top_left,_rgba(71,85,105,0.14),_transparent_28%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Trusted by workers who need proof, not promises
          </div>

          <h1 className="mt-8 max-w-4xl font-display text-4xl leading-[1.02] text-slate-950 sm:text-5xl lg:text-7xl">
            The accountability layer for the
            <span className="block bg-gradient-to-r from-slate-950 via-slate-700 to-slate-400 bg-clip-text text-transparent">
              modern gig economy.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            FairGig gives workers a clean way to prove earnings, surface disputes, and build trust across platforms with a
            frontend that feels clear under pressure.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-900 hover:text-slate-950"
            >
              <CirclePlay className="h-4 w-4" />
              See how it works
            </a>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="text-3xl font-bold text-slate-950">50k+</div>
              <div className="mt-1 text-sm text-slate-600">Workers with portable income proof</div>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex items-center gap-2 text-3xl font-bold text-slate-950">
                96%
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-1 text-sm text-slate-600">Worker onboarding completion on mobile-first flows</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="text-3xl font-bold text-slate-950">24/7</div>
              <div className="mt-1 text-sm text-slate-600">Access to records, disputes, and case updates</div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:-mt-3 xl:-mt-5">
          
          <div className="relative mx-auto h-[26rem] w-full max-w-[22rem] sm:h-[30rem] sm:max-w-[24rem]">
            {orderedImages.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => setActiveIndex((activeIndex + index) % carouselImages.length)}
                className={`absolute inset-0 overflow-hidden rounded-[30px] border border-white/70 bg-white/50 p-3 text-left shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur transition-all duration-700 ease-out ${cardStyles[index]}`}
                aria-label={`Show slide ${((activeIndex + index) % carouselImages.length) + 1}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-slate-200">
                  <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent transition-opacity duration-500 ${
                      index === 0 ? 'opacity-100' : 'opacity-70'
                    }`}
                  />
                  {index === 0 && (
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="max-w-[15rem] text-sm font-medium leading-6 text-white">{image.alt}</p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {carouselImages.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${activeIndex === index ? 'w-10 bg-slate-950' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
