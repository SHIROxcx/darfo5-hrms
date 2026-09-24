import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Shared by the Wellness Leave modal (Employee/Leave/Index) and the CSC
// Form 6 page (Employee/Leave/Apply).

export function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', opts);
}

export function isWeekend(date: Date): boolean { return date.getDay() === 0 || date.getDay() === 6; }

export function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export function toDateString(d: Date): string {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Mon–Fri between two dates, excluding any date in `holidays`. With the
 * holiday map passed in, this matches LeaveService::countWorkingDays on the
 * server. The server's count is authoritative either way.
 */
export function countWorkingDays(start: string, end: string, holidays: Record<string, string> = {}): number {
    if (!start || !end || end < start) return 0;
    let count = 0;
    let cur = new Date(start + 'T00:00:00');
    const fin = new Date(end + 'T00:00:00');
    while (cur <= fin) {
        if (!isWeekend(cur) && !holidays[toDateString(cur)]) count++;
        cur = addDays(cur, 1);
    }
    return count;
}

interface CalendarPickerProps {
    startDate: string;
    endDate: string;
    onSelect: (start: string, end: string) => void;
    /** date → holiday name; shown in orange and excluded from the day count. */
    holidays?: Record<string, string>;
    /** Earliest selectable date (YYYY-MM-DD). Defaults to today in the browser. */
    minDate?: string;
}

export function CalendarPicker({ startDate, endDate, onSelect, holidays = {}, minDate }: CalendarPickerProps) {
    const today = minDate ?? toDateString(new Date());
    const [viewDate, setViewDate] = useState(() => {
        const d = startDate ? new Date(startDate + 'T00:00:00') : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [picking, setPicking] = useState<'start' | 'end'>('start');

    function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
    function nextMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

    // Build calendar grid
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(toDateString(new Date(year, month, d)));
    }

    function handleDayClick(date: string) {
        if (date < today) return;
        if (picking === 'start') {
            onSelect(date, date >= endDate ? '' : endDate);
            setPicking('end');
        } else {
            if (date < startDate) { onSelect(date, startDate); }
            else { onSelect(startDate, date); }
            setPicking('start');
        }
    }

    function dayClass(date: string): string {
        if (date < today) return 'text-gray-300 cursor-not-allowed';
        const inRange = startDate && endDate && date >= startDate && date <= endDate;
        const isStart = date === startDate;
        const isEnd   = date === endDate;
        const isWknd  = isWeekend(new Date(date + 'T00:00:00'));
        const isHoliday = !!holidays[date];

        if (isStart || isEnd) return 'bg-green-600 text-white rounded-lg font-bold';
        if (inRange) return `${isWknd || isHoliday ? 'bg-gray-100' : 'bg-green-100'} ${isHoliday ? 'text-orange-600' : 'text-green-800'}`;
        if (isWknd)  return 'text-gray-300 cursor-not-allowed';
        if (isHoliday) return 'text-orange-500 font-semibold hover:bg-orange-50 rounded-lg cursor-pointer';
        return 'text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer';
    }

    const monthName = viewDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="select-none">
            {/* Picking indicator */}
            <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setPicking('start')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition cursor-pointer
                        ${picking === 'start' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    Start: {startDate ? fmt(startDate, { month: 'short', day: 'numeric' }) : 'Pick date'}
                </button>
                <button type="button" onClick={() => setPicking('end')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition cursor-pointer
                        ${picking === 'end' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    End: {endDate ? fmt(endDate, { month: 'short', day: 'numeric' }) : 'Pick date'}
                </button>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700">{monthName}</span>
                <button type="button" onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {days.map(d => (
                    <div key={d} className={`text-center text-[10px] font-semibold py-1 ${d === 'Sun' || d === 'Sat' ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center">
                        {date ? (
                            <button
                                type="button"
                                onClick={() => handleDayClick(date)}
                                disabled={date < today || isWeekend(new Date(date + 'T00:00:00'))}
                                title={holidays[date] ?? undefined}
                                className={`w-full h-full text-xs flex items-center justify-center transition ${dayClass(date)}`}>
                                {new Date(date + 'T00:00:00').getDate()}
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
