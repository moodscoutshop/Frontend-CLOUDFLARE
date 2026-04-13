import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Cookie, Share2, Lock, Mail, Globe, Clock3 } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { usePattern } from '../context/PatternContext';

// Pattern imports (match landing page aesthetic)
import morphingDiamonds from '../assets/morphing-diamonds.svg';
import endlessClouds from '../assets/endless-clouds.svg';
import curtain from '../assets/curtain.svg';
import bankNote from '../assets/bank-note.svg';
import intersectingCircles from '../assets/intersecting-circles.svg';

const LAST_UPDATED = 'April 13, 2026';
const COMPANY_NAME = 'MoodScout';
const CONTACT_NAME = 'Cameron Peltz';
const CONTACT_EMAIL = 'moodscoutshop@gmail.com';

function PolicySection({ id, title, icon, children }) {
  return (
    <section id={id} className="bg-white border border-[#E0DCCE] rounded-lg p-5 sm:p-6 shadow-sm scroll-mt-28">
      <h2 className="text-xl sm:text-2xl font-bold text-[#1D1F20] mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="text-[#3D3F40] leading-relaxed space-y-3 text-sm sm:text-base">{children}</div>
    </section>
  );
}

export function PrivacyPolicyPage() {
  const { currentPattern } = usePattern();

  const patternMap = {
    'endless-clouds': endlessClouds,
    'morphing-diamonds': morphingDiamonds,
    curtain,
    'bank-note': bankNote,
    'intersecting-circles': intersectingCircles,
  };

  const patternWidth = currentPattern?.width || 60;
  const patternHeight = currentPattern?.height || 60;

  return (
    <div className="bg-[#FDFDF8] min-h-screen font-sans relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${patternMap[currentPattern?.id] || morphingDiamonds})`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${patternWidth}px ${patternHeight}px`,
          opacity: 0.04,
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />

        <main className="pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-[#E0DCCE] rounded-lg p-6 sm:p-8 shadow-sm mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-[#EEEFE9] border border-[#D4CFC0] rounded-md px-3 py-1 text-xs sm:text-sm font-medium text-[#3D3F40]">
                <ShieldCheck className="w-4 h-4 text-[#EB9D2A]" />
                Public privacy policy for Shopify App Store listing requirements
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1D1F20] mt-4 mb-4">Privacy Policy</h1>

              <p className="text-[#5D5F60] text-sm sm:text-base leading-relaxed max-w-4xl">
                This Privacy Policy explains how {COMPANY_NAME} collects, uses, shares, and protects personal information when
                using the MoodScout website and related services, including MoodScout integrations and apps made available to
                merchants.
              </p>

              <div className="grid md:grid-cols-1 gap-3 mt-6">
                <div className="bg-[#FDFDF8] border border-[#E0DCCE] rounded-md p-3">
                  <p className="text-xs uppercase tracking-wide text-[#5D5F60] mb-1">Last updated</p>
                  <p className="text-sm font-semibold text-[#1D1F20]">{LAST_UPDATED}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link to="/" className="btn-secondary">
                  Back to MoodScout
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-[240px_1fr] gap-6 sm:gap-8">
              <aside className="lg:sticky lg:top-24 h-fit bg-white border border-[#E0DCCE] rounded-lg p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#5D5F60] mb-3">On this page</h2>
                <nav className="space-y-2 text-sm">
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#scope">Scope</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#data-we-collect">Information we collect</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#how-we-use-data">How we use data</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#sharing">Sharing and disclosure</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#retention">Data retention</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#security">Security</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#rights">Your rights</a>
                  <a className="block text-[#3D3F40] hover:text-[#EB9D2A] transition-colors" href="#contact">Contact</a>
                </nav>
              </aside>

              <div className="space-y-5 sm:space-y-6">
                <PolicySection id="scope" title="Scope" icon={<Globe className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>
                    This policy applies to data collected through the MoodScout website, Shopify app integrations, and related
                    support communications.
                  </p>
                  <p>
                    When MoodScout processes customer or store data on behalf of a Shopify merchant, the merchant is generally
                    the data controller and MoodScout acts as a service provider or processor.
                  </p>
                </PolicySection>

                <PolicySection id="data-we-collect" title="Information We Collect" icon={<Database className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>Depending on usage and granted permissions, we may collect:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Merchant account details</strong> such as store domain, account owner details, billing status,
                      app configuration, and authentication metadata.
                    </li>
                    <li>
                      <strong>Store-related operational data</strong> required for app features, which may include product,
                      collection, order, or customer-related fields exposed by approved API scopes.
                    </li>
                    <li>
                      <strong>Usage and diagnostics</strong> such as logs, browser type, device information, approximate IP-based
                      location, and interaction events.
                    </li>
                    <li>
                      <strong>Support information</strong> submitted through forms, email, and customer support channels.
                    </li>
                  </ul>

                  <div className="bg-[#EEEFE9] border border-[#D4CFC0] rounded-md p-3 mt-3">
                    <p className="text-sm text-[#3D3F40] font-medium flex items-start gap-2">
                      <Cookie className="w-4 h-4 mt-0.5 text-[#B17816]" />
                      MoodScout may use cookies, local storage, and similar technologies for login sessions, security,
                      preferences, analytics, and performance.
                    </p>
                  </div>
                </PolicySection>

                <PolicySection id="how-we-use-data" title="How We Use Data" icon={<Clock3 className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>We use personal information to:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Provide, maintain, and improve MoodScout services and app functionality.</li>
                    <li>Authenticate users and protect accounts against abuse and unauthorized access.</li>
                    <li>Process app operations, integrations, support requests, and merchant communications.</li>
                    <li>Monitor performance, troubleshoot errors, and improve reliability and user experience.</li>
                    <li>Comply with legal obligations and enforce applicable agreements.</li>
                  </ul>
                  <p>
                    MoodScout does not sell personal information.
                  </p>
                </PolicySection>

                <PolicySection id="sharing" title="Sharing and Disclosure" icon={<Share2 className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>We share data only when necessary, including with:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Infrastructure, analytics, and communications providers that support MoodScout operations.</li>
                    <li>Professional advisors, auditors, and legal/compliance partners where required.</li>
                    <li>Law enforcement or regulators when disclosure is required by law or valid legal process.</li>
                    <li>A successor entity in connection with a merger, acquisition, or asset sale.</li>
                  </ul>
                  <p>
                    Service providers are required to protect data and use it only for authorized purposes.
                  </p>
                </PolicySection>

                <PolicySection id="retention" title="Data Retention" icon={<Clock3 className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>
                    We retain information only for as long as needed to provide services, satisfy legal and financial obligations,
                    resolve disputes, and enforce agreements.
                  </p>
                  <p>
                    When data is no longer needed, we delete or anonymize it in line with our operational and legal requirements.
                  </p>
                </PolicySection>

                <PolicySection id="security" title="Security" icon={<Lock className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>
                    We apply reasonable administrative, technical, and organizational safeguards designed to protect personal
                    information from unauthorized access, alteration, loss, misuse, or disclosure.
                  </p>
                  <p>
                    No system is completely secure, but MoodScout continuously works to improve security controls and best
                    practices.
                  </p>
                </PolicySection>

                <PolicySection id="rights" title="Your Rights and Choices" icon={<ShieldCheck className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>
                    Depending on your location, applicable laws may provide rights such as access, correction, deletion,
                    restriction, portability, and objection to certain processing.
                  </p>
                  <p>
                    For requests related to data processed for a merchant store, please contact the merchant directly first.
                    MoodScout will assist merchants in handling valid requests as required.
                  </p>
                </PolicySection>

                <PolicySection id="contact" title="Contact" icon={<Mail className="w-5 h-5 text-[#EB9D2A]" />}>
                  <p>
                    For privacy questions, requests, or complaints, contact:
                  </p>
                  <p>
                    <strong>{COMPANY_NAME}</strong><br />
                    Attn: {CONTACT_NAME}<br />
                    Email:{' '}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-[#B17816] hover:text-[#EB9D2A] transition-colors"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                  <p>
                    We may update this policy periodically. Material updates will be reflected by revising the "Last updated"
                    date shown above.
                  </p>
                </PolicySection>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
