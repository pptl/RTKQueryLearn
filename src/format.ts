export const formatPrice = (n: number) => `NT$ ${n.toLocaleString('zh-TW')}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short', hour12: false });

/** 從 RTK Query 的 error 物件取出後端的 message（若有） */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}
