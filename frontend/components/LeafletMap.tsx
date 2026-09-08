import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
}

interface LeafletMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: () => void;
  style?: any;
}

export default function LeafletMap({
  center,
  zoom = 13,
  markers = [],
  userLocation = null,
  onMarkerPress,
  onMapPress,
  style,
}: LeafletMapProps) {
  const iframeRef = useRef<any>(null);

  // Web iframe event listener
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWebMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'markerPress' && onMarkerPress) {
          onMarkerPress(data.id);
        } else if (data?.type === 'mapPress' && onMapPress) {
          onMapPress();
        }
      } catch (e) {
        // Ignore non-json messages from other browser extensions
      }
    };

    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, [onMarkerPress, onMapPress]);

  const mapHtml = useMemo(() => {
    const markersData = JSON.stringify(markers);
    const userLocData = userLocation ? JSON.stringify(userLocation) : 'null';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #f8fafc;
    }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 4px;
    }
    .popup-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .popup-desc {
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      function send(data) {
        var str = JSON.stringify(data);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(str);
        } else if (window.parent) {
          window.parent.postMessage(str, '*');
        }
      }

      var centerLat = ${center.latitude};
      var centerLng = ${center.longitude};
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([centerLat, centerLng], ${zoom});

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Street View Tiles (100% Free, No Google Key needed)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      map.on('click', function() {
        send({ type: 'mapPress' });
      });

      // Pin factory
      function makePinIcon(color) {
        var c = color || '#2563EB';
        return L.divIcon({
          className: 'custom-pin',
          html: '<div style="background:' + c + ';width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 3px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28]
        });
      }

      var userIcon = L.divIcon({
        className: 'user-pin',
        html: '<div style="width:18px;height:18px;background:#0284c7;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 0 5px rgba(2, 132, 199, 0.4);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      // User location marker
      var userLoc = ${userLocData};
      if (userLoc && userLoc.latitude && userLoc.longitude) {
        L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon }).addTo(map);
      }

      // Add markers
      var markers = ${markersData};
      markers.forEach(function(m) {
        var pin = makePinIcon(m.color);
        var marker = L.marker([m.latitude, m.longitude], { icon: pin }).addTo(map);

        if (m.title || m.description) {
          var popupContent = '<div style="min-width:110px;">';
          if (m.title) popupContent += '<div class="popup-title">' + m.title + '</div>';
          if (m.description) popupContent += '<div class="popup-desc">' + m.description + '</div>';
          popupContent += '</div>';
          marker.bindPopup(popupContent);
        }

        marker.on('click', function(e) {
          if (e && e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          send({ type: 'markerPress', id: m.id });
        });
      });
    })();
  </script>
</body>
</html>`;
  }, [center.latitude, center.longitude, zoom, markers, userLocation]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Leaflet Street Map"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerPress' && onMarkerPress) {
              onMarkerPress(data.id);
            } else if (data.type === 'mapPress' && onMapPress) {
              onMapPress();
            }
          } catch (e) {
            console.error('Leaflet message error:', e);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
