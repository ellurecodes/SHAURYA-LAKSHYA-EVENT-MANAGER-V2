import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Target, Calendar, Trophy, Users, LogIn, Download, Upload, Save, Trash2, Plus, Search, Menu, X, Clock, CheckCircle, Medal, Crosshair, Shield, FileText, ClipboardList, Radio, Lock, ChevronDown, ChevronUp, UserCheck, FileSpreadsheet, RefreshCw, Wifi, WifiOff, ListPlus, PlayCircle, AlertTriangle, ChevronLeft, ChevronRight, XCircle, Ticket, Mail, Key, Ban, QrCode, Camera } from 'lucide-react';
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
  apiKey: "AIzaSyD8eRxPpVUOiU6pV0u3_I6pCFfOaw5UeaA",
  authDomain: "shaurya-lakshya-event.firebaseapp.com",
  projectId: "shaurya-lakshya-event",
  storageBucket: "shaurya-lakshya-event.firebasestorage.app",
  messagingSenderId: "152287825820",
  appId: "1:152287825820:web:da682c3a540087b3cd0259",
  measurementId: "G-C26DDLDHB9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "shaurya-lakshya-event"; 

// --- SECURITY CONSTANTS ---
const ALLOWED_ADMIN_EMAILS = [
  "nccrvce2025@gmail.com",
  "nccrvceshaurya@gmail.com", 
  "lokakshas.cs24@rvce.edu.in", 
  "shaurya.lakshya.admin@gmail.com"
];

const EVENT_DATES = ["5th Dec", "6th Dec"];
const STANDARD_SCHEDULE = [
  {time: "08:00 HRS", capacity: 60 },
  { time: "09:00 HRS", capacity: 60 },
  { time: "10:00 HRS", capacity: 60 },
  { time: "11:00 HRS", capacity: 60 },
  { time: "13:00 HRS ",capacity:60},
  { time: "14:00 HRS ",capacity:60},
  { time: "15:00 HRS ",capacity:60},
  { time: "16:00 HRS ",capacity:60},

];

const SHOOTING_CATEGORIES = ["Air Rifle", "Pistol"];

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
  const [participants, setParticipants] = useState([]);
  const [slots, setSlots] = useState([]);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [newSlotCapacity, setNewSlotCapacity] = useState(60);
  const [newSlotDate, setNewSlotDate] = useState('5th Dec'); 
  const [newSlotCategory, setNewSlotCategory] = useState('Air Rifle');
  const [adminViewDate, setAdminViewDate] = useState('5th Dec');

  // Leaderboard Filter State
  const [lbCategory, setLbCategory] = useState('Air Rifle');
  const [lbGender, setLbGender] = useState('Male');

  // Booking State
  const [bookingStep, setBookingStep] = useState('verify'); 
  const [participantEmail, setParticipantEmail] = useState('');
  const [bookingForm, setBookingForm] = useState({ 
    name: '', 
    gender: '', // Ensure default is empty string to force selection
    cadetType: 'General', 
    slotId: '' 
    // Removed ticketId from state
  });
  const [bookingCategory, setBookingCategory] = useState('');
  const [bookingDate, setBookingDate] = useState('5th Dec'); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookedTicket, setLastBookedTicket] = useState(null); 
  const [lastBookedPass, setLastBookedPass] = useState(null);

  // Participant Profile / Event Pass State
  const [profileQuery, setProfileQuery] = useState('');
  const [profileSearchError, setProfileSearchError] = useState('');
  const [activeProfileQuery, setActiveProfileQuery] = useState('');

  // Admin QR Check-In State
  const [scannerRunning, setScannerRunning] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- AUTH INIT & PERSISTENCE ---
  useEffect(() => {
    const persistedAdmin = localStorage.getItem('shaurya_admin_session');
    if (persistedAdmin === 'true') {
      setIsAdminAuthenticated(true);
    }

    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Initialization Error:", error);
        setDbError("Authentication Failed. Please refresh the page.");
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setDbError(null);
        if (!u.isAnonymous && u.email && ALLOWED_ADMIN_EMAILS.includes(u.email)) {
          setIsAdminAuthenticated(true);
          localStorage.setItem('shaurya_admin_session', 'true');
        } 
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth Initialization Error:", error);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'participants'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setLoading(false);
    }, (err) => {
      console.error("Participants Sync Error:", err);
      if (err.code === 'permission-denied') setDbError("Database Permission Denied. Check Firebase Rules.");
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slots'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return (a.time || '').localeCompare(b.time || '');
      });
      setSlots(data);
    }, (err) => {
      console.error("Slots Sync Error:", err);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllowedEmails(data);
    }, (err) => {
      console.error("Emails Sync Error:", err);
    });
    return () => unsub();
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
      if (error.code === 'auth/unauthorized-domain') setAdminLoginError("DOMAIN ERROR: Add domain to Firebase Console.");
      else if (error.code === 'auth/popup-closed-by-user') setAdminLoginError("Login Cancelled.");
      else setAdminLoginError("Authentication Failed: " + error.message);
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
    if (allowedEmails.length === 0) {
      alert("System syncing... please wait 2 seconds and try again.");
      return;
    }
    const inputEmail = participantEmail.trim().toLowerCase();
    const found = allowedEmails.find(e => (e.email || '').trim().toLowerCase() === inputEmail);
    if (found) {
      const existing = participants.find(p => p.email.toLowerCase() === inputEmail);
      if (existing) {
        alert("You have already booked a slot! You cannot book again.");
        return;
      }
      setBookingStep('form');
    } else {
      alert("ACCESS DENIED: This email is not on the approved list.");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingCategory) {
      alert("Please select a shooting category (Air Rifle or Pistol).");
      return;
    }
    if (!bookingForm.slotId) {
      alert("Please select a time slot");
      return;
    }
    if (!bookingForm.gender) { 
      alert("Please select a gender from the dropdown.");
      return;
    }

    // Client-side duplicate email check (catches existing records including legacy)
    const inputEmail = participantEmail.trim().toLowerCase();
    const existing = participants.find(p => p.email.toLowerCase() === inputEmail);
    if (existing) {
      alert("Action Aborted: You have already booked a slot.");
      return;
    }

    // Deterministic document ID prevents concurrent duplicate bookings for the same email
    const participantDocId = inputEmail.replace(/\//g, '__');
    const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participantDocId);
    const slotRef = doc(db, 'artifacts', appId, 'public', 'data', 'slots', bookingForm.slotId);
    const ticketBytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(ticketBytes);
    }
    const finalTicketId = "TKT-" + Array.from(ticketBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 6);
    const qrToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''));

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read participant doc (deterministic ID) — detects concurrent duplicates
        const participantSnap = await transaction.get(participantRef);
        if (participantSnap.exists()) {
          throw new Error("DUPLICATE_EMAIL");
        }

        // 2. Read slot doc — authoritative capacity check
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists()) {
          throw new Error("SLOT_NOT_FOUND");
        }
        const slotData = slotSnap.data();

        // 3. Verify category match
        if (slotData.category && slotData.category !== bookingCategory) {
          throw new Error("CATEGORY_MISMATCH");
        }

        // 4. Check capacity using transaction-read value (NOT client-side cache)
        const currentBooked = slotData.booked || 0;
        if (currentBooked >= slotData.capacity) {
          throw new Error("SLOT_FULL");
        }

        // 5. All checks passed — create participant atomically
        transaction.set(participantRef, {
          name: bookingForm.name,
          gender: bookingForm.gender,
          cadetType: 'General',
          category: bookingCategory,
          email: inputEmail,
          slotId: bookingForm.slotId,
          slotTime: slotData.time,
          slotDate: slotData.date || '5th Dec',
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
        });

        // 6. Atomically increment booked count
        transaction.update(slotRef, { booked: currentBooked + 1 });
      });

      setLastBookedTicket(finalTicketId);
      setLastBookedPass({
        name: bookingForm.name,
        gender: bookingForm.gender,
        category: bookingCategory,
        email: inputEmail,
        slotId: bookingForm.slotId,
        slotTime: bookingForm.slotTime || '',
        slotDate: bookingDate,
        ticketId: finalTicketId,
        qrToken: qrToken
      });
      setShowSuccessModal(true);
      setBookingForm({ ...bookingForm, name: '', slotId: '', gender: '' });

    } catch (error) {
      console.error("Booking transaction error:", error);
      if (error.message === "DUPLICATE_EMAIL") {
        alert("Action Aborted: This email has already been used to book a slot.");
      } else if (error.message === "SLOT_FULL") {
        alert("This slot just became full. Please select a different slot.");
      } else if (error.message === "SLOT_NOT_FOUND") {
        alert("This slot no longer exists. Please refresh and try again.");
      } else if (error.message === "CATEGORY_MISMATCH") {
        alert("Category mismatch error. Please refresh and try again.");
      } else {
        alert("Booking failed: " + error.message);
      }
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

  const handleScoreCardUpdate = async (participant, cardIndex, field, value, shotIndex = null) => {
    const newScorecards = [...(participant.scorecards || [])];
    const targetCard = { ...newScorecards[cardIndex] };

    if (field === 'scores' && shotIndex !== null) {
      const newScores = [...targetCard.scores];
      newScores[shotIndex] = value;
      targetCard.scores = newScores;
    } else if (field === 'penalty') {
      targetCard.penalty = value;
    } else if (field === 'isDQ') {
      targetCard.isDQ = value;
    }

    newScorecards[cardIndex] = targetCard;

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const handleAddScorecard = async (participant) => {
    if (!window.confirm("Add a new scorecard for this participant? This implies a new round or re-entry.")) return;
    
    const newScorecards = [
      ...(participant.scorecards || []),
      { 
        id: Date.now(), 
        scores: Array(10).fill(''), 
        penalty: 0, 
        isDQ: false 
      }
    ];

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const handleDeleteScorecard = async (participant, cardIndex) => {
    if (!window.confirm("Delete this scorecard permanently?")) return;
    
    const newScorecards = [...(participant.scorecards || [])];
    newScorecards.splice(cardIndex, 1);

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const addAllowedEmail = async (e) => {
    e.preventDefault();
    if (!newAllowedEmail) return;
    const email = newAllowedEmail.trim();
    if (allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
      setNewAllowedEmail('');
      return; 
    }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
      email: email, addedAt: new Date().toISOString()
    });
    setNewAllowedEmail('');
  };

  const handleBulkEmailImport = async () => {
    const emails = importEmailsText.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
    let count = 0;
    for (const email of emails) {
      if (!allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
          email: email, addedAt: new Date().toISOString()
        });
        count++;
      }
    }
    alert(`Imported ${count} emails.`);
    setImportEmailsText('');
  };

  const removeAllowedEmail = async (id) => {
    if(window.confirm("Revoke access?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_emails', id));
    }
  };

  // --- ADMIN SLOT MANAGEMENT ---
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotTime) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slots'), {
        time: newSlotTime,
        capacity: parseInt(newSlotCapacity) || 60,
        date: newSlotDate,
        category: newSlotCategory,
        booked: 0,
        sortOrder: 999 
      });
      setNewSlotTime('');
    } catch (err) {
      console.error(err);
      alert("Failed to create slot");
    }
  };

  const handleLoadStandardSchedule = async () => {
    let shouldClear = false;
    if (slots.length > 0) {
      const choice = window.confirm("Slots already exist.\n\nClick OK to CLEAR EXISTING SLOTS and load standard schedule for BOTH DAYS and BOTH CATEGORIES (Air Rifle + Pistol).\nClick CANCEL to APPEND to current list.");
      shouldClear = choice;
    }
    setProcessingAction(true);
    try {
      if (shouldClear) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slots'));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', d.id)));
        await Promise.all(deletePromises);
      }
      
      const addPromises = [];
      EVENT_DATES.forEach(date => {
        SHOOTING_CATEGORIES.forEach(category => {
          STANDARD_SCHEDULE.forEach((s, index) => {
            addPromises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slots'), {
              ...s,
              date: date,
              category: category,
              booked: 0,
              sortOrder: index 
            }));
          });
        });
      });
      
      await Promise.all(addPromises);
    } catch (err) {
      console.error("Error loading schedule:", err);
      alert("Error: " + err.message);
    }
    setProcessingAction(false);
  };

  const handleDeleteSlot = async (slotId, currentBooked) => {
    if (currentBooked > 0) {
      if(!window.confirm(`WARNING: This slot has ${currentBooked} candidates assigned. Deleting it will NOT remove the candidates. Continue?`)) return;
    } else {
      if(!window.confirm("Are you sure you want to delete this slot?")) return;
    }
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId));
    } catch (error) {
      console.error("Error deleting slot:", error);
      alert("Failed to delete slot. " + error.message);
    }
  };

  const handleDeleteParticipant = async (id, slotId) => {
    if(!window.confirm("Discharge personnel?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', id));
    if (slotId && slotId !== 'pending') {
      const slot = slots.find(s => s.id === slotId);
      if (slot) {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId), {
          booked: Math.max(0, slot.booked - 1)
        });
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
    a.download = 'Shaurya_Lakshya_Report.csv';
    a.click();
  };

  // --- QR SCANNER & CHECK-IN LOGIC ---
  const startScanner = async () => {
    setCheckInFeedback(null);
    setLookupResult(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("admin-qr-reader");
      }
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          stopScanner();
          handleVerifyToken(decodedText);
        },
        () => {}
      );
      setScannerRunning(true);
    } catch (err) {
      console.error("Camera scanner start error:", err);
      setCheckInFeedback({ type: 'error', text: "Camera access failed: " + (err.message || "Permission denied or camera unavailable.") });
      setScannerRunning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScannerRunning(false);
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
        errorMsg: 'No candidate record matched the provided token or ticket ID.'
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
    handleVerifyToken(lookupQuery);
  };

  const handleConfirmCheckIn = async (participant) => {
    if (!participant || !participant.id) return;
    setCheckInLoading(true);
    setCheckInFeedback(null);

    const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id);

    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(participantRef);
        if (!snap.exists()) {
          throw new Error("PARTICIPANT_NOT_FOUND");
        }
        const currentData = snap.data();
        if (currentData.checkedIn) {
          throw new Error("ALREADY_CHECKED_IN");
        }

        transaction.update(participantRef, {
          checkedIn: true,
          checkedInAt: serverTimestamp(),
          checkedInBy: user?.email || 'Admin Command'
        });
      });

      const updatedParticipant = {
        ...participant,
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: user?.email || 'Admin Command'
      };

      setLookupResult({
        status: 'ALREADY_CHECKED_IN',
        participant: updatedParticipant
      });

      setCheckInFeedback({
        type: 'success',
        text: `Check-in confirmed for ${participant.name} (${participant.category || 'Legacy'})!`
      });

    } catch (err) {
      console.error("Check-in error:", err);
      if (err.message === "ALREADY_CHECKED_IN") {
        setCheckInFeedback({ type: 'error', text: "Candidate was already checked in." });
      } else {
        setCheckInFeedback({ type: 'error', text: "Check-in failed: " + err.message });
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const resetCheckInState = () => {
    setLookupResult(null);
    setLookupQuery('');
    setCheckInFeedback(null);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // --- RENDER HELPERS ---
  const sortedParticipants = useMemo(() => {
    return participants
      .filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        p.gender === lbGender && 
        p.category === lbCategory
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
  }, [participants, searchTerm, lbGender, lbCategory]);

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
    if (!activeParticipant || !activeParticipant.category || !activeParticipant.gender) return null;
    
    // Filter candidates in same category and gender (exact match with leaderboard logic)
    const pool = participants
      .filter(p => p.category === activeParticipant.category && p.gender === activeParticipant.gender)
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
      category: activeParticipant.category,
      gender: activeParticipant.gender
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

  const bookingSlots = slots.filter(s => s.date === bookingDate && bookingCategory && s.category === bookingCategory);
  const adminSlots = slots.filter(s => s.date === adminViewDate);

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
                <img src="image_e3ad1e.png" alt="8th Mile" className="h-11 w-11 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-transform group-hover:scale-105" />
              </div>
              <div className="border-l-2 border-amber-700/60 h-10 mx-2 hidden md:block"></div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-xl md:text-2xl tracking-widest text-amber-500 drop-shadow-sm">SHAURYA<span className="text-red-600">-</span>LAKSHYA</span>
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
              <button 
                onClick={() => setView(isAdminAuthenticated ? 'admin' : 'login')} 
                className={`px-4 py-2 rounded text-xs font-bold tracking-wider uppercase border transition-all ${view === 'admin' || view === 'login' ? 'border-red-500 bg-red-950/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-900/80 hover:bg-stone-800'}`}>
                {isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                aria-label="Toggle navigation menu"
                className="text-amber-400 hover:text-amber-100 p-2.5 border border-amber-700/60 bg-stone-800/90 rounded transition active:scale-95">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-stone-900/95 backdrop-blur-md border-b-2 border-amber-700/80 px-4 py-3 space-y-2 shadow-2xl animate-in fade-in">
             <button onClick={() => {setView('home'); setMenuOpen(false)}} className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${view === 'home' ? 'bg-amber-500/20 text-amber-400 border-l-4 border-amber-500' : 'text-stone-300 hover:bg-stone-800'}`}>Event Info</button>
             <button onClick={() => {setView('booking'); setMenuOpen(false)}} className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${view === 'booking' ? 'bg-amber-500/20 text-amber-400 border-l-4 border-amber-500' : 'text-stone-300 hover:bg-stone-800'}`}>Slot Selection</button>
             <button onClick={() => {setView('profile'); setMenuOpen(false)}} className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${view === 'profile' ? 'bg-amber-500/20 text-amber-400 border-l-4 border-amber-500' : 'text-stone-300 hover:bg-stone-800'}`}>Event Pass</button>
             <button onClick={() => {setView('leaderboard'); setMenuOpen(false)}} className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${view === 'leaderboard' ? 'bg-amber-500/20 text-amber-400 border-l-4 border-amber-500' : 'text-stone-300 hover:bg-stone-800'}`}>Leaderboard</button>
             <button onClick={() => {setView(isAdminAuthenticated ? 'admin' : 'login'); setMenuOpen(false)}} className={`block w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${view === 'admin' || view === 'login' ? 'bg-red-950/40 text-red-400 border-l-4 border-red-500' : 'text-red-400 hover:bg-stone-800'}`}>
               {isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}
             </button>
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
                  SHAURYA<span className="text-stone-700">-</span>LAKSHYA
                </h1>

                {/* LAYER 2: Foreground Revealed Title (Animated with CSS Keyframes) */}
                <h1 
                  className="animate-title-reveal text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_5px_12px_rgba(0,0,0,0.9)] absolute inset-0 flex items-center justify-center whitespace-nowrap"
                >
                  SHAURYA<span className="text-red-600">-</span>LAKSHYA
                </h1>

                {/* LAYER 3: Glowing Bullet Projectile Tracer (Animated with CSS Keyframes) */}
                <div
                  className="animate-bullet-shoot absolute top-1/2 -translate-y-1/2 pointer-events-none z-30"
                >
                  {/* Glowing Bullet Projectile with tip anchored at left percentage */}
                  <div className="relative flex items-center -translate-x-full">
                    {/* High-speed glowing tracer tail */}
                    <div 
                      className="h-[3px] rounded-l-full" 
                      style={{
                        width: '56px',
                        background: 'linear-gradient(to left, rgba(254, 240, 138, 0.95), rgba(245, 158, 11, 0.7), rgba(220, 38, 38, 0.3), transparent)'
                      }}
                    />
                    {/* Projectile Core */}
                    <div 
                      className="w-3 h-2 rounded-r-full bg-amber-100 shadow-[0_0_14px_4px_rgba(251,191,36,0.9),0_0_24px_8px_rgba(245,158,11,0.6)]"
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
                  <Ticket size={16}/> RETRIEVE PASS
                </button>
                <button 
                  onClick={() => setView('leaderboard')} 
                  className="bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold px-6 py-3.5 rounded-sm transition border border-stone-700 flex items-center gap-2 text-sm tracking-wider"
                >
                  <Trophy size={16}/> LIVE SCORES
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
                  <ChevronLeft size={20}/>
                </button>
                <button 
                  onClick={nextSlide}
                  aria-label="Next Weapon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-amber-400 border border-amber-700/50 transition">
                  <ChevronRight size={20}/>
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
                       <Shield size={36} className="text-amber-500"/>
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
                     <Key size={16}/> VERIFY ACCESS & PROCEED
                   </button>
                </form>
              )}

              {/* Step 2: Booking Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="flex items-center justify-between text-green-400 text-xs font-bold bg-green-950/40 border border-green-600/50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500"/> 
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

                  {/* 1. DATE SELECTION */}
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">1. Select Mission Date</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-900 p-1.5 rounded-sm border border-amber-700/50">
                      {EVENT_DATES.map(date => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => { setBookingDate(date); setBookingForm({...bookingForm, slotId: ''}); }}
                          className={`py-2.5 text-xs font-bold rounded-sm transition uppercase tracking-wider flex items-center justify-center gap-2 ${bookingDate === date ? 'bg-amber-700 text-white shadow' : 'text-stone-400 hover:text-amber-100'}`}
                        >
                          <Calendar size={14}/> {date}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. SHOOTING CATEGORY SELECTION */}
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">2. Shooting Discipline & Category</label>
                    <div className="grid grid-cols-2 gap-3">
                      {SHOOTING_CATEGORIES.map(cat => {
                        const isSelected = bookingCategory === cat;
                        return (
                          <div
                            key={cat}
                            onClick={() => { setBookingCategory(cat); setBookingForm({...bookingForm, slotId: ''}); }}
                            className={`cursor-pointer p-4 rounded-sm border-2 transition text-left flex flex-col justify-between ${isSelected ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-900/30' : 'border-stone-700 bg-stone-900 hover:border-amber-700/50'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              {cat === 'Air Rifle' ? <Crosshair size={20} className={isSelected ? 'text-amber-400' : 'text-stone-500'}/> : <Target size={20} className={isSelected ? 'text-amber-400' : 'text-stone-500'}/>}
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-stone-600'}`}>
                                {isSelected && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
                              </span>
                            </div>
                            <div>
                              <div className={`font-black text-sm uppercase ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>{cat}</div>
                              <div className="text-[10px] text-stone-400 normal-case mt-0.5">
                                {cat === 'Air Rifle' ? '10m Precision PCP Target Rifle' : '10m Match Precision Air Pistol'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!bookingCategory && (
                      <p className="text-xs text-amber-500/80 mt-2 normal-case flex items-center gap-1">
                        ⚠️ Please select either Air Rifle or Pistol to view available duty slots.
                      </p>
                    )}
                  </div>

                  {/* 3. PARTICIPANT DETAILS */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Candidate Full Name</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="John Doe"
                        className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3 text-amber-100 outline-none focus:border-amber-500 text-sm"
                        value={bookingForm.name} 
                        onChange={e => setBookingForm({...bookingForm, name: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">Division (Gender)</label>
                      <select 
                        required 
                        className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3 text-amber-100 outline-none focus:border-amber-500 text-sm"
                        value={bookingForm.gender} 
                        onChange={e => setBookingForm({...bookingForm, gender: e.target.value})}
                      >
                        <option value="" disabled>Select Division</option>
                        <option value="Male">Male Division</option>
                        <option value="Female">Female Division</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. TIME SLOT SELECTION */}
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 uppercase mb-2">
                      3. Select Time Slot {bookingCategory ? `(${bookingCategory} · ${bookingDate})` : `(${bookingDate})`}
                    </label>
                    {bookingSlots.length === 0 ? (
                      <div className="text-amber-400 bg-stone-950 p-5 rounded border border-amber-900/50 text-xs text-center">
                        <p className="font-bold mb-1">
                          {!bookingCategory ? '⬆️ Select a shooting category above to populate slots' : `⚠️ No Slots Available for ${bookingCategory} on ${bookingDate}`}
                        </p>
                        <p className="text-stone-400 normal-case">
                          {bookingCategory ? 'Check back later or try the other event date.' : 'Duty slots are scheduled independently per discipline.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {bookingSlots.map(slot => {
                          const isFull = (slot.booked || 0) >= slot.capacity;
                          const isSelected = bookingForm.slotId === slot.id;
                          const remaining = slot.capacity - (slot.booked || 0);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isFull}
                              onClick={() => !isFull && setBookingForm({...bookingForm, slotId: slot.id})}
                              className={`p-3 rounded-sm border-2 text-center transition flex flex-col items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-950/60 shadow-lg shadow-amber-900/30' : 'border-stone-700 bg-stone-900 hover:border-amber-700/50'} ${isFull ? 'opacity-40 cursor-not-allowed border-red-950 bg-stone-950 text-stone-500' : ''}`}
                            >
                              <div className={`font-black text-sm ${isSelected ? 'text-amber-300' : 'text-amber-100'}`}>{slot.time}</div>
                              <div className="mt-1">
                                {isFull ? (
                                  <span className="text-[10px] font-bold text-red-400 uppercase">FULL</span>
                                ) : (
                                  <span className={`text-[10px] font-bold ${remaining < 10 ? 'text-amber-400' : 'text-green-400'}`}>
                                    ✓ {remaining} Open
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
                    disabled={!bookingCategory || !bookingForm.slotId || !bookingForm.name || !bookingForm.gender}
                  >
                    <CheckCircle size={18}/> CONFIRM REGISTRATION & ISSUE PASS
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
                  <Search size={14}/> Query Another Pass
                </button>
              )}
            </div>

            {/* If no active participant loaded -> Search Form */}
            {!activeParticipant && (
              <div className="bg-stone-800/80 rounded-sm p-8 border-2 border-amber-700 shadow-2xl max-w-xl mx-auto text-center">
                <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-600">
                  <Shield size={32} className="text-amber-500"/>
                </div>
                <h3 className="text-xl font-black text-amber-100 mb-2 uppercase">Access Event Pass</h3>
                <p className="text-xs text-stone-400 mb-6 leading-relaxed">
                  Enter your registered email address or Ticket ID (e.g. <span className="font-mono text-amber-300">TKT-XXXXXX</span>) to retrieve your official pass, QR token, duty slot, and live score dossier.
                </p>

                {profileSearchError && (
                  <div className="mb-4 bg-red-900/40 border border-red-500 text-red-200 px-4 py-2.5 rounded text-xs flex items-center gap-2 text-left">
                    <AlertTriangle size={16} className="shrink-0 text-red-400"/> {profileSearchError}
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
                    <Search size={16}/> Retrieve Event Pass
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
                      <Shield size={18} className="text-amber-500"/>
                      SHAURYA-LAKSHYA 2025 · OFFICIAL EVENT PASS
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-stone-950 text-xs font-black px-3 py-1 rounded uppercase tracking-wider">
                        {activeParticipant.category || 'Legacy'}
                      </span>
                      {activeParticipant.checkedIn ? (
                        <span className="bg-green-900/60 text-green-400 border border-green-500 text-xs font-bold px-3 py-1 rounded uppercase flex items-center gap-1">
                          <CheckCircle size={12}/> CHECKED IN
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
                          {activeParticipant.gender} Division · {activeParticipant.cadetType || 'General'}
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
                              <AlertTriangle size={24} className="mb-2 text-stone-500"/>
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
                          <Clock size={16}/> Assigned Duty Schedule
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-stone-950 p-3 rounded border border-stone-800">
                            <span className="text-stone-500 uppercase block mb-0.5">Date</span>
                            <span className="text-amber-100 font-bold text-sm">{activeParticipant.slotDate || '5th Dec'}</span>
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
                              <CheckCircle size={14}/> Verified at {formatCheckInDisplayTime(activeParticipant.checkedInAt)}
                            </span>
                          ) : (
                            <span className="text-yellow-400 font-bold">
                              ⏳ Pending Check-In at Range Desk
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Division Standing & Ranking */}
                      <div className="bg-stone-900/60 border border-amber-700/40 rounded p-5">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Trophy size={16}/> Category Standing & Rank
                        </div>
                        
                        {activeParticipantRank ? (
                          <div className="flex items-center justify-between bg-stone-950 p-4 rounded border border-amber-900/50">
                            <div>
                              <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                                {activeParticipantRank.rank === 1 ? '🥇 Rank 1' : activeParticipantRank.rank === 2 ? '🥈 Rank 2' : activeParticipantRank.rank === 3 ? '🥉 Rank 3' : `#${activeParticipantRank.rank}`}
                                <span className="text-xs font-normal text-stone-400">of {activeParticipantRank.total} candidates</span>
                              </div>
                              <div className="text-xs text-amber-200/70 mt-1">
                                {activeParticipantRank.category} · {activeParticipantRank.gender} Division
                              </div>
                            </div>
                            <button 
                              onClick={() => { setLbCategory(activeParticipant.category); setLbGender(activeParticipant.gender); setView('leaderboard'); }}
                              className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase underline"
                            >
                              View Merit List
                            </button>
                          </div>
                        ) : (
                          <div className="bg-stone-950 p-4 rounded border border-stone-800 text-xs text-stone-400 italic">
                            Rank will be computed once category matches active competition pool.
                          </div>
                        )}
                      </div>

                      {/* Scoring Dossier */}
                      <div className="bg-stone-900/60 border border-amber-700/40 rounded p-5">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Target size={16}/> Shooting Performance Dossier
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
                                    <div className="grid grid-cols-10 gap-1 text-center font-mono">
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
                            <Crosshair size={32} className="mx-auto mb-2 text-stone-600 opacity-60"/>
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
                        <Download size={14}/> Print / Save Pass
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
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
                      {cat === 'Air Rifle' ? <Crosshair size={14}/> : <Target size={14}/>}
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Gender Filter */}
                <div className="flex bg-stone-800 p-1 rounded-sm border border-amber-700/40">
                  {['Male', 'Female'].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setLbGender(g)}
                      className={`px-5 py-2 rounded-sm text-xs font-bold transition ${lbGender === g ? 'bg-amber-700 text-white shadow' : 'text-stone-400 hover:text-amber-100'}`}
                    >
                      {g} Division
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
                          No {lbCategory} participants found {searchTerm ? `matching "${searchTerm}"` : `in ${lbGender} division`}.
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
              <div className="flex justify-center mb-6 text-red-500"><Shield size={64}/></div>
              <h2 className="text-2xl font-black text-center mb-8 text-red-500 uppercase">Restricted Access</h2>
              
              {/* Show Error Message Conditionally */}
              {adminLoginError && (
                <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle size={16}/> {adminLoginError}
                </div>
              )}

              {/* PRIMARY: GOOGLE LOGIN */}
              <div className="text-center mb-8">
                <button 
                  onClick={handleAdminGoogleLogin}
                  className="w-full bg-red-800 hover:bg-red-700 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-red-600 flex items-center justify-center gap-3 text-sm"
                >
                  <Mail size={20}/>
                  SIGN IN WITH GOOGLE
                </button>
                <p className="text-[10px] text-stone-500 mt-2 uppercase tracking-wide">Authorized Personnel Only</p>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN COMMAND CENTER VIEW */}
        {view === 'admin' && isAdminAuthenticated && user && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-4 border-red-700 pb-6 gap-4">
              <div>
                <h2 className="text-3xl font-black text-red-500 flex items-center gap-4"><Shield size={36}/> Command Center</h2>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Range Operations, Scoring & Gate Entry Desk</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={handleExport} className="px-4 py-2 bg-stone-800 border-2 border-amber-700 rounded-sm text-xs font-bold hover:bg-stone-700 flex gap-2 items-center"><Download size={16}/> Export CSV</button>
                 <button onClick={handleLogout} className="px-4 py-2 bg-red-900/50 border-2 border-red-700 text-red-400 rounded-sm text-xs font-bold hover:bg-red-900/80 flex gap-2 items-center"><LogIn size={16}/> Logout</button>
              </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                {id: 'slots', label: 'Duty Slots & Scoring', icon: Clock},
                {id: 'checkin', label: 'QR Check-In', icon: QrCode},
                {id: 'participants', label: 'All Personnel', icon: Users},
                {id: 'access', label: 'Access Control', icon: Lock}
              ].map(tab => (
                <button key={tab.id} onClick={() => { setAdminTab(tab.id); if (tab.id !== 'checkin') stopScanner(); }} className={`px-5 py-3 rounded-sm uppercase text-xs font-bold flex items-center gap-2 border-2 transition whitespace-nowrap ${adminTab === tab.id ? 'bg-amber-700 text-amber-100 border-amber-500' : 'text-amber-200/60 border-transparent bg-stone-800 hover:bg-stone-700'}`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {adminTab === 'slots' && (
              <div className="space-y-6">
                 {/* DATE FILTER FOR ADMIN VIEW */}
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-stone-800 p-4 border border-amber-700/30 rounded-sm">
                   <div className="flex items-center gap-3">
                     <span className="text-amber-500 font-bold text-xs uppercase">Manage Schedule For:</span>
                     <div className="flex gap-2">
                       {EVENT_DATES.map(date => (
                         <button
                           key={date}
                           onClick={() => setAdminViewDate(date)}
                           className={`px-4 py-1.5 rounded text-xs font-bold transition ${adminViewDate === date ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400'}`}
                         >
                           {date}
                         </button>
                       ))}
                     </div>
                   </div>

                   <button 
                     type="button"
                     onClick={handleLoadStandardSchedule}
                     className="text-xs bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold shadow-md"
                     disabled={processingAction}
                   >
                     {processingAction ? (
                       <RefreshCw size={12} className="animate-spin"/>
                     ) : (
                       <PlayCircle size={12}/> 
                     )}
                     {processingAction ? "PROCESSING..." : "LOAD STANDARD SCHEDULE (ALL DAYS + CATEGORIES)"}
                   </button>
                 </div>

                 <div className="bg-stone-800/50 border-2 border-amber-700/30 p-6 rounded-sm">
                    <h4 className="font-bold text-amber-100 flex items-center gap-2 mb-4 text-sm"><ListPlus size={18}/> Create New Duty Slot</h4>
                    <form onSubmit={handleAddSlot} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                       <div>
                         <label className="block text-xs text-stone-400 mb-1">Date</label>
                         <select 
                           className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                           value={newSlotDate}
                           onChange={e => setNewSlotDate(e.target.value)}
                         >
                           {EVENT_DATES.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="block text-xs text-stone-400 mb-1">Category</label>
                         <select 
                           className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                           value={newSlotCategory}
                           onChange={e => setNewSlotCategory(e.target.value)}
                         >
                           {SHOOTING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="block text-xs text-stone-400 mb-1">Time (e.g. 08:30 HRS)</label>
                         <input 
                           type="text" 
                           className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                           placeholder="08:30 HRS"
                           value={newSlotTime}
                           onChange={e => setNewSlotTime(e.target.value)}
                         />
                       </div>
                       <div>
                         <label className="block text-xs text-stone-400 mb-1">Capacity</label>
                         <input 
                           type="number" 
                           className="w-full bg-stone-900 border border-stone-600 p-2.5 rounded-sm text-white outline-none focus:border-amber-500 text-xs"
                           value={newSlotCapacity}
                           onChange={e => setNewSlotCapacity(e.target.value)}
                         />
                       </div>
                       <div>
                         <button className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2.5 rounded-sm font-bold text-xs h-[38px] transition">
                           ADD SLOT
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
                               {isExpanded ? <ChevronUp className="text-amber-500"/> : <ChevronDown className="text-stone-500"/>}
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
                                <Trash2 size={18}/>
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
                                                     placeholder={`S${shotIdx+1}`}
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
                                               <Save size={14}/> Save Official Scores
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
                <div className="bg-stone-800/80 border-2 border-amber-700/60 p-6 rounded-sm shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-amber-700/40">
                    <div>
                      <h3 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase">
                        <QrCode size={22}/> Range Entry QR Check-In Desk
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        Scan candidate event pass QR token or enter Ticket ID to verify security credentials and confirm gate check-in.
                      </p>
                    </div>

                    {checkInFeedback && (
                      <div className={`text-xs px-3 py-1.5 rounded font-bold flex items-center gap-2 ${checkInFeedback.type === 'success' ? 'bg-green-900/60 text-green-300 border border-green-500' : 'bg-red-900/60 text-red-300 border border-red-500'}`}>
                        {checkInFeedback.type === 'success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                        {checkInFeedback.msg}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* LEFT COLUMN: CAMERA SCANNER & MANUAL SEARCH */}
                    <div className="space-y-6">
                      <div className="bg-stone-900 p-4 rounded border border-amber-700/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                            <Camera size={16}/> Camera Scanner
                          </span>
                          {scannerRunning && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Scanner Target Container */}
                        <div id="admin-qr-reader" className="w-full bg-black/70 rounded border border-stone-700 min-h-[240px] flex items-center justify-center overflow-hidden relative">
                          {!scannerRunning && (
                            <div className="text-center p-6 text-stone-500">
                              <QrCode size={48} className="mx-auto mb-2 opacity-40"/>
                              <p className="text-xs">Camera standby. Click Start Scanner below to activate lens.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          {!scannerRunning ? (
                            <button 
                              type="button" 
                              onClick={startScanner} 
                              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3.5 rounded-sm transition flex items-center justify-center gap-2 border border-amber-500 shadow-md text-sm"
                            >
                              <Camera size={18}/> START CAMERA SCANNER
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={stopScanner} 
                              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3.5 rounded-sm transition flex items-center justify-center gap-2 border border-red-600 shadow-md text-sm"
                            >
                              <XCircle size={18}/> STOP SCANNER
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Manual Lookup Form */}
                      <div className="bg-stone-900 p-4 rounded border border-amber-700/50">
                        <label className="block text-xs font-bold text-amber-200/80 mb-2 uppercase tracking-wider">
                          Manual Token / Ticket Search
                        </label>
                        <form onSubmit={handleManualLookup} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter Token, TKT-XXXXXX, or email..." 
                            value={lookupQuery} 
                            onChange={e => setLookupQuery(e.target.value)} 
                            className="flex-1 bg-stone-950 border border-stone-700 px-3 py-2.5 text-sm text-amber-100 rounded-sm outline-none focus:border-amber-500 font-mono"
                          />
                          <button 
                            type="submit" 
                            className="bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold rounded-sm border border-amber-600 transition tracking-wider"
                          >
                            VERIFY
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: VERIFICATION RESULT & ACTION */}
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                        Verification Status & Candidate Dossier
                      </div>

                      {!lookupResult && (
                        <div className="bg-stone-900/60 border-2 border-dashed border-stone-700 rounded p-8 text-center text-stone-500 min-h-[300px] flex flex-col items-center justify-center">
                          <Shield size={40} className="mb-3 opacity-30 text-amber-500"/>
                          <p className="text-sm font-bold text-stone-400">Awaiting Pass Scan</p>
                          <p className="text-xs mt-1">Scan candidate QR pass or query a ticket ID to proceed with check-in.</p>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'VALID' && (
                        <div className="bg-stone-900 border-2 border-green-500 rounded p-6 shadow-xl shadow-green-950/40 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-900/50 text-green-400 font-bold text-xs border border-green-500 mb-4">
                            <CheckCircle size={14}/> VALID EVENT PASS
                          </div>

                          <div className="space-y-3 mb-6">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Candidate Name</span>
                              <span className="text-xl font-bold text-amber-100">{lookupResult.participant.name}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-950 p-3 rounded border border-stone-800">
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Category</span>
                                <span className="text-amber-400 font-bold">{lookupResult.participant.category || 'Legacy'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Gender</span>
                                <span className="text-amber-200">{lookupResult.participant.gender || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Mission Date</span>
                                <span className="text-amber-200">{lookupResult.participant.slotDate || '5th Dec'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Duty Slot</span>
                                <span className="text-amber-200 font-bold">{lookupResult.participant.slotTime}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Ticket ID</span>
                                <span className="text-amber-400 font-mono font-bold">{lookupResult.participant.ticketId}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 uppercase block mb-0.5">Status</span>
                                <span className="text-yellow-400 font-bold">READY FOR ENTRY</span>
                              </div>
                            </div>

                            <div className="text-xs text-stone-400">
                              Email: <span className="text-stone-300">{lookupResult.participant.email}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleConfirmCheckIn(lookupResult.participant)} 
                            disabled={checkInLoading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-sm transition uppercase tracking-widest flex items-center justify-center gap-2 border border-green-400 shadow-lg shadow-green-900/30 text-sm"
                          >
                            {checkInLoading ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                            CONFIRM ENTRY CHECK-IN
                          </button>

                          <button 
                            onClick={resetCheckInState}
                            className="w-full mt-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-bold py-2.5 rounded-sm transition uppercase tracking-wider"
                          >
                            Clear / Scan Next
                          </button>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'ALREADY_CHECKED_IN' && (
                        <div className="bg-stone-900 border-2 border-amber-500 rounded p-6 shadow-xl shadow-amber-950/40 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-900/50 text-amber-400 font-bold text-xs border border-amber-500 mb-4">
                            <AlertTriangle size={14}/> CANDIDATE ALREADY CHECKED IN
                          </div>

                          <div className="space-y-3 mb-6">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Candidate Name</span>
                              <span className="text-xl font-bold text-amber-100">{lookupResult.participant.name}</span>
                            </div>

                            <div className="bg-stone-950 p-3 rounded border border-amber-900/50 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Category:</span>
                                <span className="text-amber-400 font-bold">{lookupResult.participant.category || 'Legacy'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Duty Slot:</span>
                                <span className="text-amber-200">{lookupResult.participant.slotTime} ({lookupResult.participant.slotDate || '5th Dec'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Ticket ID:</span>
                                <span className="text-amber-400 font-mono font-bold">{lookupResult.participant.ticketId}</span>
                              </div>
                              <div className="border-t border-stone-800 pt-2 flex justify-between">
                                <span className="text-stone-400 uppercase">Checked In At:</span>
                                <span className="text-green-400 font-bold">
                                  {formatCheckInDisplayTime(lookupResult.participant.checkedInAt)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-400 uppercase">Verified By:</span>
                                <span className="text-stone-300">{lookupResult.participant.checkedInBy || 'Admin Command'}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={resetCheckInState}
                            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold py-3 rounded-sm transition uppercase tracking-wider border border-stone-600"
                          >
                            CLEAR / SCAN NEXT
                          </button>
                        </div>
                      )}

                      {lookupResult && lookupResult.status === 'INVALID' && (
                        <div className="bg-stone-900 border-2 border-red-500 rounded p-6 shadow-xl shadow-red-950/40 animate-in fade-in">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-900/50 text-red-400 font-bold text-xs border border-red-500 mb-4">
                            <XCircle size={14}/> INVALID PASS / TOKEN NOT FOUND
                          </div>

                          <p className="text-sm text-red-200 mb-2">
                            {lookupResult.errorMsg || "No candidate record found for this token or ticket ID."}
                          </p>
                          <p className="text-xs text-stone-400 font-mono break-all mb-6">
                            Searched: {lookupResult.query}
                          </p>

                          <button 
                            onClick={resetCheckInState}
                            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold py-3 rounded-sm transition uppercase tracking-wider border border-stone-600"
                          >
                            CLEAR & TRY AGAIN
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
                              <Trash2 size={16}/>
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
                  <Lock size={22}/> Whitelist Access Control
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 mb-2 uppercase">Add Single Email</label>
                    <form onSubmit={handleAddAllowedEmail} className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="new.candidate@rvce.edu.in"
                        value={newAllowedEmail} 
                        onChange={e => setNewAllowedEmail(e.target.value)} 
                        className="flex-1 bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-amber-100 rounded-sm outline-none focus:border-amber-500"
                      />
                      <button className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold rounded-sm">
                        ADD
                      </button>
                    </form>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200/80 mb-2 uppercase">Bulk Import Emails (One per line / CSV)</label>
                    <textarea 
                      rows={3}
                      placeholder="email1@rvce.edu.in&#10;email2@rvce.edu.in"
                      value={importEmailsText}
                      onChange={e => setImportEmailsText(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-amber-100 rounded-sm outline-none focus:border-amber-500 font-mono mb-2"
                    />
                    <button 
                      onClick={handleBulkImportEmails} 
                      className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold rounded-sm flex items-center gap-2"
                      disabled={processingAction}
                    >
                      <Upload size={14}/> Bulk Import
                    </button>
                  </div>
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
                          <Trash2 size={14}/>
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
              <Ticket size={18}/> View Full Event Pass & Dossier
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
             {auth.currentUser ? <Wifi size={10}/> : <WifiOff size={10}/>} {auth.currentUser ? 'System Online' : 'Disconnected'}
           </span>
           <span>Slots Loaded: {slots.length}</span>
           <span>Emails Loaded: {allowedEmails.length}</span>
         </div>
         <div>App ID: {appId}</div>
      </footer>
    </div>
  );
}