import { X, Check } from 'lucide-react';

export default function SeatLayout({ seats, selectedSeats, onSeatClick, maxSeats = 6 }) {
  if (!seats || seats.length === 0) return (
    <div className="text-center py-10 text-gray-400">No seat data available.</div>
  );

  const maxRow = Math.max(...seats.map(s => s.row));

  const getSeatClass = (seat) => {
    const base = 'w-11 h-11 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all select-none';
    if (seat.status === 'booked' || seat.status === 'blocked') {
      return `${base} bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed`;
    }
    if (selectedSeats.includes(seat.seat_number)) {
      return `${base} bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 cursor-pointer scale-105`;
    }
    return `${base} bg-green-50 text-green-700 border-green-400 cursor-pointer hover:bg-green-100 hover:scale-105`;
  };

  const handleClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'blocked') return;
    if (selectedSeats.includes(seat.seat_number)) {
      onSeatClick(selectedSeats.filter(s => s !== seat.seat_number));
    } else if (selectedSeats.length < maxSeats) {
      onSeatClick([...selectedSeats, seat.seat_number]);
    }
  };

  // Group seats into rows
  const rows = Array.from({ length: maxRow }, (_, r) =>
    seats.filter(s => s.row === r + 1).sort((a, b) => a.column - b.column)
  );

  return (
    <div className="select-none">
      {/* Bus front */}
      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">← Front</span>
        <div className="w-14 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white text-xl shadow">
          🚌
        </div>
      </div>

      {/* Seat grid */}
      <div className="space-y-2 overflow-x-auto pb-2">
        {rows.map((rowSeats, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5 justify-center min-w-max mx-auto">
            {/* Row number */}
            <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{rowIdx + 1}</span>

            {rowSeats.map(seat => (
              <div key={seat.seat_number} className="flex items-center">
                {/* Aisle gap between col 2 and col 3 */}
                {seat.column === 3 && <div className="w-8 flex-shrink-0" />}
                <button
                  onClick={() => handleClick(seat)}
                  disabled={seat.status === 'booked' || seat.status === 'blocked'}
                  className={getSeatClass(seat)}
                  title={`Seat ${seat.seat_number} — ${seat.status}`}
                >
                  {seat.status === 'booked' || seat.status === 'blocked'
                    ? <X className="w-3.5 h-3.5" />
                    : selectedSeats.includes(seat.seat_number)
                      ? <Check className="w-3.5 h-3.5" />
                      : seat.seat_number}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
        {[
          { cls: 'bg-green-50 border-2 border-green-400', label: 'Available' },
          { cls: 'bg-blue-600 border-2 border-blue-600', label: 'Selected' },
          { cls: 'bg-gray-200 border-2 border-gray-300', label: 'Booked' },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-5 h-5 rounded ${cls}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Max-seats warning */}
      {selectedSeats.length >= maxSeats && (
        <p className="text-center text-amber-600 text-xs mt-3 font-medium">
          Max {maxSeats} seats per booking reached.
        </p>
      )}

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            Selected: {selectedSeats.sort((a, b) => a - b).join(', ')}
          </span>
          <span className="text-xs text-blue-500">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
