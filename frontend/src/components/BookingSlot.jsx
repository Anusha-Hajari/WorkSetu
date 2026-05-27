import { useState } from "react";

const TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BookingSlot({ onSelect, bookedSlots = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    onSelect?.({ date: selectedDate, time: selectedTime });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays, year, month };
  };

  const { firstDay, totalDays, year, month } = getDaysInMonth(currentMonth);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectDate = (day) => {
    const d = new Date(year, month, day);
    if (d < today) return;
    const dateStr = d.toISOString().split("T")[0];
    setSelectedDate(dateStr);
  };

  return (
    <div className="card p-5 overflow-hidden" style={{ minWidth: 320 }}>
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
        <span className="text-indigo-400">📅</span> Book a Slot
      </h3>

      {/* Visual Calendar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-xs font-bold text-white tracking-wide">
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-600 text-center uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const d = new Date(year, month, day);
            const isPast = d < today;
            const isSelected = selectedDate === d.toISOString().split("T")[0];
            const isToday = d.getTime() === today.getTime();

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => selectDate(day)}
                className={`
                  text-[11px] font-medium py-1.5 rounded transition-all
                  ${isPast ? "text-slate-800 cursor-not-allowed" : "text-slate-400 hover:bg-indigo-500/10 hover:text-white"}
                  ${isSelected ? "bg-indigo-600 !text-white font-bold scale-110 shadow-lg shadow-indigo-600/20" : ""}
                  ${isToday && !isSelected ? "border border-indigo-500/30 text-indigo-400" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-widest">Select Time</label>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => {
            const dateAndSlot = `${selectedDate}_${t}`;
            const booked = bookedSlots.includes(dateAndSlot);
            const isSelected = selectedTime === t;

            return (
              <button key={t} disabled={booked || !selectedDate}
                onClick={() => setSelectedTime(t)}
                className={`
                  text-[10px] font-bold py-2 rounded-lg border transition-all
                  ${booked || !selectedDate
                    ? "border-slate-800/50 text-slate-700 cursor-not-allowed bg-slate-900/30"
                    : isSelected
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                      : "border-slate-700/50 text-slate-400 hover:border-indigo-500/50 hover:text-white"
                  }
                `}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime}
        className="btn-primary w-full text-xs py-3 font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 transition-all">
        Confirm Booking
      </button>
    </div>
  );
}

export default BookingSlot;