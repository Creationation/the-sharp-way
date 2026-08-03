import { Star, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

type Review = {
  name: string;
  stars: number;
  date: { en: string; de: string };
  text: { en: string; de: string };
  reply?: { en: string; de: string };
};

// Echte Google-Bewertungen · SITDOWN | Gentlemen's and Women's
const reviews: Review[] = [
  {
    name: "Wilhelm Wagenleitner",
    stars: 5,
    date: { en: "1 week ago", de: "Vor 1 Woche" },
    text: {
      en: "At SITDOWN you are in good hands and the result is always a flawless haircut. I give 12 out of 10 stars.",
      de: "Bei SITDOWN ist man in guten Händen und das Ergebnis ist immer ein tadelloser Haarschnitt. Ich gebe 12 von 10 Sternen 👍🏻",
    },
  },
  {
    name: "Marcel K",
    stars: 5,
    date: { en: "1 month ago", de: "Vor 1 Monat" },
    text: {
      en: "It was my first visit today and I am absolutely delighted with my haircut. They took their time and worked very precisely, even though I needed a last-minute appointment. Thank you so much!",
      de: "Das war heute mein erster Besuch und ich bin absolut begeistert von meinem Schnitt. Sie haben sich Zeit genommen und sehr sorgfältig gearbeitet, obwohl ich kurzfristig einen Termin gebraucht habe. Vielen Dank!",
    },
    reply: {
      en: "Hi Marcel, thank you very much! 💪🏽",
      de: "Hallo Marcel, vielen Dank! 💪🏽",
    },
  },
  {
    name: "Bernhard Popoff",
    stars: 5,
    date: { en: "1 month ago", de: "Vor 1 Monat" },
    text: {
      en: "A really nice and modern salon! I have been going to Ibo for 20 years and have never been disappointed. He always does his best, works very precisely and does not stop until the result is perfect!",
      de: "Ein wirklich sympathischer und moderner Salon! Ich gehe seit 20 Jahren zu Ibo und wurde nie enttäuscht. Er gibt immer sein Bestes, arbeitet sehr präzise und hört nicht auf, bis das Ergebnis perfekt ist!",
    },
    reply: {
      en: "Hi Bernhard, thanks for your kind words! Best regards, Ibo",
      de: "Hallo Bernhard, danke für deine netten Worte! Liebe Grüße, Ibo",
    },
  },
  {
    name: "Eren Kilic",
    stars: 5,
    date: { en: "1 month ago", de: "Vor 1 Monat" },
    text: {
      en: "Great atmosphere, friendly team and a fantastic haircut. Very satisfied and happy to come back. Highly recommended!",
      de: "Super Atmosphäre, sympathisches Team und ein fantastischer Haarschnitt. Sehr zufrieden und komme gerne wieder. Klare Empfehlung!",
    },
  },
  {
    name: "Toud",
    stars: 5,
    date: { en: "3 weeks ago", de: "Vor 3 Wochen" },
    text: {
      en: "Professional, fast and passionate. It is really hard to find a barber this skilled.",
      de: "Professionell, schnell und mit Leidenschaft. Es ist wirklich schwer, einen so kompetenten Friseur zu finden.",
    },
  },
  {
    name: "Nadine Lux",
    stars: 5,
    date: { en: "2 months ago", de: "Vor 2 Monaten" },
    text: {
      en: "He did a wonderful job, everything was beautiful and flawless, worked very meticulously. I am completely satisfied and highly recommend it to all women.",
      de: "Er hat großartige Arbeit geleistet, alles war wunderschön und makellos, sehr sorgfältig gearbeitet. Ich bin rundum zufrieden und empfehle es allen Frauen sehr.",
    },
  },
  {
    name: "Petra J.",
    stars: 5,
    date: { en: "5 months ago", de: "Vor 5 Monaten" },
    text: {
      en: "I went there today with my daughter and was very impressed! Warm welcome and very professional service.",
      de: "Ich war heute mit meiner Tochter dort und war sehr beeindruckt! Herzlicher Empfang und sehr professioneller Service.",
    },
    reply: {
      en: "We are delighted! ☺️ Thank you and see you soon!",
      de: "Das freut uns sehr! ☺️ Danke und bis bald!",
    },
  },
  {
    name: "Mario F",
    stars: 5,
    date: { en: "3 months ago", de: "Vor 3 Monaten" },
    text: {
      en: "I visited Ibo at Sitdown Barbershop Vienna and I am more than delighted! ⭐⭐⭐⭐⭐",
      de: "Ich war bei Ibo im Sitdown Barbershop Vienna und bin mehr als begeistert! ⭐⭐⭐⭐⭐",
    },
  },
  {
    name: "Noah Fryba",
    stars: 5,
    date: { en: "4 months ago", de: "Vor 4 Monaten" },
    text: {
      en: "Nothing but praise. The team is extremely friendly and attentive and I am always happy with the result. The best barber in Vienna!",
      de: "Ich kann nur Gutes berichten. Das Team ist äußerst freundlich und aufmerksam und ich bin immer begeistert vom Ergebnis. Der beste Friseur in Wien!",
    },
    reply: { en: "Thank you! ☺️", de: "Danke! ☺️" },
  },
  {
    name: "Andreas Lorenz",
    stars: 5,
    date: { en: "4 months ago", de: "Vor 4 Monaten" },
    text: {
      en: "I have been here several times for a haircut and beard trim. Excellent work, fast and very friendly.",
      de: "Ich war schon mehrmals für Haarschnitt und Bartpflege hier. Ausgezeichnete Arbeit, schnell und sehr freundlich.",
    },
    reply: { en: "We are delighted! Thank you 🙏🏼", de: "Das freut uns! Danke 🙏🏼" },
  },
  {
    name: "C_St",
    stars: 5,
    date: { en: "4 months ago", de: "Vor 4 Monaten" },
    text: {
      en: "Everything was absolutely fantastic! The whole team is very friendly. The barber really took his time. Haircut, beard trim, eyebrows and ear/nose waxing · more than happy with the result.",
      de: "Alles war absolut fantastisch! Das ganze Team ist sehr freundlich. Der Friseur hat sich richtig Zeit genommen. Haarschnitt, Bartpflege, Augenbrauen sowie Ohren- und Nasenhaarentfernung · mehr als zufrieden mit dem Ergebnis.",
    },
    reply: { en: "Thank you very much! 🙏🏼", de: "Vielen Dank! 🙏🏼" },
  },
  {
    name: "Guilherme Ogawa",
    stars: 5,
    date: { en: "10 months ago", de: "Vor 10 Monaten" },
    text: {
      en: "Great service, very detailed and at a good price.",
      de: "Toller Service, sehr detailliert und zu einem guten Preis.",
    },
    reply: { en: "Thank you very much! 😊", de: "Vielen Dank! 😊" },
  },
  {
    name: "Miodrag Jesic",
    stars: 5,
    date: { en: "5 months ago", de: "Vor 5 Monaten" },
    text: {
      en: "I have been a customer of Ibo for a long time and have always been satisfied · the whole team is welcoming and does excellent work. Clear recommendation.",
      de: "Ich bin seit Langem Kunde bei Ibo und war immer zufrieden · das ganze Team ist herzlich und macht ausgezeichnete Arbeit. Klare Empfehlung.",
    },
    reply: { en: "Thanks for your kind words! 🙏🏼", de: "Danke für die netten Worte! 🙏🏼" },
  },
  {
    name: "Thomas Policzer",
    stars: 5,
    date: { en: "8 months ago", de: "Vor 8 Monaten" },
    text: {
      en: "Dear Ismail, thanks for the warm atmosphere, the perfect haircut and above all for the nose and ear waxing! In the end it wasn't that bad at all! 😁👍",
      de: "Lieber Ismail, danke für die herzliche Atmosphäre, den perfekten Haarschnitt und vor allem für das Nasen- und Ohrenwaxing! Am Ende war es gar nicht so schlimm! 😁👍",
    },
  },
  {
    name: "Toma Milovanovic",
    stars: 5,
    date: { en: "5 months ago", de: "Vor 5 Monaten" },
    text: {
      en: "Great haircut, excellent service, thanks to Ibo for the great work.",
      de: "Super Haarschnitt, ausgezeichneter Service, danke an Ibo für die tolle Arbeit.",
    },
    reply: { en: "Thank you very much! 🙏🏼", de: "Vielen Dank! 🙏🏼" },
  },
  {
    name: "Hasan Aksu",
    stars: 5,
    date: { en: "9 months ago", de: "Vor 9 Monaten" },
    text: {
      en: "I would like to thank my barber, who always makes me happy. He does really excellent work. Highly recommended.",
      de: "Ich möchte mich bei meinem Friseur bedanken, der mich immer zufriedenstellt. Er macht wirklich ausgezeichnete Arbeit. Sehr zu empfehlen.",
    },
  },
  {
    name: "Boris Andreev",
    stars: 5,
    date: { en: "9 months ago", de: "Vor 9 Monaten" },
    text: { en: "Professional: Ismail", de: "Professionell: Ismail" },
  },
  {
    name: "Oblon User",
    stars: 3,
    date: { en: "2 weeks ago", de: "Vor 2 Wochen" },
    text: {
      en: "I was here 6 times and I've got 4 different barbers cutting my hair. Maybe that works for someone but not for me. Haircut was decent though.",
      de: "Ich war 6 Mal hier und hatte 4 verschiedene Friseure. Für manche mag das passen, für mich nicht. Der Haarschnitt war aber ordentlich.",
    },
    reply: {
      en: "Hi! Next time it is best to book directly with the barber who gave you your favourite cut 😅 We hope to see you again soon 🙌🏼",
      de: "Hallo! Am besten buchst du das nächste Mal direkt bei dem Friseur, der dir den besten Schnitt gemacht hat 😅 Wir freuen uns auf ein Wiedersehen 🙌🏼",
    },
  },
  {
    name: "Christoph Lberger",
    stars: 1,
    date: { en: "4 months ago", de: "Vor 4 Monaten" },
    text: {
      en: "I had been there before and was styled by an older gentleman who really knew what he was doing and took his time. So I went back last week · unfortunately it was completely different.",
      de: "Ich war schon einmal dort und wurde von einem älteren Herrn frisiert, der wirklich wusste, was er tut, und sich Zeit genommen hat. Deshalb bin ich letzte Woche wieder hin · leider war es völlig anders.",
    },
    reply: {
      en: "Hi Christoph, first of all I am sorry your experience was not convincing. Like in every salon we have experienced barbers and talented young employees. That is why I recommend booking the barber of your choice · in your case Ibo. 🙏🏼",
      de: "Hallo Christoph, zuerst tut es mir leid, dass dein Besuch nicht überzeugend war. Wie in jedem Salon haben wir erfahrene Friseure und talentierte junge Mitarbeiter. Deshalb empfehle ich, direkt den Friseur deiner Wahl zu buchen · in deinem Fall Ibo. 🙏🏼",
    },
  },
  {
    name: "David",
    stars: 1,
    date: { en: "6 months ago", de: "Vor 6 Monaten" },
    text: {
      en: "I had been there twice before and it is usually a decent place. This time I waited ten minutes without anyone taking care of me, so I left.",
      de: "Ich war vorher zweimal dort und normalerweise ist es ein guter Laden. Diesmal habe ich zehn Minuten gewartet, ohne dass sich jemand gekümmert hat, also bin ich gegangen.",
    },
    reply: {
      en: "Hi David, we are truly sorry for this misunderstanding. As compensation we offer you a voucher for a haircut 🙏🏼",
      de: "Hallo David, das Missverständnis tut uns wirklich leid. Als Entschädigung schenken wir dir einen Gutschein für einen Haarschnitt 🙏🏼",
    },
  },
];

const ratingBars = [
  { stars: 5, pct: 84 },
  { stars: 4, pct: 2 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 0 },
  { stars: 1, pct: 12 },
];

const ReviewsScreen = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">{t.reviews.title}</h1>
      </div>

      {/* Overall rating */}
      <div className="px-5 mb-6">
        <div className="card-app p-5 flex items-center gap-6">
          <div className="text-center">
            <p className="font-heading text-5xl text-copper">4,5</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} className={i <= 4 ? "text-copper fill-copper" : "text-copper"} />
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-1">{t.reviews.count}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingBars.map(r => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-4">{r.stars}★</span>
                <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full gradient-copper rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-muted-foreground text-[10px] w-8 text-right">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="px-5 space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="card-app p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
                <span className="font-heading text-sm text-copper">{r.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{r.name}</p>
                <p className="text-muted-foreground text-[11px]">{r.date[lang]}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star key={j} size={12} className="text-copper fill-copper" />
                ))}
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">"{r.text[lang]}"</p>
            {r.reply && (
              <div className="mt-3 pl-3 border-l-2 border-copper/40">
                <p className="text-copper text-[11px] font-medium mb-1">SITDOWN Vienna</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{r.reply[lang]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsScreen;
