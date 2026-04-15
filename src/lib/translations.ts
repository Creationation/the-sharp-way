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
    nextAppointment: string;
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
    cancelledFree: string;
    cancelledCharged: string;
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
    confirmCancelTitle: string;
    confirmCancelFree: string;
    confirmCancelCharged: string;
    confirmCancelBtn: string;
    cancelBtn: string;
    paymentStatus: string;
    paymentVerified: string;
    paymentCharged: string;
    paymentReleased: string;
    paymentPending: string;
    paymentFailed: string;
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
    moreDates: string;
    closedDay: string;
    promoCode: string;
    applyCode: string;
    promoApplied: string;
    promoInvalid: string;
    promoExpired: string;
    discount: string;
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
    closedNow: string;
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
    claimReward: string;
    rewardPending: string;
    rewardClaimed: string;
    freeCutReady: string;
  };
  admin: {
    title: string;
    bookings: string;
    availability: string;
    users: string;
    promotions: string;
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
    attendanceQuestion: string;
    markAttended: string;
    markNoShow: string;
    stampAwarded: string;
    noShow: string;
    allBarbers: string;
    calendarLegend: string;
    bookings1to5: string;
    bookings6to10: string;
    bookingsOver10: string;
    noBookingsDay: string;
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
    promosTab: {
      banner: string;
      promoCard: string;
      active: string;
      inactive: string;
      titleEn: string;
      titleDe: string;
      subtitleEn: string;
      subtitleDe: string;
      linkTextEn: string;
      linkTextDe: string;
      save: string;
      saved: string;
      saveError: string;
      loadError: string;
    };
    barbersTab: {
      title: string;
      name: string;
      specialtyEn: string;
      specialtyDe: string;
      rating: string;
      cuts: string;
      years: string;
      imageKey: string;
      available: string;
      unavailable: string;
      addBarber: string;
      save: string;
      saved: string;
      saveError: string;
      deleted: string;
      deleteError: string;
      loadError: string;
      confirmDelete: string;
      changePhoto: string;
      photoUploaded: string;
      color: string;
    };
    scheduleTab: {
      title: string;
      exportCsv: string;
      noBookings: string;
      hour: string;
    };
    promoCodesTab: {
      title: string;
      code: string;
      description: string;
      discountType: string;
      percentage: string;
      fixed: string;
      discountValue: string;
      maxUses: string;
      unlimited: string;
      uses: string;
      expiresAt: string;
      noExpiry: string;
      active: string;
      inactive: string;
      addCode: string;
      save: string;
      saved: string;
      saveError: string;
      deleted: string;
      deleteError: string;
      loadError: string;
      confirmDelete: string;
      stripeReady: string;
      stripeCouponId: string;
    };
    loyaltyTab: {
      title: string;
      search: string;
      stamps: string;
      points: string;
      freeCuts: string;
      save: string;
      saved: string;
      saveError: string;
      loadError: string;
      noUsers: string;
      stampsOf10: string;
    };
    notificationsTab: {
      title: string;
      emailReminders: string;
      emailRemindersDesc: string;
      savingBtn: string;
      saveSettings: string;
      saved: string;
      saveFailed: string;
      runNow: string;
      howItWorks: string;
      howItWorksDesc: string;
      upcomingTitle: string;
      noUpcoming: string;
      pending: string;
      functionError: string;
      remindersSent: (n: number) => string;
    };
    rewardsTab: {
      title: string;
      pending: string;
      approved: string;
      rejected: string;
      noRequests: string;
      approve: string;
      reject: string;
      requestedOn: string;
      stampsAtRequest: string;
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
  auth: {
    signIn: string;
    createAccount: string;
    welcomeBack: string;
    joinCommunity: string;
    fullName: string;
    email: string;
    password: string;
    loading: string;
    noAccount: string;
    hasAccount: string;
    signUp: string;
    errorDefault: string;
  };
  explore: {
    title: string;
    subtitle: string;
    headBarber: string;
    womenSpecialist: string;
    book: string;
  };
}

const en: Translations = {
  splash: {
    line1: "DISCOVER TOP",
    line2: "BARBERS & BOOK",
    line3: "YOUR LOOK INSTANTLY.",
    sub: "Vienna's premium barbershop. Walk in or book ahead.",
    cta: "Get Started",
    walkin: "Or walk in anytime · Tue–Sat 09:00–19:00",
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
    announcement: "New: Hot Towel Shave now available",
    announcementLink: "Book Today",
    greeting: "Hi, Sharp Client",
    location: "Vienna, AT",
    searchPlaceholder: "Search barbers, styles, services...",
    promoTitle: "Upgrade Your Style ✂️",
    promoSub: "First visit? Get 20% OFF · code: SHARP20",
    bookNow: "Book Now",
    lastAppointment: "Your Last Appointment",
    nextAppointment: "Your Next Appointment",
    lastService: "Fade & Taper with Ibo",
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
    cancelledFree: "Booking cancelled · no charge.",
    cancelledCharged: "Booking cancelled · €5 deposit was charged.",
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
    confirmCancelTitle: "Cancel booking?",
    confirmCancelFree: "This booking can be cancelled free of charge (more than 24h before the appointment).",
    confirmCancelCharged: "Less than 24 hours before the appointment · the €5 deposit will be charged.",
    confirmCancelBtn: "Yes, cancel",
    cancelBtn: "Back",
    paymentStatus: "Payment",
    paymentVerified: "Verified",
    paymentCharged: "Charged",
    paymentReleased: "Released",
    paymentPending: "Pending",
    paymentFailed: "Failed",
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
    moreDates: "More dates",
    closedDay: "Closed on this day",
    promoCode: "Promo Code",
    applyCode: "Apply",
    promoApplied: "Promo code applied!",
    promoInvalid: "Invalid promo code",
    promoExpired: "This promo code has expired",
    discount: "Discount",
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
    closesAt: "· Closes at 7PM",
    closedNow: "Closed",
    directions: "Get Directions",
    callUs: "Call us",
    chatUs: "Chat with us",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    closed: "Closed",
    copyright: "© 2026 Sitdown Wien. All rights reserved.",
  },
  profile: {
    title: "Profile",
    member: "SITDOWN WIEN MEMBER",
    stampsLabel: (n) => `${n}/10 · Every 10th cut is FREE ✂️`,
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
    about: "About Sitdown Wien",
    language: "Language",
    gold: "Gold",
    claimReward: "🎁 Claim your FREE cut!",
    rewardPending: "⏳ Reward request pending...",
    rewardClaimed: "Reward requested!",
    freeCutReady: "You've earned a FREE cut! Tap to claim.",
  },
  admin: {
    title: "Admin Dashboard",
    bookings: "Bookings",
    availability: "Availability",
    users: "Users",
    promotions: "Promotions",
    total: "Total",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    all: "All",
    noBookings: "No bookings",
    with: "with",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    dayOff: "Day Off",
    closeDayFor: (name) => `Close entire day for ${name}`,
    available: "Available",
    clientBooked: "Client booked",
    blocked: "Blocked",
    saving: "Saving...",
    saveAvailability: "Save Availability",
    slotHint: "Click a slot to block/unblock it. Client bookings (amber) cannot be modified here.",
    savedSuccess: "Availability saved",
    saveFailed: "Failed to save availability",
    loadFailed: "Failed to load bookings",
    statusUpdated: "Status updated",
    updateError: "Error updating booking",
    bookingDeleted: "Booking deleted",
    deleteError: "Error deleting booking",
    bookingCancelled: "Booking cancelled",
    attendanceQuestion: "Attended?",
    markAttended: "Yes · Stamp",
    markNoShow: "No-Show",
    stampAwarded: "Stamp awarded ✓",
    noShow: "No-Show",
    allBarbers: "All Barbers",
    calendarLegend: "Legend",
    bookings1to5: "1–5 bookings",
    bookings6to10: "6–10 bookings",
    bookingsOver10: "10+ bookings",
    noBookingsDay: "No bookings",
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
    promosTab: {
      banner: "Announcement Banner",
      promoCard: "Promo Card",
      active: "Active",
      inactive: "Inactive",
      titleEn: "Title (EN)",
      titleDe: "Title (DE)",
      subtitleEn: "Subtitle (EN)",
      subtitleDe: "Subtitle (DE)",
      linkTextEn: "Button Text (EN)",
      linkTextDe: "Button Text (DE)",
      save: "Save",
      saved: "Saved successfully",
      saveError: "Error saving",
      loadError: "Failed to load promotions",
    },
    barbersTab: {
      title: "Barbers",
      name: "Name",
      specialtyEn: "Specialty (EN)",
      specialtyDe: "Specialty (DE)",
      rating: "Rating",
      cuts: "Cuts",
      years: "Years",
      imageKey: "Photo",
      available: "Available",
      unavailable: "Unavailable",
      addBarber: "Add Barber",
      save: "Save",
      saved: "Saved successfully",
      saveError: "Error saving",
      deleted: "Barber deleted",
      deleteError: "Error deleting",
      loadError: "Failed to load barbers",
      confirmDelete: "Are you sure you want to delete this barber?",
      changePhoto: "Change Photo",
      photoUploaded: "Photo uploaded!",
      color: "Color",
    },
    scheduleTab: {
      title: "Schedule",
      exportCsv: "Export CSV",
      noBookings: "No bookings",
      hour: "Hour",
    },
    promoCodesTab: {
      title: "Promo Codes",
      code: "Code",
      description: "Description",
      discountType: "Discount Type",
      percentage: "Percentage (%)",
      fixed: "Fixed Amount (€)",
      discountValue: "Value",
      maxUses: "Max Uses",
      unlimited: "Unlimited",
      uses: "Uses",
      expiresAt: "Expires",
      noExpiry: "No expiry",
      active: "Active",
      inactive: "Inactive",
      addCode: "Add Promo Code",
      save: "Save",
      saved: "Saved successfully",
      saveError: "Error saving",
      deleted: "Promo code deleted",
      deleteError: "Error deleting",
      loadError: "Failed to load promo codes",
      confirmDelete: "Are you sure you want to delete this promo code?",
      stripeReady: "Stripe-ready (coupon ID will sync when connected)",
      stripeCouponId: "Stripe Coupon ID",
    },
    loyaltyTab: {
      title: "Loyalty",
      search: "Search by name or email...",
      stamps: "Stamps",
      points: "Sharp Points",
      freeCuts: "Free Cuts Earned",
      save: "Save",
      saved: "Loyalty updated",
      saveError: "Error saving loyalty",
      loadError: "Failed to load loyalty data",
      noUsers: "No users found",
      stampsOf10: "every 10th cut free",
    },
    notificationsTab: {
      title: "Notifications",
      emailReminders: "Email Reminders",
      emailRemindersDesc: "Send reminder emails to all clients",
      savingBtn: "Saving...",
      saveSettings: "Save Settings",
      saved: "Settings saved",
      saveFailed: "Failed to save settings",
      runNow: "Run Now",
      howItWorks: "How it works:",
      howItWorksDesc: "The reminder engine runs automatically every 30 minutes via a cron job. Each email is sent once per booking and tracked to avoid duplicates. Emails are independent from phone notifications.",
      upcomingTitle: "Upcoming · Reminder Status",
      noUpcoming: "No upcoming confirmed bookings",
      pending: "pending",
      functionError: "Function error",
      remindersSent: (n) => `${n} reminder(s) sent`,
    },
    rewardsTab: {
      title: "Rewards",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      noRequests: "No reward requests",
      approve: "Approve",
      reject: "Reject",
      requestedOn: "Requested on",
      stampsAtRequest: "Stamps at request",
      loadError: "Failed to load reward requests",
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
  auth: {
    signIn: "Sign In",
    createAccount: "Create Account",
    welcomeBack: "Welcome back.",
    joinCommunity: "Join the community.",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    loading: "Loading...",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    signUp: "Sign Up",
    errorDefault: "Something went wrong",
  },
  explore: {
    title: "Our Barbers",
    subtitle: "The Sharp Cut · Vienna 1220",
    headBarber: "Head Barber",
    womenSpecialist: "Women's Specialist",
    book: "Book",
  },
};

const de: Translations = {
  splash: {
    line1: "ENTDECKE TOP",
    line2: "BARBIERE & BUCHE",
    line3: "DEINEN LOOK SOFORT.",
    sub: "Wiens Premium Barbershop. Einfach vorbeikommen oder vorab buchen.",
    cta: "Jetzt starten",
    walkin: "Oder komm einfach vorbei · Di–Sa 09:00–19:00",
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
    announcement: "Neu: Hot Towel Rasur jetzt verfügbar",
    announcementLink: "Heute buchen",
    greeting: "Hallo, Sharp Client",
    location: "Wien, AT",
    searchPlaceholder: "Barbiere, Styles, Services suchen...",
    promoTitle: "Style Upgrade ✂️",
    promoSub: "Erstbesuch? 20% Rabatt · Code: SHARP20",
    bookNow: "Jetzt buchen",
    lastAppointment: "Dein letzter Termin",
    nextAppointment: "Dein nächster Termin",
    lastService: "Fade & Taper mit Ibo",
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
    cancelledFree: "Termin storniert · keine Gebühr.",
    cancelledCharged: "Termin storniert · 5 € Kaution wurde abgebucht.",
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
    confirmCancelTitle: "Termin stornieren?",
    confirmCancelFree: "Dieser Termin kann kostenlos storniert werden (mehr als 24 Std. vor dem Termin).",
    confirmCancelCharged: "Weniger als 24 Stunden vor dem Termin · die 5 € Kaution wird abgebucht.",
    confirmCancelBtn: "Ja, stornieren",
    cancelBtn: "Zurück",
    paymentStatus: "Zahlung",
    paymentVerified: "Verifiziert",
    paymentCharged: "Abgebucht",
    paymentReleased: "Freigegeben",
    paymentPending: "Ausstehend",
    paymentFailed: "Fehlgeschlagen",
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
    moreDates: "Weitere Termine",
    closedDay: "An diesem Tag geschlossen",
    promoCode: "Promo-Code",
    applyCode: "Einlösen",
    promoApplied: "Promo-Code angewendet!",
    promoInvalid: "Ungültiger Promo-Code",
    promoExpired: "Dieser Promo-Code ist abgelaufen",
    discount: "Rabatt",
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
    closesAt: "· Schließt um 19:00 Uhr",
    closedNow: "Geschlossen",
    directions: "Route berechnen",
    callUs: "Anrufen",
    chatUs: "Schreib uns",
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    closed: "Geschlossen",
    copyright: "© 2026 Sitdown Wien. Alle Rechte vorbehalten.",
  },
  profile: {
    title: "Profil",
    member: "SITDOWN WIEN MITGLIED",
    stampsLabel: (n) => `${n}/10 · Jede 10. Coupe ist GRATIS ✂️`,
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
    adminDashboard: "Admin-Bereich",
    reviews: "Bewertungen",
    contact: "Kontakt",
    about: "Über Sitdown Wien",
    language: "Sprache",
    gold: "Gold",
    claimReward: "🎁 Gratis-Schnitt einlösen!",
    rewardPending: "⏳ Anfrage wird bearbeitet...",
    rewardClaimed: "Belohnung angefragt!",
    freeCutReady: "Du hast einen GRATIS-Schnitt verdient! Tippe zum Einlösen.",
  },
  admin: {
    title: "Admin-Bereich",
    bookings: "Buchungen",
    availability: "Verfügbarkeit",
    users: "Kunden",
    promotions: "Aktionen",
    total: "Gesamt",
    confirmed: "Bestätigt",
    cancelled: "Storniert",
    all: "Alle",
    noBookings: "Keine Buchungen",
    with: "mit",
    cancel: "Stornieren",
    confirm: "Bestätigen",
    delete: "Löschen",
    dayOff: "Freier Tag",
    closeDayFor: (name) => `Ganzen Tag schließen für ${name}`,
    available: "Verfügbar",
    clientBooked: "Kundenreservierung",
    blocked: "Gesperrt",
    saving: "Speichern...",
    saveAvailability: "Verfügbarkeit speichern",
    slotHint: "Klicke auf einen Slot, um ihn zu sperren oder freizugeben. Kundenbuchungen (gelb markiert) können hier nicht geändert werden.",
    savedSuccess: "Verfügbarkeit gespeichert",
    saveFailed: "Fehler beim Speichern der Verfügbarkeit",
    loadFailed: "Fehler beim Laden der Buchungen",
    statusUpdated: "Status aktualisiert",
    updateError: "Fehler beim Aktualisieren der Buchung",
    bookingDeleted: "Buchung gelöscht",
    deleteError: "Fehler beim Löschen der Buchung",
    bookingCancelled: "Buchung storniert",
    attendanceQuestion: "Erschienen?",
    markAttended: "Ja · Stempel",
    markNoShow: "Nicht erschienen",
    stampAwarded: "Stempel vergeben ✓",
    noShow: "Nicht erschienen",
    allBarbers: "Alle Barbiere",
    calendarLegend: "Legende",
    bookings1to5: "1–5 Termine",
    bookings6to10: "6–10 Termine",
    bookingsOver10: "10+ Termine",
    noBookingsDay: "Keine Termine",
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
    promosTab: {
      banner: "Ankündigungsbanner",
      promoCard: "Promo-Karte",
      active: "Aktiv",
      inactive: "Inaktiv",
      titleEn: "Titel (EN)",
      titleDe: "Titel (DE)",
      subtitleEn: "Untertitel (EN)",
      subtitleDe: "Untertitel (DE)",
      linkTextEn: "Button-Text (EN)",
      linkTextDe: "Button-Text (DE)",
      save: "Speichern",
      saved: "Erfolgreich gespeichert",
      saveError: "Fehler beim Speichern",
      loadError: "Fehler beim Laden der Aktionen",
    },
    barbersTab: {
      title: "Barbiere",
      name: "Name",
      specialtyEn: "Spezialität (EN)",
      specialtyDe: "Spezialität (DE)",
      rating: "Bewertung",
      cuts: "Schnitte",
      years: "Jahre",
      imageKey: "Foto",
      available: "Verfügbar",
      unavailable: "Nicht verfügbar",
      addBarber: "Barbier hinzufügen",
      save: "Speichern",
      saved: "Erfolgreich gespeichert",
      saveError: "Fehler beim Speichern",
      deleted: "Barbier gelöscht",
      deleteError: "Fehler beim Löschen",
      loadError: "Fehler beim Laden der Barbiere",
      confirmDelete: "Möchtest du diesen Barbier wirklich löschen?",
      changePhoto: "Foto ändern",
      photoUploaded: "Foto hochgeladen!",
      color: "Farbe",
    },
    scheduleTab: {
      title: "Tagesplan",
      exportCsv: "CSV exportieren",
      noBookings: "Keine Termine",
      hour: "Uhrzeit",
    },
    promoCodesTab: {
      title: "Promo-Codes",
      code: "Code",
      description: "Beschreibung",
      discountType: "Rabattart",
      percentage: "Prozent (%)",
      fixed: "Fester Betrag (€)",
      discountValue: "Wert",
      maxUses: "Max. Nutzungen",
      unlimited: "Unbegrenzt",
      uses: "Nutzungen",
      expiresAt: "Ablaufdatum",
      noExpiry: "Kein Ablauf",
      active: "Aktiv",
      inactive: "Inaktiv",
      addCode: "Promo-Code hinzufügen",
      save: "Speichern",
      saved: "Erfolgreich gespeichert",
      saveError: "Fehler beim Speichern",
      deleted: "Promo-Code gelöscht",
      deleteError: "Fehler beim Löschen",
      loadError: "Fehler beim Laden der Promo-Codes",
      confirmDelete: "Möchtest du diesen Promo-Code wirklich löschen?",
      stripeReady: "Stripe-bereit (Coupon-ID wird bei Verbindung synchronisiert)",
      stripeCouponId: "Stripe-Coupon-ID",
    },
    loyaltyTab: {
      title: "Treueprogramm",
      search: "Nach Name oder E-Mail suchen...",
      stamps: "Stempel",
      points: "Sharp Points",
      freeCuts: "Gratis-Schnitte",
      save: "Speichern",
      saved: "Treuedaten aktualisiert",
      saveError: "Fehler beim Speichern",
      loadError: "Fehler beim Laden der Treuedaten",
      noUsers: "Keine Benutzer gefunden",
      stampsOf10: "jeder 10. Schnitt gratis",
    },
    notificationsTab: {
      title: "Benachrichtigungen",
      emailReminders: "E-Mail-Erinnerungen",
      emailRemindersDesc: "Erinnerungs-E-Mails an alle Kunden senden",
      savingBtn: "Speichern...",
      saveSettings: "Einstellungen speichern",
      saved: "Einstellungen gespeichert",
      saveFailed: "Fehler beim Speichern der Einstellungen",
      runNow: "Jetzt ausführen",
      howItWorks: "So funktioniert's:",
      howItWorksDesc: "Die Erinnerungs-Engine läuft automatisch alle 30 Minuten über einen Cron-Job. Jede E-Mail wird einmalig pro Buchung gesendet und verfolgt, um Duplikate zu vermeiden. E-Mails sind unabhängig von Telefon-Benachrichtigungen.",
      upcomingTitle: "Bevorstehend · Erinnerungsstatus",
      noUpcoming: "Keine bevorstehenden bestätigten Buchungen",
      pending: "ausstehend",
      functionError: "Funktionsfehler",
      remindersSent: (n) => `${n} Erinnerung(en) gesendet`,
    },
    rewardsTab: {
      title: "Belohnungen",
      pending: "Ausstehend",
      approved: "Genehmigt",
      rejected: "Abgelehnt",
      noRequests: "Keine Belohnungsanfragen",
      approve: "Genehmigen",
      reject: "Ablehnen",
      requestedOn: "Angefragt am",
      stampsAtRequest: "Stempel bei Anfrage",
      loadError: "Fehler beim Laden der Anfragen",
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
  auth: {
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    welcomeBack: "Willkommen zurück.",
    joinCommunity: "Werde Teil der Community.",
    fullName: "Vollständiger Name",
    email: "E-Mail",
    password: "Passwort",
    loading: "Laden...",
    noAccount: "Noch kein Konto?",
    hasAccount: "Bereits ein Konto?",
    signUp: "Registrieren",
    errorDefault: "Ein Fehler ist aufgetreten",
  },
  explore: {
    title: "Unsere Barbiere",
    subtitle: "The Sharp Cut · Wien 1220",
    headBarber: "Chef Barbier",
    womenSpecialist: "Frauen Spezialistin",
    book: "Buchen",
  },
};

export const translations: Record<Lang, Translations> = { en, de };
