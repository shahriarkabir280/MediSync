import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart, Activity, Shield, Calendar, MapPin, Phone, Mail, Menu, X,
  TrendingUp, Users, Award, Clock, Star, ArrowRight, CheckCircle,
  Facebook, Twitter, Instagram, Youtube, Stethoscope, Thermometer,
  Pill, Syringe, Brain, Eye, Ear, Bone, Baby, UserPlus, Microscope,
  FileText, Cross, Smile, Droplet, UserCheck, Timer, Video,
  MessageSquare, Clipboard, Globe, Linkedin, GraduationCap,
  Briefcase, Building, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import { API_URLS, getImageUrl } from '../config/api';
import { appointmentApi } from '../lib/api';
import toast from 'react-hot-toast';

const SUPPORTED_ICONS = {
  Stethoscope, Activity, Thermometer, Pill, Syringe, Microscope,
  FileText, Clipboard, Heart, Brain, Eye, Ear, Bone, Baby, Smile,
  UserPlus, UserCheck, Timer, Video, MessageSquare, Calendar, Cross
};

const getIconComponent = (name) => SUPPORTED_ICONS[name] || Activity;

const getSocialIcon = (platform) => {
  const p = platform?.toLowerCase() || '';
  if (p.includes('facebook')) return Facebook;
  if (p.includes('twitter')) return Twitter;
  if (p.includes('instagram')) return Instagram;
  if (p.includes('youtube')) return Youtube;
  if (p.includes('linkedin')) return Linkedin;
  return Globe;
};

// ─── Utility ────────────────────────────────────────────────────────────────

const fmtYear = (d) => d ? new Date(d).getFullYear() : null;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';

const TRANSLATIONS = {
  en: {
    nav: { home: 'Home', about: 'About', services: 'Services', appointment: 'Chambers', education: 'Education', experience: 'Career', testimonials: 'Testimonials', contact: 'Contact' },
    buttons: { login: 'Sign in', signup: 'Sign Up', book: 'Book Appointment', bookShort: 'Book now', emergency: 'Emergency Call', readMore: 'Learn more' },
    labels: { available: 'Available for consultations', experience: 'Years experience', patients: 'Patients treated', success: 'Success rate', fee: 'Consultation fee' },
    sections: {
      schedule: 'Visiting hours',
      location: 'Chamber location',
      specialization: 'What we offer',
      about: 'About',
      meet: 'Meet',
      testimonials: 'What patients say',
      affiliates: 'Affiliated institutions',
      footer: 'All rights reserved.',
      qualifications: 'Education & credentials',
      career: 'Clinical experience',
      insights: 'Health insights',
      getInTouch: 'Get in touch'
    }
  },
  bn: {
    nav: { home: 'হোম', services: 'সেবাসমূহ', appointment: 'অ্যাপয়েন্টমেন্ট', about: 'পরিচিতি', testimonials: 'গল্প', contact: 'যোগাযোগ' },
    buttons: { login: 'লগইন', signup: 'নিবন্ধন', book: 'অ্যাপয়েন্টমেন্ট নিন', bookShort: 'বুক করুন', emergency: 'জরুরী কল', readMore: 'আরও পড়ুন' },
    labels: { available: 'পরামর্শের জন্য উপলব্ধ', experience: 'বছরের অভিজ্ঞতা', patients: 'রোগী চিকিৎসা', success: 'সাফল্যের হার', fee: 'পরামর্শ ফি' },
    sections: {
      schedule: 'পরামর্শের সময়সূচী',
      location: 'চেম্বার অবস্থান',
      specialization: 'কী সেবা দিচ্ছি',
      about: 'পরিচিতি',
      meet: 'পরিচিত হোন',
      testimonials: 'রোগীদের কথা',
      affiliates: 'আমাদের পার্টনার',
      footer: 'সর্বস্বত্ব সংরক্ষিত।',
      qualifications: 'শিক্ষা ও যোগ্যতা',
      career: 'ক্লিনিকাল অভিজ্ঞতা',
      insights: 'স্বাস্থ্য বিষয়ক তথ্য',
      getInTouch: 'যোগাযোগ করুন'
    }
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────

const PublicWebsite = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    patient_name: '', patient_email: '', patient_phone: '',
    appointment_date: '', appointment_time: '',
    appointment_type: 'In-person', notes: ''
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const email = localStorage.getItem('patientSessionEmail');
    if (email) setBookingData(p => ({ ...p, patient_email: email, patient_name: localStorage.getItem('patientName') || '' }));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URLS.WEBSITE.PUBLIC(slug || 'dr-jobayer-hasan'));
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        if (json.success) setData(json.data);
        else throw new Error('Failed');
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      if (!bookingData.appointment_date || !bookingData.appointment_time) throw new Error('Select date and time');
      await appointmentApi.create(data.id, { ...bookingData, status: 'pending' });
      toast.success('Appointment booked!');
      setBookingOpen(false);
      if (localStorage.getItem('patientSessionEmail')) setTimeout(() => navigate('/patient-dashboard'), 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to book');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading profile…</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <Shield style={{ width: 48, height: 48, color: '#94a3b8', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Profile not found</h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>This doctor profile is not available.</p>
      </div>
    </div>
  );

  const primary = data.website?.theme_color || data.theme_color || '#2563eb';
  const testimonials = data.testimonials || [];
  const navLinks = ['home', 'about', 'services', 'appointment', 'education', 'experience', 'testimonials', 'contact'];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a', background: '#fff', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .pub-btn-primary { 
          background: linear-gradient(135deg, ${primary}, #1e40af); 
          color: #fff; border: none; padding: 11px 24px; border-radius: 8px; 
          font-size: 14px; font-weight: 500; letter-spacing: 0.02em; cursor: pointer; 
          transition: all 0.3s ease; display:inline-flex; align-items:center; gap:8px; 
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); 
        }
        .pub-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35); filter: brightness(1.05); }
        .pub-btn-secondary { 
          background: #fff; color: #334155; border: 1px solid #e2e8f0; 
          padding: 11px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; 
          cursor: pointer; transition: all 0.3s ease; display:inline-flex; align-items:center; gap:8px; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.02); 
        }
        .pub-btn-secondary:hover { border-color: #cbd5e1; color: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); background: #f8fafc; }
        .pub-card { 
          background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; 
          box-shadow: 0 4px 24px rgba(0,0,0,0.03); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .pub-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.08); transform: translateY(-4px); border-color: #e2e8f0; }
        .pub-section-label { 
          font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; 
          color: ${primary}; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; 
        }
        .pub-section-label::before { content: ''; width: 24px; height: 2px; background: ${primary}; border-radius: 2px; opacity: 0.8; }
        .pub-input { width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; transition: all 0.2s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.01); }
        .pub-input:focus { border-color: ${primary}; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .pub-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        nav a { text-decoration: none; color: #475569; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        nav a:hover { color: ${primary}; }
        /* Responsive Utilities */
        .res-grid-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 64px; align-items: center; position: relative; z-index: 1; }
        .res-grid-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 32px; padding-top: 32px; border-top: 1px solid #e2e8f0; }
        .res-grid-about { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .res-grid-about-images { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .res-grid-appointment { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
        .desktop-nav { display: flex; gap: 16px; align-items: center; }
        .mobile-menu-btn { 
          display: none; background: #fff; border: 1px solid #e2e8f0; 
          cursor: pointer; color: #0f172a; padding: 8px 10px; border-radius: 8px; 
          align-items: center; justify-content: center; transition: all 0.2s; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.02); z-index: 204; flex-shrink: 0;
        }
        .mobile-menu-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .hero-img-wrapper { position: relative; flex-shrink: 0; justify-self: end; max-width: 100%; overflow: hidden; border-radius: 32px; }
        .doctor-brand-text { display: flex; flex-direction: column; min-width: 0; overflow: hidden; text-align: left; }
        .footer-grid { display: grid; grid-template-columns: 2.2fr 1fr 1fr; gap: 48px; }
        @media (max-width: 992px) {
          .doctor-brand-text { text-align: right; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
        
        @media (max-width: 992px) {
          .nav-container { flex-direction: row-reverse; justify-content: space-between !important; }
          .res-grid-hero, .res-grid-about, .res-grid-appointment { grid-template-columns: 1fr; gap: 48px; }
          .hero-img-wrapper { justify-self: center; margin-top: 20px; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; visibility: visible !important; opacity: 1 !important; }
        }
        @media (max-width: 768px) {
          .nav-container { padding: 0 24px !important; }
          .res-grid-about-images { grid-template-columns: 1fr; }
          #home { padding: 100px 24px 60px !important; }
          h1 { font-size: clamp(28px, 8vw, 40px) !important; text-align: center; }
          h2 { font-size: 28px !important; }
          .res-grid-hero > div:first-child { text-align: center; display: flex; flex-direction: column; align-items: center; }
        }
        @media (max-width: 480px) {
          .nav-container { padding: 0 24px !important; }
          .res-grid-stats { grid-template-columns: 1fr; gap: 20px; }
          .pub-card { padding: 16px !important; }
          .hero-img-wrapper { width: 100%; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #e2e8f0' : 'none',
        transition: 'all 0.3s'
      }}>
        <div className="nav-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="doctor-brand-text">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.full_name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.website?.tagline || data.specialization}</div>
            </div>
            <img
              src={getImageUrl(data.profile_photo_url) || `https://ui-avatars.com/api/?name=${data.full_name}&background=${primary.replace('#', '')}&color=fff`}
              alt={data.full_name}
              onError={e => e.target.src = `https://ui-avatars.com/api/?name=${data.full_name}&background=${primary.replace('#', '')}&color=fff`}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }}
            />
          </div>
          {/* Desktop Nav */}
          <nav className="desktop-nav">
            {navLinks.map(l => (
              <a key={l} href={`#${l}`} onClick={() => setMobileOpen(false)}>
                {t.nav[l] || l.charAt(0).toUpperCase() + l.slice(1)}
              </a>
            ))}
            <button className="pub-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/patient-login')}>{t.buttons.login}</button>
            <button className="pub-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setBookingOpen(true)}>
              {t.buttons.bookShort}
            </button>
          </nav>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ position: 'absolute', top: 60, left: 16, width: 220, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
            {navLinks.map(l => (
              <a key={l} href={`#${l}`} onClick={() => setMobileOpen(false)}
                style={{ display: 'block', padding: '8px 6px', borderBottom: '1px solid #f8fafc', color: '#475569', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                {t.nav[l] || l.charAt(0).toUpperCase() + l.slice(1)}
              </a>
            ))}
            <div style={{ marginTop: 10 }}>
              <button className="pub-btn-primary" style={{ width: '100%', padding: '8px', fontSize: 13, justifyContent: 'center', borderRadius: 6 }} onClick={() => { setMobileOpen(false); navigate('/patient-login'); }}>
                {t.buttons.login}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="home" style={{ position: 'relative', overflow: 'hidden', padding: '140px 24px 80px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        {/* Subtle background decoration */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, background: `radial-gradient(circle, ${primary}0A 0%, rgba(255,255,255,0) 70%)`, borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 400, height: 400, background: `radial-gradient(circle, #22c55e08 0%, rgba(255,255,255,0) 70%)`, borderRadius: '50%', zIndex: 0 }} />
        <div className="res-grid-hero" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 30, padding: '6px 16px', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#334155', marginBottom: 28 }}>
              <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 3px #d1fae5', animation: 'spin 3s linear infinite' }} />
              {data.hero?.intro_tag || t.labels.available}
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, color: '#0f172a', marginBottom: 20 }}>
              {data.hero?.title_prefix || 'Expert Medical Care,'}<br />
              <span style={{ color: primary, background: `linear-gradient(135deg, ${primary}, #0ea5e9)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {data.hero?.title_highlight || 'Delivered with Compassion'}
              </span>
            </h1>
            <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 540, marginBottom: 36, fontWeight: 400 }}>
              {data.hero?.description || data.website?.description || data.about?.bio || 'Providing comprehensive, patient-centred medical care with cutting-edge expertise.'}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48, justifyContent: 'inherit' }}>
              <button className="pub-btn-primary" style={{ fontSize: 15, padding: '14px 28px' }} onClick={() => setBookingOpen(true)}>
                {t.buttons.book}
              </button>
              <button className="pub-btn-secondary" style={{ fontSize: 15, padding: '14px 28px' }} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
                {t.buttons.readMore} <ArrowRight size={16} />
              </button>
            </div>

            {/* Stats */}
            <div className="res-grid-stats">
              {[
                { label: t.labels.experience, value: `${data.years_experience || 10}+`, icon: <Clock size={16} color={primary} /> },
                { label: t.labels.patients, value: data.stats?.patients_count || '2,000+', icon: <Users size={16} color={primary} /> },
                { label: t.labels.success, value: data.stats?.success_rate || '98%', icon: <TrendingUp size={16} color={primary} /> },
                { label: t.labels.fee, value: data.stats?.consultation_fee || '৳1,000', icon: <Star size={16} color={primary} /> }
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Photo */}
          <div className="hero-img-wrapper">
            <div style={{ position: 'absolute', top: -10, right: -20, bottom: -10, left: -10, background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)', borderRadius: 32, transform: 'rotate(2deg)', zIndex: 0 }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 460, borderRadius: 24, overflow: 'hidden', background: '#fff', border: '8px solid #fff', boxShadow: '0 24px 48px rgba(0,0,0,0.08)', zIndex: 1, margin: '0 auto' }}>
              <img
                src={getImageUrl(data.hero?.image_url) || getImageUrl(data.profile_photo_url)}
                alt={data.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80'}
              />
            </div>
            {/* Trust badge */}
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: '90%', background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '14px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
              <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={18} color="#16a34a" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Verified Expert</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Board Certified Professional</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: '80px 24px', background: '#fff' }}>
        <div className="res-grid-about" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <div className="pub-section-label">{t.sections.about}</div>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>
              {data.about?.subtitle || `${t.sections.meet} ${data.full_name}`}
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 24 }}>
              {data.about?.bio || data.website?.description || 'A highly dedicated medical professional committed to patient well-being and excellence in care.'}
            </p>

            {/* Quick credentials */}
            {data.education?.slice(0, 2).map((edu, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <GraduationCap size={15} color={primary} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{edu.degree}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{edu.institution}{edu.passing_year ? ` · ${edu.passing_year}` : ''}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 24 }}>
              <button className="pub-btn-primary" onClick={() => setBookingOpen(true)}>
                <Calendar size={14} /> {t.buttons.bookShort}
              </button>
            </div>
          </div>

          <div className="res-grid-about-images">
            <img
              src={getImageUrl(data.about?.image_1) || 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&auto=format&fit=crop'}
              onError={e => e.target.src = 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&auto=format&fit=crop'}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginTop: 40 }} alt="Practice" />
            <img
              src={getImageUrl(data.about?.image_2) || 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&auto=format&fit=crop'}
              onError={e => e.target.src = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&auto=format&fit=crop'}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12 }} alt="Team" />
            {/* Award card */}
            <div style={{ background: primary, borderRadius: 12, padding: '20px 16px', color: '#fff', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <Award size={32} style={{ flexShrink: 0, opacity: 0.85 }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{data.years_experience || 10}+ years of excellence</div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginTop: 3 }}>Serving patients with dedication and compassion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      {data.services?.length > 0 && (
        <section id="services" style={{ padding: '100px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="pub-section-label" style={{ justifyContent: 'center' }}>{t.nav.services}</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>{t.sections.specialization}</h2>
              <p style={{ color: '#475569', fontSize: 16, marginTop: 12, maxWidth: 540, margin: '12px auto 0', lineHeight: 1.6 }}>
                Comprehensive, advanced, and compassionate medical care tailored directly to your unique needs.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {data.services.map((svc, i) => {
                const Icon = getIconComponent(svc.service_icon);
                return (
                  <div key={i} className="pub-card" style={{ padding: 24, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${primary}25`; e.currentTarget.style.borderColor = primary; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                    <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Icon size={20} color={primary} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{svc.service_name}</h3>
                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{svc.service_description}</p>
                    {svc.features && (
                      <ul style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', listStyle: 'none' }}>
                        {svc.features.split(',').slice(0, 3).map((f, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748b', marginBottom: 4 }}>
                            <CheckCircle size={12} color="#22c55e" /> {f.trim()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── APPOINTMENT / CHAMBERS ── */}
      {data.chambers?.length > 0 && (
        <section id="appointment" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="res-grid-appointment">
              {/* Schedule */}
              <div>
                <div className="pub-section-label">{t.nav.appointment}</div>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: 20 }}>{t.sections.schedule}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {data.chambers.map((ch, i) => (
                    <div key={i} className="pub-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{ch.day || 'Daily'}</span>
                        <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid #bbf7d0' }}>Open</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                        <Clock size={12} color="#94a3b8" />
                        {ch.available_time || ch.time_range}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#64748b' }}>
                        <MapPin size={12} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                        {ch.chamber_location}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="pub-btn-primary" style={{ marginTop: 24 }} onClick={() => setBookingOpen(true)}>
                  <Calendar size={14} /> {t.buttons.book}
                </button>
              </div>

              {/* Contact Panel */}
              <div>
                <div className="pub-section-label">{t.nav.contact}</div>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: 20 }}>{t.sections.getInTouch}</h2>
                <div id="contact" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.contact?.phone && (
                    <a href={`tel:${data.contact.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0f172a', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}>
                      <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={15} color={primary} />
                      </div>
                      {data.contact.phone}
                    </a>
                  )}
                  {data.contact?.email && (
                    <a href={`mailto:${data.contact.email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0f172a', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}>
                      <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={15} color="#059669" />
                      </div>
                      {data.contact.email}
                    </a>
                  )}
                  {data.contact?.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#475569' }}>
                      <div style={{ width: 36, height: 36, background: '#fef3f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={15} color="#ef4444" />
                      </div>
                      {data.contact.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── EDUCATION ── */}
      {data.education?.length > 0 && (
        <section id="education" style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="pub-section-label" style={{ justifyContent: 'center' }}>Qualifications</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>{t.sections.qualifications}</h2>
            </div>
            <div style={{ position: 'relative' }}>
              {data.education.map((edu, i) => (
                <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#7c3aed', flexShrink: 0 }}>
                      {edu.passing_year ? String(edu.passing_year).slice(-2) : <GraduationCap size={16} />}
                    </div>
                    {i < data.education.length - 1 && <div style={{ width: 1, flex: 1, background: '#ddd6fe', marginTop: 4 }} />}
                  </div>
                  <div className="pub-card" style={{ flex: 1, padding: '18px 20px', marginBottom: i < data.education.length - 1 ? 0 : 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{edu.degree}</h3>
                    <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <Building size={12} /> {edu.institution}
                    </div>
                    {edu.short_description && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{edu.short_description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ── */}
      {data.experience?.length > 0 && (
        <section id="experience" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="pub-section-label" style={{ justifyContent: 'center' }}>Career</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>{t.sections.career}</h2>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={17} color="#059669" />
                  </div>
                  {i < data.experience.length - 1 && <div style={{ width: 1, flex: 1, background: '#bbf7d0', marginTop: 4 }} />}
                </div>
                <div className="pub-card" style={{ flex: 1, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{exp.designation}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: exp.end_date ? '#f1f5f9' : '#f0fdf4', color: exp.end_date ? '#64748b' : '#16a34a', border: `1px solid ${exp.end_date ? '#e2e8f0' : '#bbf7d0'}` }}>
                      {exp.end_date ? 'Former' : 'Current'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Building size={12} /> {exp.organization}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: exp.short_description ? 8 : 0 }}>
                    {fmtDate(exp.start_date)} – {exp.end_date ? fmtDate(exp.end_date) : 'Present'}
                  </div>
                  {exp.short_description && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{exp.short_description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── BLOGS ── */}
      {data.blogs?.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="pub-section-label" style={{ justifyContent: 'center' }}>Articles</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>{t.sections.insights}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {data.blogs.slice(0, 6).map((blog) => (
                <div key={blog.id} className="pub-card" style={{ cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s' }}
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
                  <div style={{ height: 160, background: '#e2e8f0', overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(blog.featured_image) || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop'}
                      alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop'} />
                  </div>
                  <div style={{ padding: '16px 18px 18px' }}>
                    {blog.category && <span style={{ fontSize: 11, fontWeight: 600, color: primary, background: '#eff6ff', padding: '2px 8px', borderRadius: 12 }}>{blog.category}</span>}
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, margin: '8px 0 6px' }}>{blog.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {blog.excerpt || ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
                      {blog.published_at && <span>{new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      <ArrowRight size={14} color={primary} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section id="testimonials" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="pub-section-label">Testimonials</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{t.sections.testimonials}</h2>
            </div>
            <div style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 48px', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 20 }}>
                {Array.from({ length: testimonials[testimonialIdx]?.rating || 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 28, maxWidth: 560, margin: '0 auto 28px' }}>
                "{testimonials[testimonialIdx]?.patient_feedback || testimonials[testimonialIdx]?.message}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: primary }}>
                  {(testimonials[testimonialIdx]?.patient_name || testimonials[testimonialIdx]?.name || 'P').charAt(0)}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{testimonials[testimonialIdx]?.patient_name || testimonials[testimonialIdx]?.name || 'Patient'}</div>
                  {testimonials[testimonialIdx]?.location && <div style={{ fontSize: 12, color: '#64748b' }}>{testimonials[testimonialIdx].location}</div>}
                </div>
              </div>
              {/* Navigation */}
              {testimonials.length > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
                  <button onClick={() => setTestimonialIdx((testimonialIdx - 1 + testimonials.length) % testimonials.length)}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={15} />
                  </button>
                  {testimonials.map((_, i) => (
                    <button key={i} onClick={() => setTestimonialIdx(i)}
                      style={{ width: i === testimonialIdx ? 24 : 8, height: 8, borderRadius: 4, border: 'none', background: i === testimonialIdx ? primary : '#e2e8f0', cursor: 'pointer', transition: 'all 0.3s' }} />
                  ))}
                  <button onClick={() => setTestimonialIdx((testimonialIdx + 1) % testimonials.length)}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── AFFILIATES ── */}
      {data.affiliates?.length > 0 && (
        <section style={{ padding: '48px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 28 }}>{t.sections.affiliates}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
              {data.affiliates.map((aff, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#475569', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
                  {aff.logo && (
                    <img src={getImageUrl(aff.logo)} alt={aff.name}
                      style={{ height: 24, width: 'auto', objectFit: 'contain' }}
                      onError={e => e.target.style.display = 'none'} />
                  )}
                  {aff.organization_name || aff.name}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '56px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ marginBottom: 40 }}>
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{data.full_name}</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>{data.website?.description || `Board-certified ${data.specialization || 'specialist'} committed to excellent patient care.`}</p>
              {data.social_media?.length > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {data.social_media.map((s, i) => {
                    const Icon = getSocialIcon(s.platform);
                    return (
                      <a key={i} href={s.profile_url} target="_blank" rel="noreferrer"
                        style={{ width: 36, height: 36, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'background 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = primary; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}>
                        <Icon size={15} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick links</h3>
              <ul style={{ listStyle: 'none' }}>
                {['home', 'about', 'services', 'appointment', 'contact'].map(l => (
                  <li key={l} style={{ marginBottom: 10 }}>
                    <a href={`#${l}`} style={{ color: '#94a3b8', fontSize: 13.5, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                      {t.nav[l] || l.charAt(0).toUpperCase() + l.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</h3>
              <ul style={{ listStyle: 'none', fontSize: 13.5 }}>
                {data.contact?.address && <li style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}><MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} />{data.contact.address}</li>}
                {data.contact?.phone && <li style={{ display: 'flex', gap: 8, marginBottom: 10 }}><Phone size={13} style={{ flexShrink: 0 }} />{data.contact.phone}</li>}
                {data.contact?.email && <li style={{ display: 'flex', gap: 8 }}><Mail size={13} style={{ flexShrink: 0 }} />{data.contact.email}</li>}
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12.5 }}>
            <span>© {new Date().getFullYear()} {data.full_name}. {t.sections.footer}</span>
            <span>Powered by <a href="#" style={{ color: '#60a5fa', textDecoration: 'none' }}>CareConnect</a></span>
          </div>
        </div>
      </footer>

      {/* ── BOOKING MODAL ── */}
      {bookingOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}
          onClick={() => setBookingOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ background: primary, color: '#fff', padding: '20px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Book an appointment</h3>
                <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>with {data.full_name}</p>
              </div>
              <button onClick={() => setBookingOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="pub-label">Full name</label>
                  <input className="pub-input" type="text" required value={bookingData.patient_name}
                    onChange={e => setBookingData(p => ({ ...p, patient_name: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label className="pub-label">Phone</label>
                  <input className="pub-input" type="tel" value={bookingData.patient_phone}
                    onChange={e => setBookingData(p => ({ ...p, patient_phone: e.target.value }))} placeholder="+880..." />
                </div>
              </div>
              <div>
                <label className="pub-label">Email address</label>
                <input className="pub-input" type="email" required value={bookingData.patient_email}
                  onChange={e => setBookingData(p => ({ ...p, patient_email: e.target.value }))} placeholder="you@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="pub-label">Preferred date</label>
                  <input className="pub-input" type="date" required value={bookingData.appointment_date}
                    onChange={e => setBookingData(p => ({ ...p, appointment_date: e.target.value }))} />
                </div>
                <div>
                  <label className="pub-label">Preferred time</label>
                  <input className="pub-input" type="time" required value={bookingData.appointment_time}
                    onChange={e => setBookingData(p => ({ ...p, appointment_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="pub-label">Visit type</label>
                <select className="pub-input" value={bookingData.appointment_type}
                  onChange={e => setBookingData(p => ({ ...p, appointment_type: e.target.value }))}>
                  <option>In-person</option>
                  <option>Telemedicine</option>
                </select>
              </div>
              <div>
                <label className="pub-label">Notes / reason (optional)</label>
                <textarea className="pub-input" rows={3} style={{ resize: 'none' }}
                  value={bookingData.notes}
                  onChange={e => setBookingData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Briefly describe your concern…" />
              </div>
              <button type="submit" disabled={bookingLoading} className="pub-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, opacity: bookingLoading ? 0.7 : 1, marginTop: 4 }}>
                {bookingLoading
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                  : <><Calendar size={15} /> Confirm appointment</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicWebsite;
