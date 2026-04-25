import { ArrowRight, BadgeCheck, BriefcaseBusiness, FileCheck2, ShieldAlert, Sparkles } from 'lucide-react';

const features = [
  {
    icon: FileCheck2,
    title: 'Verified earnings records',
    description:
      'Workers build trusted income histories they can use for loans, rentals, and benefit applications.',
  },
  {
    icon: ShieldAlert,
    title: 'Dispute resolution that leaves a trail',
    description:
      'Every complaint, document, and update is timestamped so missing pay and unfair deactivations are harder to bury.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Portable reputation across platforms',
    description:
      'FairGig helps workers carry proof of reliability and work consistency wherever the next opportunity comes from.',
  },
];

const steps = [
  'Connect work history from platforms or upload records.',
  'FairGig verifies earnings, identity signals, and patterns.',
  'Workers use a clean dashboard to track income and raise grievances fast.',
];

const testimonials = [
  {
    quote:
      'I finally had a clean earnings record to show when I applied for a motorbike loan. That changed everything.',
    name: 'Ahsan',
    role: 'Ride-hailing driver',
  },
  {
    quote:
      'When one week of payouts disappeared, I had screenshots, statements, and the dispute timeline all in one place.',
    name: 'Nimra',
    role: 'Delivery rider',
  },
  {
    quote:
      'The dashboard feels like somebody actually designed it for workers instead of for a platform support queue.',
    name: 'Rehan',
    role: 'Warehouse picker',
  },
];

export default function Sections() {
  return (
    <>
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-4 w-4" />
            Built for dignity, not just dashboards
          </div>
          <h2 className="font-display text-3xl text-slate-950 sm:text-4xl">
            The frontend should earn trust in the first few seconds.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            FairGig is handling sensitive worker data, so the interface needs to feel steady, credible, and easy to use
            on a tired phone at the end of a long shift.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-[28px] border border-white/60 bg-white/80 p-7 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-slate-950 p-3 text-slate-200 transition-transform duration-300 group-hover:-translate-y-1">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">How it works</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">A calmer flow for complicated worker problems.</h2>
            <div className="mt-8 space-y-5">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-950">
                    0{index + 1}
                  </div>
                  <p className="pt-1 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">Platform promise</p>
            <h3 className="mt-4 text-2xl font-semibold">What workers actually see</h3>
            <ul className="mt-8 space-y-4">
              {['Clear earnings snapshots', 'Fast access to disputes', 'Proof that can be shared', 'Less friction on mobile'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-100">
                  <BadgeCheck className="h-5 w-5 text-slate-300" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-3xl bg-slate-200 p-6 text-slate-950">
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">Current north star</p>
              <p className="mt-3 text-3xl font-bold">Under 2 minutes</p>
              <p className="mt-2 text-sm leading-6">From landing on the site to understanding exactly why FairGig matters.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-700">Worker voices</p>
            <h2 className="mt-4 font-display text-3xl text-slate-950 sm:text-4xl">The product story should feel human.</h2>
          </div>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-slate-700"
          >
            See plans
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="rounded-[28px] bg-slate-100 p-7 text-slate-900 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
              <blockquote className="text-lg leading-8">"{item.quote}"</blockquote>
              <figcaption className="mt-6">
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-slate-600">{item.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="pricing" className="pb-24">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-gradient-to-r from-slate-950 via-slate-800 to-slate-700 px-6 py-14 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em]">Launch direction</p>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">Start with a strong public homepage, then grow into the product app.</h2>
              <p className="mt-4 max-w-2xl leading-7">
                This frontend now has the bones for that: a branded landing experience, working auth routes, and a visual system
                we can keep extending into dashboards next.
              </p>
            </div>
            <div className="rounded-[28px] bg-white/12 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Next good move</p>
              <p className="mt-3 text-2xl font-bold text-white">Dashboard screens</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Worker overview, earnings history, dispute tracker, and case details would be the best next frontend slice.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
