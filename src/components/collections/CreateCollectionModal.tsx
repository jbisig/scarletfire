import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CollectionType } from '../../types/collection.types';
import { useCollections } from '../../contexts/CollectionsContext';
import { useToast } from '../../contexts/ToastContext';
import { BottomSheet } from '../BottomSheet';
import { COLORS, TYPOGRAPHY, FONTS, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: CollectionType;
  onCreated?: (collectionId: string) => void;
}

export function CreateCollectionModal({
  visible,
  onClose,
  initialType = 'show_collection',
  onCreated,
}: Props) {
  const { createCollection } = useCollections();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const type: CollectionType = initialType;
  const isPlaylist = type === 'playlist';
  const titleText = isPlaylist ? 'New Playlist' : 'New Show Collection';
  const namePlaceholder = isPlaylist ? 'e.g. Best Dark Stars' : 'e.g. Best 77 Shows';

  const reset = () => {
    setName('');
    setDescription('');
    setSubmitting(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createCollection({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      onCreated?.(created.id);
    } catch (e) {
      setSubmitting(false);
      const msg = e instanceof Error ? e.message : 'Failed to create collection';
      // Toast lives above the modal — keep the user's input intact so they
      // can sign in / retry without re-typing the name.
      showToast(msg, 'error');
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} cardStyle={styles.card}>
      <Text style={styles.title}>{titleText}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={namePlaceholder}
        placeholderTextColor={COLORS.textSecondary}
        autoFocus
        maxLength={80}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        maxLength={280}
      />

      <View style={styles.actions}>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim() || submitting}
          style={[styles.createBtn, (!name.trim() || submitting) && styles.disabledBtn]}
        >
          <Text style={styles.createText}>{submitting ? 'Creating…' : 'Create'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    gap: 8,
  },
  title: { ...TYPOGRAPHY.heading4, fontSize: 18, marginBottom: 8 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
  input: {
    backgroundColor: COLORS.searchBackground,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    // @ts-ignore web only
    cursor: 'pointer',
  },
  cancelText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  createBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    // @ts-ignore web only
    cursor: 'pointer',
  },
  disabledBtn: { opacity: 0.5 },
  createText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
