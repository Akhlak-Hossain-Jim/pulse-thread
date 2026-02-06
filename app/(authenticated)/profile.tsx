import { LogOut, Save, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthProvider';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [isDonorActive, setIsDonorActive] = useState(false);
  
  useEffect(() => {
    if (session) {
        fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, phone, blood_type, is_donor_active`)
        .eq('id', session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setBloodType(data.blood_type || '');
        setIsDonorActive(data.is_donor_active || false);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        full_name: fullName,
        phone,
        blood_type: bloodType,
        is_donor_active: isDonorActive,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setSaving(false);
    }
  };



  return (
    <View style={styles.container}>
      {/* ... Header ... */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
           <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <View>
            <View style={styles.card}>
                {/* ... existing profile card content ... */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <UserIcon size={40} color={COLORS.white} />
                    </View> 
                    <Text style={styles.emailText}>{session?.user.email}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="John Doe"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+1 234 567 890"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Blood Type</Text>
                        <TextInput
                            style={styles.input}
                            value={bloodType}
                            onChangeText={setBloodType}
                            placeholder="O+"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Donor Status</Text>
                        <TouchableOpacity 
                            style={[styles.toggleButton, isDonorActive && styles.activeToggle]}
                            onPress={() => setIsDonorActive(!isDonorActive)}
                        >
                            <Text style={[styles.toggleText, isDonorActive && styles.activeToggleText]}>
                                {isDonorActive ? "Active Donor (Visible on Map)" : "Inactive (Hidden)"}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>
                            Enable this to appear to people requesting blood nearby.
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={updateProfile}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Save size={20} color={COLORS.white} />
                                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  avatarContainer: {
      alignItems: 'center',
      marginBottom: SPACING.xl
  },
  avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.sm
  },
  emailText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.darkGray
  },
  form: {
      gap: SPACING.lg
  },
  inputGroup: {
      gap: SPACING.xs
  },
  label: {
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: 'bold',
      color: COLORS.text
  },
  input: {
      backgroundColor: COLORS.gray,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      fontSize: TYPOGRAPHY.sizes.md
  },
  toggleButton: {
      padding: SPACING.md,
      backgroundColor: COLORS.gray,
      borderRadius: SPACING.sm,
      alignItems: 'center'
  },
  activeToggle: {
      backgroundColor: COLORS.success + '20', // 20% opacity
      borderWidth: 1,
      borderColor: COLORS.success
  },
  toggleText: {
      fontWeight: 'bold',
      color: COLORS.darkGray
  },
  activeToggleText: {
      color: COLORS.success
  },
  helperText: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray,
      marginTop: 4
  },
  saveButton: {
      backgroundColor: COLORS.primary,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      alignItems: 'center',
      marginTop: SPACING.sm,
      ...SHADOWS.button
  },
  saveButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  },
  logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.xxl,
      padding: SPACING.md
  },
  logoutText: {
      color: COLORS.error,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  },
  // New Styles


});
