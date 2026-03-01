import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { MAPBOX_ACCESS_TOKEN } from '../config';

type MapScreenProps = {
  children?: React.ReactNode;
  onLocation?: (coords: { lat: number; lon: number; heading?: number }) => void;
  visibleMarkers?: Array<{ id: string; lat: number; lon: number; label?: string; role?: string }>;
  center?: { lat: number; lon: number };
};

export function MapScreen({ children, onLocation, visibleMarkers = [], center }: MapScreenProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    let watchId: number | null = null;
    const requestAndWatch = async () => {
      if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        if (status !== 'granted') {
          setPermission('denied');
          return;
        }
      }
      setPermission('granted');
      watchId = Geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          onLocation?.({ lat: latitude, lon: longitude, heading });
        },
        (err) => {
          if (err.code === 1) setPermission('denied');
        },
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    };
    requestAndWatch();
    return () => {
      if (watchId != null) Geolocation.clearWatch(watchId);
    };
  }, [onLocation]);

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Карта (Mapbox)</Text>
        <Text style={styles.hint}>Добавьте MAPBOX_ACCESS_TOKEN в src/config.ts</Text>
        {userLocation && (
          <Text style={styles.coords}>
            {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
          </Text>
        )}
        {children}
      </View>
    );
  }

  const coord = center || userLocation || { lat: 55.75, lon: 37.62 };
  const Mapbox = require('@rnmapbox/maps').default;
  const { MapView, Camera, PointAnnotation, StyleURL } = require('@rnmapbox/maps');
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView style={styles.map} styleURL={StyleURL.Street}>
        <Camera zoomLevel={14} centerCoordinate={[coord.lon, coord.lat]} />
        {userLocation && (
          <PointAnnotation id="me" coordinate={[userLocation.lon, userLocation.lat]}>
            <View style={styles.myMarker} />
          </PointAnnotation>
        )}
        {visibleMarkers.map((m) => (
          <PointAnnotation key={m.id} id={m.id} coordinate={[m.lon, m.lat]}>
            <View style={[styles.otherMarker, m.role === 'bandit' ? styles.banditMarker : styles.copMarker]} />
            {m.label ? <Text style={styles.markerLabel}>{m.label}</Text> : null}
          </PointAnnotation>
        ))}
      </MapView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  placeholderText: {
    color: '#eee',
    fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
  },
  coords: {
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  myMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#fff',
  },
  otherMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  copMarker: { backgroundColor: '#2563eb' },
  banditMarker: { backgroundColor: '#dc2626' },
  markerLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
});
