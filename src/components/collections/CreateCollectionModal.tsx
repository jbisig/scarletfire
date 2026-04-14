import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CollectionType } from '../../types/collection.types';
import { useCollections } from '../../contexts/CollectionsContext';
import { useToast } from '../../contexts/ToastContext';
import { COLORS } from '../../constants/theme';

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
  const [type, setType] = useState<CollectionType>(initialType);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setType(initialType);
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
      // Close the modal so the toast isn't hidden behind its overlay.
      onClose();
      showToast(msg, 'error');
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, isWeb && styles.backdropWeb]}
      >
        <View style={[styles.card, isWeb && styles.cardWeb]}>
          <Text style={styles.title}>New Collection</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Best 77 Shows"
            placeholderTextColor={COLORS.textSecondary}
            autoFocus
            maxLength={80}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['show_collection', 'playlist'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={type === t ? styles.typeTextActive : styles.typeText}>
                  {t === 'playlist' ? 'Playlist' : 'Show Collection'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  backdropWeb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  cardWeb: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
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
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.searchBackground,
  },
  typeChipActive: { backgroundColor: COLORS.accent },
  typeText: { color: COLORS.textSecondary, fontSize: 13 },
  typeTextActive: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  disabledBtn: { opacity: 0.5 },
  createText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
