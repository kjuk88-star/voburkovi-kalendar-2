import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  ShoppingCart,
  LogOut,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Lock,
  Mail,
  Sparkles,
  X
} from 'lucide-react';

// ============================================================================
// 1. TVŮJ FIREBASE CONFIG (již vyplněný)
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCEmBOWYtnLOSjtTByX2DTS9PamtFHJnaU",
  authDomain: "voburkovi-kalendar.firebaseapp.com",
  projectId: "voburkovi-kalendar",
  storageBucket: "voburkovi-kalendar.firebasestorage.app",
  messagingSenderId: "387702969834",
  appId: "1:387702969834:web:39fb996b54851329048e93"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'voburkovi-kalendar';

// ============================================================================
// 2. ZDE VLOŽ SVÉ 3 ÚDAJE Z EMAILJS (z www.emailjs.com)
// ============================================================================
const EMAILJS_SERVICE_ID = "service_8x9a2b";
const EMAILJS_TEMPLATE_ID = "template_3siagoi";
const EMAILJS_PUBLIC_KEY = "XKxcYLYcpnWxlDKsU";

// ============================================================================
// 3. NASTAVENÍ RODINY A FOTOGRAFIÍ
// ============================================================================
const ALLOWED_USERS = {
  'voburka.p@seznam.cz': {
    name: 'Petr',
    role: 'Manžel',
    color: 'bg-blue-600',
    avatar: 'P',
    photoBase: 'Petr'
  },
  'leona.voburkova@seznam.cz': {
    name: 'Lea',
    role: 'Manželka',
    color: 'bg-rose-500',
    avatar: 'L',
    photoBase: 'Lea'
  }
};

const FAMILY_PASSWORD = 'poklop123';

const CATEGORIES = [
  { id: 'rodina', label: 'Celá rodina', photoBase: 'rodina', fallback: 'V', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600' },
  { id: 'petr', label: 'Petr', photoBase: 'Petr', fallback: 'P', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600' },
  { id: 'lea', label: 'Lea', photoBase: 'Lea', fallback: 'L', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  { id: 'patrik', label: 'Patrik', photoBase: 'Patrik', fallback: 'Pa', bg: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
  { id: 'ella', label: 'Ella', photoBase: 'Ella', fallback: 'E', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' }
];

// ============================================================================
// 4. PEVNÉ RODINNÉ UDÁLOSTI (Narozeniny, Výročí, Svátky)
// ============================================================================
const FIXED_ANNUAL_EVENTS = [
  // Narozeniny
  { month: 4, day: 28, type: 'birthday', startYear: 1989, person: 'Petr', category: 'petr' },
  { month: 6, day: 14, type: 'birthday', startYear: 1995, person: 'Lea', category: 'lea' },
  { month: 8, day: 13, type: 'birthday', startYear: 2023, person: 'Patrik', category: 'patrik' },
  { month: 3, day: 25, type: 'birthday', startYear: 2025, person: 'Ella', category: 'ella' },

  // Výročí svatby
  { month: 8, day: 6, type: 'anniversary', startYear: 2021, person: 'Petr & Lea', category: 'rodina' },

  // Svátky (jmeniny)
  { month: 2, day: 19, type: 'nameday', person: 'Patrik', category: 'patrik', note: 'Svátek slaví Patrik!' },
  { month: 2, day: 22, type: 'nameday', person: 'Petr', category: 'petr', note: 'Svátek slaví Petr!' },
  { month: 6, day: 29, type: 'nameday', person: 'Petr (Petr a Pavel)', category: 'petr', note: 'Svátek slaví Petr a Pavel!' },
  { month: 3, day: 7, type: 'nameday', person: 'Ella', category: 'ella', note: 'Svátek slaví Ella!' },
  { month: 3, day: 22, type: 'nameday', person: 'Leona', category: 'lea', note: 'Svátek slaví Leona!' }
  ];

function formatCzechYears(years) {
  if (years === 1) return '1 rok';
  if (years >= 2 && years <= 4) return `${years} roky`;
  return `${years} let`;
}

function getFixedEventsForYear(year) {
  return FIXED_ANNUAL_EVENTS.map((item, idx) => {
    const dateStr = `${year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
    const diff = item.startYear ? year - item.startYear : 0;

    let title = '';
    let note = '';

    if (item.type === 'birthday') {
      title = `🎂 Narozeniny: ${item.person} (${formatCzechYears(diff)})`;
      note = `Narozen(a) ${item.day}. ${item.month}. ${item.startYear} – letos slaví ${formatCzechYears(diff)}!`;
    } else if (item.type === 'anniversary') {
      title = `💍 ${diff}. výročí svatby`;
      note = `Svatba 6. 8. ${item.startYear} – letos slavíte ${formatCzechYears(diff)} spolu!`;
    } else {
      title = `🎉 Svátek: ${item.person}`;
      note = item.note || 'Všechno nejlepší k svátku!';
    }

    return {
      id: `fixed-${year}-${idx}`,
      title,
      date: dateStr,
      time: 'Celý den',
      category: item.category,
      note,
      createdBy: 'Rodinný kalendář',
      isFixed: true
    };
  });
}

const SHOP_CATEGORIES = ['Potraviny', 'Drogerie', 'Děti (Patrik & Ella)', 'Domácnost', 'Ostatní'];

const MONTHS_CZ = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const DAYS_CZ = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

// ============================================================================
// CHYTRÁ KOMPONENTA PRO FOTKY
// ============================================================================
function SmartAvatar({ baseName, fallbackText, bgClass = 'bg-indigo-600', sizeClass = 'w-8 h-8', textClass = 'text-xs' }) {
  const [attempt, setAttempt] = useState(0);

  const candidates = useMemo(() => {
    if (!baseName) return [];
    const lower = baseName.toLowerCase();
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();
    const names = Array.from(new Set([baseName, capitalized, lower]));
    const exts = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG', '.webp'];
    const list = [];
    for (const n of names) {
      for (const e of exts) {
        list.push(`/${n}${e}`);
      }
    }
    return list;
  }, [baseName]);

  if (!baseName || attempt >= candidates.length) {
    return (
      <div className={`${sizeClass} ${bgClass} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white/40 ${textClass}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={candidates[attempt]}
      alt={baseName}
      onError={() => setAttempt((prev) => prev + 1)}
      className={`${sizeClass} rounded-full object-cover shrink-0 shadow-sm border border-white/60 bg-slate-200 block`}
    />
  );
}

export default function App() {
  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem('voburkovi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('calendar');
  const [fbUser, setFbUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('rodina');
  const [newEventNote, setNewEventNote] = useState('');

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Potraviny');

  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error('Chyba spojení s databází:', err));
    const unsub = onAuthStateChanged(auth, (user) => setFbUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!fbUser || !loggedUser) return;

    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const shoppingRef = collection(db, 'artifacts', appId, 'public', 'data', 'shopping');

    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(data);
    });

    const unsubShopping = onSnapshot(shoppingRef, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setShoppingList(data);
    });

    return () => {
      unsubEvents();
      unsubShopping();
    };
  }, [fbUser, loggedUser]);

  const sendEmailNotification = async (eventData) => {
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === "ZDE_VLOZTE_SERVICE_ID") {
      return;
    }

    const isPetr = loggedUser.email === 'voburka.p@seznam.cz';
    const recipientEmail = isPetr ? 'leona.voburkova@seznam.cz' : 'voburka.p@seznam.cz';
    const recipientName = isPetr ? 'Leo' : 'Petře';

    const categoryObj = CATEGORIES.find((c) => c.id === eventData.category);

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: recipientEmail,
            to_name: recipientName,
            created_by: loggedUser.name,
            event_title: eventData.title,
            event_date: eventData.date.split('-').reverse().join('. '),
            event_time: eventData.time,
            event_category: categoryObj ? categoryObj.label : 'Celá rodina',
            event_note: eventData.note || 'Bez poznámky'
          }
        })
      });
    } catch (err) {
      console.error('Nepodařilo se odeslat e-mailové upozornění:', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!ALLOWED_USERS[cleanEmail]) {
      setLoginError('Tento e-mail nemá přístup do rodinného kalendáře Vobůrkových.');
      return;
    }

    if (passwordInput !== FAMILY_PASSWORD) {
      setLoginError('Nesprávné heslo. Zkuste to prosím znovu.');
      return;
    }

    const userProfile = {
      email: cleanEmail,
      ...ALLOWED_USERS[cleanEmail]
    };

    localStorage.setItem('voburkovi_user', JSON.stringify(userProfile));
    setLoggedUser(userProfile);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('voburkovi_user');
    setLoggedUser(null);
    setPasswordInput('');
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !fbUser || isSaving) return;

    setIsSaving(true);

    const eventPayload = {
      title: newEventTitle.trim(),
      date: selectedDate,
      time: newEventTime || 'Celý den',
      category: newEventCategory,
      note: newEventNote.trim(),
      createdBy: loggedUser.name,
      createdAt: Date.now()
    };

    try {
      const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      await addDoc(eventsRef, eventPayload);

      await sendEmailNotification(eventPayload);

      setNewEventTitle('');
      setNewEventTime('');
      setNewEventNote('');
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!fbUser || String(id).startsWith('fixed-')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
  };

  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !fbUser) return;

    const shoppingRef = collection(db, 'artifacts', appId, 'public', 'data', 'shopping');
    await addDoc(shoppingRef, {
      text: newItemText.trim(),
      category: newItemCategory,
      completed: false,
      addedBy: loggedUser.name,
      createdAt: Date.now()
    });

    setNewItemText('');
  };

  const toggleShoppingItem = async (item) => {
    if (!fbUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id), {
      completed: !item.completed
    });
  };

  const deleteShoppingItem = async (id) => {
    if (!fbUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', id));
  };

  const clearCompletedShopping = async () => {
    if (!fbUser) return;
    const completed = shoppingList.filter((i) => i.completed);
    for (const item of completed) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id));
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr });
    }
    return days;
  }, [currentDate]);

  // Spojení událostí z databáze + pevných narozenin/výročí/svátků
  const allCombinedEvents = useMemo(() => {
    const viewedYear = currentDate.getFullYear();
    const selectedYear = parseInt(selectedDate.split('-')[0], 10);
    const yearsToGenerate = Array.from(new Set([viewedYear, selectedYear]));

    const fixedEvents = yearsToGenerate.flatMap((y) => getFixedEventsForYear(y));
    return [...fixedEvents, ...events];
  }, [events, currentDate, selectedDate]);

  const filteredEvents = useMemo(() => {
    if (selectedCategoryFilter === 'all') return allCombinedEvents;
    return allCombinedEvents.filter((e) => e.category === selectedCategoryFilter);
  }, [allCombinedEvents, selectedCategoryFilter]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => {
        if (a.isFixed && !b.isFixed) return -1;
        if (!a.isFixed && b.isFixed) return 1;
        return a.time.localeCompare(b.time);
      });
  }, [filteredEvents, selectedDate]);

  // ============================================================================
  // OBRAZOVKA 1: PŘIHLÁŠENÍ ("Ahoj Vobůrkovi")
  // ============================================================================
  if (!loggedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-rose-950 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 p-7 text-center text-white relative overflow-hidden">
            <div className="mx-auto mb-3 flex items-center justify-center">
              <SmartAvatar
                baseName="rodina"
                fallbackText="V"
                bgClass="bg-white/20"
                sizeClass="w-24 h-24 ring-4 ring-white/30"
                textClass="text-3xl"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              Ahoj Vobůrkovi <Sparkles className="w-6 h-6 text-amber-300" />
            </h1>
            <p className="text-indigo-100 text-sm mt-1.5 font-medium">
              Petr • Lea • Patrik • Ella
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-4">
              {CATEGORIES.filter((c) => c.id !== 'rodina').map((member) => (
                <div key={member.id} className="flex flex-col items-center">
                  <SmartAvatar
                    baseName={member.photoBase}
                    fallbackText={member.fallback}
                    bgClass={member.bg}
                    sizeClass="w-10 h-10 ring-2 ring-white/50"
                    textClass="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Kdo se přihlašuje?
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setEmailInput('voburka.p@seznam.cz')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2.5 transition ${
                    emailInput === 'voburka.p@seznam.cz'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SmartAvatar baseName="Petr" fallbackText="P" bgClass="bg-blue-600" sizeClass="w-7 h-7" />
                  <span>Petr</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailInput('leona.voburkova@seznam.cz')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2.5 transition ${
                    emailInput === 'leona.voburkova@seznam.cz'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SmartAvatar baseName="Lea" fallbackText="L" bgClass="bg-rose-500" sizeClass="w-7 h-7" />
                  <span>Lea</span>
                </button>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-1">
                Váš e-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="voburka.p@seznam.cz"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Společné heslo
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition"
            >
              Vstoupit do kalendáře
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // OBRAZOVKA 2: HLAVNÍ APLIKACE (Kalendář + Nákupy)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <SmartAvatar
              baseName="rodina"
              fallbackText="V"
              bgClass="bg-indigo-600"
              sizeClass="w-11 h-11 ring-2 ring-indigo-100"
              textClass="text-base"
            />
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">Vobůrkovi</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <SmartAvatar
                  baseName={loggedUser.name}
                  fallbackText={loggedUser.name[0]}
                  bgClass={loggedUser.color || 'bg-blue-600'}
                  sizeClass="w-4 h-4"
                  textClass="text-[9px]"
                />
                <p className="text-xs text-slate-500 leading-none">
                  Přihlášen(a): <span className="font-semibold text-slate-700">{loggedUser.name}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Kalendář
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'shopping' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Nákupní seznam ({shoppingList.filter((i) => !i.completed).length})
              </button>
            </div>

            <button
              onClick={handleLogout}
              title="Odhlásit se"
              className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {activeTab === 'calendar' ? (
          <div className="space-y-4">
            {/* Filtry členů rodiny */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Vše
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`shrink-0 pl-1.5 pr-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition ${
                    selectedCategoryFilter === cat.id
                      ? `${cat.bg} text-white shadow-sm`
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <SmartAvatar
                    baseName={cat.photoBase}
                    fallbackText={cat.fallback}
                    bgClass={cat.bg}
                    sizeClass="w-6 h-6"
                    textClass="text-[10px]"
                  />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Měsíční kalendář */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    {MONTHS_CZ[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCurrentDate(now);
                        setSelectedDate(now.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                    >
                      Dnes
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {DAYS_CZ.map((day) => (
                    <div key={day} className="text-xs font-bold text-slate-400 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => {
                    if (!item) return <div key={idx} className="h-16 sm:h-22" />;

                    const dayEvents = filteredEvents.filter((e) => e.date === item.dateStr);
                    const isSelected = selectedDate === item.dateStr;
                    const isToday = item.dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <button
                        key={item.dateStr}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`h-16 sm:h-22 p-1 rounded-xl border text-left flex flex-col justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday
                                ? 'bg-indigo-600 text-white'
                                : isSelected
                                ? 'text-indigo-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {item.day}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {dayEvents.slice(0, 3).map((ev) => {
                                const cat = CATEGORIES.find((c) => c.id === ev.category) || CATEGORIES[0];
                                return (
                                  <SmartAvatar
                                    key={ev.id}
                                    baseName={cat.photoBase}
                                    fallbackText={cat.fallback}
                                    bgClass={cat.bg}
                                    sizeClass="w-4 h-4"
                                    textClass="text-[8px]"
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="w-full space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const cat = CATEGORIES.find((c) => c.id === ev.category) || CATEGORIES[0];
                            return (
                              <div
                                key={ev.id}
                                className={`${cat.bg} text-white text-[10px] px-1 rounded truncate font-medium`}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-slate-400 font-bold pl-1">
                              +{dayEvents.length - 2} další
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail vybraného dne */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Vybraný den</p>
                      <h3 className="text-lg font-bold text-slate-800">
                        {selectedDate.split('-').reverse().join('. ')}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Přidat událost
                    </button>
                  </div>

                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      Na tento den zatím nemáte naplánovanou žádnou událost.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents.map((ev) => {
                        const cat = CATEGORIES.find((c) => c.id === ev.category) || CATEGORIES[0];
                        return (
                          <div
                            key={ev.id}
                            className={`p-3 rounded-xl border ${cat.light} flex items-start justify-between gap-3`}
                          >
                            <div className="flex items-start gap-3">
                              <SmartAvatar
                                baseName={cat.photoBase}
                                fallbackText={cat.fallback}
                                bgClass={cat.bg}
                                sizeClass="w-10 h-10 mt-0.5"
                                textClass="text-xs"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${cat.bg}`}>
                                    {cat.label}
                                  </span>
                                  <span className="text-xs font-semibold flex items-center gap-1 opacity-75">
                                    <Clock className="w-3.5 h-3.5" /> {ev.time}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 mt-1">{ev.title}</h4>
                                {ev.note && <p className="text-xs text-slate-600 mt-1">{ev.note}</p>}
                                {!ev.isFixed && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <SmartAvatar
                                      baseName={ev.createdBy}
                                      fallbackText={ev.createdBy ? ev.createdBy[0] : 'V'}
                                      bgClass="bg-slate-500"
                                      sizeClass="w-4 h-4"
                                      textClass="text-[8px]"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                      Zapsal(a): <span className="font-semibold">{ev.createdBy}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {!ev.isFixed && (
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ============================================================================
          // ZÁLOŽKA: NÁKUPNÍ SEZNAM
          // ============================================================================
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600" /> Rodinný nákupní seznam
            </h2>

            <form onSubmit={handleAddShoppingItem} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Co je potřeba koupit? (např. Mléko, pleny...)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700"
              >
                {SHOP_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Přidat
              </button>
            </form>

            {shoppingList.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">
                Nákupní seznam je prázdný.
              </p>
            ) : (
              <div className="space-y-2">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleShoppingItem(item)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className={`font-semibold text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <SmartAvatar
                            baseName={item.addedBy}
                            fallbackText={item.addedBy ? item.addedBy[0] : 'V'}
                            bgClass="bg-slate-500"
                            sizeClass="w-3.5 h-3.5"
                            textClass="text-[8px]"
                          />
                          <p className="text-[11px] text-slate-400">
                            {item.category} • přidal(a) {item.addedBy}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShoppingItem(item.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {shoppingList.some((i) => i.completed) && (
                  <button
                    onClick={clearCompletedShopping}
                    className="w-full mt-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    Smazat koupené položky
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modální okno pro novou událost */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nová událost</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Název události</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="např. Zubař, Trénink, Výlet..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Koho se událost týká?</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setNewEventCategory(cat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                        newEventCategory === cat.id
                          ? `${cat.bg} text-white border-transparent shadow-sm`
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <SmartAvatar
                        baseName={cat.photoBase}
                        fallbackText={cat.fallback}
                        bgClass={cat.bg}
                        sizeClass="w-6 h-6"
                        textClass="text-[10px]"
                      />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Datum</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Čas (volitelné)</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Poznámka</label>
                <textarea
                  rows="2"
                  value={newEventNote}
                  onChange={(e) => setNewEventNote(e.target.value)}
                  placeholder="Co vzít s sebou, adresa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition"
              >
                {isSaving
                  ? 'Ukládám a posílám e-mail...'
                  : `Uložit a upozornit (${loggedUser.email === 'voburka.p@seznam.cz' ? 'Lea' : 'Petr'})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spodní mobilní navigace */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-30">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 text-xs font-bold ${
            activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          Kalendář
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 text-xs font-bold ${
            activeTab === 'shopping' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          Nákupy ({shoppingList.filter((i) => !i.completed).length})
        </button>
      </nav>
    </div>
  );
}
