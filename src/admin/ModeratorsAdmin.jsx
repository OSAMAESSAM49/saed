import { useState } from 'react'
import { ShieldCheck, UserPlus, Trash2, ExternalLink, Crown } from 'lucide-react'
import { useAsync } from '../lib/app-state.jsx'
import { Toast, useToast } from '../components/ui.jsx'
import { listStaff, addModerator, removeModerator } from './adminApi.js'
import { AdminTop } from './shared.jsx'
import { FIREBASE } from '../config.js'

const USERS_URL = `https://console.firebase.google.com/project/${FIREBASE.projectId || 'YOUR-PROJECT'}/authentication/users`

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

// صاحب الموقع بس: يضيف مشرفين ويشيلهم
export function ModeratorsAdmin() {
  const [reload, setReload] = useState(0)
  const staff = useAsync(listStaff, [reload])
  const [form, setForm] = useState({ name: '', email: '', uid: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast, clearToast] = useToast()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const add = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await addModerator(form)
      setToast(`${form.name} بقى مشرف`)
      setForm({ name: '', email: '', uid: '' })
      setReload((n) => n + 1)
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const remove = async (m) => {
    if (!confirm(`تشيل ${m.name || m.email} من المشرفين؟ مش هيقدر يدخل اللوحة تاني.`)) return
    try {
      await removeModerator(m.uid)
      setToast('اتشال من المشرفين')
      setReload((n) => n + 1)
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <>
      <AdminTop title="المشرفين" />
      <div className="admin-body stack" style={{ gap: 16 }}>
        <div className="f-card">
          <h2>
            <ShieldCheck size={20} /> المشرف يقدر يعمل إيه؟
          </h2>
          <ul className="perm-list">
            <li className="yes">يضيف مقدمي خدمة ويعدّلهم ويغيّر صورهم</li>
            <li className="yes">يوقف مقدم خدمة أو يرجّعه</li>
            <li className="yes">يراجع البلاغات</li>
            <li className="no">يمسح مقدم خدمة نهائياً</li>
            <li className="no">يغيّر الفئات أو الأماكن أو الإعلانات</li>
            <li className="no">يشوف الإحصائيات أو يضيف مشرفين</li>
          </ul>
        </div>

        <div className="f-card">
          <h2>الإدارة دلوقتي</h2>
          {staff.loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : staff.error ? (
            <div className="err-note">{staff.error.message}</div>
          ) : (
            <div className="a-list">
              {staff.data.map((m) => (
                <div key={m.uid} className="a-row">
                  <div className="a-row-info">
                    <b>
                      {m.name || m.email}
                      <span className={`status-tag ${m.role === 'owner' ? 'active' : 'pending'}`}>
                        {m.role === 'owner' ? 'صاحب الموقع' : 'مشرف'}
                      </span>
                    </b>
                    <small>
                      <span dir="ltr">{m.email}</span>
                      {m.added_at && ` · من ${fmtDate(m.added_at)}`}
                    </small>
                  </div>
                  <div className="a-row-actions">
                    {m.role === 'owner' ? (
                      <span className="icon-btn" aria-label="صاحب الموقع" title="صاحب الموقع">
                        <Crown size={18} />
                      </span>
                    ) : (
                      <button className="icon-btn" onClick={() => remove(m)} aria-label="شيله" title="شيله من المشرفين">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="f-card" onSubmit={add}>
          <h2>
            <UserPlus size={20} /> ضيف مشرف
          </h2>
          <ol className="steps-list">
            <li>
              افتح{' '}
              <a href={USERS_URL} target="_blank" rel="noopener">
                صفحة الحسابات في Firebase <ExternalLink size={14} />
              </a>{' '}
              واضغط <b>Add user</b>. اكتب إيميل المشرف وباسورد ليه، وابعتهم له.
            </li>
            <li>
              هتلاقيه ظهر في الجدول. انسخ الكود اللي في عمود <b>User UID</b>.
            </li>
            <li>اكتب اسمه وإيميله والكود هنا، واضغط «ضيفه».</li>
          </ol>
          <div className="f-2">
            <label className="field">
              <span>الاسم</span>
              <input className="input" value={form.name} onChange={set('name')} maxLength={60} required placeholder="مثلاً: أحمد" />
            </label>
            <label className="field">
              <span>الإيميل</span>
              <input className="input" type="email" dir="ltr" value={form.email} onChange={set('email')} maxLength={120} required />
            </label>
          </div>
          <label className="field">
            <span>User UID</span>
            <input className="input" dir="ltr" value={form.uid} onChange={set('uid')} required placeholder="FY53WO2Oei..." autoComplete="off" />
          </label>
          {error && <div className="err-note">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>
            <UserPlus size={20} /> {busy ? 'بيتضاف...' : 'ضيفه'}
          </button>
          <p className="muted" style={{ fontSize: 14 }}>
            لما تشيل مشرف، بيتمنع من اللوحة على طول. ولو عايز تقفل حسابه خالص، امسحه كمان من صفحة الحسابات في Firebase.
          </p>
        </form>
      </div>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
