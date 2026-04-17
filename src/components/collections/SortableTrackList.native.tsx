import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, {
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
        <View style={[styles.row, isActive && styles.rowActive]}>
          <View style={{ flex: 1 }}>{renderItem(item)}</View>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={styles.handle}
            accessibilityLabel="Drag to reorder"
          >
            <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={10}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowActive: { opacity: 0.85 },
  handle: { padding: 8 },
});
