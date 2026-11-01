// ضغط الصورة في المتصفح قبل الرفع: قص 4:5 + تصغير + WebP لحد ما تبقى أقل من ~150KB

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => (URL.revokeObjectURL(url), resolve(img))
    img.onerror = () => (URL.revokeObjectURL(url), reject(new Error('الملف ده مش صورة')))
    img.src = url
  })
}

const toBlob = (canvas, type, quality) => new Promise((r) => canvas.toBlob(r, type, quality))

export async function compressImage(file, { width = 600, height = 750, maxBytes = 150 * 1024 } = {}) {
  const img = await loadImage(file)
  const sw = img.naturalWidth
  const sh = img.naturalHeight
  const target = width / height
  // قص من النص، وفي الصور الطولية بنميل لفوق شوية عشان الوش
  let cw = sw
  let ch = sh
  if (sw / sh > target) cw = sh * target
  else ch = sw / target
  const cx = (sw - cw) / 2
  const cy = (sh - ch) * 0.3

  const scale = Math.min(1, width / cw)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cw * scale)
  canvas.height = Math.round(ch * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height)

  // المتصفحات القديمة اللي مش بتدعم WebP بترجع PNG، فساعتها نستخدم JPEG
  const probe = await toBlob(canvas, 'image/webp', 0.8)
  const type = probe?.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
  let quality = 0.82
  let blob = await toBlob(canvas, type, quality)
  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.08
    blob = await toBlob(canvas, type, quality)
  }
  return { blob, type, width: canvas.width, height: canvas.height, before: file.size, after: blob.size }
}

export const kb = (bytes) => `${Math.round(bytes / 1024)}KB`
