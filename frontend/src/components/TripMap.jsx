import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Leaflet default marker icon asset resolver fix for React bundling engines
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * Reusable Leaflet Map component rendering stops and paths.
 * @param {Array} route - Array of coordinates [{ lat: 48.8, lng: 2.3, cityName: 'Paris' }]
 */
const TripMap = ({ route = [] }) => {
  // Determine map center based on first stop, or default to Europe center
  const defaultCenter = route.length > 0 ? [route[0].lat, route[0].lng] : [48.8566, 2.3522];
  const defaultZoom = route.length > 0 ? 5 : 4;

  const positions = route.map(stop => [parseFloat(stop.lat), parseFloat(stop.lng)]);

  return (
    <div className="w-full h-96 relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw Markers for Stops */}
        {route.map((stop, index) => (
          <Marker key={index} position={[parseFloat(stop.lat), parseFloat(stop.lng)]}>
            <Popup>
              <div className="font-semibold text-gray-800">
                Stop {index + 1}: {stop.cityName}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draw connecting Polyline route */}
        {positions.length > 1 && (
          <Polyline positions={positions} color="#0ea5e9" weight={4} dashArray="5, 10" />
        )}
      </MapContainer>
    </div>
  );
};

export default TripMap;
