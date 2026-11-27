import { supabase } from './supabase'
import { getSystemAchievementsCatalog } from './achievementsCatalog'
import type { UserAchievement } from '@/types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface DbAchievementRow {
  id: string
  type: string
  year: number | null
  month: number | null
}

let cachedDbAchievements: DbAchievementRow[] | null = null

async function getDbAchievementsCatalog(): Promise<DbAchievementRow[]> {
  if (cachedDbAchievements) return cachedDbAchievements
  const { data } = await supabase.from('achievements').select('id, type, year, month')
  if (Array.isArray(data) && data.length > 0) {
    cachedDbAchievements = data as DbAchievementRow[]
  }
  return cachedDbAchievements || []
}

/**
 * Resolves a catalog string ID (e.g. 'ach-50', 'ach-jan') to a seeded UUID
 * in the Supabase `achievements` table when `user_achievements.achievement_id`
 * still has a UUID/FK constraint.
 */
export async function resolveDbAchievementUuid(
  catalogId: string,
  year?: number,
  month?: number
): Promise<string | null> {
  if (UUID_REGEX.test(catalogId)) return catalogId

  const catalog = getSystemAchievementsCatalog(year || new Date().getFullYear())
  const entry = catalog.find(a => a.id === catalogId)
  if (!entry) return null

  const dbRows = await getDbAchievementsCatalog()
  const targetType = entry.type === 'complete_year_goat' ? 'full_year_consistency' : entry.type
  const targetMonth = month ?? entry.month ?? null
  const targetYear = year ?? entry.year ?? null

  const exact = dbRows.find(
    r => r.type === targetType && (r.month ?? null) === targetMonth && (r.year ?? null) === targetYear
  )
  if (exact) return exact.id

  const byTypeAndMonth = dbRows.find(
    r => r.type === targetType && (r.month ?? null) === targetMonth
  )
  return byTypeAndMonth?.id ?? null
}

/**
 * Normalizes `user_achievements` rows returned from Supabase, mapping any DB
 * achievement UUIDs back to the app's canonical catalog IDs and attaching
 * catalog metadata (`achievement`).
 */
export async function mapUserAchievementRows(rows: any[]): Promise<UserAchievement[]> {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const hasUuidIds = rows.some(r => UUID_REGEX.test(String(r.achievement_id || '')))
  const dbRows = hasUuidIds ? await getDbAchievementsCatalog() : []
  const dbById = new Map(dbRows.map(r => [r.id, r]))

  const catalogByYear = new Map<number, ReturnType<typeof getSystemAchievementsCatalog>>()
  const getCatalog = (year: number) => {
    if (!catalogByYear.has(year)) catalogByYear.set(year, getSystemAchievementsCatalog(year))
    return catalogByYear.get(year)!
  }

  return rows.map((r: any) => {
    const year = r.year || new Date().getFullYear()
    const catalog = getCatalog(year)
    let canonicalId = String(r.achievement_id || '')
    let matched = catalog.find(a => a.id === canonicalId)

    if (!matched && UUID_REGEX.test(canonicalId)) {
      const dbMeta = dbById.get(canonicalId)
      if (dbMeta) {
        const mappedType = dbMeta.type === 'full_year_consistency' ? 'complete_year_goat' : dbMeta.type
        matched = catalog.find(
          a => a.type === mappedType && (a.month ?? null) === (dbMeta.month ?? null)
        )
        if (matched) canonicalId = matched.id
      }
    }

    return {
      id: r.id,
      user_id: r.user_id,
      achievement_id: canonicalId,
      achievement: matched,
      earned_at: r.earned_at || r.unlocked_at || new Date().toISOString(),
      year: r.year || undefined,
      month: r.month || undefined,
    }
  })
}
