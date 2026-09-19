import { getCategoryOfSkill, type CertificationTier, type Course } from '@skillswap/shared'

export type PriceBand = 'all' | 'low' | 'mid' | 'high'

export interface MarketFilters {
  tiers: CertificationTier[]
  priceBand: PriceBand
  /** 0 表示不限 */
  minRating: number
}

export const DEFAULT_FILTERS: MarketFilters = { tiers: [], priceBand: 'all', minRating: 0 }

export const PRICE_BANDS: { id: PriceBand; label: string }[] = [
  { id: 'all', label: '不限' },
  { id: 'low', label: '20 币以下' },
  { id: 'mid', label: '20–50 币' },
  { id: 'high', label: '50 币以上' },
]

export const RATING_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 0.9, label: '好评 ≥ 90%' },
  { value: 0.95, label: '好评 ≥ 95%' },
]

export function inCategory(skillId: string, categoryId: string | null): boolean {
  return !categoryId || getCategoryOfSkill(skillId)?.id === categoryId
}

export function priceInBand(coins: number, band: PriceBand): boolean {
  switch (band) {
    case 'low':
      return coins < 20
    case 'mid':
      return coins >= 20 && coins < 50
    case 'high':
      return coins >= 50
    default:
      return true
  }
}

export function applyFilters(courses: Course[], f: MarketFilters): Course[] {
  return courses.filter((c) => {
    if (f.tiers.length && !f.tiers.includes(c.tier)) return false
    if (!priceInBand(c.coinsPerHour, f.priceBand)) return false
    // 一条评价都没有的新课不该出现在「好评 ≥90%」的结果里 —— 那个百分比还不存在
    if (f.minRating > 0 && !(c.ratingCount > 0 && c.rating >= f.minRating)) return false
    return true
  })
}

export function activeFilterCount(f: MarketFilters): number {
  return (f.tiers.length ? 1 : 0) + (f.priceBand !== 'all' ? 1 : 0) + (f.minRating > 0 ? 1 : 0)
}
