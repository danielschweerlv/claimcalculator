import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AnimatedCross from './ui/AnimatedCross';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Insurance Tactics', path: '/insurance-tactics' },
  { label: 'Your Rights', path: '/your-rights' },
  { label: 'Success Stories', path: '/success-stories' },
  { label: 'Contact', href: 'mailto:support@claimcalculator.ai' },
];

const FEATURED_CARDS = [
  {
    title: 'Injury Values in Nevada',
    desc: 'Compare common injury categories and the factors that move claim value.',
    path: '/injury-values',
  },
  {
    title: 'Nevada Case by Case Play Book',
    desc: 'Straightforward guides on fault rules, deadlines, and insurance tactics in Nevada.',
    path: '/case-guides',
  },
  {
    title: 'Free Case Evaluation',
    desc: 'Get your personalized estimate in about two minutes. No cost, no strings.',
    path: '/calculator',
  },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Terms of Service', path: '/terms-of-service' },
  { label: 'Legal Notice', path: '/legal-notice' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (item) => {
    setIsOpen(false);
    window.scrollTo(0, 0);
    if (item.href) {
      window.location.assign(item.href);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-[#111318] border-b border-white/[0.06]">
      <nav className="flex justify-between items-center w-full px-4 lg:px-8 h-[58px] max-w-7xl mx-auto">

        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Caret + Plus — clickable dropdown trigger */}
          <button
            ref={buttonRef}
            onClick={() => setIsOpen((v) => !v)}
            className="relative flex-shrink-0 group flex items-center gap-1 sm:gap-1.5"
            aria-label="Open menu"
            aria-expanded={isOpen}
          >
            {/* Spectrum caret */}
            <svg
              viewBox="0 0 12 8"
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
              style={{
                transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                filter: 'drop-shadow(0 0 4px rgba(0,209,255,0.6))',
              }}
              aria-hidden="true"
            >
              <polyline
                points="1,1 6,7 11,1"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* AnimatedCross + sign */}
            <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] lg:w-[42px] lg:h-[42px] relative transition-transform duration-300 group-hover:scale-110" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 209, 255, 0.5))' }}>
              <AnimatedCross className="w-full h-full" />
            </div>
          </button>

          {/* Logo text — click goes home */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => { window.scrollTo(0, 0); navigate('/'); }}
          >
            <img
              src="/logos/claimcalculator-wordmark.png"
              alt="ClaimCalculator.ai"
              className="h-[15px] min-[390px]:h-[16px] sm:h-[24px] lg:h-7 w-auto object-contain"
              style={{ maxWidth: 'calc(100vw - 190px)' }}
            />
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {[
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'Injury Values', path: '/injury-values' },
            { label: 'Case Guides', path: '/case-guides' },
            { label: 'Insurance Tactics', path: '/insurance-tactics' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-link-animated font-headline transition-colors text-[19px] font-medium ${
                location.pathname === path
                  ? 'text-primary font-bold'
                  : 'text-[#bbc9cf] hover:text-on-background'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {location.pathname !== '/calculator' && (
          <button
            onClick={() => navigate('/calculator')}
            className="hidden sm:flex cta-gradient cta-shimmer text-on-primary-fixed px-6 py-2.5 rounded-[12px] font-headline font-bold text-base active:scale-95 duration-200 shadow-[0_0_20px_rgba(164,230,255,0.15)] hover:shadow-[0_0_30px_rgba(164,230,255,0.3)] transition-all hover:-translate-y-0.5 flex-shrink-0"
          >
            Free Evaluation
          </button>
        )}
      </nav>

      {/* Mega-Menu Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed top-[58px] left-0 right-0 z-40 h-[calc(100vh-58px)] w-full overflow-y-auto bg-[#111318] pb-20"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease, visibility 0.25s',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

            {/* 3-Column Mega-Menu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

              {/* Left Column — Nav Links */}
              <div>
                <h6 className="text-[10px] font-label text-outline/60 uppercase tracking-widest mb-3">Navigation</h6>
                <ul className="space-y-1">
                  {NAV_LINKS.map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() => handleNav(item)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-headline font-medium transition-all duration-200 ${
                          !item.href && location.pathname === item.path
                            ? 'text-primary'
                            : 'text-on-surface-variant hover:text-on-background hover:bg-white/[0.04]'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Center Column — Featured Resource Cards */}
              <div>
                <h6 className="text-[10px] font-label text-outline/60 uppercase tracking-widest mb-3">Featured Resources</h6>
                <div className="space-y-3">
                  {FEATURED_CARDS.map((card) => (
                    <button
                      key={card.title}
                      onClick={() => handleNav(card)}
                      className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/25 hover:bg-primary/[0.04] transition-all duration-200 group flex flex-col gap-1.5"
                    >
                      <span className="text-sm font-headline font-bold text-on-background group-hover:text-primary transition-colors">
                        {card.title}
                      </span>
                      <p className="text-[11px] text-on-surface-variant/60 leading-relaxed">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column — Legal */}
              <div className="space-y-5">
                {/* Legal Links */}
                <div>
                  <h6 className="text-[10px] font-label text-outline/60 uppercase tracking-widest mb-3">Legal</h6>
                  <ul className="space-y-1">
                    {LEGAL_LINKS.map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() => handleNav(item)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-headline font-medium text-on-surface-variant hover:text-on-background hover:bg-white/[0.04] transition-all duration-200"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom CTA row */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[11px] text-outline leading-snug">
                ClaimCalculator.ai — Nevada personal injury estimates
              </p>
              <button
                onClick={() => { setIsOpen(false); navigate('/calculator'); }}
                className="cta-gradient text-on-primary-fixed px-5 py-2 rounded-lg font-headline font-bold text-xs transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Get Free Estimate →
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
