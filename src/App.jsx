import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Target, Calendar, Trophy, Users, LogIn, Download, Upload, Save, Trash2, Plus, Search, Menu, X, Clock, CheckCircle, Medal, Crosshair, Shield, FileText, ClipboardList, Radio, Lock, ChevronDown, ChevronUp, UserCheck, FileSpreadsheet, RefreshCw, Wifi, WifiOff, ListPlus, PlayCircle, AlertTriangle, ChevronLeft, ChevronRight, XCircle, Ticket, Mail, Key, Ban, QrCode, Camera, Image as ImageIcon, Smartphone, Volume2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  updateDoc,
  getDocs,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDinys28Nidl3Fjzw0ESuk58G3K8ZRui88",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lakshya-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lakshya-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lakshya-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "675947155217",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:675947155217:web:606d6469cc1b46e90206b0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1TWLF8M7P9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.projectId || "lakshya-2026";

// --- SECURITY CONSTANTS ---
const ALLOWED_ADMIN_EMAILS = [
  "nccrvce2025@gmail.com",
  "nccrvceshaurya@gmail.com",
  "lokakshas.cs24@rvce.edu.in",
  "shaurya.lakshya.admin@gmail.com",
  "rvcecdtlokakshasridhar@gmail.com"
];

const EVENT_DATES = ["26th September", "27th September"];
const STANDARD_HOURLY_TIMES = [
  "08:00 HRS",
  "09:00 HRS",
  "10:00 HRS",
  "11:00 HRS",
  "13:00 HRS",
  "14:00 HRS",
  "15:00 HRS",
  "16:00 HRS",
];

const SHOOTING_CATEGORIES = ["Air Rifle", "Air Pistol"];

// Capacity rule: 18 slots per hour for Air Rifle, 6 slots per hour for Air Pistol
const getDisciplineCapacity = (category) => {
  return (category === 'Air Rifle' || category === 'Rifle') ? 18 : 6;
};

const generateDefaultSlots = () => {
  const result = [];
  EVENT_DATES.forEach(date => {
    SHOOTING_CATEGORIES.forEach(category => {
      const cap = getDisciplineCapacity(category);
      STANDARD_HOURLY_TIMES.forEach((timeStr, index) => {
        const tStr = timeStr.trim();
        const match = tStr.match(/(\d{1,2}):(\d{2})/);
        const sortVal = match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : index * 60;
        result.push({
          id: `std_slot_${date.replace(/[\s.]+/g, '_')}_${category.replace(/[\s.]+/g, '_')}_${index}`,
          time: tStr,
          capacity: cap,
          date: date,
          category: category,
          booked: 0,
          sortOrder: sortVal
        });
      });
    });
  });
  return result;
};

// Cleanup legacy caches to ensure fresh September schedule & discipline capacities
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('lakshya_slots_v4');
    localStorage.removeItem('lakshya_participants_v4');
    localStorage.removeItem('lakshya_emails_v4');
    localStorage.removeItem('lakshya_slots_v5'); // purge old 60 capacity slots
  }
} catch (e) { }

const getInitialSlots = () => {
  try {
    const saved = localStorage.getItem('lakshya_slots_v6');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasLegacyDates = parsed.some(s => (s.date || '').includes('Dec'));
        if (!hasLegacyDates) {
          return parsed.map(s => {
            const cat = (s.category === 'Pistol' || s.category === 'Air Pistol') ? 'Air Pistol' : 'Air Rifle';
            const expectedCap = getDisciplineCapacity(cat);
            return {
              ...s,
              category: cat,
              capacity: (s.capacity === 60 || !s.capacity) ? expectedCap : s.capacity
            };
          });
        }
      }
    }
  } catch (e) { }
  const defaults = generateDefaultSlots();
  try {
    localStorage.setItem('lakshya_slots_v6', JSON.stringify(defaults));
  } catch (e) { }
  return defaults;
};

const getInitialParticipants = () => {
  try {
    const saved = localStorage.getItem('lakshya_participants_v6') || localStorage.getItem('lakshya_participants_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { }
  return [];
};

const getInitialAllowedEmails = () => {
  try {
    const saved = localStorage.getItem('lakshya_emails_v6') || localStorage.getItem('lakshya_emails_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { }
  return [];
};

const WEAPON_IMAGES = [

  { src: "/achilles.jpg", title: "Achilles X3", desc: "Precision PCP Rifle" },
  { src: "/minotaur.jpg", title: "PX120 Minotaur", desc: "Tactical Bullpup Design" },
  { src: "/benchrest.jpg", title: "Benchrest Special", desc: "Competition Grade Accuracy" },
  { src: "/pp75.jpg", title: "PP75 Champion", desc: "Elite Air Pistol" },
  { src: "/pp55.jpg", title: "PP55 Match Pro Junior", desc: "Junior Competition Pistol" },
  { src: "/px100.jpg", title: "PX100 Match", desc: "Standard Match Rifle" },
  { src: "/DSC01715.jpg", title: "Precision Air Rifle", desc: "Standard 10m Competition Rifle" },
  { src: "/DSC03839.jpg", title: "Tactical Sniper", desc: "High-Powered Scoped Precision" },
  { src: "/DSC05738.jpg", title: "Competition Pistols", desc: "Dual Set Match Grade Air Pistols" },
  { src: "/DSC09093.jpg", title: "Advanced PCP", desc: "Pre-Charged Pneumatic Target Rifle" }

];

// --- COMPONENT ---
export default function ShauryaLakshyaApp() {
  // State
  const [user, setUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [view, setView] = useState('home');
  const [participants, setParticipants] = useState(getInitialParticipants);
  const [slots, setSlots] = useState(getInitialSlots);
  const [allowedEmails, setAllowedEmails] = useState(getInitialAllowedEmails);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [dbError, setDbError] = useState(null);

  // Admin State
  const [adminTab, setAdminTab] = useState('slots');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [newAllowedEmail, setNewAllowedEmail] = useState('');
  const [importEmailsText, setImportEmailsText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [editingScoreId, setEditingScoreId] = useState(null);

  // Admin Slot Creation & Management State
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState(18);
  const [newSlotDate, setNewSlotDate] = useState('26th September');
  const [newSlotCategory, setNewSlotCategory] = useState('Air Rifle');
  const [adminViewDate, setAdminViewDate] = useState('26th September');
  const [adminViewCategory, setAdminViewCategory] = useState('All');
  const [slotFeedback, setSlotFeedback] = useState(null);

  // Leaderboard Filter State
  const [lbCategory, setLbCategory] = useState('Air Rifle');

  // Booking State
  const [bookingStep, setBookingStep] = useState('verify');
  const [participantEmail, setParticipantEmail] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    gender: 'Male',
    cadetType: 'General',
    slotId: ''
  });
  const [bookingCategory, setBookingCategory] = useState('');
  const [bookingDate, setBookingDate] = useState('26th September');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookedTicket, setLastBookedTicket] = useState(null);
  const [lastBookedPass, setLastBookedPass] = useState(null);

  // Participant Profile / Event Pass State
  const [profileQuery, setProfileQuery] = useState('');
  const [profileSearchError, setProfileSearchError] = useState('');
  const [activeProfileQuery, setActiveProfileQuery] = useState('');

  // Admin QR Check-In State
  const [scannerRunning, setScannerRunning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState(null);
  const html5QrCodeRef = useRef(null);
  const qrFileInputRef = useRef(null);
  const emailFileInputRef = useRef(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- AUTH INIT & SECURE OAUTH VERIFICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.warn("Auth initialization skipped (operating in local session mode)");
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        if (!u.isAnonymous && u.email && ALLOWED_ADMIN_EMAILS.includes(u.email)) {
          setIsAdminAuthenticated(true);
          localStorage.setItem('shaurya_admin_session', 'true');
        } else {
          setIsAdminAuthenticated(false);
          localStorage.removeItem('shaurya_admin_session');
        }
      } else {
        setUser(null);
        setIsAdminAuthenticated(false);
        localStorage.removeItem('shaurya_admin_session');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- FIRESTORE LISTENERS (NON-BLOCKING) ---
  useEffect(() => {
    if (!user) return;
    let unsub;
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'participants'));
      unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const cat = (d.category === 'Pistol' || d.category === 'Air Pistol') ? 'Air Pistol' : (d.category || 'Air Rifle');
          return { id: doc.id, ...d, category: cat };
        });
        setParticipants(data);
        try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(data)); } catch (e) { }
      }, (err) => {
        console.warn("Participants Firestore listener info:", err);
      });
    } catch (e) { }
    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let unsub;
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slots'));
      unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const category = (d.category === 'Pistol' || d.category === 'Air Pistol') ? 'Air Pistol' : (d.category || 'Air Rifle');
          const disciplineCap = getDisciplineCapacity(category);
          const capacity = (d.capacity === 60 || !d.capacity) ? disciplineCap : d.capacity;
          return { id: doc.id, ...d, category, capacity };
        });
        data.sort((a, b) => {
          if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder;
          }
          return (a.time || '').localeCompare(b.time || '');
        });
        setSlots(data);
        try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(data)); } catch (e) { }
      }, (err) => {
        console.warn("Slots Firestore listener info:", err);
      });
    } catch (e) { }
    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let unsub;
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'));
      unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllowedEmails(data);
        try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(data)); } catch (e) { }
      }, (err) => {
        console.warn("Allowed emails sync info:", err);
      });
    } catch (e) { }
    return () => unsub && unsub();
  }, [user]);

  // --- CAROUSEL LOGIC ---
  useEffect(() => {
    if (view === 'home') {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % WEAPON_IMAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % WEAPON_IMAGES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + WEAPON_IMAGES.length) % WEAPON_IMAGES.length);

  // --- CINEMATIC HERO BULLET ANIMATION (ON LOAD & SCROLL-UP) ---
  const heroRef = useRef(null);
  const [heroAnimKey, setHeroAnimKey] = useState(0);
  const lastScrollYRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);

  useEffect(() => {
    if (view !== 'home') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const now = Date.now();

      // Trigger ONLY when scrolling upward by more than 15px with a strict 1.6s cooldown
      // This prevents multiple repeated triggers (1 single clean animation per scroll up)
      if (currentScrollY < lastScrollYRef.current - 15 && (now - lastTriggerTimeRef.current > 1600)) {
        lastTriggerTimeRef.current = now;
        setHeroAnimKey(k => k + 1);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);


  // --- SCORING & STATS LOGIC ---
  const calculateStats = (participantData) => {
    const scorecards = participantData.scorecards || [];

    let grandTotal = 0;
    let grandPenalty = 0;

    const scoreCounts = {};
    for (let i = 0; i <= 10; i++) scoreCounts[i] = 0;

    scorecards.forEach(card => {
      // Skip if Disqualified
      if (card.isDQ) return;

      const cardPenalty = parseFloat(card.penalty) || 0;
      grandPenalty += cardPenalty;

      const shots = card.scores || [];
      const cardTotal = shots.reduce((a, b) => {
        const val = parseFloat(b);
        return a + (isNaN(val) ? 0 : val);
      }, 0);

      grandTotal += (cardTotal - cardPenalty);

      // Populate Histogram for Tie-Breaker
      shots.forEach(s => {
        const val = parseFloat(s);
        if (!isNaN(val)) {
          let bucket = Math.floor(val);
          if (bucket > 10) bucket = 10;
          if (bucket < 0) bucket = 0;
          scoreCounts[bucket] = (scoreCounts[bucket] || 0) + 1;
        }
      });
    });

    return {
      totalScore: grandTotal,
      totalPenalty: grandPenalty,
      scoreCounts
    };
  };

  // --- ACTIONS ---

  const handleAdminGoogleLogin = async () => {
    setAdminLoginError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (ALLOWED_ADMIN_EMAILS.includes(email)) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('shaurya_admin_session', 'true');
        setView('admin');
      } else {
        await signOut(auth);
        setAdminLoginError("ACCESS DENIED: This Google account is not authorized for command.");
        setIsAdminAuthenticated(false);
        localStorage.removeItem('shaurya_admin_session');
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errMsg = (error.message || '').toLowerCase();
      if (errMsg.includes('suspended') || errMsg.includes('permission-denied')) {
        setAdminLoginError("API KEY SUSPENDED: Google Cloud suspended this API key. Unsuspend it in Google Cloud Console or generate a new Web API Key in Firebase Console -> Project Settings and add to .env.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAdminLoginError("DOMAIN ERROR: Add localhost to Firebase Console -> Authentication -> Settings -> Authorized domains.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAdminLoginError("Login Cancelled by user.");
      } else {
        setAdminLoginError("Authentication Failed: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('shaurya_admin_session');
    await signInAnonymously(auth);
    setView('home');
    setParticipantEmail('');
    setBookingCategory('');
    setBookingStep('verify');
    setAdminLoginError('');
  };

  const verifyParticipantEmail = async (e) => {
    e.preventDefault();
    const inputEmail = participantEmail.trim().toLowerCase();
    if (!inputEmail) return;

    // Check if participant already booked
    const existing = participants.find(p => p.email && p.email.toLowerCase() === inputEmail);
    if (existing) {
      alert("You have already booked a slot! Switch to the 'Event Pass' tab to view your pass.");
      return;
    }

    if (allowedEmails.length === 0) {
      setBookingStep('form');
      return;
    }

    const found = allowedEmails.find(e => (e.email || '').trim().toLowerCase() === inputEmail);
    if (found) {
      setBookingStep('form');
    } else {
      alert(`ACCESS RESTRICTED: The email "${inputEmail}" is not on the authorized registration allowlist.\n\nPlease contact the NCC RVCE command team or event administrator to obtain booking clearance.`);
      return;
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (processingAction) return; // Prevent double-clicks

    if (!bookingCategory) {
      alert("Please select whether you want to proceed with Air Rifle or Air Pistol shooting.");
      return;
    }
    if (!bookingForm.slotId) {
      alert("Please select a time slot");
      return;
    }

    const inputEmail = (participantEmail || '').trim().toLowerCase();
    if (!inputEmail) {
      alert("Please enter a valid email address.");
      return;
    }

    // Client-side duplicate email check (fast pre-check)
    const existing = participants.find(p => (p.email || '').toLowerCase() === inputEmail);
    if (existing) {
      alert("Action Aborted: You have already booked a slot with this email.");
      return;
    }

    const selectedSlot = slots.find(s => s.id === bookingForm.slotId);
    if (!selectedSlot) {
      alert("Selected slot was not found. Please re-select a slot.");
      return;
    }

    const currentBooked = selectedSlot.booked || 0;
    if (currentBooked >= selectedSlot.capacity) {
      alert("This slot is already full. Please choose another time slot.");
      return;
    }

    setProcessingAction(true);

    const ticketBytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(ticketBytes);
    }
    const finalTicketId = "TKT-" + Array.from(ticketBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 6);
    const qrToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Use email-based ID so local state ID matches Firestore doc ID
    const participantDocId = inputEmail.replace(/\//g, '__');

    const newParticipant = {
      id: participantDocId,
      name: bookingForm.name,
      gender: bookingForm.gender || 'Male',
      cadetType: 'General',
      category: (bookingCategory === 'Air Pistol' ? 'Pistol' : bookingCategory),
      email: inputEmail,
      slotId: bookingForm.slotId,
      slotTime: selectedSlot.time,
      slotDate: selectedSlot.date || bookingDate,
      ticketId: finalTicketId,
      qrToken: qrToken,
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      scorecards: [
        {
          id: Date.now(),
          scores: Array(10).fill(''),
          penalty: 0,
          isDQ: false
        }
      ],
      totalScore: 0,
      registeredAt: new Date().toISOString()
    };

    // Local participant representation (always with friendly discipline name)
    const localParticipant = {
      ...newParticipant,
      category: (bookingCategory === 'Pistol' || bookingCategory === 'Air Pistol') ? 'Air Pistol' : 'Air Rifle'
    };

    // TRANSACTION-FIRST: Firestore atomic booking with strict capacity check
    try {
      const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participantDocId);
      const slotRef = doc(db, 'artifacts', appId, 'public', 'data', 'slots', bookingForm.slotId);

      await runTransaction(db, async (transaction) => {
        // 1. Read current slot state inside transaction (atomic snapshot)
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) {
          throw new Error("Slot no longer exists. Please select another slot.");
        }

        const slotData = slotDoc.data();
        const serverBooked = slotData.booked || 0;
        const serverCapacity = slotData.capacity || getDisciplineCapacity(bookingCategory);

        // 2. Strict capacity check inside the transaction
        if (serverBooked >= serverCapacity) {
          throw new Error(`SLOT FULL: This time slot has reached its maximum capacity of ${serverCapacity}. Please choose another slot.`);
        }

        // 3. Check if participant already exists (server-side duplicate check)
        const participantDoc = await transaction.get(participantRef);
        if (participantDoc.exists()) {
          throw new Error("You have already booked a slot with this email address.");
        }

        // 4. Atomically write participant AND increment slot booked count
        transaction.set(participantRef, newParticipant);
        transaction.update(slotRef, { booked: serverBooked + 1 });
      });

      // SUCCESS: Transaction committed — now update local state to reflect
      setSlots(prev => {
        const updated = prev.map(s => s.id === bookingForm.slotId ? { ...s, booked: (s.booked || 0) + 1 } : s);
        try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(updated)); } catch (e) { }
        return updated;
      });

      setParticipants(prev => {
        const updated = [...prev.filter(p => p.id !== localParticipant.id), localParticipant];
        try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
        return updated;
      });

      // Issue ticket pass & show modal
      setLastBookedTicket(finalTicketId);
      setLastBookedPass({
        name: bookingForm.name,
        gender: bookingForm.gender || 'Male',
        category: (bookingCategory === 'Pistol' || bookingCategory === 'Air Pistol') ? 'Air Pistol' : 'Air Rifle',
        email: inputEmail,
        slotId: bookingForm.slotId,
        slotTime: selectedSlot.time,
        slotDate: selectedSlot.date || bookingDate,
        ticketId: finalTicketId,
        qrToken: qrToken
      });
      setShowSuccessModal(true);
      setBookingForm({ name: '', slotId: '', gender: 'Male', cadetType: 'General' });

    } catch (err) {
      console.error("Booking transaction failed:", err);
      const errMsg = err.message || "Booking failed. Please try again.";
      alert("BOOKING FAILED: " + errMsg);
    } finally {
      setProcessingAction(false);
    }
  };


  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setLastBookedPass(null);
    setView('home');
    setBookingStep('verify');
    setParticipantEmail('');
    setBookingCategory('');
  };

  // --- SCORECARD MANAGEMENT ---

  const handleScoreChange = (participantId, cardIndex, field, value) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.id !== participantId) return p;
        const newScorecards = [...(p.scorecards || [])];
        const targetCard = { ...(newScorecards[cardIndex] || { id: Date.now(), scores: Array(10).fill(''), penalty: 0, isDQ: false }) };
        targetCard[field] = value;
        newScorecards[cardIndex] = targetCard;
        const stats = calculateStats({ scorecards: newScorecards });
        return {
          ...p,
          scorecards: newScorecards,
          totalScore: stats.totalScore
        };
      });
      try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });
  };

  const handleAddScorecard = (participantId) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.id !== participantId) return p;
        const newScorecards = [
          ...(p.scorecards || []),
          {
            id: Date.now(),
            scores: Array(10).fill(''),
            penalty: 0,
            isDQ: false
          }
        ];
        const stats = calculateStats({ scorecards: newScorecards });
        return {
          ...p,
          scorecards: newScorecards,
          totalScore: stats.totalScore
        };
      });
      try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });
  };

  const handleDeleteScorecard = (participantId, cardIndex) => {
    if (!window.confirm("Delete this scorecard permanently?")) return;
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.id !== participantId) return p;
        const newScorecards = [...(p.scorecards || [])];
        newScorecards.splice(cardIndex, 1);
        const stats = calculateStats({ scorecards: newScorecards });
        return {
          ...p,
          scorecards: newScorecards,
          totalScore: stats.totalScore
        };
      });
      try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });
  };

  const handleSaveScores = (participant) => {
    if (!participant) return;
    const target = participants.find(p => p.id === participant.id) || participant;
    const stats = calculateStats(target);

    // Background cloud update
    try {
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', target.id), {
        scorecards: target.scorecards || [],
        totalScore: stats.totalScore
      }).catch(e => console.log("Score update saved in local session:", e));
    } catch (e) { }

    alert(`Official scores saved for ${target.name} (Total: ${stats.totalScore.toFixed(1)} PTS)!`);
    setEditingScoreId(null);
  };

  const handleAddAllowedEmail = (e) => {
    e.preventDefault();
    if (!newAllowedEmail) return;
    const email = newAllowedEmail.trim();
    if (allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
      setNewAllowedEmail('');
      return;
    }
    const newEntry = { id: 'email_' + Date.now(), email: email, addedAt: new Date().toISOString() };
    setAllowedEmails(prev => {
      const updated = [...prev, newEntry];
      try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });
    setNewAllowedEmail('');
    try {
      addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
        email: email, addedAt: new Date().toISOString()
      }).catch(() => { });
    } catch (e) { }
  };

  const handleBulkImportEmails = () => {
    const emails = importEmailsText.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && e.includes('@'));
    let count = 0;
    const toAdd = [];
    emails.forEach(email => {
      if (!allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
        const entry = { id: 'email_' + Date.now() + '_' + count, email: email, addedAt: new Date().toISOString() };
        toAdd.push(entry);
        count++;
      }
    });
    if (toAdd.length > 0) {
      setAllowedEmails(prev => {
        const updated = [...prev, ...toAdd];
        try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(updated)); } catch (e) { }
        return updated;
      });
      // Sync all new emails to Firestore
      try {
        toAdd.forEach(entry => {
          addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
            email: entry.email, addedAt: entry.addedAt
          }).catch(() => { });
        });
      } catch (e) { }
    }
    alert(`Imported ${count} new email${count !== 1 ? 's' : ''}. ${emails.length - count} duplicate(s) skipped.`);
    setImportEmailsText('');
  };

  // Handle CSV/Excel file upload for bulk email import
  const handleFileEmailImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setProcessingAction(true);
    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        // Parse CSV/TXT with native FileReader
        const text = await file.text();
        const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);

        const extractedEmails = [];
        lines.forEach(line => {
          // Split by comma, semicolon, or tab to handle multi-column CSVs
          const parts = line.split(/[,;\t]+/).map(p => p.trim().replace(/^["']|["']$/g, ''));
          parts.forEach(part => {
            // Check if this part looks like an email
            if (part && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
              extractedEmails.push(part.toLowerCase());
            }
          });
        });

        // Deduplicate
        const uniqueEmails = [...new Set(extractedEmails)];
        if (uniqueEmails.length === 0) {
          alert("No valid email addresses found in the file. Ensure emails are in a recognizable format.");
          return;
        }

        // Use the same import logic
        let count = 0;
        const toAdd = [];
        uniqueEmails.forEach(email => {
          if (!allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email)) {
            const entry = { id: 'email_file_' + Date.now() + '_' + count, email: email, addedAt: new Date().toISOString() };
            toAdd.push(entry);
            count++;
          }
        });

        if (toAdd.length > 0) {
          setAllowedEmails(prev => {
            const updated = [...prev, ...toAdd];
            try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(updated)); } catch (e) { }
            return updated;
          });
          // Sync to Firestore
          try {
            toAdd.forEach(entry => {
              addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
                email: entry.email, addedAt: entry.addedAt
              }).catch(() => { });
            });
          } catch (ex) { }
        }

        alert(`File imported: ${count} new email${count !== 1 ? 's' : ''} added. ${uniqueEmails.length - count} duplicate(s) skipped.`);

      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // For Excel files, use SheetJS (xlsx) if available, otherwise fallback
        try {
          const XLSX = await import('xlsx');
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          const extractedEmails = [];
          data.forEach(row => {
            if (Array.isArray(row)) {
              row.forEach(cell => {
                const val = String(cell || '').trim().toLowerCase();
                if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                  extractedEmails.push(val);
                }
              });
            }
          });

          const uniqueEmails = [...new Set(extractedEmails)];
          if (uniqueEmails.length === 0) {
            alert("No valid email addresses found in the Excel file.");
            return;
          }

          let count = 0;
          const toAdd = [];
          uniqueEmails.forEach(email => {
            if (!allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email)) {
              const entry = { id: 'email_xlsx_' + Date.now() + '_' + count, email: email, addedAt: new Date().toISOString() };
              toAdd.push(entry);
              count++;
            }
          });

          if (toAdd.length > 0) {
            setAllowedEmails(prev => {
              const updated = [...prev, ...toAdd];
              try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(updated)); } catch (e) { }
              return updated;
            });
            try {
              toAdd.forEach(entry => {
                addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
                  email: entry.email, addedAt: entry.addedAt
                }).catch(() => { });
              });
            } catch (ex) { }
          }

          alert(`Excel imported: ${count} new email${count !== 1 ? 's' : ''} added. ${uniqueEmails.length - count} duplicate(s) skipped.`);
        } catch (xlsxErr) {
          console.error("Excel parse error:", xlsxErr);
          alert("Could not parse Excel file. Please install the 'xlsx' package (npm install xlsx) or use a CSV file instead.");
        }
      } else {
        alert("Unsupported file type. Please upload a .csv, .txt, or .xlsx file.");
      }
    } catch (err) {
      console.error("File import error:", err);
      alert("Error reading file: " + (err.message || "Unknown error"));
    } finally {
      setProcessingAction(false);
      e.target.value = '';
    }
  };

  const handleDeleteAllowedEmail = (id) => {
    if (window.confirm("Revoke access?")) {
      setAllowedEmails(prev => {
        const updated = prev.filter(e => e.id !== id);
        try { localStorage.setItem('lakshya_emails_v6', JSON.stringify(updated)); } catch (e) { }
        return updated;
      });
      try {
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_emails', id)).catch(() => { });
      } catch (e) { }
    }
  };


  // --- ADMIN SLOT MANAGEMENT ---
  const formatSlotTimeString = (raw) => {
    let t = (raw || '').trim().toUpperCase();
    if (!t) return '';
    if (/^\d{1,2}:\d{2}$/.test(t)) {
      const parts = t.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]} HRS`;
    }
    if (/^\d{1,2}:\d{2}\s*HRS?$/.test(t)) {
      const match = t.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]} HRS`;
      }
    }
    return t;
  };

  const getSlotSortOrder = (tStr) => {
    const match = (tStr || '').match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 999;
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    const formattedTime = formatSlotTimeString(newSlotTime);
    if (!formattedTime) {
      alert("Please enter a valid time (e.g. 08:30 HRS or 14:00)");
      return;
    }

    const sortOrderVal = getSlotSortOrder(formattedTime);
    const capacityVal = parseInt(newSlotCapacity, 10) || getDisciplineCapacity(newSlotCategory);
    const newSlotId = 'slot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newSlotData = {
      id: newSlotId,
      time: formattedTime,
      capacity: capacityVal,
      date: newSlotDate,
      category: newSlotCategory,
      booked: 0,
      sortOrder: sortOrderVal
    };

    // 1. Immediately update React state and LocalStorage
    setSlots(prev => {
      const updated = [...prev, newSlotData];
      updated.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      });
      try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });

    // 2. Adjust admin view to view this newly created slot immediately
    setAdminViewDate(newSlotDate);
    if (adminViewCategory !== 'All' && adminViewCategory !== newSlotCategory) {
      setAdminViewCategory('All');
    }

    setNewSlotTime('');
    setSlotFeedback({
      type: 'success',
      msg: `Slot ${formattedTime} (${newSlotCategory} · ${newSlotDate} · Cap: ${capacityVal}) created successfully!`
    });

    // 3. Firestore write (BaaS persistence)
    try {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', newSlotId), newSlotData)
        .catch(err => console.warn("Firestore slot write notice:", err));
    } catch (e) { }
  };

  const handleLoadStandardSchedule = async () => {
    let shouldClear = false;
    if (slots.length > 0) {
      const choice = window.confirm("Slots already exist.\n\nClick OK to RESET & LOAD standard schedule for 26th & 27th September (Air Rifle: 18 slots/hr, Air Pistol: 6 slots/hr).\nClick CANCEL to APPEND to current list.");
      shouldClear = choice;
    }

    setProcessingAction(true);
    const standardGenerated = generateDefaultSlots();

    setSlots(prev => {
      let updated;
      if (shouldClear) {
        updated = standardGenerated;
      } else {
        const existingIds = new Set(prev.map(s => `${s.date}_${s.category}_${s.time}`));
        const toAdd = standardGenerated.filter(s => !existingIds.has(`${s.date}_${s.category}_${s.time}`));
        updated = [...prev, ...toAdd];
      }
      updated.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      });
      try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });

    // Push standard schedule to Cloud Firestore
    try {
      const pushPromises = standardGenerated.map(s =>
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', s.id), s, { merge: true })
      );
      await Promise.allSettled(pushPromises);
    } catch (e) {
      console.warn("Could not batch sync slots to Cloud Firestore:", e);
    }

    setSlotFeedback({ type: 'success', msg: 'Standard 26th & 27th September schedule (18 Rifle, 6 Pistol) synced to local & Cloud Firestore!' });
    setProcessingAction(false);
  };

  const handleDeleteSlot = (slotId, currentBooked) => {
    if (currentBooked > 0) {
      if (!window.confirm(`WARNING: This slot has ${currentBooked} candidates assigned. Deleting it will NOT remove the candidates. Continue?`)) return;
    } else {
      if (!window.confirm("Are you sure you want to delete this slot?")) return;
    }

    setSlots(prev => {
      const updated = prev.filter(s => s.id !== slotId);
      try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });
    setSlotFeedback({ type: 'success', msg: 'Slot deleted successfully.' });

    // Background Firestore delete
    deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId)).catch(() => { });
  };

  const handleDeleteParticipant = (id, slotId) => {
    if (!window.confirm("Discharge personnel?")) return;

    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== id);
      try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });

    if (slotId && slotId !== 'pending') {
      setSlots(prev => {
        const updated = prev.map(s => s.id === slotId ? { ...s, booked: Math.max(0, (s.booked || 1) - 1) } : s);
        try { localStorage.setItem('lakshya_slots_v6', JSON.stringify(updated)); } catch (e) { }
        return updated;
      });
    }

    // Background Firestore cleanup
    deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', id)).catch(() => { });
    if (slotId && slotId !== 'pending') {
      const slot = slots.find(s => s.id === slotId);
      if (slot) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId), {
          booked: Math.max(0, slot.booked - 1)
        }).catch(() => { });
      }
    }
  };

  const formatCheckInDisplayTime = (val) => {
    if (!val) return 'Earlier Today';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return String(val);
    } catch {
      return 'Earlier Today';
    }
  };

  const handleExport = () => {
    const headers = "Name,TicketID,Email,Gender,Category,Date,Slot,CheckedIn,CheckedInAt,Total_10s,Total_Penalty,Total_Score\n";
    const csv = participants.map(p => {
      const stats = calculateStats(p);
      let checkInTimeStr = '';
      if (p.checkedInAt) {
        if (typeof p.checkedInAt.toDate === 'function') {
          checkInTimeStr = p.checkedInAt.toDate().toISOString();
        } else {
          checkInTimeStr = String(p.checkedInAt);
        }
      }
      return `"${p.name || ''}","${p.ticketId || 'N/A'}","${p.email || ''}","${p.gender || ''}","${p.category || 'Legacy'}","${p.slotDate || ''}","${p.slotTime || ''}","${p.checkedIn ? 'YES' : 'NO'}","${checkInTimeStr}",${stats.scoreCounts[10] || 0},${stats.totalPenalty},${p.totalScore}`;
    }).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Lakshya_Report.csv';
    a.click();
  };

  // --- QR SCANNER & CHECK-IN LOGIC ---
  const triggerScanSuccessEffects = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) { }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch (e) { }
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn("Error stopping/clearing scanner:", err);
    } finally {
      html5QrCodeRef.current = null;
      setScannerRunning(false);
    }
  };

  const startScanner = async (overrideFacingOrId = null) => {
    setCheckInFeedback(null);
    setLookupResult(null);

    // Stop and clear any existing instance first
    await stopScanner();

    // Make sure scanner state is running immediately so DOM is visible with layout dimensions
    setScannerRunning(true);

    // Give browser time to layout container dimensions
    await new Promise(resolve => setTimeout(resolve, 120));

    const readerElem = document.getElementById("admin-qr-reader");
    if (!readerElem) {
      setCheckInFeedback({ type: 'error', text: "Camera scanner element not found in DOM." });
      setScannerRunning(false);
      return;
    }

    try {
      const qrScanner = new Html5Qrcode("admin-qr-reader");
      html5QrCodeRef.current = qrScanner;

      // Camera selection strategy:
      // By default on mobile devices, requesting { facingMode: "environment" } instructs the OS / browser
      // to pick the primary high-resolution rear RGB camera (avoiding auxiliary depth/macro/ToF sensors).
      let camConfig = { facingMode: "environment" };

      if (overrideFacingOrId) {
        if (overrideFacingOrId === 'user') {
          camConfig = { facingMode: "user" };
          setCameraFacing('user');
        } else if (overrideFacingOrId === 'environment') {
          camConfig = { facingMode: "environment" };
          setCameraFacing('environment');
        } else if (typeof overrideFacingOrId === 'string') {
          camConfig = { deviceId: { exact: overrideFacingOrId } };
          setActiveCameraId(overrideFacingOrId);
        }
      } else {
        setCameraFacing('environment');
      }

      const qrboxCalc = (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.max(160, Math.min(Math.floor(minEdge * 0.72), 260));
        return { width: edge, height: edge };
      };

      const scanConfig = {
        fps: 15,
        qrbox: qrboxCalc
      };

      const onScanSuccess = (decodedText) => {
        stopScanner();
        triggerScanSuccessEffects();
        handleVerifyToken(decodedText);
      };

      try {
        await qrScanner.start(camConfig, scanConfig, onScanSuccess, () => { });
      } catch (firstErr) {
        console.warn("Camera start with primary config failed, attempting fallback:", firstErr);
        // If environment facing mode failed (e.g. desktop webcam without rear camera), try front camera
        if (camConfig && camConfig.facingMode === 'environment') {
          camConfig = { facingMode: "user" };
          setCameraFacing('user');
          await qrScanner.start(camConfig, scanConfig, onScanSuccess, () => { });
        } else {
          throw firstErr;
        }
      }

      // Now that camera permissions are active, enumerate cameras to populate the switcher
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
        }
      } catch (camErr) {
        console.warn("Could not enumerate device cameras:", camErr);
      }
    } catch (err) {
      console.error("Camera scanner start error:", err);
      let msg = "Camera access failed: " + (err.message || "Permission denied.");
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        msg = "Note: Live camera requires HTTPS or localhost on mobile. You can use '📷 Snap / Upload QR Photo' below or enter Ticket ID manually!";
      }
      setCheckInFeedback({ type: 'error', text: msg });
      await stopScanner();
    }
  };

  const toggleCameraFacing = async () => {
    if (availableCameras.length > 1) {
      const currIdx = availableCameras.findIndex(c => c.id === activeCameraId);
      const nextIdx = (currIdx + 1) % availableCameras.length;
      const nextCam = availableCameras[nextIdx];
      setActiveCameraId(nextCam.id);
      await startScanner(nextCam.id);
      return;
    }
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startScanner(nextFacing);
  };

  const handleImageFileScan = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCheckInFeedback(null);
    setLookupResult(null);

    await stopScanner();

    try {
      const qrScanner = new Html5Qrcode("admin-qr-reader");
      const decodedText = await qrScanner.scanFile(file, true);
      try { qrScanner.clear(); } catch (cErr) { }
      triggerScanSuccessEffects();
      handleVerifyToken(decodedText);
    } catch (err) {
      console.error("QR file scan error:", err);
      setCheckInFeedback({ type: 'error', text: "Could not detect QR in the selected picture. Ensure the QR is clear and well-lit." });
    }
    e.target.value = '';
  };

  const handleVerifyToken = (rawQuery) => {
    const q = (rawQuery || '').trim();
    if (!q) return;
    setCheckInFeedback(null);

    const match = participants.find(p =>
      (p.qrToken && p.qrToken.toLowerCase() === q.toLowerCase()) ||
      (p.ticketId && p.ticketId.toUpperCase() === q.toUpperCase()) ||
      (p.email && p.email.toLowerCase() === q.toLowerCase())
    );

    if (!match) {
      setLookupResult({
        status: 'INVALID',
        query: q,
        errorMsg: 'No candidate record found matching this QR code / Ticket ID.'
      });
      return;
    }

    if (match.checkedIn) {
      setLookupResult({
        status: 'ALREADY_CHECKED_IN',
        participant: match
      });
    } else {
      setLookupResult({
        status: 'VALID',
        participant: match
      });
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    triggerScanSuccessEffects();
    handleVerifyToken(lookupQuery);
  };

  const handleConfirmCheckIn = async (participant) => {
    if (!participant || !participant.id) return;
    setCheckInLoading(true);
    setCheckInFeedback(null);

    const nowIso = new Date().toISOString();
    const updatedParticipant = {
      ...participant,
      checkedIn: true,
      checkedInAt: nowIso,
      checkedInBy: user?.email || 'Admin Command'
    };

    // 1. Immediately update local state & persistence
    setParticipants(prev => {
      const updated = prev.map(p => p.id === participant.id ? updatedParticipant : p);
      try { localStorage.setItem('lakshya_participants_v6', JSON.stringify(updated)); } catch (e) { }
      return updated;
    });

    setLookupResult({
      status: 'ALREADY_CHECKED_IN',
      participant: updatedParticipant
    });

    setCheckInFeedback({
      type: 'success',
      text: `Check-in confirmed for ${participant.name} (${participant.category || 'Legacy'})!`
    });
    setCheckInLoading(false);

    // 2. Background Firestore update (non-blocking)
    try {
      const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id);
      updateDoc(participantRef, {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
        checkedInBy: user?.email || 'Admin Command'
      }).catch(err => {
        console.log("Firestore cloud check-in sync skipped (local active):", err);
      });
    } catch (err) { }
  };

  const resetCheckInState = () => {
    setLookupResult(null);
    setLookupQuery('');
    setCheckInFeedback(null);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => { });
      }
    };
  }, []);

  // --- RENDER HELPERS ---
  const sortedParticipants = useMemo(() => {
    return participants
      .filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        (p.category === lbCategory || (lbCategory === 'Air Pistol' && p.category === 'Pistol'))
      )
      .sort((a, b) => {
        const statsA = calculateStats(a);
        const statsB = calculateStats(b);

        if (Math.abs(statsB.totalScore - statsA.totalScore) > 0.001) {
          return statsB.totalScore - statsA.totalScore;
        }

        for (let i = 10; i >= 0; i--) {
          const countA = statsA.scoreCounts[i] || 0;
          const countB = statsB.scoreCounts[i] || 0;
          if (countB !== countA) {
            return countB - countA;
          }
        }
        return 0;
      });
  }, [participants, searchTerm, lbCategory]);

  // --- PARTICIPANT PROFILE & RANKING LOGIC ---
  const activeParticipant = useMemo(() => {
    const q = (activeProfileQuery || participantEmail || (lastBookedPass && lastBookedPass.ticketId) || '').trim().toLowerCase();
    if (!q) return null;
    return participants.find(p =>
      (p.email && p.email.toLowerCase() === q) ||
      (p.ticketId && p.ticketId.toLowerCase() === q) ||
      (p.qrToken && p.qrToken.toLowerCase() === q)
    ) || null;
  }, [participants, activeProfileQuery, participantEmail, lastBookedPass]);

  const activeParticipantRank = useMemo(() => {
    if (!activeParticipant || !activeParticipant.category) return null;
    const targetCat = (activeParticipant.category === 'Pistol' || activeParticipant.category === 'Air Pistol') ? 'Air Pistol' : (activeParticipant.category || 'Air Rifle');

    // Filter candidates in same category (exact match with leaderboard logic)
    const pool = participants
      .filter(p => {
        const pCat = (p.category === 'Pistol' || p.category === 'Air Pistol') ? 'Air Pistol' : (p.category || 'Air Rifle');
        return pCat === targetCat;
      })
      .sort((a, b) => {
        const statsA = calculateStats(a);
        const statsB = calculateStats(b);

        if (Math.abs(statsB.totalScore - statsA.totalScore) > 0.001) {
          return statsB.totalScore - statsA.totalScore;
        }

        for (let i = 10; i >= 0; i--) {
          const countA = statsA.scoreCounts[i] || 0;
          const countB = statsB.scoreCounts[i] || 0;
          if (countB !== countA) {
            return countB - countA;
          }
        }
        return 0;
      });

    const index = pool.findIndex(p => p.id === activeParticipant.id || (p.email && p.email.toLowerCase() === (activeParticipant.email || '').toLowerCase()));
    if (index === -1) return null;
    return {
      rank: index + 1,
      total: pool.length,
      category: activeParticipant.category
    };
  }, [activeParticipant, participants]);

  const activeParticipantStats = useMemo(() => {
    return activeParticipant ? calculateStats(activeParticipant) : null;
  }, [activeParticipant]);

  const hasActiveScores = useMemo(() => {
    if (!activeParticipant || !activeParticipant.scorecards) return false;
    return activeParticipant.scorecards.some(card =>
      !card.isDQ && card.scores && card.scores.some(s => s !== '' && !isNaN(parseFloat(s)))
    );
  }, [activeParticipant]);

  const handleProfileSearch = (e) => {
    e.preventDefault();
    setProfileSearchError('');
    const q = profileQuery.trim();
    if (!q) return;
    const found = participants.find(p =>
      (p.email && p.email.toLowerCase() === q.toLowerCase()) ||
      (p.ticketId && p.ticketId.toUpperCase() === q.toUpperCase()) ||
      (p.qrToken && p.qrToken.toLowerCase() === q.toLowerCase())
    );
    if (found) {
      setActiveProfileQuery(q);
      setProfileSearchError('');
    } else {
      setProfileSearchError(`No candidate pass found matching "${q}". Please check your Ticket ID or email.`);
    }
  };

  const bookingSlots = slots.filter(s =>
    s.date === bookingDate &&
    bookingCategory &&
    (s.category === bookingCategory || (bookingCategory === 'Air Pistol' && s.category === 'Pistol'))
  );
  const adminSlots = slots.filter(s => {
    const matchDate = s.date === adminViewDate;
    const matchCat = adminViewCategory === 'All' ||
      s.category === adminViewCategory ||
      (adminViewCategory === 'Air Pistol' && s.category === 'Pistol');
    return matchDate && matchCat;
  });

  return (
    <div className="min-h-screen bg-stone-900 text-amber-100 font-sans uppercase tracking-wider selection:bg-amber-700 selection:text-amber-100 relative flex flex-col">
      {/* Camo BG */}
      <div className="fixed inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none" style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23383225"/><path d="M174.7 229.4c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm19.5 19.5c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm-54.6 54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm54.6-54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6z" fill="%234a4436"/><path d="M329.7 74.7c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm19.5 19.5c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm-54.6 54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm54.6-54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6z" fill="%232a271e"/></svg>')`
      }} />

      {/* Nav */}
      <nav className="bg-stone-900/95 backdrop-blur-md border-b-2 border-amber-700/80 sticky top-0 z-50 shadow-xl shadow-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
              <div className="flex gap-2 items-center">
                <img src="image_e3acf6.png" alt="NCC" className="h-11 w-11 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-transform group-hover:scale-105" />
                <img src="image_e3ad73.png" alt="RVCE" className="h-11 w-11 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-transform group-hover:scale-105" />
              </div>
              <div className="border-l-2 border-amber-700/60 h-10 mx-2 hidden md:block"></div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-xl md:text-2xl tracking-widest text-amber-500 drop-shadow-sm">LAKSHYA 2.0</span>
                <span className="text-[10px] text-amber-200/60 tracking-widest font-mono uppercase">10m Precision Shooting · RVCE</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setView('home')}
                className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'home' ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-transparent text-stone-400 hover:text-amber-200 hover:bg-stone-800'}`}>
                Event Info
              </button>
              <button
                onClick={() => setView('booking')}
                className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'booking' ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-transparent text-stone-400 hover:text-amber-200 hover:bg-stone-800'}`}>
                Slot Selection
              </button>
              <button
                onClick={() => setView('profile')}
                className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'profile' ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-transparent text-stone-400 hover:text-amber-200 hover:bg-stone-800'}`}>
                Event Pass
              </button>
              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'leaderboard' ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-transparent text-stone-400 hover:text-amber-200 hover:bg-stone-800'}`}>
                Leaderboard
              </button>
              {isAdminAuthenticated ? (
                <button
                  onClick={() => setView('admin')}
                  className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'admin' ? 'border-red-500 bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-red-900 bg-red-950/40 text-red-400 hover:bg-red-900/60'}`}>
                  Command Desk
                </button>
              ) : (
                <button
                  onClick={() => setView('login')}
                  className={`px-3 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'login' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-700 text-stone-400 hover:text-amber-300'}`}>
                  <Lock size={14} className="inline mr-1" /> Admin
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
                className="text-amber-400 hover:text-amber-300 p-2">
                {menuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-stone-950 border-b-2 border-amber-700/80 px-4 pt-2 pb-6 space-y-3">
            <button onClick={() => { setView('home'); setMenuOpen(false) }} className={`block w-full text-left py-2 px-3 text-sm font-bold ${view === 'home' ? 'text-amber-400 bg-stone-900' : 'text-stone-300'}`}>Event Info</button>
            <button onClick={() => { setView('booking'); setMenuOpen(false) }} className={`block w-full text-left py-2 px-3 text-sm font-bold ${view === 'booking' ? 'text-amber-400 bg-stone-900' : 'text-stone-300'}`}>Slot Selection</button>
            <button onClick={() => { setView('profile'); setMenuOpen(false) }} className={`block w-full text-left py-2 px-3 text-sm font-bold ${view === 'profile' ? 'text-amber-400 bg-stone-900' : 'text-stone-300'}`}>Event Pass</button>
            <button onClick={() => { setView('leaderboard'); setMenuOpen(false) }} className={`block w-full text-left py-2 px-3 text-sm font-bold ${view === 'leaderboard' ? 'text-amber-400 bg-stone-900' : 'text-stone-300'}`}>Leaderboard</button>
            {isAdminAuthenticated ? (
              <button onClick={() => { setView('admin'); setMenuOpen(false) }} className="block w-full text-left py-2 px-3 text-sm font-bold text-red-400 bg-red-950/40">Command Desk</button>
            ) : (
              <button onClick={() => { setView('login'); setMenuOpen(false) }} className="block w-full text-left py-2 px-3 text-sm font-bold text-stone-400">Admin Login</button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full">

        {/* ERROR BANNER IF DB FAILS */}
        {dbError && isAdminAuthenticated && (
          <div className="mb-6 bg-red-900/80 border-l-4 border-red-500 p-4 rounded shadow-lg flex items-start gap-3">
            <AlertTriangle className="text-red-300 mt-1" size={24} />
            <div>
              <h3 className="text-red-200 font-bold">System Connection Issue</h3>
              <p className="text-red-300 text-sm">{dbError}</p>
            </div>
          </div>
        )}

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="space-y-16">
            {/* FIRST SCREEN HERO VIEWPORT */}
            <div ref={heroRef} className="relative w-full min-h-[calc(100vh-9rem)] md:min-h-[calc(100vh-7.5rem)] flex flex-col items-center justify-center text-center overflow-hidden py-4 sm:py-8">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <Crosshair size={380} className="text-amber-700" />
              </div>

              {/* TITLE & BULLET CONTAINER - LOCKED 1:1 TO TEXT BOUNDS */}
              <div
                key={heroAnimKey}
                onClick={() => setHeroAnimKey(k => k + 1)}
                className="relative inline-flex items-center justify-center w-fit max-w-full mx-auto px-4 py-6 sm:py-10 select-none cursor-pointer group"
                title="Click to trigger bullet ballistic trajectory"
              >

                {/* LAYER 1: Background Ghost / Concealed Title */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-stone-800/40 whitespace-nowrap">
                  LAKSHYA 2.0
                </h1>

                {/* LAYER 2: Foreground Revealed Title (Animated with CSS Keyframes) */}
                <h1
                  className="animate-title-reveal text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_5px_12px_rgba(0,0,0,0.9)] absolute inset-0 flex items-center justify-center whitespace-nowrap"
                >
                  LAKSHYA 2.0
                </h1>

                {/* LAYER 3: Glowing Bullet Projectile Tracer (Animated with CSS Keyframes) */}
                <div
                  className="animate-bullet-shoot absolute top-1/2 pointer-events-none z-30"
                >
                  {/* Glowing Bullet Projectile with tip anchored at left percentage */}
                  <div className="relative flex items-center -translate-x-full">
                    {/* Supersonic shockwave ring */}
                    <div className="w-1.5 h-4 -mr-1 rounded-full border border-amber-300/40 opacity-70 blur-[0.5px]"></div>
                    {/* High-speed glowing tracer tail */}
                    <div
                      className="h-[3px] rounded-l-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                      style={{
                        width: '64px',
                        background: 'linear-gradient(to left, rgba(254, 240, 138, 0.98), rgba(245, 158, 11, 0.8), rgba(239, 68, 68, 0.3), transparent)'
                      }}
                    />
                    {/* Brass / Copper Projectile Core */}
                    <div
                      className="w-4 h-2.5 rounded-r-full bg-gradient-to-r from-amber-200 via-amber-100 to-white shadow-[0_0_16px_4px_rgba(251,191,36,0.95),0_0_28px_8px_rgba(245,158,11,0.7)]"
                    />
                  </div>
                </div>

              </div>

              {/* PRIMARY CTA BUTTONS - IN FIRST SCREEN HERO */}
              <div className="mt-6 sm:mt-8 relative z-30 flex flex-wrap justify-center gap-4 px-4">
                <button
                  onClick={() => setView('booking')}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-8 py-3.5 rounded-sm transition shadow-lg shadow-amber-900/40 tracking-widest border border-amber-400 text-sm"
                >
                  REGISTER & BOOK SLOT
                </button>
                <button
                  onClick={() => setView('profile')}
                  className="bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold px-6 py-3.5 rounded-sm transition border border-amber-700/60 flex items-center gap-2 text-sm tracking-wider"
                >
                  <Ticket size={16} /> RETRIEVE PASS
                </button>
                <button
                  onClick={() => setView('leaderboard')}
                  className="bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold px-6 py-3.5 rounded-sm transition border border-stone-700 flex items-center gap-2 text-sm tracking-wider"
                >
                  <Trophy size={16} /> LIVE SCORES
                </button>
              </div>
            </div>

            {/* WEAPONS & EQUIPMENT CAROUSEL */}
            <div className="space-y-6 pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-black text-amber-500 uppercase tracking-widest">Competition Weaponry & Armory</h3>
                <p className="text-xs text-stone-400 mt-1">Official competition match rifles and precision air pistols deployed at the range</p>
              </div>

              <div className="relative max-w-4xl mx-auto rounded-sm overflow-hidden border-2 border-amber-700/50 shadow-2xl bg-stone-950">
                <div className="aspect-[16/9] md:aspect-[21/9] relative overflow-hidden flex items-center justify-center">
                  <img
                    src={WEAPON_IMAGES[currentSlide].src}
                    alt={WEAPON_IMAGES[currentSlide].title}
                    className="w-full h-full object-cover transition-all duration-700 scale-100 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                    <div className="text-xs text-amber-400 font-mono tracking-widest uppercase mb-1">
                      Armory Profile {currentSlide + 1} of {WEAPON_IMAGES.length}
                    </div>
                    <h4 className="text-2xl md:text-3xl font-black text-amber-100 uppercase tracking-wide">
                      {WEAPON_IMAGES[currentSlide].title}
                    </h4>
                    <p className="text-xs md:text-sm text-stone-300 max-w-lg mt-1">
                      {WEAPON_IMAGES[currentSlide].desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={prevSlide}
                  aria-label="Previous Weapon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-amber-400 border border-amber-700/50 transition">
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next Weapon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-amber-400 border border-amber-700/50 transition">
                  <ChevronRight size={20} />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {WEAPON_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-400 w-6' : 'bg-stone-600 w-2'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING VIEW */}
        {view === 'booking' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border-b-4 border-amber-700 pb-4">
              <h2 className="text-3xl font-black flex items-center gap-4">
                <ClipboardList className="text-amber-500" size={36} /> Slot Selection
              </h2>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Official Registration & Duty Slot Reservation</p>
            </div>

            {/* Visual Step Indicator */}
            <div className="grid grid-cols-2 gap-2 bg-stone-900/80 p-2 rounded border border-amber-700/40 text-xs">
              <div className={`p-2.5 rounded text-center font-bold flex items-center justify-center gap-2 ${bookingStep === 'verify' ? 'bg-amber-700 text-amber-100 shadow' : 'bg-stone-950 text-stone-400'}`}>
                <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px]">1</span>
                <span>Verify Access</span>
              </div>
              <div className={`p-2.5 rounded text-center font-bold flex items-center justify-center gap-2 ${bookingStep === 'form' ? 'bg-amber-700 text-amber-100 shadow' : 'bg-stone-950 text-stone-400'}`}>
                <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px]">2</span>
                <span>Select & Confirm</span>
              </div>
            </div>

            <div className="bg-stone-800/90 rounded-sm p-6 sm:p-8 border-2 border-amber-700 shadow-2xl">

              {/* Step 1: Verify Email */}
              {bookingStep === 'verify' && (
                <form onSubmit={verifyParticipantEmail} className="space-y-6">
                  <div className="text-center text-amber-200/70 mb-6">
                    <div className="w-16 h-16 bg-amber-950/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-600/40">
                      <Shield size={36} className="text-amber-500" />
                    </div>
                    <h3 className="text-lg font-black text-amber-100 uppercase tracking-wide">Restricted Access Clearance</h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                      Enter your approved email ID to unlock category and duty slot reservations.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Candidate Email Address</label>
                    <input
                      required
                      type="email"
                      className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3.5 text-amber-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-sm"
                      placeholder="candidate@email.com"
                      value={participantEmail}
                      onChange={e => setParticipantEmail(e.target.value)}
                    />
                  </div>
                  <button className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-amber-600 shadow-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <Key size={16} /> VERIFY ACCESS & PROCEED
                  </button>
                </form>
              )}

              {/* Step 2: Booking Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="flex items-center justify-between text-green-400 text-xs font-bold bg-green-950/40 border border-green-600/50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>Access Granted: <span className="font-mono text-amber-200">{participantEmail}</span></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingStep('verify')}
                      className="text-[10px] text-stone-400 hover:text-amber-300 underline font-normal"
                    >
                      Change
                    </button>
                  </div>

                  {/* 1. BASIC CANDIDATE DETAILS & MISSION DATE */}
                  <div className="bg-stone-900/90 p-5 rounded-sm border border-amber-700/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center">1</span>
                        <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Candidate Details & Mission Date</h4>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">STEP 1 OF 3</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Candidate Full Name *</label>
                        <input
                          required
                          type="text"
                          placeholder="Cadet Full Name"
                          className="w-full bg-stone-950 border-2 border-amber-700/50 rounded-sm px-4 py-3 text-amber-100 outline-none focus:border-amber-500 text-sm"
                          value={bookingForm.name}
                          onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Gender Category *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Male', 'Female'].map(g => {
                            const isGSelected = (bookingForm.gender || 'Male') === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setBookingForm({ ...bookingForm, gender: g })}
                                className={`py-3 text-xs font-bold rounded-sm border-2 transition uppercase tracking-wider ${isGSelected ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow' : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-amber-700/50'}`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Select Mission Date *</label>
                      <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1.5 rounded-sm border border-amber-700/50">
                        {EVENT_DATES.map(date => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => { setBookingDate(date); setBookingForm({ ...bookingForm, slotId: '' }); }}
                            className={`py-2.5 text-xs font-bold rounded-sm transition uppercase tracking-wider flex items-center justify-center gap-2 ${bookingDate === date ? 'bg-amber-700 text-white shadow' : 'text-stone-400 hover:text-amber-100'}`}
                          >
                            <Calendar size={14} /> {date}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. SHOOTING DISCIPLINE SELECTION (Air Rifle vs Air Pistol) */}
                  <div className="bg-stone-900/90 p-5 rounded-sm border border-amber-700/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center">2</span>
                        <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Choose Shooting Discipline *</h4>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">STEP 2 OF 3</span>
                    </div>
                    <p className="text-xs text-stone-400 normal-case">
                      Please select whether you want to proceed with <strong>Air Rifle</strong> (18 slots/hr) or <strong>Air Pistol</strong> (6 slots/hr). Slot availability below will update based on your choice.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SHOOTING_CATEGORIES.map(cat => {
                        const isSelected = bookingCategory === cat;
                        const isRifle = cat === 'Air Rifle';
                        return (
                          <div
                            key={cat}
                            onClick={() => { setBookingCategory(cat); setBookingForm({ ...bookingForm, slotId: '' }); }}
                            className={`cursor-pointer p-4 rounded-sm border-2 transition text-left flex flex-col justify-between relative overflow-hidden ${isSelected ? 'border-amber-500 bg-amber-950/50 shadow-lg shadow-amber-900/30' : 'border-stone-700 bg-stone-950 hover:border-amber-700/50'}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-400'}`}>
                                  {isRifle ? <Crosshair size={22} /> : <Target size={22} />}
                                </div>
                                <div>
                                  <div className={`font-black text-base uppercase tracking-wider ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                                    {cat}
                                  </div>
                                  <div className="text-[10px] text-stone-400 normal-case">
                                    {isRifle ? '10m Precision PCP Match Rifle' : '10m Precision Air Pistol'}
                                  </div>
                                </div>
                              </div>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-stone-600'}`}>
                                {isSelected && <span className="w-2 h-2 bg-stone-950 rounded-full"></span>}
                              </span>
                            </div>

                            {/* Slot Capacity Badge */}
                            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">HOURLY CAPACITY</span>
                              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full font-mono ${isSelected ? 'bg-amber-400 text-black' : 'bg-stone-800 text-amber-300'}`}>
                                {isRifle ? '18 SLOTS / HR' : '6 SLOTS / HR'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. TIME SLOT SELECTION */}
                  <div className="bg-stone-900/90 p-5 rounded-sm border border-amber-700/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center">3</span>
                        <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                          Select Duty Time Slot {bookingCategory ? `(${bookingCategory} · ${bookingDate})` : `(${bookingDate})`}
                        </h4>
                      </div>
                      {bookingCategory && (
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          {bookingCategory === 'Air Rifle' ? '18 MAX / SLOT' : '6 MAX / SLOT'}
                        </span>
                      )}
                    </div>

                    {!bookingCategory ? (
                      <div className="text-center p-6 bg-stone-950 rounded border border-dashed border-amber-700/40 space-y-2">
                        <AlertTriangle size={24} className="text-amber-500 mx-auto" />
                        <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                          Selection Required: Air Rifle or Air Pistol
                        </p>
                        <p className="text-[11px] text-stone-400 normal-case max-w-md mx-auto">
                          Please select whether you want to proceed with <strong>Air Rifle</strong> (18 slots/hr) or <strong>Air Pistol</strong> (6 slots/hr) in Step 2 above to view available time slots for {bookingDate}.
                        </p>
                      </div>
                    ) : bookingSlots.length === 0 ? (
                      <div className="text-amber-400 bg-stone-950 p-5 rounded border border-amber-900/50 text-xs text-center">
                        <p className="font-bold mb-1">
                          ⚠️ No Slots Available for {bookingCategory} on {bookingDate}
                        </p>
                        <p className="text-stone-400 normal-case">
                          Check back later or try the other event date. Duty slots are scheduled independently per discipline.
                        </p>
                        {slots.length === 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={handleLoadStandardSchedule}
                              disabled={processingAction}
                              className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-sm border border-amber-500 transition uppercase tracking-wider inline-flex items-center gap-1.5 shadow"
                            >
                              {processingAction ? <RefreshCw size={12} className="animate-spin" /> : <Clock size={12} />}
                              ⚡ Load Standard Schedule (08:00 - 16:00 HRS)
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {bookingSlots.map(slot => {
                          const isFull = (slot.booked || 0) >= slot.capacity;
                          const isSelected = bookingForm.slotId === slot.id;
                          const remaining = slot.capacity - (slot.booked || 0);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isFull}
                              onClick={() => !isFull && setBookingForm({ ...bookingForm, slotId: slot.id })}
                              className={`p-3 rounded-sm border-2 text-center transition flex flex-col items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-950/60 shadow-lg shadow-amber-900/30' : 'border-stone-700 bg-stone-950 hover:border-amber-700/50'} ${isFull ? 'opacity-40 cursor-not-allowed border-red-950 bg-stone-950 text-stone-500' : ''}`}
                            >
                              <div className={`font-black text-sm font-mono ${isSelected ? 'text-amber-300' : 'text-amber-100'}`}>{slot.time}</div>
                              <div className="mt-1 font-mono">
                                {isFull ? (
                                  <span className="text-[10px] font-bold text-red-400 uppercase">FULL</span>
                                ) : (
                                  <span className={`text-[10px] font-bold ${remaining <= 3 ? 'text-amber-400' : 'text-green-400'}`}>
                                    {remaining} / {slot.capacity} Open
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-amber-600 shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!bookingCategory || !bookingForm.slotId || !bookingForm.name || processingAction}
                  >
                    {processingAction ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {processingAction ? 'PROCESSING BOOKING...' : 'CONFIRM REGISTRATION & ISSUE PASS'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PARTICIPANT PROFILE & EVENT PASS VIEW */}
        {view === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b-4 border-amber-700 pb-4">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-4">
                  <Ticket className="text-amber-500" size={36} /> Candidate Event Pass
                </h2>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Official Credentials & Performance Record</p>
              </div>
              {activeParticipant && (
                <button
                  onClick={() => { setActiveProfileQuery(''); setProfileQuery(''); }}
                  className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 px-4 py-2 rounded border border-amber-700/50 font-bold transition flex items-center gap-2"
                >
                  <Search size={14} /> Query Another Pass
                </button>
              )}
            </div>

            {/* If no active participant loaded -> Search Form */}
            {!activeParticipant && (
              <div className="bg-stone-800/80 rounded-sm p-8 border-2 border-amber-700 shadow-2xl max-w-xl mx-auto text-center">
                <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-600">
                  <Shield size={32} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-amber-100 mb-2 uppercase">Access Event Pass</h3>
                <p className="text-xs text-stone-400 mb-6 leading-relaxed">
                  Enter your registered email address or Ticket ID (e.g. <span className="font-mono text-amber-300">TKT-XXXXXX</span>) to retrieve your official pass, QR token, duty slot, and live score dossier.
                </p>

                {profileSearchError && (
                  <div className="mb-4 bg-red-900/40 border border-red-500 text-red-200 px-4 py-2.5 rounded text-xs flex items-center gap-2 text-left">
                    <AlertTriangle size={16} className="shrink-0 text-red-400" /> {profileSearchError}
                  </div>
                )}

                <form onSubmit={handleProfileSearch} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 mb-2 uppercase">Email or Ticket ID</label>
                    <input
                      required
                      type="text"
                      placeholder="candidate@email.com or TKT-XXXXXX"
                      value={profileQuery}
                      onChange={e => setProfileQuery(e.target.value)}
                      className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3.5 text-amber-100 outline-none focus:border-amber-500 font-mono text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3.5 rounded-sm transition border-2 border-amber-600 shadow-lg uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                    <Search size={16} /> Retrieve Event Pass
                  </button>
                </form>

                <div className="mt-8 border-t border-amber-700/30 pt-4 text-center">
                  <span className="text-xs text-stone-500">Haven't booked a slot yet?</span>{' '}
                  <button onClick={() => setView('booking')} className="text-xs text-amber-400 hover:underline font-bold">
                    Book a Slot Now
                  </button>
                </div>
              </div>
            )}

            {/* If active participant loaded -> Full Tactical Dossier & Event Pass */}
            {activeParticipant && (
              <div className="space-y-8">
                {/* Main Pass Container with print-pass-card class */}
                <div className="print-pass-card bg-stone-800/90 border-2 border-amber-600 rounded-sm shadow-2xl overflow-hidden">

                  {/* Pass Top Banner */}
                  <div className="bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 p-4 border-b-2 border-amber-700/60 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-widest uppercase">
                      <Shield size={18} className="text-amber-500" />
                      LAKSHYA 2.0 · OFFICIAL EVENT PASS
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-stone-950 text-xs font-black px-3 py-1 rounded uppercase tracking-wider">
                        {activeParticipant.category || 'Legacy'}
                      </span>
                      {activeParticipant.checkedIn ? (
                        <span className="bg-green-900/60 text-green-400 border border-green-500 text-xs font-bold px-3 py-1 rounded uppercase flex items-center gap-1">
                          <CheckCircle size={12} /> CHECKED IN
                        </span>
                      ) : (
                        <span className="bg-stone-900 text-stone-400 border border-stone-700 text-xs font-bold px-3 py-1 rounded uppercase">
                          REGISTERED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pass Body (Two Columns: QR Pass on Left, Details & Scores on Right) */}
                  <div className="p-6 sm:p-8 grid md:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: QR & Identification Badge (5 cols) */}
                    <div className="md:col-span-5 flex flex-col items-center justify-between bg-stone-900/80 p-6 rounded border border-amber-700/40 text-center">
                      <div className="w-full">
                        <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">Candidate</div>
                        <h3 className="text-2xl font-black text-amber-100 tracking-wide mb-1 break-words">
                          {activeParticipant.name}
                        </h3>
                        <div className="text-xs text-amber-200/60 mb-4">
                          {activeParticipant.category || 'Air Rifle'} · {activeParticipant.cadetType || 'General'}
                        </div>

                        <div className="bg-black/40 border border-stone-800 p-2.5 rounded mb-6 text-center">
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Ticket Identifier</span>
                          <span className="text-lg font-mono font-bold text-amber-400 tracking-wider">
                            {activeParticipant.ticketId}
                          </span>
                        </div>
                      </div>

                      {/* QR Display */}
                      <div className="w-full flex flex-col items-center">
                        <div className="bg-white p-3.5 rounded shadow-lg shadow-black/60 flex items-center justify-center">
                          {activeParticipant.qrToken ? (
                            <QRCodeSVG
                              value={activeParticipant.qrToken}
                              size={170}
                              bgColor="#ffffff"
                              fgColor="#1c1917"
                              level="H"
                              includeMargin={false}
                            />
                          ) : (
                            <div className="w-[170px] h-[170px] flex flex-col items-center justify-center text-xs text-stone-600 font-mono p-2">
                              <AlertTriangle size={24} className="mb-2 text-stone-500" />
                              QR Not Available
                              <span className="text-[10px] text-stone-400 mt-1">(Legacy Record)</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-3 font-mono tracking-wider">
                          TOKEN: {activeParticipant.qrToken ? `${activeParticipant.qrToken.substring(0, 12)}...` : 'N/A'}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-2 normal-case leading-tight">
                          Scan at range gate for instantaneous security clearance.
                        </p>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Mission Duty, Check-In, Scores, Ranking (7 cols) */}
                    <div className="md:col-span-7 space-y-6">

                      {/* Booking & Duty Schedule Box */}
                      <div className="bg-stone-900/60 border border-amber-700/40 rounded p-5">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Clock size={16} /> Assigned Duty Schedule
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-stone-950 p-3 rounded border border-stone-800">
                            <span className="text-stone-500 uppercase block mb-0.5">Date</span>
                            <span className="text-amber-100 font-bold text-sm">{activeParticipant.slotDate || '26th September'}</span>
                          </div>
                          <div className="bg-stone-950 p-3 rounded border border-stone-800">
                            <span className="text-stone-500 uppercase block mb-0.5">Time Slot</span>
                            <span className="text-amber-100 font-bold text-sm">{activeParticipant.slotTime}</span>
                          </div>
                          <div className="bg-stone-950 p-3 rounded border border-stone-800 col-span-2 sm:col-span-1">
                            <span className="text-stone-500 uppercase block mb-0.5">Category</span>
                            <span className="text-amber-400 font-bold text-sm">{activeParticipant.category || 'Legacy'}</span>
                          </div>
                        </div>

                        {/* Gate Check-In Status Detail */}
                        <div className="mt-3 pt-3 border-t border-stone-800 flex justify-between items-center text-xs">
                          <span className="text-stone-400 uppercase">Gate Entry:</span>
                          {activeParticipant.checkedIn ? (
                            <span className="text-green-400 font-bold flex items-center gap-1.5">
                              <CheckCircle size={14} /> Verified at {formatCheckInDisplayTime(activeParticipant.checkedInAt)}
                            </span>
                          ) : (
                            <span className="text-yellow-400 font-bold">
                              ⏳ Pending Check-In at Range Desk
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scoring Dossier */}
                      <div className="bg-stone-900/60 border border-amber-700/40 rounded p-5">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Target size={16} /> Shooting Performance Dossier
                        </div>

                        {hasActiveScores && activeParticipantStats ? (
                          <div className="space-y-4">
                            {/* Score Metrics Summary */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="bg-stone-950 p-3 rounded border border-stone-800">
                                <span className="text-[10px] text-stone-500 uppercase block mb-1">Total Score</span>
                                <span className="text-xl font-black text-amber-500">
                                  {activeParticipantStats.totalScore.toFixed(1)}
                                </span>
                              </div>
                              <div className="bg-stone-950 p-3 rounded border border-stone-800">
                                <span className="text-[10px] text-stone-500 uppercase block mb-1">Total 10s</span>
                                <span className="text-xl font-black text-amber-200">
                                  {activeParticipantStats.scoreCounts[10] || 0}
                                </span>
                              </div>
                              <div className="bg-stone-950 p-3 rounded border border-stone-800">
                                <span className="text-[10px] text-stone-500 uppercase block mb-1">Penalties</span>
                                <span className="text-xl font-black text-red-400">
                                  {activeParticipantStats.totalPenalty > 0 ? `-${activeParticipantStats.totalPenalty}` : '0'}
                                </span>
                              </div>
                            </div>

                            {/* Scorecard Rounds Grid */}
                            <div className="space-y-2">
                              {(activeParticipant.scorecards || []).map((card, cIdx) => {
                                const cardTotal = (card.scores || []).reduce((a, b) => a + (parseFloat(b) || 0), 0) - (parseFloat(card.penalty) || 0);
                                return (
                                  <div key={cIdx} className="bg-stone-950 p-3 rounded border border-stone-800 text-xs">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
                                        Round #{cIdx + 1} {card.isDQ && <span className="text-red-500 font-bold">(DISQUALIFIED)</span>}
                                      </span>
                                      <span className="font-mono font-bold text-amber-100">
                                        Subtotal: {cardTotal.toFixed(1)} pts
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center font-mono">
                                      {Array(10).fill(0).map((_, shotIdx) => (
                                        <div key={shotIdx} className="bg-stone-900 border border-stone-700 py-1 rounded text-[11px] text-amber-200">
                                          {card.scores && card.scores[shotIdx] !== '' && card.scores[shotIdx] !== undefined ? card.scores[shotIdx] : '-'}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-stone-950 p-6 rounded border border-stone-800 text-center">
                            <Crosshair size={32} className="mx-auto mb-2 text-stone-600 opacity-60" />
                            <div className="text-sm font-bold text-stone-300">Scores Not Available Yet</div>
                            <p className="text-xs text-stone-500 mt-1">
                              Your 10-shot scorecard will be officially entered by the Range Officer after completing your shooting duty.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Pass Footer Actions */}
                  <div className="bg-stone-950 p-4 border-t-2 border-amber-700/60 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div className="text-stone-400">
                      Registered Email: <span className="text-amber-200 font-mono">{activeParticipant.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="bg-stone-800 hover:bg-stone-700 text-amber-100 px-4 py-2 rounded font-bold border border-amber-700/50 flex items-center gap-1.5 transition"
                      >
                        <Download size={14} /> Print / Save Pass
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD VIEW */}
        {view === 'leaderboard' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b-4 border-amber-700 pb-4">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-4"><Medal className="text-amber-500" size={36} /> Merit List</h2>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Real-Time Competition Standings & Qualification Scores</p>
              </div>
              <div className="w-full md:w-auto flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    className="bg-stone-800 border-2 border-amber-700/50 rounded-sm pl-9 pr-4 py-2 text-amber-100 w-full outline-none focus:border-amber-500 text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* LEADERBOARD FILTERS & COMPETITOR COUNT */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <div className="flex bg-stone-800 p-1 rounded-sm border border-amber-700/40">
                  {SHOOTING_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLbCategory(cat)}
                      className={`px-5 py-2 rounded-sm text-xs font-bold transition flex items-center gap-2 ${lbCategory === cat ? 'bg-amber-700 text-white shadow' : 'text-stone-400 hover:text-amber-100'}`}
                    >
                      {cat === 'Air Rifle' ? <Crosshair size={14} /> : <Target size={14} />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-amber-400/80 font-mono bg-stone-900 px-3 py-1.5 rounded border border-stone-800">
                Active Pool: <span className="font-bold text-amber-300">{sortedParticipants.length}</span> Competitors
              </div>
            </div>

            <div className="bg-stone-800/80 rounded-sm border-2 border-amber-700 overflow-x-auto shadow-2xl">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead className="bg-stone-900 text-amber-200/60 text-xs tracking-widest border-b-2 border-amber-700">
                  <tr>
                    <th className="p-4 text-center w-16">Rank</th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4 text-center">Rounds</th>
                    <th className="p-4 text-center">Total 10s</th>
                    <th className="p-4 text-center text-red-400">Penalty</th>
                    <th className="p-4 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-amber-700/20 text-sm">
                  {sortedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-500 italic">
                        No {lbCategory} participants found {searchTerm ? `matching "${searchTerm}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    sortedParticipants.map((p, idx) => {
                      const stats = calculateStats(p);
                      const validCards = (p.scorecards || []).filter(c => !c.isDQ).length;
                      const isPodium = idx < 3;
                      return (
                        <tr key={p.id} className={`hover:bg-amber-900/20 transition ${idx === 0 ? 'bg-amber-950/20' : idx === 1 ? 'bg-stone-900/40' : idx === 2 ? 'bg-amber-950/10' : ''}`}>
                          <td className="p-4 text-center font-black text-amber-500 text-base">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-amber-100 flex items-center gap-2">
                              {p.name}
                              {isPodium && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded uppercase font-normal">
                                  Podium
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-amber-200/60">{p.gender}{p.category ? ` · ${p.category}` : ''}</div>
                          </td>
                          <td className="p-4 text-center text-stone-400 text-xs">
                            {validCards} Active {p.scorecards?.length > validCards && `(+${p.scorecards.length - validCards} DQ)`}
                          </td>
                          <td className="p-4 text-center text-amber-200/80 font-bold">
                            {stats.scoreCounts[10] || 0}
                          </td>
                          <td className="p-4 text-center text-red-400 font-bold">
                            {stats.totalPenalty > 0 ? `-${stats.totalPenalty}` : '-'}
                          </td>
                          <td className="p-4 text-right font-black text-xl text-amber-500">{p.totalScore.toFixed(1)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN VIEW */}
        {view === 'login' && (
          <div className="flex items-center justify-center py-16">
            <div className="bg-stone-800/90 p-10 rounded-sm border-2 border-red-700 shadow-2xl w-full max-w-md">
              <div className="flex justify-center mb-6 text-red-500"><Shield size={64} /></div>
              <h2 className="text-2xl font-black text-center mb-8 text-red-500 uppercase">Restricted Access</h2>

              {/* Show Error Message Conditionally */}
              {adminLoginError && (
                <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {adminLoginError}
                </div>
              )}

              {/* PRIMARY: GOOGLE LOGIN */}
              <div className="text-center">
                <button
                  onClick={handleAdminGoogleLogin}
                  className="w-full bg-red-800 hover:bg-red-700 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-red-600 flex items-center justify-center gap-3 text-sm shadow-lg"
                >
                  <Mail size={20} />
                  SIGN IN WITH GOOGLE
                </button>
                <p className="text-[10px] text-stone-500 mt-3 uppercase tracking-wide">Authorized Command Personnel Only</p>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN COMMAND CENTER VIEW */}
        {view === 'admin' && isAdminAuthenticated && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-4 border-red-700 pb-6 gap-4">
              <div>
                <h2 className="text-3xl font-black text-red-500 flex items-center gap-4"><Shield size={36} /> Command Center</h2>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Range Operations, Scoring & Gate Entry Desk</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExport} className="px-4 py-2 bg-stone-800 border-2 border-amber-700 rounded-sm text-xs font-bold hover:bg-stone-700 flex gap-2 items-center"><Download size={16} /> Export CSV</button>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-900/50 border-2 border-red-700 text-red-400 rounded-sm text-xs font-bold hover:bg-red-900/80 flex gap-2 items-center"><LogIn size={16} /> Logout</button>
              </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                { id: 'slots', label: 'Duty Slots & Scoring', icon: Clock },
                { id: 'checkin', label: 'QR Check-In', icon: QrCode },
                { id: 'participants', label: 'All Personnel', icon: Users },
                { id: 'access', label: 'Access Control', icon: Lock }
              ].map(tab => (
                <button key={tab.id} onClick={() => { setAdminTab(tab.id); if (tab.id !== 'checkin') stopScanner(); }} className={`px-5 py-3 rounded-sm uppercase text-xs font-bold flex items-center gap-2 border-2 transition whitespace-nowrap ${adminTab === tab.id ? 'bg-amber-700 text-amber-100 border-amber-500' : 'text-amber-200/60 border-transparent bg-stone-800 hover:bg-stone-700'}`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {adminTab === 'slots' && (
              <div className="space-y-6">
                {/* FEEDBACK TOAST */}
                {slotFeedback && (
                  <div className={`p-3 rounded text-xs font-bold flex items-center justify-between border ${slotFeedback.type === 'success' ? 'bg-green-950/80 text-green-300 border-green-500' : 'bg-red-950/80 text-red-300 border-red-500'}`}>
                    <div className="flex items-center gap-2">
                      {slotFeedback.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      <span>{slotFeedback.msg}</span>
                    </div>
                    <button onClick={() => setSlotFeedback(null)} className="text-stone-400 hover:text-white text-xs">✕</button>
                  </div>
                )}

                {/* DATE & CATEGORY FILTER FOR ADMIN VIEW */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-800 p-4 border border-amber-700/30 rounded-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold text-xs uppercase">Date:</span>
                      <div className="flex gap-1.5 bg-stone-900 p-1 rounded border border-stone-700">
                        {EVENT_DATES.map(date => (
                          <button
                            key={date}
                            onClick={() => setAdminViewDate(date)}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${adminViewDate === date ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'}`}
                          >
                            {date}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold text-xs uppercase">Discipline:</span>
                      <div className="flex gap-1.5 bg-stone-900 p-1 rounded border border-stone-700">
                        {['All', ...SHOOTING_CATEGORIES].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setAdminViewCategory(cat)}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${adminViewCategory === cat ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadStandardSchedule}
                    className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded flex items-center gap-2 font-bold shadow-md transition border border-amber-500 uppercase tracking-wider"
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <PlayCircle size={14} />
                    )}
                    {processingAction ? "PROCESSING..." : "LOAD FULL 2-DAY SCHEDULE"}
                  </button>
                </div>

                {/* CREATE NEW SLOT CARD */}
                <div className="bg-stone-800/80 border-2 border-amber-700/40 p-5 rounded-sm shadow-xl">
                  <h4 className="font-bold text-amber-300 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                    <ListPlus size={18} className="text-amber-400" /> Create New Duty Slot
                  </h4>

                  <form onSubmit={handleAddSlot} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Date</label>
                        <select
                          className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                          value={newSlotDate}
                          onChange={e => setNewSlotDate(e.target.value)}
                        >
                          {EVENT_DATES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Discipline</label>
                        <select
                          className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                          value={newSlotCategory}
                          onChange={e => {
                            const cat = e.target.value;
                            setNewSlotCategory(cat);
                            setNewSlotCapacity(getDisciplineCapacity(cat));
                          }}
                        >
                          {SHOOTING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Time (e.g. 09:00 HRS)</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs font-mono"
                          placeholder="09:00 HRS"
                          value={newSlotTime}
                          onChange={e => setNewSlotTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Capacity (Limit)</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs font-mono"
                          value={newSlotCapacity}
                          onChange={e => setNewSlotCapacity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-700/50">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-stone-500 uppercase mr-1">Time Presets:</span>
                        {['08:00 HRS', '09:00 HRS', '10:00 HRS', '11:00 HRS', '13:00 HRS', '14:00 HRS', '15:00 HRS', '16:00 HRS'].map(tPreset => (
                          <button
                            key={tPreset}
                            type="button"
                            onClick={() => setNewSlotTime(tPreset)}
                            className="text-[10px] bg-stone-900 hover:bg-stone-700 text-amber-300/80 hover:text-amber-200 px-2 py-1 rounded border border-stone-700 font-mono transition"
                          >
                            {tPreset}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-500 uppercase mr-1">Discipline Std:</span>
                        <button
                          type="button"
                          onClick={() => setNewSlotCapacity(18)}
                          className={`text-[10px] px-2.5 py-1 rounded border font-mono font-bold transition ${newSlotCapacity === 18 ? 'bg-amber-700 border-amber-500 text-white shadow' : 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'}`}
                        >
                          18 (Rifle)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewSlotCapacity(6)}
                          className={`text-[10px] px-2.5 py-1 rounded border font-mono font-bold transition ${newSlotCapacity === 6 ? 'bg-amber-700 border-amber-500 text-white shadow' : 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'}`}
                        >
                          6 (Pistol)
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 rounded-sm font-bold text-xs transition border border-amber-500 shadow-md uppercase tracking-wider flex items-center justify-center gap-2">
                        <Plus size={16} /> ADD DUTY SLOT TO SCHEDULE
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  {adminSlots.length === 0 && <p className="text-stone-500 text-center italic py-8">No slots for {adminViewDate}. Add one above or load the standard schedule.</p>}
                  {adminSlots.map(slot => {
                    const slotParticipants = participants.filter(p => p.slotId === slot.id);
                    const isExpanded = expandedSlot === slot.id;

                    return (
                      <div key={slot.id} className="bg-stone-800/80 border-2 border-amber-700/50 rounded-sm overflow-hidden">
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}>
                            {isExpanded ? <ChevronUp className="text-amber-500" /> : <ChevronDown className="text-stone-500" />}
                            <div>
                              <span className="text-xs text-amber-500 font-bold block">{slot.date} — {slot.category || 'Legacy'}</span>
                              <div className="font-black text-xl text-amber-100">{slot.time}</div>
                            </div>
                            <div className="text-xs text-amber-200/60 ml-4">{slotParticipants.length} / {slot.capacity} Candidates</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-amber-500 font-bold text-xs tracking-widest">
                              {slotParticipants.length > 0 ? 'ACTIVE' : 'EMPTY'}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id, slotParticipants.length);
                              }}
                              className="text-stone-500 hover:text-red-500 p-2 hover:bg-red-900/20 rounded transition"
                              title="Delete Slot"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t-2 border-amber-700/30 p-4 bg-stone-900/50">
                            {slotParticipants.length === 0 ? (
                              <p className="text-stone-500 italic text-xs">No candidates assigned to this slot.</p>
                            ) : (
                              <div className="space-y-4">
                                {slotParticipants.map(p => {
                                  const isEditing = editingScoreId === p.id;
                                  const pStats = calculateStats(p);
                                  return (
                                    <div key={p.id} className="bg-stone-950 p-4 rounded border border-stone-800">
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                                        <div>
                                          <div className="font-bold text-amber-100">{p.name}</div>
                                          <div className="text-xs text-stone-400">
                                            {p.email} · {p.gender} · Ticket: <span className="text-amber-400 font-mono">{p.ticketId}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <div className="text-xs text-stone-400">Score</div>
                                            <div className="font-bold text-amber-400">{pStats.totalScore.toFixed(1)}</div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setEditingScoreId(isEditing ? null : p.id)}
                                            className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded font-bold transition"
                                          >
                                            {isEditing ? 'Close Scoring' : 'Enter Scores'}
                                          </button>
                                        </div>
                                      </div>

                                      {isEditing && (
                                        <div className="mt-4 pt-4 border-t border-stone-800 space-y-4 animate-in fade-in">
                                          {(p.scorecards || []).map((card, cIdx) => (
                                            <div key={cIdx} className="bg-stone-900 p-3 rounded border border-stone-700 text-xs">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-amber-300">Round #{cIdx + 1}</span>
                                                <label className="flex items-center gap-1 text-red-400 cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={card.isDQ || false}
                                                    onChange={e => handleScoreChange(p.id, cIdx, 'isDQ', e.target.checked)}
                                                  />
                                                  Disqualify
                                                </label>
                                              </div>
                                              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-2">
                                                {Array(10).fill(0).map((_, shotIdx) => (
                                                  <input
                                                    key={shotIdx}
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10.9"
                                                    placeholder={`S${shotIdx + 1}`}
                                                    className="w-full bg-stone-950 border border-stone-700 p-1 text-center text-amber-100 rounded text-xs"
                                                    value={card.scores?.[shotIdx] ?? ''}
                                                    onChange={e => {
                                                      const newScores = [...(card.scores || Array(10).fill(''))];
                                                      newScores[shotIdx] = e.target.value;
                                                      handleScoreChange(p.id, cIdx, 'scores', newScores);
                                                    }}
                                                  />
                                                ))}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-stone-400">Penalty:</span>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  className="w-16 bg-stone-950 border border-stone-700 p-1 text-xs text-red-400 rounded"
                                                  value={card.penalty || ''}
                                                  onChange={e => handleScoreChange(p.id, cIdx, 'penalty', e.target.value)}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleAddScorecard(p.id)}
                                              className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 px-3 py-1.5 rounded font-bold border border-amber-700/50"
                                            >
                                              + Add Round
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveScores(p)}
                                              className="text-xs bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1"
                                            >
                                              <Save size={14} /> Save Official Scores
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR CHECK-IN TAB */}
            {adminTab === 'checkin' && (
              <div className="space-y-6">
                <div className="bg-stone-800/80 border-2 border-amber-700/60 p-5 sm:p-6 rounded-sm shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-amber-700/40">
                    <div>
                      <h3 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase">
                        <QrCode size={22} /> Range Entry QR Check-In Desk
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        Scan candidate event passes or query Ticket ID to confirm gate entry credentials in real-time.
                      </p>
                    </div>

                    {checkInFeedback && (
                      <div className={`text-xs px-3.5 py-2 rounded font-bold flex items-center gap-2 ${checkInFeedback.type === 'success' ? 'bg-green-900/70 text-green-300 border border-green-500' : 'bg-red-900/70 text-red-300 border border-red-500'}`}>
                        {checkInFeedback.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                        {checkInFeedback.text || checkInFeedback.msg}
                      </div>
                    )}
                  </div>

                  <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: CAMERA SCANNER & MANUAL SEARCH (7 cols) */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-stone-900 p-4 rounded border border-amber-700/50 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                            <Camera size={16} /> Live Camera Scanner
                          </span>
                          <div className="flex items-center gap-2">
                            {scannerRunning && (
                              <button
                                type="button"
                                onClick={toggleCameraFacing}
                                className="px-2.5 py-1 text-[11px] bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-amber-700/60 flex items-center gap-1 transition shadow-sm active:scale-95"
                                title="Flip Front / Rear Camera Lens"
                              >
                                <RefreshCw size={11} /> {cameraFacing === 'environment' ? 'Rear Cam' : 'Front Cam'}
                              </button>
                            )}
                            {scannerRunning ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-800">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span> LIVE
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-500 font-mono">STANDBY</span>
                            )}
                          </div>
                        </div>

                        {/* Scanner Target Container */}
                        <div className="w-full bg-stone-950 rounded border-2 border-stone-800 min-h-[260px] flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                          {/* Dedicated empty DOM container for Html5Qrcode - NO REACT CHILDREN */}
                          <div
                            id="admin-qr-reader"
                            className="w-full"
                            style={{ display: scannerRunning ? 'block' : 'none', minHeight: scannerRunning ? '240px' : '0px' }}
                          />

                          {!scannerRunning && (
                            <div className="text-center p-6 text-stone-500">
                              <QrCode size={48} className="mx-auto mb-2 text-amber-500/40" />
                              <p className="text-xs text-stone-400 font-medium">Camera in standby mode.</p>
                              <p className="text-[10px] text-stone-500 mt-1">Tap below to activate rear camera or snap a photo of the QR.</p>
                            </div>
                          )}
                        </div>

                        {/* Scanner Controls */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {!scannerRunning ? (
                            <button
                              type="button"
                              onClick={() => startScanner()}
                              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2 border border-amber-500 shadow-md text-xs tracking-wider uppercase"
                            >
                              <Camera size={16} /> START CAMERA SCANNER
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopScanner}
                              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2 border border-red-600 shadow-md text-xs tracking-wider uppercase"
                            >
                              <XCircle size={16} /> STOP SCANNER
                            </button>
                          )}

                          {/* Fallback: Direct Snap / Upload Photo of QR */}
                          <button
                            type="button"
                            onClick={() => qrFileInputRef.current && qrFileInputRef.current.click()}
                            className="w-full bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold py-3 rounded-sm transition flex items-center justify-center gap-2 border border-amber-700/50 text-xs tracking-wider uppercase"
                          >
                            <ImageIcon size={16} /> SNAP / UPLOAD QR PHOTO
                          </button>
                          <input
                            ref={qrFileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageFileScan}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Manual Lookup Form */}
                      <div className="bg-stone-900 p-4 rounded border border-amber-700/50">
                        <label className="block text-xs font-bold text-amber-200/80 mb-2 uppercase tracking-wider">
                          Manual Token / Ticket ID Search
                        </label>
                        <form onSubmit={handleManualLookup} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter TKT-XXXXXX, Token, or Email..."
                            value={lookupQuery}
                            onChange={e => setLookupQuery(e.target.value)}
                            className="flex-1 bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm text-amber-100 rounded-sm outline-none focus:border-amber-500 font-mono placeholder:text-stone-600"
                          />
                          <button
                            type="submit"
                            className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold rounded-sm border border-amber-600 transition tracking-wider uppercase"
                          >
                            VERIFY
                          </button>
                        </form>
                      </div>

                      {/* Mobile Permission & Usage Guide */}
                      <div className="bg-stone-950/80 p-3.5 rounded border border-stone-800 text-[11px] text-stone-400 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <Smartphone size={13} /> Mobile Camera Usage Tips:
                        </div>
                        <p>• When starting the camera, your mobile browser will ask: <strong className="text-stone-300">"Allow Camera Access?"</strong> ➔ tap <strong>Allow</strong>.</p>
                        <p>• If accessing via Wi-Fi network without HTTPS, use the <strong className="text-amber-300">"Snap / Upload QR Photo"</strong> button which works immediately on all devices without camera permission blocks.</p>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: VERIFICATION RESULT & ACTION (6 cols) */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                        <span>Candidate Gate Dossier</span>
                        {lookupResult && (
                          <button onClick={resetCheckInState} className="text-[10px] text-stone-400 hover:text-amber-300 underline font-normal">
                            Clear Dossier
                          </button>
                        )}
                      </div>

                      {!lookupResult && (
                        <div className="bg-stone-900/60 border-2 border-dashed border-stone-700 rounded p-8 text-center text-stone-500 min-h-[280px] flex flex-col items-center justify-center">
                          <Shield size={44} className="mb-3 opacity-30 text-amber-500" />
                          <p className="text-sm font-bold text-stone-400 uppercase tracking-wider">Awaiting Pass Scan</p>
                          <p className="text-xs text-stone-500 mt-1 max-w-xs">
                            Scan a QR code pass with the camera or query a Ticket ID to load the candidate's gate pass.
                          </p>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'VALID' && (
                        <div className="bg-stone-900 border-2 border-green-500 rounded p-6 shadow-2xl shadow-green-950/50 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-900/60 text-green-400 font-bold text-xs border border-green-500 mb-4">
                            <CheckCircle size={15} /> VALID EVENT PASS · CLEARED FOR ENTRY
                          </div>

                          <div className="space-y-3 mb-6">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Candidate Full Name</span>
                              <span className="text-2xl font-black text-amber-100">{lookupResult.participant.name}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs bg-stone-950 p-3.5 rounded border border-stone-800">
                              <div>
                                <span className="text-stone-400 uppercase block text-[10px]">Category</span>
                                <span className="text-amber-400 font-bold text-sm">{lookupResult.participant.category || 'Air Rifle'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block text-[10px]">Duty Slot</span>
                                <span className="text-amber-200 font-bold text-sm">{lookupResult.participant.slotTime}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block text-[10px]">Mission Date</span>
                                <span className="text-amber-200 font-medium">{lookupResult.participant.slotDate || '26th September'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block text-[10px]">Ticket ID</span>
                                <span className="text-amber-400 font-mono font-bold">{lookupResult.participant.ticketId}</span>
                              </div>
                            </div>

                            <div className="text-xs text-stone-400">
                              Registered Email: <span className="text-stone-300 font-mono">{lookupResult.participant.email}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConfirmCheckIn(lookupResult.participant)}
                            disabled={checkInLoading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-sm transition uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-green-400 shadow-xl shadow-green-900/40 text-sm"
                          >
                            {checkInLoading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            CONFIRM ENTRY CHECK-IN
                          </button>

                          <button
                            onClick={resetCheckInState}
                            className="w-full mt-2.5 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 text-xs font-bold py-2.5 rounded-sm transition uppercase tracking-wider"
                          >
                            Cancel / Scan Next
                          </button>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'ALREADY_CHECKED_IN' && (
                        <div className="bg-stone-900 border-2 border-amber-500 rounded p-6 shadow-xl shadow-amber-950/40 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-900/50 text-amber-400 font-bold text-xs border border-amber-500 mb-4">
                            <AlertTriangle size={14} /> CANDIDATE ALREADY CHECKED IN
                          </div>

                          <div className="space-y-3 mb-6">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Candidate Name</span>
                              <span className="text-xl font-bold text-amber-100">{lookupResult.participant.name}</span>
                            </div>

                            <div className="bg-stone-950 p-3.5 rounded border border-amber-900/50 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Category:</span>
                                <span className="text-amber-400 font-bold">{lookupResult.participant.category || 'Air Rifle'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Duty Slot:</span>
                                <span className="text-amber-200 font-bold">{lookupResult.participant.slotTime} ({lookupResult.participant.slotDate || '26th September'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Ticket ID:</span>
                                <span className="text-amber-400 font-mono font-bold">{lookupResult.participant.ticketId}</span>
                              </div>
                              <div className="flex justify-between border-t border-stone-800 pt-2">
                                <span className="text-stone-400 uppercase">Status:</span>
                                <span className="text-green-400 font-bold">Checked In & Entered Range</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={resetCheckInState}
                            className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-sm transition uppercase tracking-wider text-xs"
                          >
                            Ready for Next Candidate
                          </button>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'INVALID' && (
                        <div className="bg-stone-900 border-2 border-red-500 rounded p-6 shadow-xl shadow-red-950/40 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-900/50 text-red-300 font-bold text-xs border border-red-500 mb-4">
                            <XCircle size={14} /> INVALID / UNRECOGNIZED PASS
                          </div>

                          <p className="text-xs text-stone-300 mb-4">
                            {lookupResult.errorMsg}
                          </p>

                          <button
                            onClick={resetCheckInState}
                            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-sm transition uppercase tracking-wider text-xs"
                          >
                            Scan Another Pass
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ALL PERSONNEL TAB */}
            {adminTab === 'participants' && (
              <div className="bg-stone-800/80 border-2 border-amber-700 rounded-sm overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-amber-700/30 flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-500">TOTAL PERSONNEL: {participants.length}</span>
                  <span className="text-green-400 font-bold">CHECKED IN: {participants.filter(p => p.checkedIn).length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-stone-900 text-stone-400">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Slot</th>
                        <th className="p-3">Gate Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-700">
                      {participants.map(p => (
                        <tr key={p.id} className="hover:bg-stone-750">
                          <td className="p-3 font-bold text-amber-100">{p.name}</td>
                          <td className="p-3 font-mono text-amber-500">{p.ticketId}</td>
                          <td className="p-3 text-amber-200/60">{p.category || 'Legacy'}</td>
                          <td className="p-3 text-stone-400">{p.email}</td>
                          <td className="p-3 text-stone-400">{p.slotDate}</td>
                          <td className="p-3">{p.slotTime}</td>
                          <td className="p-3">
                            {p.checkedIn ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-600">
                                CHECKED IN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-700 text-stone-400">
                                REGISTERED
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteParticipant(p.id, p.slotId)} className="text-red-500 hover:text-white p-1">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ACCESS CONTROL TAB */}
            {adminTab === 'access' && (
              <div className="bg-stone-800/80 border-2 border-amber-700 rounded-sm p-6 shadow-2xl space-y-6">
                <h3 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase">
                  <Lock size={22} /> Whitelist Access Control
                </h3>

                <p className="text-xs text-stone-400 normal-case leading-relaxed mb-4">
                  Manage which email addresses are authorized to register and book shooting slots. Only whitelisted emails can proceed through slot selection.
                </p>

                {/* METHOD 1: Single Email Entry */}
                <div className="bg-stone-900/80 p-5 rounded border border-amber-700/40 space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-800/40 pb-2">
                    <Mail size={16} className="text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Method 1: Add Single Email</h4>
                  </div>
                  <form onSubmit={handleAddAllowedEmail} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="new.candidate@rvce.edu.in"
                      value={newAllowedEmail}
                      onChange={e => setNewAllowedEmail(e.target.value)}
                      className="flex-1 bg-stone-950 border-2 border-stone-700 px-3 py-2.5 text-xs text-amber-100 rounded-sm outline-none focus:border-amber-500 font-mono"
                    />
                    <button className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold rounded-sm transition border border-amber-500 uppercase tracking-wider">
                      <Plus size={14} className="inline mr-1" /> ADD
                    </button>
                  </form>
                </div>

                {/* METHOD 2: Bulk Paste */}
                <div className="bg-stone-900/80 p-5 rounded border border-amber-700/40 space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-800/40 pb-2">
                    <ListPlus size={16} className="text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Method 2: Bulk Paste Emails</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 normal-case">Paste multiple emails separated by new lines, commas, or semicolons.</p>
                  <textarea
                    rows={4}
                    placeholder={"email1@rvce.edu.in\nemail2@rvce.edu.in\nemail3@rvce.edu.in"}
                    value={importEmailsText}
                    onChange={e => setImportEmailsText(e.target.value)}
                    className="w-full bg-stone-950 border-2 border-stone-700 p-3 text-xs text-amber-100 rounded-sm outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    onClick={handleBulkImportEmails}
                    className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold rounded-sm flex items-center gap-2 transition border border-amber-500 uppercase tracking-wider"
                    disabled={processingAction || !importEmailsText.trim()}
                  >
                    <Upload size={14} /> Import Pasted Emails
                  </button>
                </div>

                {/* METHOD 3: File Upload (CSV / Excel) */}
                <div className="bg-stone-900/80 p-5 rounded border border-amber-700/40 space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-800/40 pb-2">
                    <FileSpreadsheet size={16} className="text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Method 3: Upload CSV / Excel File</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 normal-case">
                    Upload a <strong className="text-amber-300">.csv</strong>, <strong className="text-amber-300">.txt</strong>, or <strong className="text-amber-300">.xlsx</strong> file containing email addresses. The system will automatically detect and extract all valid emails from any column.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => emailFileInputRef.current && emailFileInputRef.current.click()}
                      className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-3 text-xs font-bold rounded-sm flex items-center gap-2 transition border border-amber-500 uppercase tracking-wider shadow-md"
                      disabled={processingAction}
                    >
                      {processingAction ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      {processingAction ? 'PROCESSING FILE...' : 'SELECT & UPLOAD FILE'}
                    </button>
                    <span className="text-[10px] text-stone-500 font-mono">.csv / .txt / .xlsx</span>
                  </div>
                  <input
                    ref={emailFileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleFileEmailImport}
                    className="hidden"
                  />
                </div>

                <div className="mt-6 border-t border-stone-700 pt-4">
                  <div className="text-xs text-stone-400 mb-3 uppercase font-bold">
                    Whitelisted Emails ({allowedEmails.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {allowedEmails.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-stone-900 px-3 py-1.5 rounded text-xs">
                        <span className="font-mono text-stone-300">{item.email}</span>
                        <button onClick={() => handleDeleteAllowedEmail(item.id)} className="text-stone-500 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SUCCESS / EVENT PASS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-stone-900 border-2 border-amber-500 rounded-sm p-6 sm:p-8 max-w-lg w-full text-center relative shadow-2xl shadow-amber-900/30 my-8">
            <button onClick={closeSuccessModal} className="absolute top-4 right-4 text-stone-400 hover:text-amber-500 transition">
              <X size={24} />
            </button>

            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
              <CheckCircle size={36} className="text-green-500" />
            </div>

            <div className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">Official Event Pass</div>
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">Mission Confirmed</h3>

            {/* Tactical Pass Card */}
            <div className="bg-stone-950/80 border-2 border-amber-700/60 rounded p-5 text-left mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-700/40 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-bl uppercase tracking-widest border-l border-b border-amber-600/40">
                {lastBookedPass?.category || bookingCategory}
              </div>

              <div className="text-xs text-stone-400 uppercase tracking-wider mb-1">Candidate Name</div>
              <div className="text-lg font-bold text-amber-100 mb-3">{lastBookedPass?.name || 'Registered Candidate'}</div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div>
                  <span className="text-stone-400 uppercase block mb-0.5">Date</span>
                  <span className="text-amber-200 font-bold">{lastBookedPass?.slotDate || bookingDate}</span>
                </div>
                <div>
                  <span className="text-stone-400 uppercase block mb-0.5">Duty Slot</span>
                  <span className="text-amber-200 font-bold">{lastBookedPass?.slotTime || 'Designated Time'}</span>
                </div>
                <div>
                  <span className="text-stone-400 uppercase block mb-0.5">Ticket ID</span>
                  <span className="text-amber-400 font-mono font-bold">{lastBookedPass?.ticketId || lastBookedTicket}</span>
                </div>
                <div>
                  <span className="text-stone-400 uppercase block mb-0.5">Gate Status</span>
                  <span className="text-green-400 font-bold">CONFIRMED</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded flex flex-col items-center justify-center mx-auto w-fit shadow-inner">
                {lastBookedPass?.qrToken ? (
                  <QRCodeSVG
                    value={lastBookedPass.qrToken}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#1c1917"
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[150px] h-[150px] flex items-center justify-center text-xs text-stone-600 font-mono">QR Not Available</div>
                )}
              </div>
              <div className="text-[10px] text-center text-amber-200/50 mt-2 font-mono tracking-widest">
                PASS TOKEN: {lastBookedPass?.qrToken ? `${lastBookedPass.qrToken.substring(0, 8)}...` : 'N/A'}
              </div>
            </div>

            <p className="text-stone-400 mb-6 leading-relaxed text-xs">
              Your slot has been successfully booked. You can now access your full event pass, QR token, and live scores.
            </p>

            <button
              onClick={() => {
                setActiveProfileQuery(lastBookedPass?.email || lastBookedTicket || '');
                setShowSuccessModal(false);
                setView('profile');
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3.5 rounded-sm transition uppercase tracking-widest border-2 border-amber-600 shadow-lg mb-2 flex items-center justify-center gap-2 text-sm"
            >
              <Ticket size={18} /> View Full Event Pass & Dossier
            </button>

            <button onClick={closeSuccessModal} className="w-full bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold py-2.5 rounded-sm transition uppercase tracking-widest text-xs">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* DEBUG FOOTER */}
      <footer className="bg-stone-950 border-t border-stone-800 p-2 text-[10px] text-stone-500 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <span className={`flex items-center gap-1 ${auth.currentUser ? 'text-green-500' : 'text-red-500'}`}>
            {auth.currentUser ? <Wifi size={10} /> : <WifiOff size={10} />} {auth.currentUser ? 'System Online' : 'Disconnected'}
          </span>
          <span>Slots Loaded: {slots.length}</span>
          <span>Emails Loaded: {allowedEmails.length}</span>
        </div>
        <div>App ID: {appId}</div>
      </footer>
    </div>
  );
}