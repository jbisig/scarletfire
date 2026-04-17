import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

type Props = {
  items: CollectionItem[];
  onReorder: (next: CollectionItem[]) => void;
  renderItem: (item: CollectionItem) => React.ReactNode;
};

function SortableRow({
  item,
  children,
}: {
  item: CollectionItem;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  };

  return (
    // @ts-ignore — dnd-kit uses DOM refs; this file is web-only.
    <div ref={setNodeRef} style={style} {...attributes}>
      <View style={{ flex: 1 }}>{children}</View>
      <TouchableOpacity
        style={styles.handle}
        // @ts-ignore — dnd-kit listeners are DOM event handlers.
        {...listeners}
        accessibilityLabel="Drag to reorder"
      >
        <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </div>
  );
}

export function SortableTrackList({ items, onReorder, renderItem }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableRow key={item.id} item={item}>
            {renderItem(item)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

const styles = StyleSheet.create({
  handle: {
    padding: 8,
    // @ts-ignore — web only
    cursor: 'grab',
  },
});
