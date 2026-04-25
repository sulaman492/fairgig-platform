import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Features', href: '/#features' },
  { name: 'How it works', href: '/#how-it-works' },
  { name: 'Testimonials', href: '/#testimonials' },
  { name: 'Plans', href: '/#pricing' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-slate-200">
            FG
          </div>
          <div>
            <div className="font-display text-lg leading-none text-slate-950">FairGig</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Worker trust platform</div>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {!isAuthPage && (
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-slate-950">
              Log in
            </Link>
          )}
          <Link
            to={isAuthPage ? '/' : '/signup'}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {isAuthPage ? 'Back to home' : 'Get started'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-800 lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur lg:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Link
              to="/login"
              className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-950"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setIsOpen(false)}
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
