import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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
        <Pressable
          style={({ pressed }) => [
            styles.row,
            isActive && styles.rowActive,
            pressed && styles.rowPressed,
          ]}
          onLongPress={drag}
          disabled={isActive}
          accessibilityLabel="Long press to drag and reorder"
        >
          <View style={styles.handle}>
            <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
          </View>
          {/* pointerEvents="none" so the inner SongCard's own Pressable can't
              steal touches away from the outer long-press-drag handler. */}
          <View style={styles.content} pointerEvents="none">
            {renderItem(item)}
          </View>
        </Pressable>
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
  rowPressed: { backgroundColor: COLORS.cardBackground },
  handle: { padding: 8 },
  content: { flex: 1 },
});
