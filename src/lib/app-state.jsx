import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCatalog, getCachedCatalog } from './api.js'

const Ctx = createContext(null)
const LOC_KEY = 'saed.location'
const THEME_KEY = 'saed.theme'

const read = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k, v) => {
  try {
    v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v)
  } catch {}
}

function buildCatalog(data) {
  if (!data) return null
  const { categories, subcategories, locations } = data
  const catById = new Map(categories.map((c) => [c.id, c]))
  const catBySlug = new Map(categories.map((c) => [c.slug, c]))
  const subById = new Map(subcategories.map((s) => [s.id, s]))
  const locById = new Map(locations.map((l) => [l.id, l]))
  const locBySlug = new Map(locations.map((l) => [l.slug, l]))
  const subsOf = (catId) => subcategories.filter((s) => s.category_id === catId)
  const childrenOf = (id) => locations.filter((l) => l.parent_id === id)
  // الأماكن اللي الناس بتختار منها (قرى ومدن) مع اسم المركز
  const places = locations.filter((l) => l.type === 'village' || l.type === 'city')
  const locLabel = (id) => locById.get(id)?.name_ar || ''
  // الخدمة الأساسية لمقدم الخدمة = أول خدمة
  const primaryService = (p) => subById.get(p.service_ids?.[0])
  const categoryOf = (p) => catById.get(primaryService(p)?.category_id)
  return {
    ...data, catById, catBySlug, subById, locById, locBySlug, subsOf, childrenOf, places, locLabel,
    primaryService, categoryOf,
  }
}

export function AppStateProvider({ children }) {
  const [raw, setRaw] = useState(getCachedCatalog)
  const [error, setError] = useState(null)
  const [locationId, setLocationIdState] = useState(() => Number(read(LOC_KEY)) || null)
  const [theme, setThemeState] = useState(() => read(THEME_KEY))

  useEffect(() => {
    fetchCatalog().then(setRaw).catch((e) => !raw && setError(e))
  }, [])

  const catalog = useMemo(() => buildCatalog(raw), [raw])

  // لو المكان المحفوظ اتمسح أو اتقفل
  useEffect(() => {
    if (catalog && locationId && !catalog.locById.has(locationId)) setLocationIdState(null)
  }, [catalog, locationId])

  const value = {
    catalog,
    error,
    // بعد ما الأدمن يعدّل الفئات أو الأماكن
    refreshCatalog: () => fetchCatalog({ force: true }).then(setRaw),
    locationId,
    setLocationId: (id) => {
      setLocationIdState(id)
      write(LOC_KEY, id)
    },
    theme,
    toggleTheme: () => {
      const isDark =
        theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const next = isDark ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      write(THEME_KEY, next)
      setThemeState(next)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAppState = () => useContext(Ctx)
export const useCatalog = () => useContext(Ctx).catalog

export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ loading: false, data, error: null }))
      .catch((error) => alive && setState({ loading: false, data: null, error }))
    return () => {
      alive = false
    }
  }, deps)
  return state
}

// عنوان ووصف الصفحة (للمتصفح والمشاركة)
export function useSeo({ title, description }) {
  useEffect(() => {
    if (!title) return
    document.title = title
    const set = (sel, attr, val) => {
      let el = document.head.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        const [k, v] = attr
        el.setAttribute(k, v)
        document.head.appendChild(el)
      }
      el.setAttribute('content', val)
    }
    set('meta[property="og:title"]', ['property', 'og:title'], title)
    if (description) {
      set('meta[name="description"]', ['name', 'description'], description)
      set('meta[property="og:description"]', ['property', 'og:description'], description)
    }
  }, [title, description])
}
