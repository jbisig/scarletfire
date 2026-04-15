import React, { useRef, useState } from 'react';
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
import { COLORS, TYPOGRAPHY, FONTS, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  type: CollectionType;
  onCancel: () => void;
  onCreated?: (collectionId: string) => void;
}

/**
 * Inline create-collection form. Designed to live inside an already-open
 * BottomSheet so we avoid stacking two native iOS modals (which breaks
 * TextInput focus and touch routing). CreateCollectionModal wraps this in
 * its own BottomSheet for the standalone case.
 */
export function CreateCollectionForm({ type, onCancel, onCreated }: Props) {
  const { createCollection } = useCollections();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Refs mirror the inputs so handleCreate always sees the latest value even
  // if React hasn't re-rendered between the last keystroke and the tap.
  const nameRef = useRef('');
  const descriptionRef = useRef('');
  const submittingRef = useRef(false);
  const isPlaylist = type === 'playlist';
  const titleText = isPlaylist ? 'New Playlist' : 'New Show Collection';
  const namePlaceholder = isPlaylist ? 'e.g. Best Dark Stars' : 'e.g. Best 77 Shows';

  console.log('[CreateCollectionForm] rendered', { type });

  const handleCreate = async () => {
    const trimmed = nameRef.current.trim();
    console.log('[CreateCollectionForm] handleCreate called', { trimmed, submitting: submittingRef.current });
    if (!trimmed || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const created = await createCollection({
        name: trimmed,
        type,
        description: descriptionRef.current.trim() || undefined,
      });
      onCreated?.(created.id);
    } catch (e) {
      submittingRef.current = false;
      setSubmitting(false);
      const msg = e instanceof Error ? e.message : 'Failed to create collection';
      showToast(msg, 'error');
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{titleText}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => {
          nameRef.current = t;
          setName(t);
        }}
        placeholder={namePlaceholder}
        placeholderTextColor={COLORS.textSecondary}
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={handleCreate}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={description}
        onChangeText={(t) => {
          descriptionRef.current = t;
          setDescription(t);
        }}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        maxLength={280}
      />

      <View
        style={styles.actions}
        onTouchStart={() => console.log('[CreateCollectionForm] actions onTouchStart')}
      >
        {/* SWAPPED ORDER for diagnosis: Create left, Cancel right */}
        <TouchableOpacity
          onPress={() => {
            console.log('[CreateCollectionForm] Create onPress fired');
            handleCreate();
          }}
          onPressIn={() => {
            console.log('[CreateCollectionForm] Create onPressIn fired');
          }}
          onTouchStart={() => console.log('[CreateCollectionForm] Create onTouchStart')}
          onTouchEnd={() => console.log('[CreateCollectionForm] Create onTouchEnd')}
          onLayout={(e) => console.log('[CreateCollectionForm] Create onLayout', e.nativeEvent.layout)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={[
            styles.createBtn,
            (!name.trim() || submitting) && styles.disabledBtn,
          ]}
        >
          <Text style={styles.createText}>{submitting ? 'Creating…' : 'Create'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            console.log('[CreateCollectionForm] Cancel onPress');
            onCancel();
          }}
          onTouchStart={() => console.log('[CreateCollectionForm] Cancel onTouchStart')}
          onLayout={(e) => console.log('[CreateCollectionForm] Cancel onLayout', e.nativeEvent.layout)}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 8 },
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
