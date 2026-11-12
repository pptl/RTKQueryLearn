import type { Category } from '../../types';

export type CategoryFilter = 'all' | Category;

const TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'main', label: '主餐' },
  { value: 'side', label: '點心' },
  { value: 'drink', label: '飲料' },
];

interface Props {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label="餐點分類">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={value === t.value ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
