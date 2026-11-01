import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

// زرار "حط ساعد على موبايلك" — بيظهر بس على الموبايلات اللي بتدعم تثبيت المواقع (أندرويد/كروم)
export function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    const onInstalled = () => setPrompt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!prompt) return null
  return (
    <div className="promo lavender" style={{ marginBottom: 20 }}>
      <div className="spacer">
        <h3>حط ساعد على شاشة موبايلك</h3>
        <p>يفتح زي التطبيق بضغطة واحدة، ومن غير ما ياخد مساحة.</p>
      </div>
      <button
        className="btn"
        onClick={async () => {
          prompt.prompt()
          await prompt.userChoice
          setPrompt(null)
        }}
      >
        <Download size={20} /> ثبّت
      </button>
    </div>
  )
}
