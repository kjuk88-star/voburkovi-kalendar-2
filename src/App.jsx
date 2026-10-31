import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  ShoppingCart,
  Settings,
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
  X,
  FileText,
  Star,
  Check,
  Palette,
  Users,
  PackagePlus,
  Camera,
  RotateCcw,
  MessageSquarePlus,
  Search
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
// 3. VÝCHOZÍ NASTAVENÍ RODINY, BAREV A KATALOGU POTRAVIN
// ============================================================================
const ALLOWED_USERS = {
  'voburka.p@seznam.cz': {
    id: 'petr',
    defaultName: 'Petr',
    role: 'Manžel',
    photoBase: 'Petr'
  },
  'leona.voburkova@seznam.cz': {
    id: 'lea',
    defaultName: 'Lea',
    role: 'Manželka',
    photoBase: 'Lea'
  }
};

const FAMILY_PASSWORD = 'poklop123';

// Paleta barev pro členy rodiny (nastavitelná v administraci)
const MEMBER_COLOR_PALETTE = {
  indigo: { label: 'Fialová', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600' },
  blue: { label: 'Modrá', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600' },
  rose: { label: 'Růžová', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  emerald: { label: 'Zelená', bg: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
  amber: { label: 'Oranžová', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  purple: { label: 'Švestková', bg: 'bg-purple-600', light: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-600' },
  teal: { label: 'Tyrkysová', bg: 'bg-teal-600', light: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-600' }
};

// Vzhled celé aplikace (nastavitelný v administraci)
const APP_THEMES = {
  indigo: {
    name: 'Rodinná Fialová (Výchozí)',
    pageBg: 'bg-slate-50',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    activeNav: 'text-indigo-600',
    selectedBorder: 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20',
    todayBadge: 'bg-indigo-600 text-white',
    accentText: 'text-indigo-600',
    headerGradient: 'from-indigo-600 via-purple-600 to-rose-500'
  },
  emerald: {
    name: 'Přírodní Smaragdová',
    pageBg: 'bg-stone-50',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    activeNav: 'text-emerald-600',
    selectedBorder: 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20',
    todayBadge: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-600',
    headerGradient: 'from-emerald-700 via-teal-600 to-cyan-600'
  },
  blue: {
    name: 'Čistá Modrá',
    pageBg: 'bg-slate-50',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    activeNav: 'text-blue-600',
    selectedBorder: 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20',
    todayBadge: 'bg-blue-600 text-white',
    accentText: 'text-blue-600',
    headerGradient: 'from-blue-700 via-indigo-600 to-sky-500'
  },
  rose: {
    name: 'Teplá Malinová',
    pageBg: 'bg-rose-50/30',
    primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    activeNav: 'text-rose-600',
    selectedBorder: 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20',
    todayBadge: 'bg-rose-600 text-white',
    accentText: 'text-rose-600',
    headerGradient: 'from-rose-600 via-pink-600 to-amber-500'
  },
  slate: {
    name: 'Minimalistická Břidlice',
    pageBg: 'bg-zinc-100',
    primaryBtn: 'bg-slate-800 hover:bg-slate-900 text-white',
    activeNav: 'text-slate-900',
    selectedBorder: 'border-slate-800 bg-slate-200/60 ring-2 ring-slate-500/20',
    todayBadge: 'bg-slate-900 text-white',
    accentText: 'text-slate-800',
    headerGradient: 'from-slate-800 via-slate-700 to-zinc-600'
  }
};

const DEFAULT_MEMBERS = [
  { id: 'rodina', label: 'Celá rodina', photoBase: 'rodina', fallback: 'V', colorKey: 'indigo', customPhoto: '' },
  { id: 'petr', label: 'Petr', photoBase: 'Petr', fallback: 'P', colorKey: 'blue', customPhoto: '' },
  { id: 'lea', label: 'Lea', photoBase: 'Lea', fallback: 'L', colorKey: 'rose', customPhoto: '' },
  { id: 'patrik', label: 'Patrik', photoBase: 'Patrik', fallback: 'Pa', colorKey: 'emerald', customPhoto: '' },
  { id: 'ella', label: 'Ella', photoBase: 'Ella', fallback: 'E', colorKey: 'amber', customPhoto: '' }
];

// Výchozí katalog zboží s Emoji ikonkami
const DEFAULT_CATALOG = [
  { id: 'cat-mleko', name: 'Mléko', icon: '🥛', category: 'Potraviny', usageCount: 10 },
  { id: 'cat-chleba', name: 'Chleba', icon: '🍞', category: 'Pečivo', usageCount: 9 },
  { id: 'cat-rohlíky', name: 'Rohlíky', icon: '🥐', category: 'Pečivo', usageCount: 8 },
  { id: 'cat-maslo', name: 'Máslo', icon: '🧈', category: 'Potraviny', usageCount: 8 },
  { id: 'cat-vejce', name: 'Vejce', icon: '🥚', category: 'Potraviny', usageCount: 7 },
  { id: 'cat-syr', name: 'Sýr', icon: '🧀', category: 'Potraviny', usageCount: 6 },
  { id: 'cat-jogurt', name: 'Jogurt', icon: '🥣', category: 'Potraviny', usageCount: 6 },
  { id: 'cat-sunka', name: 'Šunka', icon: '🥩', category: 'Potraviny', usageCount: 6 },
  { id: 'cat-banany', name: 'Banány', icon: '🍌', category: 'Ovoce a zelenina', usageCount: 7 },
  { id: 'cat-jablka', name: 'Jablka', icon: '🍎', category: 'Ovoce a zelenina', usageCount: 5 },
  { id: 'cat-rajcata', name: 'Rajčata', icon: '🍅', category: 'Ovoce a zelenina', usageCount: 5 },
  { id: 'cat-brambory', name: 'Brambory', icon: '🥔', category: 'Ovoce a zelenina', usageCount: 4 },
  { id: 'cat-kureci', name: 'Kuřecí maso', icon: '🍗', category: 'Potraviny', usageCount: 5 },
  { id: 'cat-testoviny', name: 'Těstoviny', icon: '🍝', category: 'Potraviny', usageCount: 4 },
  { id: 'cat-kava', name: 'Káva', icon: '☕', category: 'Nápoje', usageCount: 5 },
  { id: 'cat-voda', name: 'Voda', icon: '💧', category: 'Nápoje', usageCount: 4 },
  { id: 'cat-pleny', name: 'Pleny', icon: '🧷', category: 'Děti (Patrik & Ella)', usageCount: 8 },
  { id: 'cat-ubrousky', name: 'Vlhčené ubrousky', icon: '🧻', category: 'Děti (Patrik & Ella)', usageCount: 6 },
  { id: 'cat-kapsicky', name: 'Ovocné kapsičky', icon: '🍓', category: 'Děti (Patrik & Ella)', usageCount: 5 },
  { id: 'cat-toaletni', name: 'Toaletní papír', icon: '🧻', category: 'Drogerie', usageCount: 6 },
  { id: 'cat-tablety', name: 'Tablety do myčky', icon: '🧼', category: 'Drogerie', usageCount: 3 },
  { id: 'cat-prasek', name: 'Prací gel', icon: '🧺', category: 'Drogerie', usageCount: 3 }
];

const SHOP_CATEGORIES = [
  'Potraviny',
  'Pečivo',
  'Ovoce a zelenina',
  'Nápoje',
  'Děti (Patrik & Ella)',
  'Drogerie',
  'Domácnost',
  'Ostatní'
];

const EMOJI_PRESETS = [
  '🥛', '🍞', '🥐', '🥖', '🧈', '🥚', '🧀', '🥩', '🍗', '🍖', '🐟', '🥣',
  '🍎', '🍌', '🍓', '🍇', '🍋', '🥑', '🍅', '🥒', '🥕', '🥔', '🧅', '🧄', '🥦', '🌶️',
  '🍝', '🍚', '🍕', '🍟', '🍫', '🍪', '🍰', '🍦', '🍯', '🥜',
  '☕', '🍵', '💧', '🧃', '🍺', '🍷', '🍼',
  '🧷', '🧸', '🧻', '🧼', '🪥', '🧴', '🧺', '🧽', '🧹', '🕯️', '🔋', '💊', '🐶', '🐱', '🛒'
];

// ============================================================================
// 4. PEVNÉ RODINNÉ UDÁLOSTI (Narozeniny, Výročí, Svátky)
// ============================================================================
const FIXED_ANNUAL_EVENTS = [
  { month: 4, day: 28, type: 'birthday', startYear: 1989, personId: 'petr', defaultPerson: 'Petr', category: 'petr' },
  { month: 6, day: 14, type: 'birthday', startYear: 1995, personId: 'lea', defaultPerson: 'Lea', category: 'lea' },
  { month: 8, day: 13, type: 'birthday', startYear: 2023, personId: 'patrik', defaultPerson: 'Patrik', category: 'patrik' },
  { month: 3, day: 25, type: 'birthday', startYear: 2025, personId: 'ella', defaultPerson: 'Ella', category: 'ella' },
  { month: 8, day: 6, type: 'anniversary', startYear: 2021, defaultPerson: 'Petr & Lea', category: 'rodina' },
  { month: 2, day: 19, type: 'nameday', personId: 'patrik', defaultPerson: 'Patrik', category: 'patrik', note: 'Svátek slaví Patrik!' },
  { month: 2, day: 22, type: 'nameday', personId: 'petr', defaultPerson: 'Petr', category: 'petr', note: 'Svátek slaví Petr!' },
  { month: 6, day: 29, type: 'nameday', defaultPerson: 'Petr (Petr a Pavel)', category: 'petr', note: 'Svátek slaví Petr a Pavel!' },
  { month: 3, day: 7, type: 'nameday', personId: 'ella', defaultPerson: 'Ella', category: 'ella', note: 'Svátek slaví Ella!' },
  { month: 6, day: 18, type: 'nameday', personId: 'lea', defaultPerson: 'Lea (Leona)', category: 'lea', note: 'Svátek slaví Leona!' }
];

function formatCzechYears(years) {
  if (years === 1) return '1 rok';
  if (years >= 2 && years <= 4) return `${years} roky`;
  return `${years} let`;
}

function getFixedEventsForYear(year, membersList) {
  return FIXED_ANNUAL_EVENTS.map((item, idx) => {
    const dateStr = `${year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
    const diff = item.startYear ? year - item.startYear : 0;
    const memberObj = membersList.find((m) => m.id === item.personId);
    const personName = memberObj ? memberObj.label : item.defaultPerson;

    let title = '';
    let note = '';

    if (item.type === 'birthday') {
      title = `🎂 Narozeniny: ${personName} (${formatCzechYears(diff)})`;
      note = `Narozen(a) ${item.day}. ${item.month}. ${item.startYear} – letos slaví ${formatCzechYears(diff)}!`;
    } else if (item.type === 'anniversary') {
      title = `💍 ${diff}. výročí svatby`;
      note = `Svatba 6. 8. ${item.startYear} – letos slavíte ${formatCzechYears(diff)} spolu!`;
    } else {
      title = `🎉 Svátek: ${personName}`;
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

const MONTHS_CZ = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const DAYS_CZ = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

// Pomocná funkce pro zmenšení fotky z mobilu před uložením do databáze
function compressImageFile(file, maxSize = 220) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// CHYTRÁ KOMPONENTA PRO FOTKY (podporuje vlastní fotku z administrace i soubory z GitHubu)
// ============================================================================
function SmartAvatar({ customPhoto, baseName, fallbackText, bgClass = 'bg-indigo-600', sizeClass = 'w-8 h-8', textClass = 'text-xs' }) {
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

  if (customPhoto) {
    return (
      <img
        src={customPhoto}
        alt={baseName || fallbackText}
        className={`${sizeClass} rounded-full object-cover shrink-0 shadow-sm border border-white/60 bg-slate-200 block`}
      />
    );
  }

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

  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'shopping' | 'settings'
  const [fbUser, setFbUser] = useState(null);

  // Data z Firebase
  const [events, setEvents] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [appSettings, setAppSettings] = useState({
    familyTitle: 'Vobůrkovi',
    theme: 'indigo',
    members: DEFAULT_MEMBERS,
    familyNotes: '• Děti pojišťovna: VZP\n• Důležité kontakty a poznámky...'
  });

  // Kalendářové stavy
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Formulář nové události
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('rodina');
  const [newEventNote, setNewEventNote] = useState('');

  // Stavy pro nákupní seznam
  const [shopSearch, setShopSearch] = useState('');
  const [shopNoteInput, setShopNoteInput] = useState('');
  const [shopCategoryInput, setShopCategoryInput] = useState('Potraviny');
  const [selectedCatalogFilter, setSelectedCatalogFilter] = useState('Nejčastější');
  const [editingNoteItemId, setEditingNoteItemId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');

  // Stavy pro administraci (Nastavení)
  const [adminNewItemName, setAdminNewItemName] = useState('');
  const [adminNewItemIcon, setAdminNewItemIcon] = useState('🥛');
  const [adminNewItemCategory, setAdminNewItemCategory] = useState('Potraviny');
  const [adminSavedToast, setAdminSavedToast] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  const themeObj = APP_THEMES[appSettings.theme] || APP_THEMES.indigo;

  // Spojení informací o členech s paletou barev
  const categoriesWithStyles = useMemo(() => {
    const list = appSettings.members && appSettings.members.length > 0 ? appSettings.members : DEFAULT_MEMBERS;
    return list.map((m) => {
      const palette = MEMBER_COLOR_PALETTE[m.colorKey] || MEMBER_COLOR_PALETTE.indigo;
      return {
        ...m,
        bg: palette.bg,
        light: palette.light,
        dot: palette.dot
      };
    });
  }, [appSettings.members]);

  const currentLoggedMember = useMemo(() => {
    if (!loggedUser) return null;
    const found = categoriesWithStyles.find((m) => m.id === loggedUser.id);
    return found || { label: loggedUser.defaultName || loggedUser.name, photoBase: loggedUser.photoBase, bg: 'bg-blue-600' };
  }, [loggedUser, categoriesWithStyles]);

  // Firebase přihlášení
  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error('Chyba spojení s databází:', err));
    const unsub = onAuthStateChanged(auth, (user) => setFbUser(user));
    return () => unsub();
  }, []);

  // Synchronizace všech kolekcí (události, nákupy, katalog zboží, nastavení)
  useEffect(() => {
    if (!fbUser) return;

    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const shoppingRef = collection(db, 'artifacts', appId, 'public', 'data', 'shopping');
    const catalogRef = collection(db, 'artifacts', appId, 'public', 'data', 'catalog');
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');

    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubShopping = onSnapshot(shoppingRef, (snapshot) => {
      setShoppingList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCatalog = onSnapshot(catalogRef, async (snapshot) => {
      if (snapshot.empty) {
        // Naplnit výchozí katalog potravin při prvním spuštění
        for (const item of DEFAULT_CATALOG) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'catalog', item.id), item);
        }
      } else {
        setCatalog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });

    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppSettings((prev) => ({
          ...prev,
          ...data,
          members: data.members || DEFAULT_MEMBERS
        }));
        setNotesDraft(data.familyNotes || '');
      } else {
        setDoc(settingsDocRef, {
          familyTitle: 'Vobůrkovi',
          theme: 'indigo',
          members: DEFAULT_MEMBERS,
          familyNotes: '• Děti pojišťovna: VZP\n• Důležité kontakty a poznámky...'
        });
      }
    });

    return () => {
      unsubEvents();
      unsubShopping();
      unsubCatalog();
      unsubSettings();
    };
  }, [fbUser]);

  const showToast = (msg) => {
    setAdminSavedToast(msg);
    setTimeout(() => setAdminSavedToast(''), 2500);
  };

  // Uložení nastavení do Firebase
  const saveSettingsToCloud = async (partialSettings, toastMsg = 'Nastavení uloženo') => {
    if (!fbUser) return;
    const nextSettings = { ...appSettings, ...partialSettings };
    setAppSettings(nextSettings);
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
    await setDoc(settingsDocRef, nextSettings, { merge: true });
    if (toastMsg) showToast(toastMsg);
  };

  // Odeslání e-mailu druhému z manželů
  const sendEmailNotification = async (eventData) => {
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === "ZDE_VLOZTE_SERVICE_ID") return;

    const isPetr = loggedUser.email === 'voburka.p@seznam.cz';
    const recipientEmail = isPetr ? 'leona.voburkova@seznam.cz' : 'voburka.p@seznam.cz';
    const recipientMember = categoriesWithStyles.find((m) => m.id === (isPetr ? 'lea' : 'petr'));
    const recipientName = recipientMember ? recipientMember.label : (isPetr ? 'Leo' : 'Petře');
    const categoryObj = categoriesWithStyles.find((c) => c.id === eventData.category);

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
            created_by: currentLoggedMember?.label || loggedUser.name,
            event_title: eventData.title,
            event_date: eventData.date.split('-').reverse().join('. '),
            event_time: eventData.time,
            event_category: categoryObj ? categoryObj.label : 'Celá rodina',
            event_note: eventData.note || 'Bez poznámky',
            calendar_link: 'https://voburkovi-kalendar-2.vercel.app/'
          }
        })
      });
    } catch (err) {
      console.error('Nepodařilo se odeslat e-mailové upozornění:', err);
    }
  };

  // Přihlášení
  const handleLogin = (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!ALLOWED_USERS[cleanEmail]) {
      setLoginError('Tento e-mail nemá přístup do rodinného kalendáře.');
      return;
    }

    if (passwordInput !== FAMILY_PASSWORD) {
      setLoginError('Nesprávné heslo. Zkuste to prosím znovu.');
      return;
    }

    const userProfile = {
      email: cleanEmail,
      ...ALLOWED_USERS[cleanEmail],
      name: ALLOWED_USERS[cleanEmail].defaultName
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

  // Události v kalendáři
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
      createdBy: currentLoggedMember?.label || loggedUser.name,
      createdById: loggedUser.id || 'petr',
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

  // ============================================================================
  // NÁKUPNÍ SEZNAM & KATALOG POTRAVIN
  // ============================================================================
  const sortedCatalog = useMemo(() => {
    return [...catalog].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }, [catalog]);

  const filteredCatalogForPicker = useMemo(() => {
    if (shopSearch.trim()) {
      const q = shopSearch.trim().toLowerCase();
      return sortedCatalog.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (selectedCatalogFilter === 'Nejčastější') {
      return sortedCatalog.slice(0, 14);
    }
    return sortedCatalog.filter((c) => c.category === selectedCatalogFilter);
  }, [sortedCatalog, shopSearch, selectedCatalogFilter]);

  // Přidání položky z katalogu (nebo ručně z vyhledávání) do aktivního nákupního seznamu
  const addProductToShoppingList = async (catalogItem, customNote = '') => {
    if (!fbUser) return;
    const shoppingRef = collection(db, 'artifacts', appId, 'public', 'data', 'shopping');

    await addDoc(shoppingRef, {
      text: catalogItem.name,
      icon: catalogItem.icon || '🛒',
      category: catalogItem.category || 'Potraviny',
      note: customNote.trim(),
      completed: false,
      addedBy: currentLoggedMember?.label || loggedUser.name,
      addedById: loggedUser.id || 'petr',
      createdAt: Date.now()
    });

    // Zvýšit počítadlo oblíbenosti v katalogu
    if (catalogItem.id) {
      const catDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'catalog', catalogItem.id);
      await updateDoc(catDocRef, {
        usageCount: (catalogItem.usageCount || 0) + 1
      }).catch(() => {});
    }
  };

  // Ruční odeslání formuláře v nákupech (pokud zboží ještě není v katalogu, rovnou ho i uloží do katalogu)
  const handleManualShopSubmit = async (e) => {
    e.preventDefault();
    if (!shopSearch.trim() || !fbUser) return;

    const cleanName = shopSearch.trim();
    const existing = catalog.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());

    if (existing) {
      await addProductToShoppingList(existing, shopNoteInput);
    } else {
      // Vytvořit rovnou i v katalogu, aby příště bylo v nabídce
      const catalogRef = collection(db, 'artifacts', appId, 'public', 'data', 'catalog');
      const newCatDoc = await addDoc(catalogRef, {
        name: cleanName,
        icon: '🛒',
        category: shopCategoryInput,
        usageCount: 1
      });
      await addProductToShoppingList(
        { id: newCatDoc.id, name: cleanName, icon: '🛒', category: shopCategoryInput, usageCount: 1 },
        shopNoteInput
      );
    }

    setShopSearch('');
    setShopNoteInput('');
  };

  // Uložení nebo úprava poznámky u konkrétní položky v nákupním seznamu (např. "Alpro")
  const handleSaveItemNote = async (itemId) => {
    if (!fbUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', itemId), {
      note: editingNoteValue.trim()
    });
    setEditingNoteItemId(null);
    setEditingNoteValue('');
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

  // Přidání nového produktu do katalogu v Administraci
  const handleAdminAddCatalogItem = async (e) => {
    e.preventDefault();
    if (!adminNewItemName.trim() || !fbUser) return;

    const catalogRef = collection(db, 'artifacts', appId, 'public', 'data', 'catalog');
    await addDoc(catalogRef, {
      name: adminNewItemName.trim(),
      icon: adminNewItemIcon || '🛒',
      category: adminNewItemCategory,
      usageCount: 1
    });

    setAdminNewItemName('');
    showToast('Zboží přidáno do katalogu');
  };

  const handleAdminDeleteCatalogItem = async (id) => {
    if (!fbUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'catalog', id));
    showToast('Položka smazána z katalogu');
  };

  // Změna člena rodiny v Administraci (jméno, barva, vlastní fotka z mobilu)
  const handleUpdateMember = async (memberId, changes) => {
    const updated = categoriesWithStyles.map((m) =>
      m.id === memberId
        ? {
            id: m.id,
            label: changes.label !== undefined ? changes.label : m.label,
            photoBase: m.photoBase,
            fallback: (changes.label || m.label || 'V')[0].toUpperCase(),
            colorKey: changes.colorKey !== undefined ? changes.colorKey : m.colorKey,
            customPhoto: changes.customPhoto !== undefined ? changes.customPhoto : (m.customPhoto || '')
          }
        : {
            id: m.id,
            label: m.label,
            photoBase: m.photoBase,
            fallback: m.fallback,
            colorKey: m.colorKey,
            customPhoto: m.customPhoto || ''
          }
    );
    await saveSettingsToCloud({ members: updated }, 'Profil člena uložen');
  };

  const handlePhotoUpload = async (memberId, file) => {
    if (!file) return;
    try {
      const base64Photo = await compressImageFile(file, 220);
      await handleUpdateMember(memberId, { customPhoto: base64Photo });
    } catch (err) {
      console.error('Chyba při nahrávání fotky:', err);
    }
  };

  // Výpočet dnů v měsíci
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

  const allCombinedEvents = useMemo(() => {
    const viewedYear = currentDate.getFullYear();
    const selectedYear = parseInt(selectedDate.split('-')[0], 10);
    const yearsToGenerate = Array.from(new Set([viewedYear, selectedYear]));

    const fixedEvents = yearsToGenerate.flatMap((y) => getFixedEventsForYear(y, categoriesWithStyles));
    return [...fixedEvents, ...events];
  }, [events, currentDate, selectedDate, categoriesWithStyles]);

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

  const familyHeaderMember = categoriesWithStyles.find((c) => c.id === 'rodina') || DEFAULT_MEMBERS[0];

  // ============================================================================
  // OBRAZOVKA 1: PŘIHLÁŠENÍ ("Ahoj Vobůrkovi")
  // ============================================================================
  if (!loggedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-rose-950 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className={`bg-gradient-to-r ${themeObj.headerGradient} p-7 text-center text-white relative overflow-hidden`}>
            <div className="mx-auto mb-3 flex items-center justify-center">
              <SmartAvatar
                customPhoto={familyHeaderMember.customPhoto}
                baseName="rodina"
                fallbackText="V"
                bgClass="bg-white/20"
                sizeClass="w-24 h-24 ring-4 ring-white/30"
                textClass="text-3xl"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              Ahoj {appSettings.familyTitle || 'Vobůrkovi'} <Sparkles className="w-6 h-6 text-amber-300" />
            </h1>
            <p className="text-white/85 text-sm mt-1.5 font-medium">
              {categoriesWithStyles.filter((c) => c.id !== 'rodina').map((c) => c.label).join(' • ')}
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-4">
              {categoriesWithStyles.filter((c) => c.id !== 'rodina').map((member) => (
                <div key={member.id} className="flex flex-col items-center">
                  <SmartAvatar
                    customPhoto={member.customPhoto}
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
                {['petr', 'lea'].map((uid) => {
                  const emailKey = uid === 'petr' ? 'voburka.p@seznam.cz' : 'leona.voburkova@seznam.cz';
                  const member = categoriesWithStyles.find((m) => m.id === uid) || DEFAULT_MEMBERS[uid === 'petr' ? 1 : 2];
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => setEmailInput(emailKey)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2.5 transition ${
                        emailInput === emailKey
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <SmartAvatar
                        customPhoto={member.customPhoto}
                        baseName={member.photoBase}
                        fallbackText={member.fallback}
                        bgClass={member.bg}
                        sizeClass="w-7 h-7"
                      />
                      <span>{member.label}</span>
                    </button>
                  );
                })}
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
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
              className={`w-full py-3.5 bg-gradient-to-r ${themeObj.headerGradient} text-white font-bold rounded-xl shadow-lg transition`}
            >
              Vstoupit do kalendáře
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // OBRAZOVKA 2: HLAVNÍ APLIKACE (Kalendář + Nákupy + Administrace)
  // ============================================================================
  return (
    <div className={`min-h-screen ${themeObj.pageBg} pb-24 md:pb-10`}>
      {/* Plovoucí notifikace o uložení */}
      {adminSavedToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> {adminSavedToast}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <SmartAvatar
              customPhoto={familyHeaderMember.customPhoto}
              baseName="rodina"
              fallbackText="V"
              bgClass={familyHeaderMember.bg}
              sizeClass="w-11 h-11 ring-2 ring-slate-100"
              textClass="text-base"
            />
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">
                {appSettings.familyTitle || 'Vobůrkovi'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <SmartAvatar
                  customPhoto={currentLoggedMember?.customPhoto}
                  baseName={currentLoggedMember?.photoBase}
                  fallbackText={currentLoggedMember?.label?.[0] || 'V'}
                  bgClass={currentLoggedMember?.bg || 'bg-blue-600'}
                  sizeClass="w-4 h-4"
                  textClass="text-[9px]"
                />
                <p className="text-xs text-slate-500 leading-none">
                  Přihlášen(a): <span className="font-semibold text-slate-700">{currentLoggedMember?.label}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'calendar' ? `bg-white ${themeObj.accentText} shadow-sm` : 'text-slate-600'
                }`}
              >
                Kalendář
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'shopping' ? `bg-white ${themeObj.accentText} shadow-sm` : 'text-slate-600'
                }`}
              >
                Nákupy ({shoppingList.filter((i) => !i.completed).length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'settings' ? `bg-white ${themeObj.accentText} shadow-sm` : 'text-slate-600'
                }`}
              >
                Nastavení
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
          // ============================================================================
          // ZÁLOŽKA 1: KALENDÁŘ
          // ============================================================================
          <div className="space-y-4">
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
              {categoriesWithStyles.map((cat) => (
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
                    customPhoto={cat.customPhoto}
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
                          isSelected ? themeObj.selectedBorder : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday ? themeObj.todayBadge : isSelected ? themeObj.accentText : 'text-slate-700'
                            }`}
                          >
                            {item.day}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {dayEvents.slice(0, 3).map((ev) => {
                                const cat = categoriesWithStyles.find((c) => c.id === ev.category) || categoriesWithStyles[0];
                                return (
                                  <SmartAvatar
                                    key={ev.id}
                                    customPhoto={cat.customPhoto}
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
                            const cat = categoriesWithStyles.find((c) => c.id === ev.category) || categoriesWithStyles[0];
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
                      className={`px-3.5 py-2 ${themeObj.primaryBtn} rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm`}
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
                        const cat = categoriesWithStyles.find((c) => c.id === ev.category) || categoriesWithStyles[0];
                        return (
                          <div
                            key={ev.id}
                            className={`p-3 rounded-xl border ${cat.light} flex items-start justify-between gap-3`}
                          >
                            <div className="flex items-start gap-3">
                              <SmartAvatar
                                customPhoto={cat.customPhoto}
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
                                  <p className="text-[11px] text-slate-500 mt-2">
                                    Zapsal(a): <span className="font-semibold">{ev.createdBy}</span>
                                  </p>
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
        ) : activeTab === 'shopping' ? (
          // ============================================================================
          // ZÁLOŽKA 2: CHYTRÝ NÁKUPNÍ SEZNAM S EMOJI KATALOGEM A ODDĚLENOU POZNÁMKOU
          // ============================================================================
          <div className="max-w-3xl mx-auto space-y-6">
            {/* SEKCE A: Rychlý výběr z vašeho katalogu potravin s ikonkami */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Katalog zboží (klikni pro přidání)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Řazeno automaticky podle toho, co kupujete nejčastěji.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Spravovat zboží
                </button>
              </div>

              {/* Filtry kategorií katalogu */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
                {['Nejčastější', ...SHOP_CATEGORIES].map((catName) => (
                  <button
                    key={catName}
                    onClick={() => setSelectedCatalogFilter(catName)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      selectedCatalogFilter === catName
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {catName === 'Nejčastější' ? '⭐ Nejčastější' : catName}
                  </button>
                ))}
              </div>

              {/* Dlaždice s Emoji ikonkami */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {filteredCatalogForPicker.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addProductToShoppingList(item, shopNoteInput)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 bg-slate-50/60 flex items-center gap-2.5 text-left transition group"
                  >
                    <span className="text-2xl shrink-0">{item.icon || '🛒'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.category}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Vyhledávání / Ruční přidání s volitelnou poznámkou */}
              <form onSubmit={handleManualShopSubmit} className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Hledat v katalogu nebo dopsat vlastní položku s poznámkou:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      placeholder="Název (např. Mléko)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={shopNoteInput}
                      onChange={(e) => setShopNoteInput(e.target.value)}
                      placeholder="Poznámka (např. Alpro, 2 ks)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-1.5">
                    <button
                      type="submit"
                      className={`w-full py-2 px-4 ${themeObj.primaryBtn} font-bold rounded-xl text-sm shadow-sm`}
                    >
                      + Do seznamu
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* SEKCE B: Samotný aktivní nákupní seznam */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className={`w-6 h-6 ${themeObj.accentText}`} /> Co je potřeba koupit ({shoppingList.filter((i) => !i.completed).length})
                </h2>
                {shoppingList.some((i) => i.completed) && (
                  <button
                    onClick={clearCompletedShopping}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
                  >
                    Smazat koupené
                  </button>
                )}
              </div>

              {shoppingList.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">
                  Nákupní seznam je prázdný. Klepněte nahoře na libovolnou položku v katalogu!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {shoppingList.map((item) => {
                    const isEditingNote = editingNoteItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition ${
                          item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            onClick={() => toggleShoppingItem(item)}
                            className="flex items-start gap-3 flex-1 cursor-pointer"
                          >
                            <div className="mt-1">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                            </div>

                            <span className="text-2xl leading-none mt-0.5">{item.icon || '🛒'}</span>

                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {item.text}
                              </p>

                              {/* Zobrazení poznámky pod názvem zboží */}
                              {item.note && !isEditingNote && (
                                <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 inline-block px-2 py-0.5 rounded-md mt-1">
                                  Pozn.: {item.note}
                                </p>
                              )}

                              <p className="text-[11px] text-slate-400 mt-1">
                                {item.category} • přidal(a) {item.addedBy}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteItemId(isEditingNote ? null : item.id);
                                setEditingNoteValue(item.note || '');
                              }}
                              title="Přidat / upravit poznámku"
                              className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 border border-slate-200"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" />
                              <span>{item.note ? 'Upravit pozn.' : '+ Poznámka'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteShoppingItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Rozbalovací řádek pro dopsání poznámky pod položku (např. "Alpro") */}
                        {isEditingNote && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={editingNoteValue}
                              onChange={(e) => setEditingNoteValue(e.target.value)}
                              placeholder="Upřesnění (např. Alpro, bez laktózy, 2 balení)..."
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveItemNote(item.id)}
                              className={`px-3 py-1.5 ${themeObj.primaryBtn} rounded-lg text-xs font-bold`}
                            >
                              Uložit
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteItemId(null)}
                              className="px-2 py-1.5 text-xs text-slate-500"
                            >
                              Zrušit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ============================================================================
          // ZÁLOŽKA 3: SKUTEČNÁ ADMINISTRACE & NASTAVENÍ
          // ============================================================================
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 1. Vzhled a název kalendáře */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Palette className={`w-5 h-5 ${themeObj.accentText}`} /> Vzhled stránky a barvy
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Název rodinného kalendáře v hlavičce
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={appSettings.familyTitle || ''}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, familyTitle: e.target.value }))}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => saveSettingsToCloud({ familyTitle: appSettings.familyTitle }, 'Název uložen')}
                    className={`px-4 py-2 ${themeObj.primaryBtn} rounded-xl text-xs font-bold`}
                  >
                    Uložit název
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Barevné téma celé aplikace
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(APP_THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => saveSettingsToCloud({ theme: key }, `Téma změněno: ${t.name}`)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        appSettings.theme === key
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{t.name}</span>
                      <span className={`w-5 h-5 rounded-full bg-gradient-to-tr ${t.headerGradient} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Správa členů rodiny (Jména, Fotky z mobilu, Barvy) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className={`w-5 h-5 ${themeObj.accentText}`} /> Členové rodiny, jména a fotky
                </h2>
                <p className="text-xs text-slate-500">
                  Tady můžete každému změnit jméno, barvu štítku v kalendáři nebo nahrát novou fotku přímo z mobilu.
                </p>
              </div>

              <div className="space-y-3">
                {categoriesWithStyles.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <SmartAvatar
                        customPhoto={member.customPhoto}
                        baseName={member.photoBase}
                        fallbackText={member.fallback}
                        bgClass={member.bg}
                        sizeClass="w-12 h-12"
                        textClass="text-sm"
                      />
                      <div className="space-y-1">
                        <input
                          type="text"
                          defaultValue={member.label}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value !== member.label) {
                              handleUpdateMember(member.id, { label: e.target.value.trim() });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 bg-white w-44"
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" /> Nahrát novou fotku
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(member.id, e.target.files?.[0])}
                            />
                          </label>
                          {member.customPhoto && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMember(member.id, { customPhoto: '' })}
                              className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                            >
                              <RotateCcw className="w-3 h-3" /> Původní fotka
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Výběr barvy člena */}
                    <div className="flex items-center gap-1.5">
                      {Object.entries(MEMBER_COLOR_PALETTE).map(([cKey, cVal]) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => handleUpdateMember(member.id, { colorKey: cKey })}
                          title={cVal.label}
                          className={`w-6 h-6 rounded-full ${cVal.bg} transition ${
                            member.colorKey === cKey ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Správa katalogu zboží a Emoji ikonek */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PackagePlus className={`w-5 h-5 ${themeObj.accentText}`} /> Katalog potravin a drogerie (s ikonkami)
                </h2>
                <p className="text-xs text-slate-500">
                  Přidejte si vlastní zboží a vyberte mu ikonku. Všechny položky se pak zobrazí v nákupním seznamu.
                </p>
              </div>

              <form onSubmit={handleAdminAddCatalogItem} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-bold uppercase text-slate-500">Přidat novou položku do katalogu</p>

                {/* Výběr Emoji ikonky */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">1. Vyber ikonku (nebo napiš vlastní emoji):</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={adminNewItemIcon}
                      onChange={(e) => setAdminNewItemIcon(e.target.value)}
                      className="w-14 h-10 text-center text-xl rounded-xl border border-slate-300 bg-white"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
                      {EMOJI_PRESETS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setAdminNewItemIcon(em)}
                          className={`w-8 h-8 rounded-lg text-lg shrink-0 flex items-center justify-center transition ${
                            adminNewItemIcon === em ? 'bg-indigo-600 text-white shadow-sm scale-110' : 'bg-white border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={adminNewItemName}
                    onChange={(e) => setAdminNewItemName(e.target.value)}
                    placeholder="2. Název (např. Mléko, Avokádo)..."
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                  <select
                    value={adminNewItemCategory}
                    onChange={(e) => setAdminNewItemCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-medium text-slate-700"
                  >
                    {SHOP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className={`py-2 px-4 ${themeObj.primaryBtn} font-bold rounded-xl text-sm shadow-sm`}
                  >
                    + Uložit do katalogu
                  </button>
                </div>
              </form>

              {/* Seznam existujících položek v katalogu */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">
                  Váš uložený katalog ({sortedCatalog.length} položek):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {sortedCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">{item.icon || '🛒'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.category} ({item.usageCount || 0}×)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdminDeleteCatalogItem(item.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Sdílené rodinné poznámky */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className={`w-5 h-5 ${themeObj.accentText}`} /> Sdílená rodinná nástěnka (pro oba telefony)
                </label>
                <button
                  type="button"
                  onClick={() => saveSettingsToCloud({ familyNotes: notesDraft }, 'Poznámky uloženy')}
                  className={`px-3.5 py-1.5 ${themeObj.primaryBtn} rounded-xl text-xs font-bold`}
                >
                  Uložit poznámky
                </button>
              </div>
              <textarea
                rows="4"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Zapište si sem čísla pojištěnek dětí, velikosti oblečení, STK..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
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
                  {categoriesWithStyles.map((cat) => (
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
                        customPhoto={cat.customPhoto}
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
                className={`w-full py-3 ${themeObj.primaryBtn} disabled:opacity-60 font-bold rounded-xl shadow-md transition`}
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
            activeTab === 'calendar' ? themeObj.activeNav : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          Kalendář
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 text-xs font-bold ${
            activeTab === 'shopping' ? themeObj.activeNav : 'text-slate-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          Nákupy ({shoppingList.filter((i) => !i.completed).length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 text-xs font-bold ${
            activeTab === 'settings' ? themeObj.activeNav : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          Nastavení
        </button>
      </nav>
    </div>
  );
}
