import React, { useEffect, useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import logo from '../assets/logo.png';
import heroIllustration from '../assets/hero-illustration.png';

const translations = {
  hero_pill: { en: "🇮🇳 Built for Bharat's Students", hi: "🇮🇳 भारत के छात्रों के लिए बना" },
  hero_tagline: { en: "Where every student finds their bridge to knowledge.", hi: "जहाँ हर छात्र को ज्ञान का सेतु मिलता है।" },
  hero_cta_primary: { en: "Start Learning Free", hi: "मुफ़्त में शुरू करें" },
  hero_cta_secondary: { en: "Upload Your Syllabus", hi: "पाठ्यक्रम अपलोड करें" },
  trust_1: { en: "✓ 14 badge milestones", hi: "✓ 14 बैज मील के पत्थर" },
  trust_2: { en: "✓ Hindi supported", hi: "✓ हिंदी में उपलब्ध" },
  trust_3: { en: "✓ Works offline", hi: "✓ ऑफलाइन काम करता है" },
  desc_para1: { en: "GyaanSetu is not another study app...", hi: "GyaanSetu सिर्फ एक और पढ़ाई ऐप नहीं है। यह आपका विश्वविद्यालय पाठ्यक्रम पढ़ता है, आपकी सोचने की गति समझता है, और एक व्यक्तिगत सीखने का रास्ता तैयार करता है।" },
  desc_para2: { en: "Designed for students in bandwidth-constrained environments...", hi: "भारत के सीमित इंटरनेट वाले माहौल में पढ़ने वाले छात्रों के लिए बना — GyaanSetu ऑफलाइन काम करता है, हिंदी बोलता है, और आपकी प्रगति को स्ट्रीक और बैज से ट्रैक करता है।" },
  features_heading: { en: "What makes us different", hi: "हम क्यों अलग हैं" },
  feature1_title: { en: "Adaptive Quiz Engine", hi: "अनुकूलित प्रश्नोत्तरी इंजन" },
  feature2_title: { en: "Contextual AI Tutor", hi: "संदर्भ-आधारित AI शिक्षक" },
  usp_heading_over: { en: "Why GyaanSetu", hi: "GyaanSetu क्यों?" },
  usp_heading: { en: "Built around how students actually learn", hi: "छात्र जैसे सच में सीखते हैं, वैसे बना" },
  hiw_overline: { en: "How It Works", hi: "यह कैसे काम करता है" },
  hiw_heading: { en: "From syllabus to career clarity — in one week.", hi: "पाठ्यक्रम से करियर तक — एक हफ़्ते में।" },
  nav_features: { en: "Features", hi: "विशेषताएं" },
  nav_howitworks: { en: "How It Works", hi: "कैसे काम करता है" },
  nav_usps: { en: "USPs", hi: "खासियतें" },
  nav_about: { en: "About", hi: "हमारे बारे में" },
  nav_login: { en: "Log In", hi: "लॉग इन" },
  nav_signup: { en: "Sign Up", hi: "साइन अप" },
  footer_copy: { en: "Made with purpose for Indian students", hi: "भारत के छात्रों के लिए बनाया गया" },
  // How It Works one-liners
  hiw_step1: { en: "Upload your syllabus. The AI reads it so you don't have to restructure it.", hi: "पाठ्यक्रम अपलोड करें। AI इसे पढ़ता है।" },
  hiw_step2: { en: "Tag what you know. Flag what scares you. Build your confidence map.", hi: "जो जानते हो टैग करो। जो डराता है वो फ्लैग करो।" },
  hiw_step3: { en: "Get a quiz built around your gaps — not the syllabus order.", hi: "अपनी कमज़ोरियों पर आधारित क्विज़ पाएं।" },
  hiw_step4: { en: "Ask your AI tutor anything. It answers from your syllabus, not the internet.", hi: "AI शिक्षक से कुछ भी पूछें। जवाब आपके पाठ्यक्रम से।" },
  hiw_step5: { en: "Watch your streak grow. Collect badges. Study even when offline.", hi: "स्ट्रीक बढ़ाएं। बैज इकट्ठा करें। ऑफलाइन पढ़ें।" },
  hiw_step6: { en: "See exactly which jobs you're ready for — and what's still missing.", hi: "जानें कौन सी नौकरी के लिए तैयार हैं — और क्या बाकी है।" },
};

const hiwDetails = [
  { en: "PDF, DOC, DOCX · auto-parsed in seconds", hi: "PDF, DOC, DOCX · सेकंड में पार्स" },
  { en: "Confident · Neutral · Weak · auto-prioritized", hi: "आत्मविश्वासी · तटस्थ · कमज़ोर · ऑटो-प्राथमिकता" },
  { en: "Adaptive difficulty · MCQ + Coding + Theory", hi: "अनुकूलित कठिनाई · MCQ + कोडिंग + थ्योरी" },
  { en: "RAG-powered · English & हिंदी · streamed", hi: "RAG-आधारित · English & हिंदी · स्ट्रीम" },
  { en: "14 badges · IndexedDB cache · auto-sync", hi: "14 बैज · IndexedDB कैश · ऑटो-सिंक" },
  { en: "Real salary data · YouTube resources · scholarship suggestions", hi: "वास्तविक वेतन · YouTube संसाधन · छात्रवृत्ति सुझाव" },
];

const LangContext = createContext();
const useLang = () => useContext(LangContext);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { lang, t, toggleLang } = useLang();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`l-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="l-nav-left">
        <img src={logo} alt="GyaanSetu Logo" className="l-nav-logo" />
        <div className="l-nav-brand">
          <span className="l-nav-title">GyaanSetu</span>
          <span className="l-nav-subtitle">ज्ञान सेतु</span>
        </div>
      </div>
      <div className="l-nav-center">
        <button onClick={() => scrollToSection('features')} className="l-nav-link" data-i18n="nav_features">{t('nav_features')}</button>
        <button onClick={() => scrollToSection('how-it-works')} className="l-nav-link" data-i18n="nav_howitworks">{t('nav_howitworks')}</button>
        <button onClick={() => scrollToSection('usps')} className="l-nav-link" data-i18n="nav_usps">{t('nav_usps')}</button>
        <button onClick={() => scrollToSection('about')} className="l-nav-link" data-i18n="nav_about">{t('nav_about')}</button>
      </div>
      <div className="l-nav-right">
        <div className="l-lang-toggle">
          <button className={`l-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => toggleLang('en')}>EN</button>
          <button className={`l-lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => toggleLang('hi')}>हि</button>
        </div>
        <div className="l-nav-divider"></div>
        <Link to="/login" className="l-btn l-btn-ghost" data-i18n="nav_login">{t('nav_login')}</Link>
        <Link to="/signup" className="l-btn l-btn-filled" data-i18n="nav_signup">{t('nav_signup')}</Link>
      </div>
    </nav>
  );
};

const HeroSection = () => {
  const { lang, t, toggleLang } = useLang();
  return (
    <section className="l-hero" id="about">
      <div className="l-hero-content">
        <div className="l-hero-text">
          <div className="l-hero-pill" data-i18n="hero_pill">{t('hero_pill')}</div>
          <h1 className="l-hero-h1">GyaanSetu</h1>
          <p className="l-hero-tagline" data-i18n="hero_tagline">{t('hero_tagline')}</p>
          <div className="l-hero-ctas">
            <Link to="/signup" className="l-btn-hero-primary" data-i18n="hero_cta_primary">{t('hero_cta_primary')}</Link>
            <Link to="/signup" className="l-btn-hero-secondary" data-i18n="hero_cta_secondary">{t('hero_cta_secondary')}</Link>
          </div>
          <div className="l-hero-lang-toggle">
            <button className={`l-lang-pill-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => toggleLang('en')}>English</button>
            <button className={`l-lang-pill-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => toggleLang('hi')}>हिंदी</button>
          </div>
          <div className="l-hero-trust">
            <span className="l-trust-item" data-i18n="trust_1">{t('trust_1')}</span>
            <span className="l-trust-item" data-i18n="trust_2">{t('trust_2')}</span>
            <span className="l-trust-item" data-i18n="trust_3">{t('trust_3')}</span>
          </div>
        </div>
        <div className="l-hero-visual">
          <img src={heroIllustration} alt="Student learning" />
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const { lang, t } = useLang();
  const steps = [
    { num: '01', key: 'hiw_step1', detailIdx: 0 },
    { num: '02', key: 'hiw_step2', detailIdx: 1 },
    { num: '03', key: 'hiw_step3', detailIdx: 2 },
    { num: '04', key: 'hiw_step4', detailIdx: 3 },
    { num: '05', key: 'hiw_step5', detailIdx: 4 },
    { num: '06', key: 'hiw_step6', detailIdx: 5 },
  ];

  return (
    <section className="l-hiw" id="how-it-works">
      <div className="l-hiw-container">
        <div className="l-hiw-header l-fade-section">
          <div className="l-hiw-overline" data-i18n="hiw_overline">{t('hiw_overline')}</div>
          <h2 className="l-hiw-heading" data-i18n="hiw_heading">{t('hiw_heading')}</h2>
        </div>
        
        <div className="l-hiw-steps l-fade-section">
          {steps.map((step, idx) => (
            <div key={idx} className="l-hiw-step-row">
              <span className="l-hiw-step-num">{step.num}</span>
              <span className="l-hiw-oneliner" data-i18n={step.key}>{t(step.key)}</span>
              <span className="l-hiw-detail">{hiwDetails[step.detailIdx][lang]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSpotlightSection = () => {
  const { t } = useLang();
  return (
    <section className="l-features" id="features">
      <div className="l-features-container">
        <h2 className="l-section-heading l-fade-section" data-i18n="features_heading">{t('features_heading')}</h2>
        <div className="l-features-grid">
          
          <div className="l-feature-card l-fade-section">
            <div className="l-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 2.5 2.5 0 0 1-.39-4.75 2.5 2.5 0 0 1 1.7-4.22A2.5 2.5 0 0 1 9.5 2Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 2.5 2.5 0 0 0 .39-4.75 2.5 2.5 0 0 0-1.7-4.22A2.5 2.5 0 0 0 14.5 2Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="l-feature-title" data-i18n="feature1_title">{t('feature1_title')}</h3>
            <p className="l-feature-body">
              Quizzes adapt to your confidence and pace in real time. Weak topics get prioritized. Fast thinkers get harder questions. Slow days get gentler ones. Every session is calibrated to where you actually are — not where the syllabus says you should be.
            </p>
            <div className="l-feature-badges">
              <span className="l-badge">MCQ</span>
              <span className="l-badge">Theoretical</span>
              <span className="l-badge">Coding</span>
            </div>
          </div>

          <div className="l-feature-card l-fade-section">
            <div className="l-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
                <path d="M8 14h8" />
              </svg>
            </div>
            <h3 className="l-feature-title" data-i18n="feature2_title">{t('feature2_title')}</h3>
            <p className="l-feature-body">
              Ask anything about your syllabus. The AI tutor pulls exactly the right context from your uploaded curriculum — not generic internet answers — and explains it at your level, in English or Hindi, with real-world analogies built for Indian college students.
            </p>
            <div className="l-feature-badges">
              <span className="l-badge">English</span>
              <span className="l-badge">हिंदी</span>
              <span className="l-badge">Streamed</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const USPGridSection = () => {
  const { t } = useLang();
  const usps = [
    {
      icon: "📴",
      title: "Works Offline",
      body: "Pre-generate quizzes and cache explanations locally. Study on a train, in a hostel, anywhere. Sync progress automatically when you reconnect."
    },
    {
      icon: "🎯",
      title: "Spaced Repetition Built In",
      body: "Topics due for review surface automatically after 7 days. The system remembers what you've forgotten so you don't have to."
    },
    {
      icon: "🔥",
      title: "Streak & Badge System",
      body: "14 achievement badges from First Step to Month Master. A daily streak tracker keeps you accountable without guilt-tripping you."
    },
    {
      icon: "🌍",
      title: "Hindi Language Support",
      body: "Ask questions, take quizzes, and read explanations in Hindi. The AI responds fluently in your language of choice — no broken translations."
    },
    {
      icon: "🎓",
      title: "Career Readiness Guidance",
      body: "Know exactly which roles you're ready for, where your gaps are, and which YouTube tutorials to watch — all derived from your actual quiz scores."
    },
    {
      icon: "📄",
      title: "Syllabus-First Intelligence",
      body: "Upload your university PDF. The AI parses, structures, and embeds your entire curriculum. Every quiz and explanation is grounded in your actual syllabus — not generic content."
    }
  ];

  return (
    <section className="l-usp" id="usps">
      <div className="l-usp-container">
        <div className="l-usp-header l-fade-section">
          <span className="l-usp-overline" data-i18n="usp_heading_over">{t('usp_heading_over')}</span>
          <h2 className="l-section-heading" style={{ margin: 0 }} data-i18n="usp_heading">{t('usp_heading')}</h2>
        </div>
        <div className="l-usp-grid">
          {usps.map((usp, idx) => (
            <div key={idx} className="l-usp-card l-fade-section">
              <div className="l-usp-icon">{usp.icon}</div>
              <h3 className="l-usp-title">{usp.title}</h3>
              <p className="l-usp-body">{usp.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useLang();
  return (
    <footer className="l-footer">
      <div className="l-footer-container">
        <div className="l-footer-row1">
          <div className="l-footer-brand">
            <img src={logo} alt="GyaanSetu logo" className="l-footer-logo" />
            <h3 className="l-footer-name">GyaanSetu</h3>
          </div>
          <div className="l-footer-nav">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="l-footer-link" data-i18n="nav_features">{t('nav_features')}</button>
            <Link to="/quiz" className="l-footer-link">Quiz</Link>
            <Link to="/explanation" className="l-footer-link">Explain</Link>
          </div>
          <Link to="/signup" className="l-btn-footer" data-i18n="nav_signup">{t('nav_signup')}</Link>
        </div>
        <div className="l-footer-row2">
          <p className="l-footer-copyright">© 2026 GyaanSetu · <span data-i18n="footer_copy">{t('footer_copy')}</span></p>
        </div>
      </div>
    </footer>
  );
};

const Landing = () => {
  const [lang, setLang] = useState(localStorage.getItem('landing_lang') || 'en');

  const toggleLang = (newLang) => {
    if (lang === newLang) return;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => el.style.opacity = '0');
    setTimeout(() => {
      setLang(newLang);
      localStorage.setItem('landing_lang', newLang);
      setTimeout(() => {
        elements.forEach(el => el.style.opacity = '1');
      }, 50);
    }, 150);
  };

  const t = (key) => translations[key]?.[lang] || translations[key]?.['en'] || key;

  useEffect(() => {
    document.body.classList.add('landing-page');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const fadeElements = document.querySelectorAll('.l-fade-section');
    fadeElements.forEach((el) => observer.observe(el));

    return () => {
      document.body.classList.remove('landing-page');
      fadeElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      <div className="landing-container">
        <Navbar />
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSpotlightSection />
        <USPGridSection />
        <Footer />
      </div>
    </LangContext.Provider>
  );
};

export default Landing;
