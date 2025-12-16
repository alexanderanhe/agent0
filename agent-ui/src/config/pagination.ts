const parseSize = (value: unknown, fallback: number) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return fallback
  return Math.min(num, 100)
}

export const paginationConfig = {
  pageSize: parseSize(
    typeof import.meta !== 'undefined'
      ? (import.meta.env.VITE_PAGE_SIZE as string | undefined)
      : undefined,
    10,
  ),
}
