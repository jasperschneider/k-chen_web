import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { ChatWidget } from '@/components/ChatWidget';
import './App.css';

declare global {
  interface Window {
    Cookiebot?: {
      show: () => void;
      hasResponse?: boolean;
    };
  }
}

gsap.registerPlugin(ScrollTrigger);

// Loading Screen Component
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 2500;
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          // Exit animation
          if (containerRef.current && logoRef.current) {
            gsap.to(logoRef.current, {
              letterSpacing: '200px',
              opacity: 0,
              duration: 0.8,
              ease: 'expo.in'
            });
            gsap.to(containerRef.current, {
              y: '-100vh',
              duration: 1,
              delay: 0.3,
              ease: 'expo.inOut',
              onComplete
            });
          }
        }, 300);
      }
    };
    
    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  const logoText = 'ARCHITEKTENKÜCHEN';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999] flex flex-col justify-between p-6 md:p-10"
    >
      {/* Top Row */}
      <div className="flex justify-between items-start">
        <div className="text-white text-xs md:text-sm opacity-0 animate-[slideDown_0.6s_ease-out_0.2s_forwards]">
          <p>Küchenstudio</p>
          <p>Planung & Design</p>
        </div>
        <div className="text-white text-xs md:text-sm opacity-0 animate-[slideDown_0.6s_ease-out_0.3s_forwards]">
          <p>Ankergärten</p>
          <p>Bielefeld</p>
        </div>
        <div className="text-white text-xs md:text-sm text-right opacity-0 animate-[slideDown_0.6s_ease-out_0.4s_forwards]">
          <p>Loading</p>
          <p>{progress}%</p>
        </div>
      </div>

      {/* Center Logo – overflow-visible + Padding damit Ü nicht abgeschnitten wird */}
      <div 
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center overflow-visible px-4"
      >
        <h1 className="text-white text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight pt-[0.15em]">
          {logoText.split('').map((char, i) => (
            <span 
              key={i} 
              className="inline-block"
              style={{
                animation: `logoReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + i * 0.03}s forwards`,
                opacity: 0,
                clipPath: 'inset(100% 0 0 0)'
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>
      </div>

      {/* Bottom spacer */}
      <div className="h-10" />
    </div>
  );
}

// Navigation Component
function Navigation() {
  const [currentTime, setCurrentTime] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes} Uhr`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/90 backdrop-blur-xl' : 'bg-transparent'
      } ${!isScrolled ? 'text-white' : ''}`}
    >
      <div className="flex items-center justify-between px-6 md:px-10 py-4 md:py-6">
        <a href="#" className={`text-sm md:text-base font-semibold tracking-tight link-underline ${!isScrolled ? 'text-white' : ''}`}>
          architektenküchen
        </a>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#works" className={`text-sm link-underline ${!isScrolled ? 'text-white' : ''}`}>Konzept, Referenzen, Studio</a>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className={`hidden md:block text-sm ${!isScrolled ? 'text-white/80' : 'text-gray-500'}`}>
            <span>{currentTime}</span>
            <span className="ml-4">Bielefeld</span>
          </div>
          <a href="#contact" className={`text-sm link-underline ${!isScrolled ? 'text-white' : ''}`}>Kontakt</a>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const tagline = taglineRef.current;

    if (section && image && tagline) {
      gsap.fromTo(image, 
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.2 }
      );

      gsap.fromTo(tagline.children,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'expo.out', delay: 1 }
      );

      // Parallax on scroll
      gsap.to(image, {
        y: -100,
        scale: 1.05,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      gsap.to(tagline, {
        opacity: 0,
        y: -30,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '50% top',
          scrub: true
        }
      });
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
      {/* Hero Image */}
      <div 
        ref={imageRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0 }}
      >
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85" 
          alt="Minimalistische Designküche – architektenküchen Bielefeld"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Tagline */}
      <div 
        ref={taglineRef}
        className="absolute bottom-20 right-6 md:right-10 text-right text-white"
      >
        <p className="text-lg md:text-2xl font-light leading-relaxed">
          Küchenplanung aus Architektenhand.
        </p>
        <p className="text-lg md:text-2xl font-light leading-relaxed">
          Funktion und Stil – Made in Germany.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-6 md:left-10 text-white scroll-indicator">
        <span className="text-xs tracking-wider">[Nach unten]</span>
      </div>
    </section>
  );
}

// Studio Section
function StudioSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const headline = headlineRef.current;

    if (section && image && headline) {
      // Image reveal
      gsap.fromTo(image,
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Headline word stagger
      const words = headline.querySelectorAll('.word');
      gsap.fromTo(words,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: headline,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Image parallax
      gsap.to(image, {
        y: -50,
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }, []);

  const headlineText = "architektenküchen Bielefeld ist ein inhabergeführtes Küchenstudio in den Ankergärten. Inhaber Dipl.-Ing. Jens Peter Landwehr plant mit seinem Team individuelle Designküchen – von der Familienoase bis zur Gastronomie – mit großartigen Partnern, Made in Germany.";

  return (
    <section ref={sectionRef} className="relative min-h-screen bg-white py-20 md:py-32">
      <div className="px-6 md:px-10">
        {/* Section Label */}
        <div className="flex items-baseline gap-4 mb-12">
          <span className="text-xs text-gray-400">01</span>
          <span className="text-xs uppercase tracking-wider">Studio</span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left - Image */}
          <div className="lg:col-span-4">
            <div 
              ref={imageRef}
              className="aspect-[3/4] overflow-hidden"
              style={{ clipPath: 'inset(100% 0 0 0)' }}
            >
              <img 
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85" 
                alt="Showroom architektenküchen Bielefeld – next125 Ausstellung"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Right - Content */}
          <div className="lg:col-span-8">
            {/* Intro Text */}
            <p className="text-sm md:text-base text-gray-600 max-w-xl mb-12 leading-relaxed">
              Entdecken Sie die Kunst des minimalistischen Küchendesigns: Bei uns verschmelzen 
              Funktion und Stil zu einem einzigartigen Erlebnis. Mit next125, Siemens studioLine, 
              NEFF, Blum und Premium-Arbeitsplatten aus Keramik oder Quarzstein.
            </p>

            {/* Large Headline */}
            <h2 
              ref={headlineRef}
              className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-16"
            >
              {headlineText.split(' ').map((word, i) => (
                <span key={i} className="word inline-block mr-[0.3em]">{word}</span>
              ))}
            </h2>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium mb-2">Planung & Beratung</p>
                <p className="text-sm font-medium">Montage & Service</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ob Kreativzentrum, Familienoase oder 5-Sterne-Restaurant – wir entwerfen mit Ihnen 
                  maßgeschneiderte Küchenarchitektur. Eigenes Montage- und Serviceteam für Planung 
                  bis Umsetzung aus einer Hand.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Button */}
        <div className="flex justify-center mt-16">
          <a 
            href="#works"
            className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors"
          >
            <span>Konzept</span>
            <span className="text-gray-400">Entdecken</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Selected Works Section – Scroll-Zoom: Karte in der Bildschirmmitte am größten, davor/danach kleiner
function SelectedWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const projects = [
    {
      title: 'Mattlack Weiß',
      category: 'Grifflos, Keramik-Arbeitsplatte',
      year: 'next125',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85'
    },
    {
      title: 'Eggersmann',
      category: 'Designküche, Premium-Geräte',
      year: 'Miele',
      image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85'
    },
    {
      title: 'Aluminium & Quarzstein',
      category: 'High-End Architektenküche',
      year: 'Showroom',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85'
    }
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const projectCards = section.querySelectorAll('.referenz-card-inner');
    projectCards.forEach((card) => {
      gsap.fromTo(card,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

  // Scroll-Zoom: Karte in Viewport-Mitte = max Scale, sonst kleiner
  useEffect(() => {
    const cards = cardRefs.current;
    const scaleMin = 0.88;
    const scaleMax = 1.08;
    const distanceForMin = 420;

    let rafId: number;
    const tick = () => {
      if (typeof window === 'undefined') return;
      const viewportCenterY = window.innerHeight / 2;

      cards.forEach((card) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenterY - viewportCenterY);
        const t = Math.min(1, distance / distanceForMin);
        const scale = scaleMax - t * (scaleMax - scaleMin);
        card.style.transform = `scale(${scale})`;
        card.style.transformOrigin = 'center center';
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section ref={sectionRef} id="works" className="relative bg-white py-20 md:py-32">
      <div className="px-6 md:px-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-baseline gap-4">
            <span className="text-xs uppercase tracking-wider">Referenzen</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-gray-400">02</span>
            <span className="text-xs text-gray-400">next125 · Eggersmann</span>
          </div>
        </div>

        {/* Projects – Wrapper für Scroll-Zoom, innen die eigentliche Karte */}
        <div className="space-y-24 md:space-y-32">
          {projects.map((project, i) => (
            <div
              key={project.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="referenz-card transition-transform duration-200 ease-out origin-center"
              style={{ transformOrigin: 'center center' }}
            >
              <div className="project-card referenz-card-inner">
                {/* Project Title with Brackets */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className="text-4xl md:text-6xl lg:text-8xl font-light bracket-decoration">[</span>
                  <h3 className="text-4xl md:text-6xl lg:text-8xl font-semibold tracking-tight">
                    {project.title}
                  </h3>
                  <span className="text-4xl md:text-6xl lg:text-8xl font-light bracket-decoration">]</span>
                </div>

                {/* Project Image */}
                <div className="relative max-w-4xl mx-auto overflow-hidden group">
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full aspect-[3/2] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Project Meta */}
                <div className="flex items-center justify-between max-w-4xl mx-auto mt-6">
                  <span className="text-sm">{project.category}</span>
                  <span className="text-sm text-gray-400">{project.year}</span>
                </div>

                {/* CTA Button */}
                <div className="flex justify-center mt-8">
                  <a 
                    href="#contact"
                    className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors"
                  >
                    <span>{project.title}</span>
                    <span className="text-gray-400">Beratung</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// All Work Gallery Section – Text wirklich fix in der Mitte, starker Scroll- + Maus-Parallax
function AllWorkGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const scrollProgressRef = useRef(0);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });
  const [textEnterStuck, setTextEnterStuck] = useState(false);
  const [textFixedVisible, setTextFixedVisible] = useState(false);
  const [textExitStuck, setTextExitStuck] = useState(false);

  hoveredIndexRef.current = hoveredIndex;

  const galleryImages = [
    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=85', posClass: 'top-6 left-2 w-20 md:top-10 md:left-10 md:w-64', parallaxLayer: -0.5 },
    { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=85', posClass: 'top-4 right-2 w-16 md:top-20 md:right-20 md:w-56', parallaxLayer: 0.55 },
    { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=85', posClass: 'bottom-24 left-2 w-20 md:bottom-32 md:left-20 md:w-60', parallaxLayer: -0.3 },
    { src: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=85', posClass: 'top-1/2 right-1 w-14 md:top-1/2 md:right-10 md:w-48', parallaxLayer: 0.45 },
    { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=85', posClass: 'bottom-16 right-2 w-16 md:bottom-20 md:right-32 md:w-52', parallaxLayer: 0.7 },
    { src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=85', posClass: 'top-1/4 left-1 w-14 md:top-1/3 md:left-1/4 md:w-44', parallaxLayer: -0.65 },
  ];

  // Drei Phasen: Einscrollen, Fix in der Mitte, Stuck wenn nächste Sektion kurz vor Eintritt → smoothes Wegscrollen
  const EXIT_STUCK_THRESHOLD_VH = 98;
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const vh = (n: number) => (typeof window !== 'undefined' ? (window.innerHeight * n) / 100 : 0);
    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const exitThreshold = vh(EXIT_STUCK_THRESHOLD_VH);
      const entering = rect.top > 0;
      const exitZone = rect.bottom <= exitThreshold;
      setTextEnterStuck(entering && rect.bottom > 0);
      setTextFixedVisible(!entering && rect.bottom >= exitThreshold);
      setTextExitStuck(exitZone);
    };
    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
        update();
      },
    });
    update();
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      st.kill();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Maus-Position relativ zur Sektion (normalisiert -1..1)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseTargetRef.current = {
        x: (x - 0.5) * 2,
        y: (y - 0.5) * 2,
      };
    };
    section.addEventListener('mousemove', onMove, { passive: true });
    return () => section.removeEventListener('mousemove', onMove);
  }, []);

  // Progress aus Wrapper-Position berechnen (wie ScrollTrigger), damit Karten von Anfang an an der richtigen Stelle stehen
  const getProgressFromWrapper = (wrapper: HTMLDivElement | null) => {
    if (!wrapper || typeof window === 'undefined') return 0;
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight;
    const startTop = vh;
    const endTop = -rect.height;
    const progress = (startTop - rect.top) / (startTop - endTop);
    return Math.max(0, Math.min(1, progress));
  };

  // Ein einziger RAF: Parallax aus live Progress (Wrapper-Rect) + Maus; keine Konkurrenz mit GSAP
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const images = imagesRef.current;
    if (!wrapper || !images) return;

    const scrollStrength = 280;
    const scrollStrengthX = 90;
    const mouseStrength = 32;

    let rafId: number;
    const tick = () => {
      const p = getProgressFromWrapper(wrapper);
      scrollProgressRef.current = p;
      const mt = mouseTargetRef.current;
      const mc = mouseCurrentRef.current;
      mouseCurrentRef.current = {
        x: mc.x + (mt.x - mc.x) * 0.06,
        y: mc.y + (mt.y - mc.y) * 0.06,
      };
      const mx = mouseCurrentRef.current.x;
      const my = mouseCurrentRef.current.y;
      const hovered = hoveredIndexRef.current;

      galleryImages.forEach((img, i) => {
        const card = cardRefs.current[i];
        if (!card) return;
        const L = img.parallaxLayer;
        const scrollY = (p - 0.5) * L * scrollStrength;
        const scrollX = (p - 0.5) * L * scrollStrengthX;
        const mouseY = my * L * mouseStrength;
        const mouseX = mx * L * mouseStrength;
        const scale = hovered === i ? 1.14 : 1;
        card.style.transform = `translate(${scrollX + mouseX}px, ${scrollY + mouseY}px) scale(${scale})`;
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Einblend-Animation nur Opacity (kein Scale), damit Position 100 % vom Parallax-RAF kommt – kein Sprung
  useEffect(() => {
    const section = sectionRef.current;
    const images = imagesRef.current;
    if (!section || !images) return;
    const elements = images.querySelectorAll('.gallery-img');
    elements.forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0 },
        {
          opacity: 0.7,
          duration: 0.8,
          delay: i * 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none reverse' },
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden">
      {/* Wrapper mit fester Höhe für Scroll-Raum */}
      <div ref={wrapperRef} className="relative" style={{ height: '180vh' }}>
        {/* Karten: Parallax wird im RAF gesetzt */}
        <div ref={imagesRef} className="absolute inset-0 pointer-events-none">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`gallery-img absolute opacity-70 pointer-events-auto cursor-default ${img.posClass}`}
              style={{
                transition: 'z-index 0.2s ease',
                zIndex: hoveredIndex === i ? 20 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={img.src}
                alt={`Ausstellung ${i + 1}`}
                className="w-full aspect-[4/3] object-cover rounded-sm shadow-lg"
              />
            </div>
          ))}
        </div>

        {/* Phase 1: Einscrollen – Text 50vh unter Sektionstop, bei rect.top=0 exakt bei 50vh → Wechsel zu fix ohne Sprung */}
        <div
          className="absolute left-0 right-0 z-30 flex flex-col items-center justify-center py-12 pointer-events-auto"
          style={{
            top: '50vh',
            transform: 'translateY(-50%)',
            visibility: textEnterStuck ? 'visible' : 'hidden',
            pointerEvents: textEnterStuck ? 'auto' : 'none',
          }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-9xl font-semibold tracking-tight mb-8 text-center">
            Ausstellung<sup className="text-2xl md:text-4xl ml-2">next125</sup>
          </h2>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors"
          >
            <span>Termin vereinbaren</span>
            <span className="text-gray-400">Kontakt</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Phase 3: Stuck wenn nächste Sektion kurz vor Eintritt – Textmitte 48vh über Sektionsende; bei Wechsel (98vh) exakt bei 50vh */}
        <div
          className="absolute left-0 right-0 z-30 flex flex-col items-center justify-center py-12 pointer-events-auto"
          style={{
            top: 'calc(100% - 48vh)',
            transform: 'translateY(-50%)',
            visibility: textExitStuck ? 'visible' : 'hidden',
            pointerEvents: textExitStuck ? 'auto' : 'none',
          }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-9xl font-semibold tracking-tight mb-8 text-center">
            Ausstellung<sup className="text-2xl md:text-4xl ml-2">next125</sup>
          </h2>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors"
          >
            <span>Termin vereinbaren</span>
            <span className="text-gray-400">Kontakt</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Text fix in der Mitte, nur wenn Viewport-Mitte in der Sektion und noch nicht in der Exit-Zone */}
      <div
        className="fixed left-0 right-0 z-30 flex flex-col items-center justify-center py-12 pointer-events-none"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          visibility: textFixedVisible ? 'visible' : 'hidden',
          pointerEvents: textFixedVisible ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-5xl md:text-7xl lg:text-9xl font-semibold tracking-tight mb-8 text-center">
            Ausstellung<sup className="text-2xl md:text-4xl ml-2">next125</sup>
          </h2>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition-colors"
          >
            <span>Termin vereinbaren</span>
            <span className="text-gray-400">Kontakt</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Vision Section
function VisionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Text animations
    textRefs.current.forEach((text, i) => {
      if (text) {
        gsap.fromTo(text,
          { x: i === 0 ? -100 : i === 2 ? 100 : 0, y: i === 1 ? 50 : 0, opacity: 0 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    });

    // Background zoom
    const bgImage = section.querySelector('.vision-bg');
    if (bgImage) {
      gsap.to(bgImage, {
        scale: 1.1,
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="vision-bg absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=85"
          alt="Minimalistische Architektenküche"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-10">
        {/* Top Labels */}
        <div className="flex items-center justify-between text-white/60 text-xs">
          <span>03</span>
          <span className="uppercase tracking-wider">Philosophie</span>
        </div>

        {/* Floating Text – auf Mobile gestapelt und zentriert, auf Desktop wie zuvor */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-0 mb-6 md:mb-8 text-center md:text-left">
              <div 
                ref={el => { if (el) textRefs.current[0] = el; }}
                className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light"
              >
                Design-Integrität
              </div>
              <div 
                ref={el => { if (el) textRefs.current[1] = el; }}
                className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light"
              >
                Innovation
              </div>
              <div 
                ref={el => { if (el) textRefs.current[2] = el; }}
                className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light md:ml-auto md:text-right"
              >
                Langlebige Qualität
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-8">
          <p className="text-white/70 text-sm max-w-md leading-relaxed text-center md:text-left">
            Siemens Future Living Award 2013. Unser Anspruch: Küchen, die funktional, 
            ästhetisch und dauerhaft sind – für Familien, Gastronomie und Kreativräume.
          </p>
          
          <a 
            href="#contact"
            className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full text-sm hover:bg-gray-100 transition-colors"
          >
            <span>Kontakt</span>
            <span className="text-gray-400">Beratungstermin</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Footer Section
function FooterSection() {
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const logo = logoRef.current;

    if (footer && logo) {
      const chars = logo.querySelectorAll('.logo-char');
      gsap.fromTo(chars,
        { y: '100%', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.015,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }, []);

  const logoText = 'architektenküchen';

  return (
    <footer ref={footerRef} id="contact" className="relative bg-white pt-20 md:pt-32 pb-8">
      <div className="px-6 md:px-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
          {/* Contact CTA */}
          <div className="md:col-span-4">
            <p className="text-gray-400 text-sm mb-2">Beratungstermin vereinbaren</p>
            <a href="mailto:info@architektenkuechen.com" className="text-2xl md:text-3xl font-semibold link-underline">
              Kontakt aufnehmen
            </a>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <nav className="flex flex-col gap-2">
              {['Start', 'Referenzen', 'Studio', 'Konzept', 'Kontakt'].map((item) => (
                <a 
                  key={item}
                  href={item === 'Kontakt' ? '#contact' : item === 'Referenzen' ? '#works' : '#'}
                  className="text-sm link-underline w-fit"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-5">
            <div className="space-y-4 text-sm">
              <div className="flex gap-4">
                <span className="text-gray-400 w-4">L</span>
                <div>
                  <p>Architektenkuechen.com · Dipl.-Ing. Jens Peter Landwehr</p>
                  <p>Ankergärten Bielefeld</p>
                  <p>Rohrteichstraße 19 · 33602 Bielefeld</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-400 w-4">P</span>
                <a href="tel:+4952177253396" className="link-underline">+49 (0)521 77253396</a>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-400 w-4">E</span>
                <a href="mailto:info@architektenkuechen.com" className="link-underline">
                  info@architektenkuechen.com
                </a>
              </div>
              <div className="flex gap-4 pt-2">
                <span className="text-gray-400 w-4">Ö</span>
                <div>
                  <p>Mo–Fr 10–13 und 14–18:30 Uhr</p>
                  <p>Sa 10–14 Uhr · Termine nach Vereinbarung</p>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <span className="text-gray-400 w-4" />
                <a href="https://www.facebook.com/architektenkuechen/?locale=de_DE" target="_blank" rel="noopener noreferrer" className="link-underline">Facebook</a>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter / CTA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-8 border-t border-gray-200">
          <div className="flex items-center gap-8">
            <span className="text-sm">Jederzeit Termine nach Vereinbarung</span>
            <a href="tel:+4952177253396" className="text-sm border-b border-gray-300 pb-1 link-underline">
              0521 – 7725 3396
            </a>
          </div>
          <a href="#" className="text-sm text-gray-400 hover:text-black transition-colors">
            Nach oben
          </a>
        </div>

        {/* Logo „architektenküchen“ – Kleinbuchstaben, volle Bildschirmbreite */}
        <div
          ref={logoRef}
          className="w-screen relative left-1/2 -translate-x-1/2 overflow-visible py-6 md:py-12"
        >
          <div className="text-center whitespace-nowrap">
            {logoText.split('').map((char, i) => (
              <span
                key={i}
                className="logo-char inline-block font-bold tracking-tighter leading-none"
                style={{
                  opacity: 0,
                  fontSize: 'clamp(1.75rem, 10vw, 7rem)',
                  letterSpacing: '0.02em',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Legal – auf Mobile umbrechbar, kein Abschneiden */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200 text-xs text-gray-400 break-words">
          <p className="text-center md:text-left max-w-full">© architektenküchen · Dipl.-Ing. Jens Peter Landwehr</p>
          <div className="flex gap-6 shrink-0">
            <a href="https://www.architektenkuechen.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors break-all md:break-normal">architektenkuechen.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App Component
function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Cookiebot erst nach der Loading-Animation laden, dann Banner anzeigen
  useEffect(() => {
    if (isLoading) return;
    const cbid = 'f5c9fb2a-0dc7-4f27-af36-213b2872b14e';
    if (document.getElementById('Cookiebot')) return; // schon geladen
    const script = document.createElement('script');
    script.id = 'Cookiebot';
    script.src = 'https://consent.cookiebot.com/uc.js';
    script.setAttribute('data-cbid', cbid);
    script.setAttribute('data-blockingmode', 'auto');
    script.type = 'text/javascript';
    script.onload = () => {
      const cb = window.Cookiebot;
      if (cb && typeof cb.show === 'function' && !cb.hasResponse) cb.show();
    };
    document.head.appendChild(script);
  }, [isLoading]);

  return (
    <>
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Chat-Widget (nur sichtbar nach Loading) */}
      {!isLoading && <ChatWidget />}

      {/* Main Content */}
      {!isLoading && (
        <>
          <Navigation />
          <main>
            <HeroSection />
            <StudioSection />
            <SelectedWorksSection />
            <AllWorkGallery />
            <VisionSection />
            <FooterSection />
          </main>
        </>
      )}
    </>
  );
}

export default App;
