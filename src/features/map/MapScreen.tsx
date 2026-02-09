
import { Activity, Navigation, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { MapMarker } from '../../components/MapMarker';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthProvider';
import { decodePolyline } from '../../lib/polyline';
import { supabase } from '../../lib/supabase';
import { useLocationStore } from '../../store/locationStore';
import { AcceptSheet } from '../donor/AcceptSheet';
import { RequestSheet } from '../request/RequestSheet';
import { DonorVerificationSheet } from '../verification/DonorVerificationSheet';
import { RequesterVerificationSheet } from '../verification/RequesterVerificationSheet';

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const { location, errorMsg, requestPermission, setLocation } = useLocationStore();
  const { session } = useAuth();
  const [isRequestSheetVisible, setIsRequestSheetVisible] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [myActiveRequest, setMyActiveRequest] = useState<any | null>(null);
  const [myActiveDonation, setMyActiveDonation] = useState<any | null>(null);
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [isDonorActionsVisible, setIsDonorActionsVisible] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<any>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  
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
  useEffect(() => {
    const timer = setTimeout(async () => {
        console.log("MapScreen mounted, triggering permissions...");
        await requestPermission();
        await fetchMyActiveState();
        await fetchRequests();
    }, 1000); // 1s delay to let navigation finish and map mount

    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  useEffect(() => {
    if (!session?.user) return;

    // Realtime subscriptions
    const channel = supabase.channel('map_screen_updates')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'requests',
                filter: `requester_id=eq.${session.user.id}`,
            },
            () => {
                console.log('My Request updated, fetching state...');
                fetchMyActiveState();
            }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'donations',
                filter: `donor_id=eq.${session.user.id}`,
            },
            () => {
                console.log('My Donation updated, fetching state...');
                fetchMyActiveState();
            }
        )
         // Listen for ANY donation changes related to my active request (if I'm a requester)
         // Since we can't easily filter by "my request IDs" without knowing them, 
         // and we want to catch the initial acceptance (INSERT), we rely on:
         // 1. If logic updates request status -> caught by requests sub above.
         // 2. We can also subscribe to donations generally if volume is low, OR
         //    More specifically, if we have myActiveRequest, we subscribe to it.
         //    But that requires a separate effect dependent on myActiveRequest.
         //    For now, let's add a separate effect for that case or handle it here if possible.
        .subscribe();
        
    // Separate subscription for incoming donations to my requests
    let requestChannel: any = null;
    if (myActiveRequest) {
         requestChannel = supabase.channel(`my_request_donations:${myActiveRequest.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'donations',
                    filter: `request_id=eq.${myActiveRequest.id}`
                },
                () => {
                    console.log('Donation for my request updated/created, fetching state...');
                    fetchMyActiveState();
                }
            )
            .subscribe();
    }

    return () => {
        supabase.removeChannel(channel);
        if (requestChannel) supabase.removeChannel(requestChannel);
    };
  }, [session?.user?.id, myActiveRequest?.id]);

  const fetchMyActiveState = async () => {
    if (!session) return;
    
    // Check for active request
    const { data: requestData } = await supabase
        .from('requests')
        .select('*')
        .eq('requester_id', session.user.id)
        .in('status', ['PENDING', 'ACCEPTED'])
        .maybeSingle(); 
    
    setMyActiveRequest(requestData); // Clear if null

    // Check for active donation
    const { data: donationData } = await supabase
        .from('donations')
        .select('*, request:requests(*)')
        .eq('donor_id', session.user.id)
        .in('status', ['EN_ROUTE', 'ARRIVED', 'MATCHED'])
        .maybeSingle();
    
    setMyActiveDonation(donationData); // Clear if null
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, donations(status)')
      .eq('status', 'PENDING');
    
    if (error) {
     console.error(error);
    } else {
      // Filter out requests that have enough active donors
      const filtered = (data || []).filter((req: any) => {
             const activeDonations = req.donations?.filter((d: any) => d.status !== 'CANCELLED') || [];
             
             // Data Integrity Check
             if (req.location) {
                const matches = req.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
                if (matches) {
                    const lon = parseFloat(matches[1]);
                    const lat = parseFloat(matches[2]);
                    if (isNaN(lon) || isNaN(lat)) {
                         const msg = `Invalid coordinates for request ${req.id}: ${req.location}`;
                         console.error(msg);
                         setDataError(msg); 
                         return false; // exclude from map
                    }
                }
             }

             return activeDonations.length < req.units_needed;
      });
      setRequests(filtered);
    }
  };

  // Route State
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  
  useEffect(() => {
      if (myActiveDonation && location) {
          fetchDirections();
      } else {
          setRouteCoords([]);
      }
  }, [myActiveDonation, location]);

  const fetchDirections = async () => {
      if (!myActiveDonation || !location) return;
      
      // Get destination from request
      const { data: requestData } = await supabase
        .from('requests')
        .select('location')
        .eq('id', myActiveDonation.request_id)
        .single();
      
      if (!requestData?.location) return;

      const matches = requestData.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (!matches) return;
      const destLng = matches[1];
      const destLat = matches[2];

      try {
          const resp = await fetch(
              `https://maps.googleapis.com/maps/api/directions/json?origin=${location.coords.latitude},${location.coords.longitude}&destination=${destLat},${destLng}&key=${GOOGLE_API_KEY}`
          );
          const data = await resp.json();
          if (data.routes.length > 0) {
              const points = decodePolyline(data.routes[0].overview_polyline.points);
              setRouteCoords(points);
          }
      } catch (error) {
          console.error("Error fetching directions", error);
      }
  };



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
    <ErrorBoundary onReset={() => requestPermission()}>
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

                if (isNaN(longitude) || isNaN(latitude)) {
                    console.error(`Invalid coordinates for request ${req.id}: ${req.location}`);
                    return null;
                }

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

            {/* Route Polyline */}
            {routeCoords.length > 0 && (
                <Polyline
                    coordinates={routeCoords}
                    strokeColor={COLORS.primary}
                    strokeWidth={4}
                />
            )}
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

        {/* Floating Status Buttons Container */}
        {!isPickingLocation && (
            <View style={[styles.floatingButtonContainer, { top: insets.top + SPACING.lg }]}>
                {myActiveRequest && (
                    <TouchableOpacity 
                        style={[styles.floatingButton, styles.requesterButton]}
                        onPress={() => setIsVerificationVisible(true)}
                    >
                        <Activity color={COLORS.white} size={24} />
                        <Text style={styles.requestButtonText}>MY REQUEST</Text>
                    </TouchableOpacity>
                )}

                {myActiveDonation && (
                    <TouchableOpacity 
                        style={[styles.floatingButton, styles.donorButton]}
                        onPress={() => setIsDonorActionsVisible(true)}
                    >
                        <Navigation color={COLORS.white} size={24} />
                        <Text style={styles.requestButtonText}>DONATION ACTIVE</Text>
                    </TouchableOpacity>
                )}
            </View>
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
                onVerifySuccess={() => {
                    fetchMyActiveState();
                    // Optionally close the sheet or keep it open to show next step
                    // setIsDonorActionsVisible(false); 
                }}
            />
        )}

        {/* Data Error Modal */ }
        {dataError && (
            <View style={styles.errorModalOverlay}>
                <View style={styles.errorModalBox}>
                    <Text style={styles.errorModalTitle}>Data Error Detected</Text>
                    <Text style={styles.errorModalText}>{dataError}</Text>
                    <TouchableOpacity 
                        style={styles.errorModalButton}
                        onPress={() => setDataError(null)}
                    >
                        <Text style={styles.errorModalButtonText}>Dismiss</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
        </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    marginTop: SPACING.md,
    color: COLORS.error,
    textAlign: 'center',
    marginHorizontal: SPACING.lg,
  },
  map: {
    flex: 1,
  },
  centerPinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  pickerInstruction: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  requestButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  requestButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: COLORS.gray, 
  },
  requesterButton: {
    backgroundColor: COLORS.primary,
  },
  donorButton: {
    backgroundColor: COLORS.success,
  },
  errorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  errorModalBox: {
    width: '85%',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  errorModalText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontFamily: 'monospace',
  },
  errorModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  errorModalButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});



