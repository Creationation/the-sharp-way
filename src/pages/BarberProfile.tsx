import { ArrowLeft, Star, MapPin, Share2, CalendarDays, Plane } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBarbers } from "@/hooks/useBarbers";
import { useBarberPhotos } from "@/hooks/useBarberPhotos";
import { useBarberSchedule } from "@/hooks/useBarberSchedule";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";


import { useServices, formatServicePrice } from "@/hooks/useServices";

const BarberProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { barbers, loading } = useBarbers();
  const { services } = useServices();
  const fallbackWork = [gallery1, gallery2, gallery3];

  const barber = barbers.find(b => b.id === id) || barbers[0];
  const { photos } = useBarberPhotos(barber?.id);
  const { hours, absences } = useBarberSchedule(barber?.id);

  if (loading || barbers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const de = lang === "de";
  const specialty = de ? barber.specialty_de : barber.specialty_en;
  const recentWork = photos.length > 0
    ? photos.map(p => p.image_url)
    : fallbackWork;

  const DAY_LABELS = de
    ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const hourFor = (wd: number) => hours.find(h => h.weekday === wd);
  const hhmm = (v: string) => String(v).slice(0, 5);
  const fmtDate = (v: string) => format(parseISO(v), "dd.MM.yyyy");

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero image */}
      <div className="relative h-[50vh]">
        <img src={barber.image} alt={barber.name} className="w-full h-full object-cover object-top" />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Back + share */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Share2 size={18} className="text-foreground" />
          </button>
        </div>

        {/* Barber info overlay */}
        <div className="absolute bottom-6 left-5 right-5">
          <h1 className="font-heading text-4xl text-foreground">{barber.name}</h1>
          <p className="text-copper text-sm font-medium mb-2">{specialty}</p>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-copper fill-copper" />
              <span className="text-foreground font-medium">{barber.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={12} />
              <span>Vienna</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: `${barber.cuts.toLocaleString(de ? "de-DE" : "en-US")}+`, label: t.barber.cuts },
            { value: `${barber.years} ${t.barber.yrs}`, label: t.barber.experience },
            { value: t.barber.topRated, label: t.barber.status },
          ].map(s => (
            <div key={s.label} className="card-app p-3 text-center">
              <p className="text-copper font-heading text-xl">{s.value}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Arbeitstage & Abwesenheiten */}
      <div className="px-5 mb-6 space-y-3">
        <div className="card-app p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-copper" />
            <h3 className="font-heading text-base text-foreground">
              {de ? "Arbeitstage" : "Working days"}
            </h3>
          </div>
          {hours.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {de ? "Zeiten auf Anfrage" : "Hours on request"}
            </p>
          ) : (
            <div className="space-y-1.5">
              {weekOrder.map(wd => {
                const h = hourFor(wd);
                const open = h?.active;
                return (
                  <div key={wd} className="flex items-center justify-between text-xs">
                    <span className={open ? "text-foreground" : "text-muted-foreground"}>
                      {DAY_LABELS[wd]}
                    </span>
                    <span className={open ? "text-mint font-medium" : "text-muted-foreground"}>
                      {open
                        ? `${hhmm(h!.start_time)} · ${hhmm(h!.end_time)}`
                        : de ? "Frei" : "Off"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card-app p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plane size={16} className="text-copper" />
            <h3 className="font-heading text-base text-foreground">
              {de ? "Nächste Abwesenheiten" : "Upcoming time off"}
            </h3>
          </div>
          {absences.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {de ? "Keine Abwesenheiten geplant" : "No time off planned"}
            </p>
          ) : (
            <div className="space-y-2">
              {absences.map(a => (
                <div key={a.id} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-foreground">
                    {a.start_date === a.end_date
                      ? fmtDate(a.start_date)
                      : `${fmtDate(a.start_date)} · ${fmtDate(a.end_date)}`}
                  </span>
                  {a.reason && (
                    <span className="text-muted-foreground text-right">{a.reason}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Services */}
      <div className="px-5 mb-6">
        <h3 className="font-heading text-lg text-foreground mb-3">{t.barber.services}</h3>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {services.map(s => (
              <div key={s.id} className="card-app px-4 py-2.5 flex-shrink-0">
                <p className="text-foreground text-sm font-medium">{de ? s.name : s.name_en}</p>
                <p className="text-copper text-xs font-semibold">{formatServicePrice(s, de ? "de" : "en")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Work */}
      <div className="px-5 mb-6">
        <h3 className="font-heading text-lg text-foreground mb-3">{t.barber.recentWork}</h3>
        <div className="grid grid-cols-3 gap-2">
          {recentWork.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden">
              {/\.(mp4|webm|mov)(\?|$)/i.test(img) ? (
                <video
                  src={img}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : (
                <img src={img} alt="Haircut result" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-5 py-3 bg-background/90 backdrop-blur-md border-t border-border">
        <button
          onClick={() => navigate("/book")}
          className="w-full gradient-copper text-primary-foreground font-semibold text-base py-3.5 rounded-full shadow-copper"
        >
          {t.barber.bookWith(barber.name)}
        </button>
      </div>
    </div>
  );
};

export default BarberProfile;
