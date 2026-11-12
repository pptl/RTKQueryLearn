import type { MenuItem } from '../types';

// 圖片用 public/img 下的 SVG 佔位圖
export const initialMenu: MenuItem[] = [
  { id: 'm-001', name: '經典牛肉堡', description: '雙層牛肉、切達起司', price: 159, category: 'main', imageUrl: '/img/burger.svg', available: true },
  { id: 'm-002', name: '辣味雞腿堡', description: '酥炸雞腿、辣味美乃滋', price: 139, category: 'main', imageUrl: '/img/chicken.svg', available: true },
  { id: 'm-003', name: '鮭魚堡', description: '鮭魚排、塔塔醬', price: 149, category: 'main', imageUrl: '/img/salmon.svg', available: false },
  { id: 'm-101', name: '薄脆薯條', description: '中份', price: 59, category: 'side', imageUrl: '/img/fries.svg', available: true },
  { id: 'm-102', name: '洋蔥圈', description: '6 入', price: 69, category: 'side', imageUrl: '/img/onion.svg', available: true },
  { id: 'm-201', name: '紅茶', description: '微糖，中杯', price: 35, category: 'drink', imageUrl: '/img/tea.svg', available: true },
  { id: 'm-202', name: '拿鐵', description: '熱，中杯', price: 75, category: 'drink', imageUrl: '/img/latte.svg', available: true },
];

// mock 後端的「資料庫」：可被修改（例如模擬某餐點在點餐途中售完）
export let menu: MenuItem[] = structuredClone(initialMenu);

/** 測試用：把菜單還原成初始狀態 */
export function resetMenu() {
  menu = structuredClone(initialMenu);
}
