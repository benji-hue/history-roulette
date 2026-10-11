export interface Topic {
  /** номер темы в исходном списке, он же стабильный id */
  n: number
  title: string
  category: string
  categoryIndex: number
}

/** Палитра по разделам: цвет закреплён за индексом, а не за названием. */
export const CATEGORY_COLORS = [
  '#e07a5f',
  '#d9a441',
  '#81b29a',
  '#7aa2d9',
  '#b08bd4',
  '#e0956f',
  '#c9797a',
  '#9ab973',
  '#d4a373',
  '#7fb2b8',
  '#bf8fb0',
  '#c2a85a',
] as const

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
