import { useEffect, useRef, useState } from 'react';
import { MapPin, X, Check, Loader } from 'lucide-react';
import { useLanguageStore } from '../../store/language';

// Dynamically load Leaflet CSS
function loadLeaflet() {
  if (document.getElementById('leaflet-css')) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id   = 'leaflet-css';
    link.rel  = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.onload = resolve;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export default function MapLocationPicker({ onSelect, onClose }) {
  const { t } = useLanguageStore();
  const mapRef     = useRef(null);
  const markerRef  = useRef(null);
  const leafletRef = useRef(null);
  const [address,  setAddress]  = useState('');
  const [coords,   setCoords]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    loadLeaflet().then(() => {
      setTimeout(() => initMap(), 300);
    });
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;
    if (!L) return;

    // Default center: Jakarta, Indonesia
    const defaultLat = -6.2088;
    const defaultLng = 106.8456;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    leafletRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom red marker icon
    const icon = L.divIcon({
      html: `<div style="
        width:36px; height:36px;
        background:#FF6B6B;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 2px 12px rgba(255,107,107,0.5);
      "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      className: '',
    });

    // Place marker on click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setCoords({ lat, lng });

      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);

      // Reverse geocode using Nominatim (free)
      setGeocoding(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(addr);
        markerRef.current.bindPopup(`<div style="font-size:12px;max-width:200px">${addr}</div>`).openPopup();
      } catch {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setGeocoding(false);
      }
    });

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          map.setView([lat, lng], 16);
          setLoading(false);
        },
        () => setLoading(false),
        { timeout: 5000 }
      );
    } else {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!coords) return;
    onSelect({
      address,
      lat: coords.lat,
      lng: coords.lng,
      // Parse address components
      city:        address.split(',').slice(-3, -2)[0]?.trim() || '',
      postal_code: address.match(/\d{5}/)?.[0] || '',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 700, height: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center">
              <MapPin size={18} className="text-coral" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Pin Your Location</h2>
              <p className="text-xs text-gray-400">Click anywhere on the map to set your delivery address</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading map…</p>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Selected address + confirm */}
        <div className="p-5 border-t border-gray-100 shrink-0">
          {geocoding ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Loader size={14} className="animate-spin" />
              Getting address…
            </div>
          ) : address ? (
            <div className="flex items-start gap-3 bg-coral/5 rounded-2xl p-3 mb-4 border border-coral/20">
              <MapPin size={16} className="text-coral mt-0.5 shrink-0" />
              <p className="text-sm text-ink leading-relaxed">{address}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 bg-cream-dark rounded-2xl p-3">
              <MapPin size={14} />
              Click anywhere on the map to select your location
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!coords}
              className="btn-primary flex-1 py-2.5 justify-center disabled:opacity-40"
            >
              <Check size={16} />
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}