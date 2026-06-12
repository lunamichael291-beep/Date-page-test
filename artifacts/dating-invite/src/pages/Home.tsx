import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import confetti from "canvas-confetti";
import emailjs from "@emailjs/browser";
import { Check, ChevronLeft, ChevronRight, Heart, Calendar, Clock, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// EMAILJS CONFIGURATION — replace these with your credentials
// Sign up free at https://www.emailjs.com/
// ============================================================
const EMAILJS_SERVICE_ID = "service_na9p27t";
const EMAILJS_TEMPLATE_ID = "template_s0s6m9g";
const EMAILJS_PUBLIC_KEY = "XaFVpU5wKseh3qRgv";
const NOTIFICATION_EMAIL = "lunamichael291@gmail.com";
// ============================================================

// ============================================================
// LOCATIONS — add more objects here to add new date spots
// ============================================================
const locations = [
  {
    id: "micasa",
    name: "Mi Casa",
    emoji: "🏠",
    description: "Ambiente acogedor y privado con películas, snacks, música y conversación de calidad.",
    vibe: "Íntimo & Relajado",
    gradient: "from-amber-50 to-orange-100",
    accent: "#D4956A",
  },
  {
    id: "momoto",
    name: "Momoto Café",
    emoji: "☕",
    description: "Una cita de café relajada con postres y tiempo de sobra para conversar.",
    vibe: "Tranquilo & Especial",
    gradient: "from-stone-100 to-amber-50",
    accent: "#9C8068",
  },
  {
    id: "chikchak",
    name: "Chik Chak",
    emoji: "🍽️",
    description: "Comida casual, buena energía y un ambiente divertido.",
    vibe: "Casual & Divertido",
    gradient: "from-orange-50 to-rose-100",
    accent: "#C4715A",
  },
  {
    id: "paneevino",
    name: "Pane e Vino",
    emoji: "🍷",
    description: "Cocina italiana elegante en un ambiente romántico e íntimo.",
    vibe: "Elegante & Romántico",
    gradient: "from-rose-50 to-pink-100",
    accent: "#A85870",
  },
];

const timeOptions = [
  { id: "1200", label: "12:00 PM", desc: "Almuerzo" },
  { id: "1400", label: "2:00 PM", desc: "Sobremesa" },
  { id: "1600", label: "4:00 PM", desc: "Merienda" },
  { id: "1800", label: "6:00 PM", desc: "Tarde" },
  { id: "2000", label: "8:00 PM", desc: "Cena" },
];

const TOTAL_STEPS = 6; // 0=Welcome 1=Date 2=Time 3=Location 4=Confirm 5=Success
const PROGRESS_LABELS = ["Fecha", "Hora", "Lugar", "Confirmación"];

// ---- Ornament SVG ----
function Ornament({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="100"
      height="10"
      viewBox="0 0 100 10"
      fill="none"
      className={cn("opacity-40", flip && "scale-x-[-1]")}
    >
      <line x1="0" y1="5" x2="38" y2="5" stroke="currentColor" strokeWidth="1" />
      <polygon points="44,5 48,2 52,5 48,8" fill="currentColor" opacity="0.6" />
      <line x1="58" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// ---- Custom Calendar ----
function DateCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = new Date(view.year, view.month, 1).getDay();

  const prevMonth = () => {
    setView(v =>
      v.month === 0
        ? { month: 11, year: v.year - 1 }
        : { month: v.month - 1, year: v.year }
    );
  };
  const nextMonth = () => {
    setView(v =>
      v.month === 11
        ? { month: 0, year: v.year + 1 }
        : { month: v.month + 1, year: v.year }
    );
  };

  const monthName = new Date(view.year, view.month, 1).toLocaleString("es-ES", {
    month: "long",
  });

  const canGoPrev =
    view.year > today.getFullYear() ||
    (view.year === today.getFullYear() && view.month > today.getMonth());

  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
            canGoPrev
              ? "hover:bg-primary/20 text-foreground"
              : "text-foreground/20 cursor-default"
          )}
          data-testid="calendar-prev"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-serif text-lg capitalize font-semibold">
          {monthName} {view.year}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors text-foreground"
          data-testid="calendar-next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map(d => (
          <div key={d} className="text-center text-xs text-foreground/40 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const date = new Date(view.year, view.month, day);
          date.setHours(0, 0, 0, 0);
          const isPast = date < today;
          const isSelected =
            selected &&
            selected.getFullYear() === view.year &&
            selected.getMonth() === view.month &&
            selected.getDate() === day;
          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onSelect(new Date(view.year, view.month, day))}
              data-testid={`calendar-day-${day}`}
              className={cn(
                "aspect-square w-full rounded-full text-sm font-medium transition-all duration-150 flex items-center justify-center",
                isPast && "text-foreground/20 cursor-default",
                !isPast && !isSelected && "hover:bg-primary/20 text-foreground",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                isToday && !isSelected && "ring-1 ring-primary/60 text-primary font-semibold"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Swipeable Location Cards ----
function LocationCarousel({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setIdx(i => (i - 1 + locations.length) % locations.length);
  const next = () => setIdx(i => (i + 1) % locations.length);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStartX.current = null;
  };

  const loc = locations[idx];
  const isSelected = selected === loc.id;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Dots */}
      <div className="flex justify-center gap-2 mb-4">
        {locations.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setIdx(i)}
            data-testid={`loc-dot-${i}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === idx ? "w-6 bg-primary" : "w-2 bg-foreground/20"
            )}
          />
        ))}
      </div>

      {/* Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-lg",
          isSelected ? "border-primary shadow-[0_0_0_2px_#A8B8A0]" : "border-[#D8D0C8]"
        )}
        data-testid={`location-card-${loc.id}`}
      >
        {/* Image area */}
        <div className={cn("h-44 flex flex-col items-center justify-center bg-gradient-to-br relative", loc.gradient)}>
          <span className="text-7xl drop-shadow-sm">{loc.emoji}</span>
          {isSelected && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 shadow">
              <Check size={16} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-[#FDFBF8] p-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-serif text-xl font-bold">{loc.name}</h3>
          </div>
          <span className="inline-block bg-primary/15 text-foreground/70 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
            {loc.vibe}
          </span>
          <p className="text-sm text-foreground/60 leading-relaxed mb-4">{loc.description}</p>
          <button
            onClick={() => onSelect(loc.id)}
            data-testid={`select-location-${loc.id}`}
            className={cn(
              "w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-[#D8D0C8] text-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {isSelected ? "Seleccionado ✓" : "Elegir este lugar"}
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      <div className="flex justify-between mt-4">
        <button
          onClick={prev}
          className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
          data-testid="location-prev"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <button
          onClick={next}
          className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
          data-testid="location-next"
        >
          Siguiente <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [noAttempts, setNoAttempts] = useState(0);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dating-invite-v2");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.step > 0 && s.step < 5) setStep(s.step);
        if (s.selectedDate) setSelectedDate(new Date(s.selectedDate));
        if (s.selectedTime) setSelectedTime(s.selectedTime);
        if (s.selectedLocation) setSelectedLocation(s.selectedLocation);
      }
    } catch (_) {}
  }, []);

  // Save state on change
  useEffect(() => {
    if (step === 0) return;
    try {
      localStorage.setItem(
        "dating-invite-v2",
        JSON.stringify({
          step,
          selectedDate: selectedDate?.toISOString() ?? null,
          selectedTime,
          selectedLocation,
        })
      );
    } catch (_) {}
  }, [step, selectedDate, selectedTime, selectedLocation]);

  // Particles
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    const colors = ["#A8B8A0", "#C4B8AA", "#B8B8B8", "#D4C9BC"];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div");
      el.className = "particle";
      const size = Math.random() * 5 + 3;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}vw;
        top:${Math.random() * 300}vh;
        opacity:${(Math.random() * 0.2 + 0.1).toFixed(2)};
        animation-duration:${Math.random() * 14 + 14}s;
        animation-delay:${Math.random() * 8}s;
      `;
      container.appendChild(el);
    }
  }, []);

  // Live countdown to selected date
  useEffect(() => {
    if (step !== 5 || !selectedDate) return;
    const target = new Date(selectedDate);
    const timeLabel = timeOptions.find(t => t.id === selectedTime);
    if (timeLabel) {
      const [h, p] = timeLabel.label.split(":");
      let hour = parseInt(h);
      if (p?.includes("PM") && hour !== 12) hour += 12;
      target.setHours(hour, 0, 0, 0);
    }
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, selectedDate, selectedTime]);

  const goTo = useCallback((s: number) => setStep(s), []);
  const next = useCallback(() => setStep(s => s + 1), []);
  const back = useCallback(() => setStep(s => s - 1), []);

  const moveNo = () => {
    setNoAttempts(n => n + 1);
    const margin = 80;
    const x = margin + Math.random() * Math.max(50, window.innerWidth - 2 * margin - 140);
    const y = margin + Math.random() * Math.max(50, window.innerHeight - 2 * margin - 56);
    setNoPos({ x, y });
  };

  const getNoText = () => {
    if (noAttempts >= 12) return "¡Para ya! 🙈";
    if (noAttempts >= 7) return "¿Estás segura? 😤";
    if (noAttempts >= 3) return "No es opción 😏";
    return "No 😅";
  };

  const handleConfirm = async () => {
    setSending(true);
    const dateStr = selectedDate
      ? selectedDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    const timeStr = timeOptions.find(t => t.id === selectedTime)?.label ?? "";
    const locName = locations.find(l => l.id === selectedLocation)?.name ?? "";

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: NOTIFICATION_EMAIL,
          date: dateStr,
          time: timeStr,
          location: locName,
          timestamp: new Date().toLocaleString("es-ES"),
        },
        EMAILJS_PUBLIC_KEY
      );
    } catch (_) {
      // Silent fail — still advance to success
    }

    setSending(false);
    localStorage.removeItem("dating-invite-v2");
    next();

    setTimeout(() => {
      confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ["#A8B8A0", "#E8E0D5", "#3B2F2F", "#F8F5F0", "#C4B8AA"] });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.6 }, colors: ["#A8B8A0", "#E8E0D5"] }), 400);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.6 }, colors: ["#3B2F2F", "#C4B8AA"] }), 600);
    }, 300);
  };

  const progressStep = step - 1; // steps 1-4 → 0-3
  const showProgress = step >= 1 && step <= 4;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background relative">
      {/* Floating particles */}
      <div ref={particlesRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Ambient gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(248,245,240,0) 40%, rgba(168,184,160,0.06) 100%)" }}
      />

      {/* Progress bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 bg-background/80 backdrop-blur-sm border-b border-[#E8E0D5]">
          <div className="max-w-sm mx-auto">
            <div className="flex justify-between mb-1.5">
              {PROGRESS_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    i < progressStep
                      ? "text-primary"
                      : i === progressStep
                      ? "text-foreground"
                      : "text-foreground/30"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(progressStep / (PROGRESS_LABELS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide container — all 6 steps side by side */}
      <div
        className="flex h-full"
        style={{
          width: `${TOTAL_STEPS * 100}vw`,
          transform: `translateX(-${step * 100}vw)`,
          transition: "transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {/* ── STEP 0: Welcome ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#FDFBF8] shadow-[0_8px_40px_rgba(59,47,47,0.11)] rounded-2xl px-8 py-10 border border-[#D8D0C8]">
              <div className="flex justify-center gap-2 mb-6 text-foreground/50">
                <Ornament />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-4">
                ¿Quieres salir conmigo?
              </h1>
              <p className="font-serif italic text-foreground/60 text-base md:text-lg mb-8 leading-relaxed">
                Te prometo buena conversación, buena comida y una experiencia memorable.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={next}
                  data-testid="button-yes"
                  className="bg-primary hover:bg-primary/85 text-primary-foreground px-10 py-3.5 rounded-full font-medium text-base tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 w-36"
                >
                  Sí ❤️
                </button>
                <button
                  data-testid="button-no-placeholder"
                  className="border-2 border-[#D8D0C8] text-foreground/60 px-10 py-3.5 rounded-full font-medium text-base bg-[#FDFBF8] w-36 cursor-default"
                  style={{ visibility: noPos ? "hidden" : "visible" }}
                  onMouseEnter={moveNo}
                  onTouchStart={e => { e.preventDefault(); moveNo(); }}
                >
                  {getNoText()}
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-6 text-foreground/50">
                <Ornament flip />
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 1: Date ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full" style={{ paddingTop: showProgress ? "64px" : 0 }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <Calendar size={12} /> Paso 1 de 4
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                ¿Qué día te funciona mejor?
              </h2>
            </div>

            <div className="bg-[#FDFBF8] rounded-2xl shadow-[0_4px_24px_rgba(59,47,47,0.08)] border border-[#D8D0C8] p-5">
              <DateCalendar
                selected={selectedDate}
                onSelect={d => {
                  setSelectedDate(d);
                  setTimeout(next, 500);
                }}
              />
            </div>

            {selectedDate && (
              <div className="mt-3 text-center text-sm text-primary font-medium">
                ✓ {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: Time ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full" style={{ paddingTop: showProgress ? "64px" : 0 }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <Clock size={12} /> Paso 2 de 4
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                ¿A qué hora te gustaría?
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {timeOptions.map(t => {
                const isSel = selectedTime === t.id;
                return (
                  <button
                    key={t.id}
                    data-testid={`time-${t.id}`}
                    onClick={() => {
                      setSelectedTime(t.id);
                      setTimeout(next, 450);
                    }}
                    className={cn(
                      "flex items-center justify-between px-5 py-3.5 rounded-xl border-2 transition-all duration-200 bg-[#FDFBF8]",
                      isSel
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-[#D8D0C8] hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <div className="text-left">
                      <span className="font-semibold text-base text-foreground">{t.label}</span>
                      <span className="ml-2 text-sm text-foreground/50">{t.desc}</span>
                    </div>
                    {isSel && <Check size={18} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={back}
              className="mt-5 w-full text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
              data-testid="time-back"
            >
              ← Cambiar fecha
            </button>
          </div>
        </div>

        {/* ── STEP 3: Location ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full" style={{ paddingTop: showProgress ? "64px" : 0 }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <MapPin size={12} /> Paso 3 de 4
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                ¿A dónde vamos?
              </h2>
              <p className="text-sm text-foreground/50 mt-1">Desliza para explorar</p>
            </div>

            <LocationCarousel
              selected={selectedLocation}
              onSelect={id => {
                setSelectedLocation(id);
                setTimeout(next, 500);
              }}
            />

            <button
              onClick={back}
              className="mt-4 w-full text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
              data-testid="location-back"
            >
              ← Cambiar hora
            </button>
          </div>
        </div>

        {/* ── STEP 4: Confirmation ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-sm w-full" style={{ paddingTop: showProgress ? "64px" : 0 }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <Star size={12} /> Paso 4 de 4
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                Tu cita ideal sería:
              </h2>
            </div>

            <div className="bg-[#FDFBF8] rounded-2xl shadow-[0_8px_32px_rgba(59,47,47,0.1)] border border-[#D8D0C8] overflow-hidden">
              {/* Summary rows */}
              {[
                {
                  icon: <Calendar size={18} className="text-primary" />,
                  label: "Fecha",
                  value: selectedDate
                    ? selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
                    : "—",
                },
                {
                  icon: <Clock size={18} className="text-primary" />,
                  label: "Hora",
                  value: timeOptions.find(t => t.id === selectedTime)?.label ?? "—",
                },
                {
                  icon: <MapPin size={18} className="text-primary" />,
                  label: "Lugar",
                  value: locations.find(l => l.id === selectedLocation)?.name ?? "—",
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4",
                    i < 2 && "border-b border-[#EDE8E2]"
                  )}
                >
                  <div className="shrink-0">{row.icon}</div>
                  <div>
                    <div className="text-xs text-foreground/40 uppercase tracking-wide font-medium">{row.label}</div>
                    <div className="text-foreground font-medium capitalize">{row.value}</div>
                  </div>
                </div>
              ))}

              <div className="px-6 py-5 border-t border-[#EDE8E2] flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={sending}
                  data-testid="button-confirm"
                  className="w-full bg-primary hover:bg-primary/85 disabled:opacity-60 text-primary-foreground py-3.5 rounded-xl font-medium text-base transition-all duration-200 hover:shadow-md active:scale-95"
                >
                  {sending ? "Enviando..." : "Confirmar ❤️"}
                </button>
                <button
                  onClick={() => goTo(1)}
                  data-testid="button-change"
                  className="w-full border-2 border-[#D8D0C8] text-foreground/60 py-3 rounded-xl font-medium text-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  Cambiar selección
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 5: Success ── */}
        <div className="w-screen h-full flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#FDFBF8] shadow-[0_8px_40px_rgba(59,47,47,0.11)] rounded-2xl px-8 py-12 border border-[#D8D0C8]">
              <div className="flex justify-center gap-2 mb-6 text-foreground/40">
                <Ornament />
              </div>
              <div className="mb-6">
                <Heart
                  className="w-16 h-16 text-primary mx-auto"
                  fill="currentColor"
                  style={{ animation: "heartbeat 1.4s ease-in-out infinite" }}
                />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-2">
                ¡Perfecto!
              </h2>
              <p className="font-serif italic text-foreground/60 text-base mb-5 leading-relaxed">
                {selectedDate?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}
                {timeOptions.find(t => t.id === selectedTime)?.label}
                {" · "}
                {locations.find(l => l.id === selectedLocation)?.name}
              </p>

              {/* Countdown */}
              {countdown !== null && (
                <div className="mb-6">
                  {countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 ? (
                    <p className="font-serif italic text-primary text-lg">¡Es hoy! 🎉</p>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-widest text-foreground/40 font-medium mb-3">
                        Faltan
                      </p>
                      <div className="flex items-end justify-center gap-2">
                        {countdown.days > 0 && (
                          <div className="flex flex-col items-center">
                            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 min-w-[64px]">
                              <span className="font-serif text-3xl font-bold text-foreground leading-none">
                                {String(countdown.days).padStart(2, "0")}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1.5">
                              {countdown.days === 1 ? "día" : "días"}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 min-w-[64px]">
                            <span className="font-serif text-3xl font-bold text-foreground leading-none">
                              {String(countdown.hours).padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1.5">horas</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 min-w-[64px]">
                            <span className="font-serif text-3xl font-bold text-foreground leading-none">
                              {String(countdown.minutes).padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1.5">min</span>
                        </div>
                        {countdown.days === 0 && (
                          <div className="flex flex-col items-center">
                            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 min-w-[64px]">
                              <span className="font-serif text-3xl font-bold text-primary leading-none">
                                {String(countdown.seconds).padStart(2, "0")}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1.5">seg</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-2 mt-4 text-foreground/40">
                <Ornament flip />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating "No" button — fixed position */}
      {step === 0 && noPos && (
        <button
          onMouseEnter={moveNo}
          onTouchStart={e => { e.preventDefault(); moveNo(); }}
          data-testid="button-no"
          className="border-2 border-[#D8D0C8] text-foreground/60 px-8 py-3 rounded-full font-medium text-base bg-[#FDFBF8] shadow-lg"
          style={{
            position: "fixed",
            left: noPos.x,
            top: noPos.y,
            zIndex: 9999,
            transform: `rotate(${((noAttempts * 37) % 16) - 8}deg) scale(${1 + (noAttempts % 3) * 0.02})`,
            transition: "left 0.05s ease, top 0.05s ease",
          }}
        >
          {getNoText()}
        </button>
      )}

      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.15); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          56% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
