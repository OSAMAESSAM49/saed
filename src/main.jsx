import { Component, StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
import '@fontsource/tajawal/800.css'
import './styles/app.css'
import { AppStateProvider } from './lib/app-state.jsx'
import { Layout } from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Category from './pages/Category.jsx'
import Provider from './pages/Provider.jsx'
import Search from './pages/Search.jsx'
import Join from './pages/Join.jsx'
import NotFound from './pages/NotFound.jsx'
import { About, Advertise, Privacy, Terms } from './pages/Static.jsx'

// لو حصل أي خطأ، الزائر يشوف رسالة بدل صفحة بيضا
class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>حصلت مشكلة صغيرة</h1>
        <p className="muted" style={{ margin: '8px 0 18px' }}>جرّب تفتح الصفحة تاني.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          حمّل الصفحة تاني
        </button>
      </div>
    )
  }
}

// PWA: الموقع يتحط على الشاشة الرئيسية ويفتح بسرعة على النت الضعيف
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}))
}

// لوحة الأدمن في ملف لوحدها، فالزائر العادي مش بينزّلها خالص
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppStateProvider>
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div className="container" style={{ padding: 40 }}>جاري التحميل...</div>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="c/:slug" element={<Category />} />
              <Route path="c/:slug/:loc" element={<Category />} />
              <Route path="s/:sub" element={<Category />} />
              <Route path="s/:sub/:loc" element={<Category />} />
              <Route path="p/:slug" element={<Provider />} />
              <Route path="search" element={<Search />} />
              <Route path="join" element={<Join />} />
              <Route path="advertise" element={<Advertise />} />
              <Route path="about" element={<About />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AppStateProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
