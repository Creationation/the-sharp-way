export type Lang = "en" | "de";

export interface Translations {
  splash: {
    line1: string;
    line2: string;
    line3: string;
    sub: string;
    cta: string;
    walkin: string;
    pickLanguage: string;
  };
  nav: {
    home: string;
    explore: string;
    book: string;
    gallery: string;
    profile: string;
  };
  home: {
    announcement: string;
    announcementLink: string;
    greeting: string;
    location: string;
    searchPlaceholder: string;
    promoTitle: string;
    promoSub: string;
    bookNow: string;
    lastAppointment: string;
    lastService: string;
    rebook: string;
    ourBarbers: string;
    seeAll: string;
    quickBook: string;
    allServices: string;
    available: string;
    busy: string;
  };
  services: {
    title: string;
    allCat: string;
    bookBtn: string;
  };
  toasts: {
    signInToBook: string;
    bookingFailed: string;
    cancelError: string;
    bookingCancelled: string;
    cancelling: string;
    copied: string;
    accountCreated: string;
    welcomeBack: string;
  };
  common: {
    noAppointments: string;
    cancelled: string;
    cancelBooking: string;
    barberUnavailable: string;
  };
  booking: {
    title: string;
    selectBarber: string;
    availableSlots: string;
    selectTime: string;
    selectService: string;
    service: string;
    duration: string;
    barber: string;
    dateTime: string;
    total: string;
    confirm: string;
    saving: string;
    cancellation: string;
    booked: string;
    bookedWith: string;
    backHome: string;
    feb: string;
  };
  gallery: {
    title: string;
    filters: string[];
  };
  reviews: {
    title: string;
    count: string;
  };
  contact: {
    title: string;
    openNow: string;
    closesAt: string;
    directions: string;
    callUs: string;
    chatUs: string;
    days: string[];
    closed: string;
    copyright: string;
  };
  profile: {
    title: string;
    member: string;
    stampsLabel: (n: number) => string;
    points: string;
    earnPoints: string;
    redeem: string;
    myBookings: string;
    upcoming: string;
    past: string;
    noUpcoming: string;
    noPast: string;
    bookNow: string;
    with: string;
    referTitle: string;
    referSub: string;
    copy: string;
    adminDashboard: string;
    reviews: string;
    contact: string;
    about: string;
    language: string;
    gold: string;
  };
  admin: {
    title: string;
    bookings: string;
    availability: string;
    users: string;
    total: string;
    confirmed: string;
    cancelled: string;
    all: string;
    noBookings: string;
    with: string;
    cancel: string;
    confirm: string;
    delete: string;
    dayOff: string;
    closeDayFor: (name: string) => string;
    available: string;
    clientBooked: string;
    blocked: string;
    saving: string;
    saveAvailability: string;
    slotHint: string;
    savedSuccess: string;
    saveFailed: string;
    loadFailed: string;
    statusUpdated: string;
    updateError: string;
    bookingDeleted: string;
    deleteError: string;
    bookingCancelled: string;
    usersTab: {
      title: string;
      search: string;
      totalUsers: string;
      name: string;
      email: string;
      phone: string;
      joined: string;
      noUsers: string;
      noPhone: string;
      noName: string;
      loadError: string;
    };
  };
  barber: {
    cuts: string;
    experience: string;
    status: string;
    topRated: string;
    services: string;
    recentWork: string;
    bookWith: (name: string) => string;
    reviews: string;
    yrs: string;
  };
}

const en: Translations = {
  splash: {
    line1: "DISCOVER TOP",
    line2: "BARBERS & BOOK",
    line3: "YOUR LOOK INSTANTLY.",
    sub: "Vienna's premium barbershop. Walk in or book ahead.",
    cta: "Get Started",
    walkin: "Or walk in anytime · Tue–Sat 10:00–20:00",
    pickLanguage: "Choose your language",
  },
  nav: {
    home: "Home",
    explore: "Explore",
    book: "Book",
    gallery: "Gallery",
    profile: "Profile",
  },
  home: {
    announcement: "New: Hot Towel Shave now available —",
    announcementLink: "Book Today",
    greeting: "Hi, Sharp Client",
    location: "Vienna, AT",
    searchPlaceholder: "Search barbers, styles, services...",
    promoTitle: "Upgrade Your Style ✂️",
    promoSub: "First visit? Get 20% OFF — code: SHARP20",
    bookNow: "Book Now",
    lastAppointment: "Your Last Appointment",
    lastService: "Fade & Taper with Marco",
    rebook: "Rebook",
    ourBarbers: "Our Barbers",
    seeAll: "See all",
    quickBook: "Quick Book",
    allServices: "All services",
    available: "Available",
    busy: "Busy",
  },
  services: {
    title: "Services",
    allCat: "All",
    bookBtn: "Book This Service",
  },
  toasts: {
    signInToBook: "Sign in to book an appointment",
    bookingFailed: "Booking failed. Please try again.",
    cancelError: "Failed to cancel booking",
    bookingCancelled: "Booking cancelled",
    cancelling: "Cancelling...",
    copied: "Copied!",
    accountCreated: "Account created!",
    welcomeBack: "Welcome back!",
  },
  common: {
    noAppointments: "No appointments yet",
    cancelled: "Cancelled",
    cancelBooking: "Cancel booking",
    barberUnavailable: "This barber is not available on this day",
  },
  booking: {
    title: "Book Now",
    selectBarber: "SELECT BARBER",
    availableSlots: "AVAILABLE SLOTS",
    selectTime: "SELECT TIME",
    selectService: "SELECT SERVICE",
    service: "Service",
    duration: "Duration",
    barber: "Barber",
    dateTime: "Date & Time",
    total: "Total",
    confirm: "Confirm Booking →",
    saving: "Booking...",
    cancellation: "Free cancellation up to 2 hours before",
    booked: "You're Booked!",
    bookedWith: "with",
    backHome: "Back to Home",
    feb: "FEB",
  },
  gallery: {
    title: "The Art of the Cut",
    filters: ["All", "Fades", "Beards", "Classic", "Women", "Design"],
  },
  reviews: {
    title: "Reviews",
    count: "312 reviews",
  },
  contact: {
    title: "Find Us",
    openNow: "Open Now",
    closesAt: "· Closes at 8PM",
    directions: "Get Directions",
    callUs: "Call us",
    chatUs: "Chat with us",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    closed: "Closed",
    copyright: "© 2026 The Sharp Cut. All rights reserved.",
  },
  profile: {
    title: "Profile",
    member: "THE SHARP CUT MEMBER",
    stampsLabel: (n) => `${n}/10 — Every 10th cut is FREE ✂️`,
    points: "450 Sharp Points",
    earnPoints: "Earn 50 pts per visit",
    redeem: "Redeem →",
    myBookings: "My Bookings",
    upcoming: "Upcoming",
    past: "Past",
    noUpcoming: "No upcoming appointments",
    noPast: "No past appointments",
    bookNow: "Book now →",
    with: "with",
    referTitle: "Refer a Friend",
    referSub: "Give €10, Get €10. Share your code",
    copy: "Copy",
    adminDashboard: "Admin Dashboard",
    reviews: "Reviews",
    contact: "Contact Us",
    about: "About The Sharp Cut",
    language: "Language",
    gold: "Gold",
  },
  admin: {
    users: "Users",
    usersTab: {
      title: "Users",
      search: "Search by name, email, phone...",
      totalUsers: "Total Users",
      name: "Name",
      email: "Email",
      phone: "Phone",
      joined: "Joined",
      noUsers: "No users found",
      noPhone: "No phone",
      noName: "No name",
      loadError: "Failed to load users",
    },
  },
  barber: {
    cuts: "Cuts",
    experience: "Experience",
    status: "Status",
    topRated: "Top Rated",
    services: "Services",
    recentWork: "Recent Work",
    bookWith: (name) => `Book with ${name} →`,
    reviews: "reviews",
    yrs: "yrs",
  },
};

const de: Translations = {
  splash: {
    line1: "ENTDECKE TOP",
    line2: "BARBIERE & BUCHE",
    line3: "DEINEN LOOK SOFORT.",
    sub: "Wiens Premium Barbershop. Einfach vorbeikommen oder vorab buchen.",
    cta: "Jetzt starten",
    walkin: "Oder komm einfach vorbei · Di–Sa 10:00–20:00",
    pickLanguage: "Wähle deine Sprache",
  },
  nav: {
    home: "Home",
    explore: "Entdecken",
    book: "Buchen",
    gallery: "Galerie",
    profile: "Profil",
  },
  home: {
    announcement: "Neu: Hot Towel Rasur jetzt verfügbar —",
    announcementLink: "Heute buchen",
    greeting: "Hallo, Sharp Client",
    location: "Wien, AT",
    searchPlaceholder: "Barbiere, Styles, Services suchen...",
    promoTitle: "Style Upgrade ✂️",
    promoSub: "Erstbesuch? 20% Rabatt — Code: SHARP20",
    bookNow: "Jetzt buchen",
    lastAppointment: "Dein letzter Termin",
    lastService: "Fade & Taper mit Marco",
    rebook: "Erneut buchen",
    ourBarbers: "Unsere Barbiere",
    seeAll: "Alle anzeigen",
    quickBook: "Schnellbuchung",
    allServices: "Alle Services",
    available: "Verfügbar",
    busy: "Besetzt",
  },
  services: {
    title: "Leistungen",
    allCat: "Alle",
    bookBtn: "Service buchen",
  },
  toasts: {
    signInToBook: "Melde dich an, um einen Termin zu buchen",
    bookingFailed: "Buchung fehlgeschlagen. Bitte versuche es erneut.",
    cancelError: "Fehler beim Stornieren",
    bookingCancelled: "Termin storniert",
    cancelling: "Wird storniert...",
    copied: "Kopiert!",
    accountCreated: "Konto erstellt!",
    welcomeBack: "Willkommen zurück!",
  },
  common: {
    noAppointments: "Noch keine Termine",
    cancelled: "Storniert",
    cancelBooking: "Termin stornieren",
    barberUnavailable: "Dieser Barbier ist heute nicht verfügbar",
  },
  booking: {
    title: "Jetzt buchen",
    selectBarber: "BARBIER WÄHLEN",
    availableSlots: "VERFÜGBARE TERMINE",
    selectTime: "UHRZEIT WÄHLEN",
    selectService: "SERVICE WÄHLEN",
    service: "Service",
    duration: "Dauer",
    barber: "Barbier",
    dateTime: "Datum & Uhrzeit",
    total: "Gesamt",
    confirm: "Termin bestätigen →",
    saving: "Wird gebucht...",
    cancellation: "Kostenlose Stornierung bis 2 Stunden vorher",
    booked: "Gebucht!",
    bookedWith: "mit",
    backHome: "Zurück zur Startseite",
    feb: "FEB",
  },
  gallery: {
    title: "Die Kunst des Schnitts",
    filters: ["Alle", "Fades", "Bärte", "Klassisch", "Frauen", "Design"],
  },
  reviews: {
    title: "Bewertungen",
    count: "312 Bewertungen",
  },
  contact: {
    title: "Finde uns",
    openNow: "Jetzt geöffnet",
    closesAt: "· Schließt um 20:00",
    directions: "Route berechnen",
    callUs: "Anrufen",
    chatUs: "Schreib uns",
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    closed: "Geschlossen",
    copyright: "© 2026 The Sharp Cut. Alle Rechte vorbehalten.",
  },
  profile: {
    title: "Profil",
    member: "THE SHARP CUT MITGLIED",
    stampsLabel: (n) => `${n}/10 — Jede 10. Coupe ist GRATIS ✂️`,
    points: "450 Sharp Points",
    earnPoints: "50 Punkte pro Besuch",
    redeem: "Einlösen →",
    myBookings: "Meine Buchungen",
    upcoming: "Bevorstehend",
    past: "Vergangen",
    noUpcoming: "Keine bevorstehenden Termine",
    noPast: "Keine vergangenen Termine",
    bookNow: "Jetzt buchen →",
    with: "mit",
    referTitle: "Freund einladen",
    referSub: "€10 verschenken, €10 erhalten. Teile deinen Code",
    copy: "Kopieren",
    adminDashboard: "Admin Dashboard",
    reviews: "Bewertungen",
    contact: "Kontakt",
    about: "Über The Sharp Cut",
    language: "Sprache",
    gold: "Gold",
  },
  admin: {
    users: "Kunden",
    usersTab: {
      title: "Kunden",
      search: "Nach Name, E-Mail, Telefon suchen...",
      totalUsers: "Kunden gesamt",
      name: "Name",
      email: "E-Mail",
      phone: "Telefon",
      joined: "Beigetreten",
      noUsers: "Keine Kunden gefunden",
      noPhone: "Kein Telefon",
      noName: "Kein Name",
      loadError: "Fehler beim Laden der Kunden",
    },
  },
  barber: {
    cuts: "Schnitte",
    experience: "Erfahrung",
    status: "Status",
    topRated: "Top bewertet",
    services: "Leistungen",
    recentWork: "Aktuelle Arbeiten",
    bookWith: (name) => `Mit ${name} buchen →`,
    reviews: "Bewertungen",
    yrs: "J.",
  },
};

export const translations: Record<Lang, Translations> = { en, de };
