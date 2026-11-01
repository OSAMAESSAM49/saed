// الصور مع Firebase المجاني (من غير Firebase Storage):
// 1) الأدمن بيرفع الصورة مضغوطة جوه Firestore (photos/{key})
// 2) مع كل نشر للموقع، سكربت prerender بينسخها كملفات على GitHub Pages: photos/{key}-{v}.{ext}
// 3) الزائر بياخدها من GitHub Pages (مجاناً ومن غير ما تستهلك من حصة Firebase)،
//    ولو لسه متنشرتش (صورة لسه مترفعة) بنجيبها من Firestore ونحفظها على الموبايل
import { useEffect, useState } from 'react'
import { IS_DEMO } from '../config.js'

export const staticPhotoUrl = (key, v, ext) => `${import.meta.env.BASE_URL}photos/${key}-${v}.${ext || 'webp'}`

// ---------- كاش بسيط في IndexedDB ----------
const DB_NAME = 'saed-photos'
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('p')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function idbGet(key) {
  try {
    const db = await idb()
    return await new Promise((r) => {
      const q = db.transaction('p').objectStore('p').get(key)
      q.onsuccess = () => r(q.result || null)
      q.onerror = () => r(null)
    })
  } catch {
    return null
  }
}
async function idbSet(key, value) {
  try {
    const db = await idb()
    db.transaction('p', 'readwrite').objectStore('p').put(value, key)
  } catch {}
}

const inflight = new Map()
export function fetchPhotoData(key, v) {
  const id = `${key}:${v}`
  if (!inflight.has(id)) {
    inflight.set(
      id,
      (async () => {
        const cached = await idbGet(id)
        if (cached) return cached
        const [{ db }, { doc, getDoc }] = await Promise.all([import('./firebase.js'), import('firebase/firestore/lite')])
        const snap = await getDoc(doc(db, 'photos', key))
        const data = snap.exists() ? snap.data().data : null
        if (data) idbSet(id, data)
        return data
      })().catch(() => null),
    )
  }
  return inflight.get(id)
}

/**
 * بيرجّع src للصورة + onError للتحويل لـ Firestore لو الملف لسه مش على GitHub Pages
 * item: فيه photo_url (الوضع التجريبي) أو photo_key / photo_v / photo_ext
 */
export function usePhoto(item, prefix = 'photo') {
  const url = item?.[`${prefix}_url`]
  const key = item?.[`${prefix}_key`]
  const v = item?.[`${prefix}_v`]
  const ext = item?.[`${prefix}_ext`]
  const initial = url || (key && v && !IS_DEMO ? staticPhotoUrl(key, v, ext) : null)
  const [src, setSrc] = useState(initial)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSrc(initial)
    setFailed(false)
  }, [initial])

  const onError = () => {
    if (failed || !key || !v) return setSrc(null)
    setFailed(true)
    fetchPhotoData(key, v).then((data) => setSrc(data))
  }
  return { src, onError }
}
