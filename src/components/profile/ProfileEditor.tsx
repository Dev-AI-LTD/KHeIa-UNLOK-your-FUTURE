import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, ios, iosText, sizes } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { IOSButton } from '@/components/ui/IOSButton';
import {
  getUserProfile,
  updateUserProfile,
  pickProfileImage,
  uploadProfileAvatar,
  STUDY_YEAR_OPTIONS,
  type UserProfile,
} from '@/services/profile.service';

type ProfileEditorProps = {
  userId: string;
  onSaved?: () => void;
};

export function ProfileEditor({ userId, onSaved }: ProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [studyYear, setStudyYear] = useState<string>(STUDY_YEAR_OPTIONS[3]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await getUserProfile(userId);
    if (p) {
      setProfile(p);
      setDisplayName(p.display_name ?? '');
      setSchool(p.school ?? '');
      setCity(p.city ?? '');
      setStudyYear(
        p.study_year && STUDY_YEAR_OPTIONS.includes(p.study_year as (typeof STUDY_YEAR_OPTIONS)[number])
          ? p.study_year
          : STUDY_YEAR_OPTIONS[3],
      );
      setAvatarUrl(p.avatar_url);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePickPhoto = async () => {
    const uri = await pickProfileImage();
    if (!uri) {
      Alert.alert(
        'Acces la galerie',
        'Permite accesul la poze în setările telefonului pentru a seta poza de profil.',
      );
      return;
    }

    setUploadingPhoto(true);
    const result = await uploadProfileAvatar(userId, uri);
    setUploadingPhoto(false);

    if (!result.success) {
      Alert.alert('Eroare', result.error ?? 'Nu s-a putut încărca poza');
      return;
    }
    setAvatarUrl(result.avatarUrl ?? null);
    onSaved?.();
  };

  const handleSave = async () => {
    if (!school.trim()) {
      Alert.alert('Școală necesară', 'Completează numele școlii pentru a apărea în clasament.');
      return;
    }

    setSaving(true);
    const result = await updateUserProfile(userId, {
      display_name: displayName,
      school,
      city,
      study_year: studyYear,
    });
    setSaving(false);

    if (!result.success) {
      Alert.alert('Eroare', result.error ?? 'Nu s-a putut salva profilul');
      return;
    }

    Alert.alert('Salvat', 'Profilul tău a fost actualizat.');
    await load();
    onSaved?.();
  };

  const initial = (displayName.trim()[0] ?? 'U').toUpperCase();

  if (loading) {
    return (
      <GlassCard dark intensity={18} style={styles.card}>
        <ActivityIndicator color={colors.dark.primary} />
      </GlassCard>
    );
  }

  return (
    <GlassCard dark intensity={18} style={styles.card}>
      <Text style={styles.cardTitle}>Profilul meu</Text>
      <Text style={styles.cardDesc}>
        Completează datele pentru clasamentul pe școală. Colegii vor vedea numele, școala și XP-ul tău.
      </Text>

      <Pressable
        onPress={() => void handlePickPhoto()}
        disabled={uploadingPhoto}
        style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Schimbă poza de profil"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.avatarBadge}>
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Ionicons name="camera" size={18} color="#0F172A" />
          )}
        </View>
      </Pressable>

      <Field label="Nume afișat">
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="ex. Maria Popescu"
          placeholderTextColor={colors.dark.muted}
          maxLength={40}
        />
      </Field>

      <Field label="Școală *">
        <TextInput
          style={styles.input}
          value={school}
          onChangeText={setSchool}
          placeholder="ex. Colegiul Național ..."
          placeholderTextColor={colors.dark.muted}
          maxLength={120}
        />
      </Field>

      <Field label="Oraș">
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="ex. București"
          placeholderTextColor={colors.dark.muted}
          maxLength={80}
        />
      </Field>

      <Field label="An de studiu">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
        >
          {STUDY_YEAR_OPTIONS.map((year) => {
            const active = studyYear === year;
            return (
              <Pressable
                key={year}
                onPress={() => setStudyYear(year)}
                style={[styles.yearChip, active && styles.yearChipActive]}
              >
                <Text style={[styles.yearChipText, active && styles.yearChipTextActive]}>
                  {year.replace('Clasa ', '')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>

      <IOSButton
        label={saving ? 'Se salvează…' : 'Salvează profilul'}
        onPress={() => void handleSave()}
        loading={saving}
        disabled={saving || uploadingPhoto}
        style={styles.saveBtn}
      />
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.dark.primary,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dark.primary,
  },
  avatarInitial: {
    ...iosText('title1'),
    color: colors.dark.primary,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    minHeight: sizes.inputMinHeight,
    borderRadius: ios.radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
    color: colors.dark.text,
    ...iosText('body'),
  },
  yearRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  yearChip: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: ios.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dark.border,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
  },
  yearChipActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  yearChipText: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    fontWeight: '600',
  },
  yearChipTextActive: {
    color: '#0F172A',
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
});
