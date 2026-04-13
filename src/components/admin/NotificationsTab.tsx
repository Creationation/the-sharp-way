import { useState, useEffect } from "react";
import { Bell, Mail, Clock, ToggleLeft, ToggleRight, Send, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Settings {
  email_reminders: boolean;
  reminder_24h: boolean;
  reminder_5h: boolean;
  reminder_2h: boolean;
}

interface UpcomingBooking {
  id: string;
  barber_name: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  reminder_sent_24h: boolean;
  reminder_sent_5h: boolean;
  reminder_sent_2h: boolean;
  profiles: { email: string | null; full_name: string | null } | null;
}

const REMINDERS_DATA = [
  {
    key: "reminder_24h" as const,
    icon: "📅",
    label: { en: "24h before", de: "24 Stunden vorher" },
    desc:  { en: "The day before the appointment", de: "Am Abend vor dem Termin" },
  },
  {
    key: "reminder_5h" as const,
    icon: "⏰",
    label: { en: "5h before", de: "5 Stunden vorher" },
    desc:  { en: "Morning of the appointment", de: "Am Morgen des Termins" },
  },
  {
    key: "reminder_2h" as const,
    icon: "🔔",
    label: { en: "2h before", de: "2 Stunden vorher" },
    desc:  { en: "Last-minute reminder", de: "Kurzfristige Erinnerung" },
  },
];

interface Props {
  t: {
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
}

export default function NotificationsTab({ t }: Props) {
  const { lang } = useLanguage();
  const REMINDERS = REMINDERS_DATA.map(r => ({
    ...r,
    label: r.label[lang],
    desc: r.desc[lang],
  }));

  const [settings, setSettings] = useState<Settings>({
    email_reminders: true,
    reminder_24h: true,
    reminder_5h: true,
    reminder_2h: true,
  });
  const [upcoming, setUpcoming] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [settingsRes, bookingsRes] = await Promise.all([
      supabase.from("notification_settings").select("*").eq("id", 1).single(),
      supabase
        .from("bookings")
        .select("id, barber_name, service_name, booking_date, booking_time, reminder_sent_24h, reminder_sent_5h, reminder_sent_2h, profiles(email, full_name)")
        .eq("status", "confirmed")
        .gte("booking_date", new Date().toISOString().split("T")[0])
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true })
        .limit(20),
    ]);
    if (settingsRes.data) setSettings(settingsRes.data as Settings);
    if (bookingsRes.data) setUpcoming(bookingsRes.data as unknown as UpcomingBooking[]);
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("notification_settings")
      .update(settings)
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error(t.saveFailed);
    else toast.success(t.saved);
  };

  const toggle = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerTest = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("process-reminders");
    setTesting(false);
    if (error) {
      toast.error(t.functionError + ": " + error.message);
    } else {
      const result = data as { sent: number; results: string[] };
      toast.success(t.remindersSent(result.sent));
      fetchData();
    }
  };

  const getApptTime = (b: UpcomingBooking) => {
    return new Date(`${b.booking_date}T${b.booking_time}:00`);
  };

  const getReminderStatus = (b: UpcomingBooking) => {
    const appt = getApptTime(b);
    const now = new Date();
    const diff = appt.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return {
      "24h": { sent: b.reminder_sent_24h, upcoming: hours > 23 && hours <= 25 },
      "5h":  { sent: b.reminder_sent_5h,  upcoming: hours > 4.5 && hours <= 5.5 },
      "2h":  { sent: b.reminder_sent_2h,  upcoming: hours > 1.5 && hours <= 2.5 },
    };
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Master toggle */}
      <div className="card-app p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-copper" />
          <div>
            <p className="text-foreground text-sm font-semibold">{t.emailReminders}</p>
            <p className="text-muted-foreground text-xs">{t.emailRemindersDesc}</p>
          </div>
        </div>
        <button onClick={() => toggle("email_reminders")}>
          {settings.email_reminders
            ? <ToggleRight size={32} className="text-copper" />
            : <ToggleLeft size={32} className="text-muted-foreground" />}
        </button>
      </div>

      {/* Individual reminder toggles */}
      <div className={`space-y-2 transition-opacity ${settings.email_reminders ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {REMINDERS.map(r => (
          <div key={r.key} className="card-app px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.icon}</span>
              <div>
                <p className="text-foreground text-sm font-medium">{r.label}</p>
                <p className="text-muted-foreground text-xs">{r.desc}</p>
              </div>
            </div>
            <button onClick={() => toggle(r.key)}>
              {settings[r.key]
                ? <ToggleRight size={28} className="text-copper" />
                : <ToggleLeft size={28} className="text-muted-foreground" />}
            </button>
          </div>
        ))}
      </div>

      {/* Save + Test buttons */}
      <div className="flex gap-2">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex-1 gradient-copper text-primary-foreground font-semibold py-3 rounded-full shadow-copper disabled:opacity-50 text-sm"
        >
          {saving ? t.savingBtn : t.saveSettings}
        </button>
        <button
          onClick={triggerTest}
          disabled={testing}
          className="flex items-center gap-2 bg-surface border border-border text-foreground font-medium py-3 px-4 rounded-full text-sm disabled:opacity-50"
        >
          <Send size={14} />
          {testing ? "..." : t.runNow}
        </button>
      </div>

      {/* Info */}
      <div className="card-app p-4 border-copper/20">
        <p className="text-muted-foreground text-xs leading-relaxed">
          <span className="text-copper font-medium">{t.howItWorks}</span> {t.howItWorksDesc}
        </p>
      </div>

      {/* Upcoming bookings reminder status */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-copper" />
          <h3 className="text-foreground font-semibold text-sm">{t.upcomingTitle}</h3>
        </div>
        {upcoming.length === 0 ? (
          <div className="card-app p-6 text-center">
            <p className="text-muted-foreground text-sm">{t.noUpcoming}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => {
              const status = getReminderStatus(b);
              const appt = getApptTime(b);
              const email = b.profiles?.email ?? "—";
              return (
                <div key={b.id} className="card-app p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-foreground text-xs font-medium">{b.service_name} · {b.barber_name}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {format(appt, "dd/MM/yyyy")} · {b.booking_time} · {email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(["24h", "5h", "2h"] as const).map(key => {
                      const s = status[key];
                      return (
                        <span
                          key={key}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            s.sent
                              ? "bg-mint/20 text-mint"
                              : s.upcoming
                              ? "bg-copper/20 text-copper"
                              : "bg-surface text-muted-foreground"
                          }`}
                        >
                          {key} {s.sent ? "✓" : s.upcoming ? t.pending : "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
