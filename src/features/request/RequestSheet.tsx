
import { ArrowLeft, MapPin, Navigation, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useLocationStore } from '../../store/locationStore';

interface RequestSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickLocation: () => void;
  selectedLocation?: any;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

export const RequestSheet = ({ visible, onClose, onPickLocation, selectedLocation }: RequestSheetProps) => {
  const { session } = useAuth();
  const { location: gpsLocation } = useLocationStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [bloodType, setBloodType] = useState('');
  const [componentType, setComponentType] = useState('Whole Blood');
  const [units, setUnits] = useState('1');
  const [urgency, setUrgency] = useState('Standard');
  const [hospital, setHospital] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Search State
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    if (selectedLocation) {
        setHospital(selectedLocation.address || "Pinned Location");
        setSelectedPlace({
            geometry: { location: { lat: selectedLocation.latitude, lng: selectedLocation.longitude } },
            name: "Pinned Location"
        });
        setShowPredictions(false);
    }
  }, [selectedLocation]);

  const searchPlaces = async (text: string) => {
    setQuery(text);
    setHospital(text);
    if (text.length < 3) {
        setPredictions([]);
        setShowPredictions(false);
        return;
    }

    try {
        const userLat = gpsLocation?.coords.latitude;
        const userLng = gpsLocation?.coords.longitude;
        const locationBias = userLat ? `&location=${userLat},${userLng}&radius=50000` : '';
        
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}${locationBias}`
        );
        const data = await res.json();
        if (data.status === 'OK') {
            setPredictions(data.predictions);
            setShowPredictions(true);
        }
    } catch (error) {
        console.error("Error fetching places", error);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
      setHospital(description);
      setShowPredictions(false);
      
      try {
          const res = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name&key=${GOOGLE_API_KEY}`
          );
          const data = await res.json();
          if (data.status === 'OK') {
              setSelectedPlace(data.result); // Contains geometry.location.lat/lng
          }
      } catch (error) {
          Alert.alert("Error", "Could not fetch place details");
      }
  };

  const handleUseCurrentLocation = () => {
     setHospital("Current Location");
     setSelectedPlace(null); // Will fallback to GPS
     setShowPredictions(false);
  };

  const handleSubmit = async () => {
    // Priority: 1. Selected Place (Autocomplete), 2. Selected Map Pin, 3. GPS
    let finalLat, finalLng;

    if (selectedPlace?.geometry?.location) {
        finalLat = selectedPlace.geometry.location.lat;
        finalLng = selectedPlace.geometry.location.lng;
    } else if (selectedLocation) {
        finalLat = selectedLocation.latitude;
        finalLng = selectedLocation.longitude;
    } else {
        finalLat = gpsLocation?.coords.latitude;
        finalLng = gpsLocation?.coords.longitude;
    }

    if (!bloodType || !hospital || !finalLat || !session) {
      Alert.alert('Error', 'Please fill in all fields and ensure location is active.');
      return;
    }

    setLoading(true);
    try {
      // 1. Ensure profile exists (Implicit Creation)
      const { error: profileError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          updated_at: new Date().toISOString(),
      });

      if (profileError) {
          console.error("Profile creation failed:", JSON.stringify(profileError, null, 2));
          // We continue anyway, hoping it's non-fatal (like existing profile)
      }

      const { error } = await supabase.from('requests').insert({
        requester_id: session.user.id,
        blood_type: bloodType,
        units_needed: parseInt(units),
        hospital_name: hospital,
        location: `POINT(${finalLng} ${finalLat})`,
        urgency,
        component_type: componentType,
        status: 'PENDING',
      });

      if (error) throw error;
      
      Alert.alert('Success', 'Request broadcasted to nearby donors!');
      setBloodType('');
      setHospital('');
      setQuery('');
      setUnits('1');
      setUrgency('Standard');
      setComponentType('Whole Blood');
      setStep(1);
      setSelectedPlace(null);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
      if (!bloodType || !units) {
          Alert.alert("Missing Info", "Please select blood type and units.");
          return;
      }
      setStep(2);
  };
  
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const COMPONENT_TYPES = ['Whole Blood', 'PRBC', 'Platelets', 'Plasma', 'Cryoprecipitate'];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { height: showPredictions ? '80%' : 'auto', paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {step === 2 && (
                    <TouchableOpacity onPress={() => setStep(1)}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>
                    {step === 1 ? "Request Details" : "Select Location"}
                </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={[styles.form, { flex: showPredictions ? 1 : 0 }]}>
            {step === 1 ? (
                <>
                <Text style={styles.label}>Blood Type</Text>
                <View style={styles.chipsContainer}>
                    {BLOOD_TYPES.map(type => (
                        <TouchableOpacity 
                            key={type}
                            style={[
                                styles.chip, 
                                bloodType === type && styles.activeChip
                            ]}
                            onPress={() => setBloodType(type)}
                        >
                            <Text style={[
                                styles.chipText,
                                bloodType === type && styles.activeChipText
                            ]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Component Type</Text>
                <View style={styles.chipsContainer}>
                    {COMPONENT_TYPES.map(type => (
                        <TouchableOpacity 
                            key={type}
                            style={[
                                styles.chip, 
                                componentType === type && styles.activeChip
                            ]}
                            onPress={() => setComponentType(type)}
                        >
                            <Text style={[
                                styles.chipText,
                                componentType === type && styles.activeChipText
                            ]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Units Needed</Text>
                <TextInput
                style={styles.input}
                value={units}
                onChangeText={setUnits}
                keyboardType="numeric"
                placeholderTextColor={COLORS.darkGray}
                />

                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyContainer}>
                    {['Standard', 'Urgent', 'Critical'].map((level) => (
                        <TouchableOpacity 
                            key={level}
                            style={[
                                styles.urgencyButton, 
                                urgency === level && styles.activeUrgencyButton,
                                urgency === level && level === 'Critical' && { backgroundColor: COLORS.error },
                                urgency === level && level === 'Urgent' && { backgroundColor: COLORS.primary }
                            ]}
                            onPress={() => setUrgency(level)}
                        >
                            <Text style={[
                                styles.urgencyText, 
                                urgency === level && styles.activeUrgencyText
                            ]}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleNextStep}
                >
                    <Text style={styles.buttonText}>NEXT</Text>
                </TouchableOpacity>
                </>
            ) : (
                <>
                 <Text style={styles.label}>Hospital / Location</Text>
                 {/* ... Location Search Logic ... */}
             <View style={styles.hospitalInputContainer}>
                <TextInput
                    style={styles.searchInput}
                    value={hospital}
                    onChangeText={searchPlaces}
                    placeholder="Search hospital or place..."
                    placeholderTextColor={COLORS.darkGray}
                    onFocus={() => {
                        if (hospital.length > 2) setShowPredictions(true);
                    }}
                />
                 {hospital.length > 0 && (
                    <TouchableOpacity onPress={() => { setHospital(''); setQuery(''); setShowPredictions(false); }} style={styles.clearBtn}>
                        <X size={16} color={COLORS.darkGray} />
                    </TouchableOpacity>
                 )}
            </View>

            {showPredictions && (
                <View style={styles.predictionsList}>
                    <TouchableOpacity style={styles.predictionItem} onPress={handleUseCurrentLocation}>
                        <Navigation size={16} color={COLORS.primary} />
                        <Text style={styles.predictionText}>Use Current Location</Text>
                    </TouchableOpacity>
                     
                    <TouchableOpacity style={styles.predictionItem} onPress={onPickLocation}>
                        <MapPin size={16} color={COLORS.primary} />
                        <Text style={styles.predictionText}>Select on Map</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={predictions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.predictionItem} onPress={() => handleSelectPlace(item.place_id, item.description)}>
                                <MapPin size={16} color={COLORS.darkGray} />
                                <Text style={styles.predictionText} numberOfLines={1}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled" 
                    />
                </View>
            )}

            {!showPredictions && (
                <TouchableOpacity 
                style={styles.button} 
                onPress={handleSubmit}
                disabled={loading}
                >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.buttonText}>BROADCAST REQUEST</Text>
                )}
                </TouchableOpacity>
            )}
            </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  form: {
    gap: SPACING.md,
    flex: 1
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  hospitalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.gray,
      borderRadius: SPACING.sm,
      paddingHorizontal: SPACING.md,
  },
  searchInput: {
      flex: 1,
      paddingVertical: SPACING.md,
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text,
  },
  clearBtn: {
      padding: SPACING.xs
  },
  predictionsList: {
      flex: 1,
      marginTop: SPACING.xs,
      backgroundColor: COLORS.white,
      borderRadius: SPACING.sm,
      borderWidth: 1,
      borderColor: COLORS.gray
  },
  predictionItem: {
      flexDirection: 'row',
      gap: SPACING.sm,
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.gray,
      alignItems: 'center'
  },
  predictionText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl, // Safe area
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  urgencyContainer: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md
  },
  urgencyButton: {
      flex: 1,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      backgroundColor: COLORS.gray,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent'
  },
  activeUrgencyButton: {
      backgroundColor: COLORS.action, // Default active
  },
  urgencyText: {
      fontWeight: 'bold',
      color: COLORS.darkGray
  },
  activeUrgencyText: {
      color: COLORS.white
  },
  chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginBottom: SPACING.md
  },
  chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 16,
      backgroundColor: COLORS.gray,
      borderWidth: 1,
      borderColor: 'transparent'
  },
  activeChip: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.primary
  },
  chipText: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.sm
  },
  activeChipText: {
      color: COLORS.primary,
      fontWeight: 'bold'
  }
});
