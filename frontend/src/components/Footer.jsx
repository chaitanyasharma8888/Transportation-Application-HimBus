import { Link } from 'react-router-dom';
import { Bus, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
            <Bus className="w-6 h-6" />
            HimBus
          </div>
          <p className="text-sm text-gray-400">Your Gateway to the Hills. Book bus tickets across Himachal Pradesh with ease.</p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition">Home</Link></li>
            <li><Link to="/my-bookings" className="hover:text-white transition">My Bookings</Link></li>
            <li><Link to="/register" className="hover:text-white transition">Create Account</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Popular Routes</h3>
          <ul className="space-y-2 text-sm">
            <li>Delhi → Shimla</li>
            <li>Delhi → Manali</li>
            <li>Shimla → Manali</li>
            <li>Chandigarh → Shimla</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> helpdesk@himbus.in</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1800-123-4567</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        © 2024 HimBus Transport. All rights reserved.
      </div>
    </footer>
  );
}
