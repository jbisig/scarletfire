import React from 'react';
import { ActionSheet } from './ActionSheet';
import type { SortOption } from './SortDropdown';

interface SortTrayProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  options: SortOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  /** Tray heading. Defaults to "Sort by". */
  title?: string;
}

/**
 * Sort picker as a bottom tray — the ActionSheet flavor of the old positioned
 * SortDropdown, sharing its option shape so call sites swap in directly
 * (minus the ref/measure/position plumbing).
 */
export function SortTray<T extends string>({
  visible,
  onClose,
  options,
  selectedValue,
  onSelect,
  title = 'Sort by',
}: SortTrayProps<T>) {
  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      actions={options.map((option) => ({
        label: option.label,
        icon: option.icon,
        selected: option.value === selectedValue,
        onPress: () => onSelect(option.value),
      }))}
    />
  );
}
