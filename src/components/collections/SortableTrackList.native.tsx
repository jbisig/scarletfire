import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  NestableDraggableFlatList,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

type Props = {
  items: CollectionItem[];
  onReorder: (next: CollectionItem[]) => void;
  renderItem: (item: CollectionItem) => React.ReactNode;
};

export function SortableTrackList({ items, onReorder, renderItem }: Props) {
  const renderRow = ({ item, drag, isActive }: RenderItemParams<CollectionItem>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[styles.row, isActive && styles.rowActive]}
          onLongPress={drag}
          disabled={isActive}
          activeOpacity={0.85}
          accessibilityLabel="Long press to drag and reorder"
        >
          <View style={styles.handle}>
            <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>{renderItem(item)}</View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <NestableDraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={10}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowActive: { opacity: 0.85 },
  handle: { padding: 8 },
});
