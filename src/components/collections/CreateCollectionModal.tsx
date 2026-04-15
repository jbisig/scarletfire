import React from 'react';
import { CollectionType } from '../../types/collection.types';
import { BottomSheet } from '../BottomSheet';
import { CreateCollectionForm } from './CreateCollectionForm';

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
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <CreateCollectionForm
        type={initialType}
        onCancel={onClose}
        onCreated={(id) => {
          onClose();
          onCreated?.(id);
        }}
      />
    </BottomSheet>
  );
}
