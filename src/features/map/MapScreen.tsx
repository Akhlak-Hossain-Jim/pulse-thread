
import { Activity, Navigation, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { MapMarker } from '../../components/MapMarker';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useLocationStore } from '../../store/locationStore';
import { AcceptSheet } from '../donor/AcceptSheet';
import { RequestSheet } from '../request/RequestSheet';
import { DonorVerificationSheet } from '../verification/DonorVerificationSheet';
import { RequesterVerificationSheet } from '../verification/RequesterVerificationSheet';

export const MapScreen = () => {
  const { location, errorMsg, requestPermission, setLocation } = useLocationStore();
  const { session } = useAuth();
  const [isRequestSheetVisible, setIsRequestSheetVisible] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [myActiveRequest, setMyActiveRequest] = useState<any | null>(null);
  const [myActiveDonation, setMyActiveDonation] = useState<any | null>(null);
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [isDonorActionsVisible, setIsDonorActionsVisible] = useState(false);

  
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

  // Debounced reverse geocode to avoid hitting API limit on every frame
  const handleRegionChange = async (region: Region) => {
      if (isPickingLocation) {
          // Just update coords first for UI responsiveness
          setPickupCoords({
              latitude: region.latitude,
              longitude: region.longitude,
              address: 'Loading...'
          });
      }
  };

  const handleRegionChangeComplete = async (region: Region) => {
    if (isPickingLocation) {
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${GOOGLE_API_KEY}`
            );
            const data = await res.json();
            if (data.status === 'OK' && data.results.length > 0) {
                setPickupCoords({
                    latitude: region.latitude,
                    longitude: region.longitude,
                    address: data.results[0].formatted_address
                });
            } else {
                 setPickupCoords({
                    latitude: region.latitude,
                    longitude: region.longitude,
                    address: `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`
                });
            }
        } catch (e) {
             setPickupCoords({
                latitude: region.latitude,
                longitude: region.longitude,
                address: `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`
            });
        }
    }
  };
  // ... (useEffect remains the same)

  const fetchMyActiveState = async () => {
    if (!session) return;
    
    // Check for active request
    const { data: requestData } = await supabase
        .from('requests')
        .select('*')
        .eq('requester_id', session.user.id)
        .in('status', ['PENDING', 'ACCEPTED'])
        .maybeSingle(); 
    
    if (requestData) setMyActiveRequest(requestData);

    // Check for active donation
    const { data: donationData } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', session.user.id)
        .in('status', ['EN_ROUTE', 'ARRIVED', 'MATCHED'])
        .maybeSingle();
    
    if (donationData) setMyActiveDonation(donationData);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('status', 'PENDING');
    
    if (error) {
     console.error(error);
    } else {
      setRequests(data || []);
    }
  };

  // Location Picker State
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<any>(null);

  const handlePickLocationStart = () => {
      setIsRequestSheetVisible(false);
      setIsPickingLocation(true);
      // Default to current location if picking starts
      if (location) {
          setPickupCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
          });
      }
  };

  const handlePickLocationConfirm = () => {
      setIsPickingLocation(false);
      setIsRequestSheetVisible(true);
  };



  // Force default location handler
  const handleForceLocation = () => {
      setLocation({
          coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
          },
          timestamp: Date.now()
      } as any);
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Locating you...</Text>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        
        <TouchableOpacity onPress={handleForceLocation} style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.gray, borderRadius: 8 }}>
            <Text style={{ color: COLORS.text }}>Use Default Location (Skip)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Render Requests (Hide when picking) */}
        {!isPickingLocation && requests.map((req) => {
             if (!req.location) return null;
             const matches = req.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
             if (!matches) return null;
             const longitude = parseFloat(matches[1]);
             const latitude = parseFloat(matches[2]);

             // Don't show my own requests as "Donor targets"
             if (req.requester_id === session?.user.id) return null;

             return (
                <MapMarker
                    key={req.id}
                    coordinate={{ latitude, longitude }}
                    type="request"
                    title={`${req.blood_type} Needed`}
                    description={req.hospital_name}
                    onPress={() => setSelectedRequest(req)}
                />
             );
        })}

        {/* User Marker */}
         <MapMarker 
            coordinate={{ 
                latitude: location.coords.latitude, 
                longitude: location.coords.longitude 
            }} 
            type="user" 
        />
      </MapView>

      {/* Center Pin for Picking */}
      {isPickingLocation && (
          <View style={styles.centerPinContainer} pointerEvents="none">
              <MapMarker 
                type="request" // Re-use the droplet/pulse marker as the pin
                coordinate={{ latitude: 0, longitude: 0 }} // Dummy, handled by absolute center View
              />
          </View>
      )}

      {/* Confirm Button for Picking */}
      {isPickingLocation && (
        <View style={styles.pickerOverlay}>
            <Text style={styles.pickerInstruction}>
                {pickupCoords?.address || "Move map to location"}
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handlePickLocationConfirm}>
                <Text style={styles.confirmButtonText}>CONFIRM LOCATION</Text>
            </TouchableOpacity>
        </View> 
      )}
      
      {!isPickingLocation && (
        <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => setIsRequestSheetVisible(true)}
        >
            <Plus color={COLORS.white} size={24} />
            <Text style={styles.requestButtonText}>REQUEST BLOOD</Text>
        </TouchableOpacity>
      )}

      {/* Floating Status Buttons */}
      {!isPickingLocation && myActiveRequest && (
          <TouchableOpacity 
            style={[styles.floatingButton, styles.requesterButton]}
            onPress={() => setIsVerificationVisible(true)}
        >
            <Activity color={COLORS.white} size={24} />
            <Text style={styles.requestButtonText}>MY REQUEST</Text>
        </TouchableOpacity>
      )}

      {!isPickingLocation && myActiveDonation && (
          <TouchableOpacity 
            style={[styles.floatingButton, styles.donorButton]}
            onPress={() => setIsDonorActionsVisible(true)}
        >
            <Navigation color={COLORS.white} size={24} />
            <Text style={styles.requestButtonText}>DONATION ACTIVE</Text>
        </TouchableOpacity>
      )}

      <RequestSheet 
        visible={isRequestSheetVisible} 
        onClose={() => setIsRequestSheetVisible(false)}
        onPickLocation={handlePickLocationStart}
        selectedLocation={pickupCoords}
      />

      <AcceptSheet
        visible={!!selectedRequest}
        request={selectedRequest}
        onClose={() => {
            setSelectedRequest(null);
            fetchMyActiveState(); // Refresh state after acceptance
        }}
      />

      {myActiveRequest && (
        <RequesterVerificationSheet
            visible={isVerificationVisible}
            requestId={myActiveRequest.id}
            onClose={() => setIsVerificationVisible(false)}
        />
      )}

      {myActiveDonation && (
        <DonorVerificationSheet
            visible={isDonorActionsVisible}
            donation={myActiveDonation}
            onClose={() => setIsDonorActionsVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.text,
  },
  errorText: {
    marginTop: 10,
    color: COLORS.error,
  },
  requestButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.floating,
  },
  requestButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  floatingButton: {
    position: 'absolute',
    top: SPACING.xxl + SPACING.lg, // Below header area
    alignSelf: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.floating,
  },
  requesterButton: {
      backgroundColor: COLORS.primary,
  },
  donorButton: {
      backgroundColor: COLORS.success,
  },
  centerPinContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -25, // Half of marker size roughly
      marginTop: -50,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
  },
  pickerOverlay: {
      position: 'absolute',
      bottom: SPACING.xxl,
      left: SPACING.lg,
      right: SPACING.lg,
      alignItems: 'center',
      gap: SPACING.md
  },
  pickerInstruction: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: COLORS.white,
      padding: SPACING.sm,
      borderRadius: SPACING.sm,
      fontWeight: 'bold'
  },
  confirmButton: {
      backgroundColor: COLORS.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      borderRadius: SPACING.xxl,
      width: '100%',
      alignItems: 'center',
      ...SHADOWS.floating
  },
  confirmButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  }
});
