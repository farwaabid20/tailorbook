import { useEffect, useState, createContext, useContext, FormEvent } from 'react'
import { Routes, Route, NavLink, Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from './supabase'
import { useT } from './i18n'
import Landing from './Landing'
import { Settings, Logo } from './Settings'
import { Charts } from './Charts'
import Portal from './Portal'

const ShopCtx = createContext<any>(null)
const STATUSES = ['New', 'Cutting', 'Stitching', 'Ready', 'Delivered', 'Cancelled']
const GARMENTS = ['Shalwar kameez', 'Suit', 'Shirt', 'Trousers', 'Waistcoat', 'Dress', 'Alteration']
const FIELDS = ['shoulder', 'chest', 'waist', 'hip', 'shirt_length', 'sleeve_length', 'neck', 'trouser_length', 'inseam', 'thigh', 'knee', 'bottom']
const today = () => new Date().toISOString().slice(0, 10)
const money = (n: number) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const total = (o: any) => (o.order_items || []).reduce((s: number, i: any) => s + i.qty * Number(i.price), 0)
const paid = (o: any) => (o.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
const isOverdue = (o: any) => o.delivery_date && o.delivery_date < today() && !['Delivered', 'Cancelled'].includes(o.status)

function Skeleton() { return <div className="grid"><div className="skel" /><div className="skel" /><div className="skel" /></div> }

const OK_DOMAINS = ['gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com']
const TYPOS: any = { 'gmial.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com' }
function emailProblem(email: string, lang: string): string {
  const d = email.trim().toLowerCase().split('@')[1] || ''
  if (OK_DOMAINS.includes(d)) return ''
  if (TYPOS[d]) return lang === 'ur' ? `کیا آپ کا مطلب ${TYPOS[d]} تھا؟ براہ کرم ای میل درست کریں۔` : `Did you mean ${TYPOS[d]}? Please correct your email.`
  return lang === 'ur' ? 'براہ کرم اپنی اصلی، چلتی ہوئی ای میل لکھیں (Gmail، Yahoo، Outlook، Hotmail یا iCloud)۔ تصدیق کا لنک اسی پر آئے گا۔' : 'Please use your real email (Gmail, Yahoo, Outlook, Hotmail or iCloud). The confirmation link will be sent there.'
}

function Auth() {
  const { t, lang } = useT()
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>(new URLSearchParams(location.search).get('mode') === 'up' ? 'up' : 'in')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setMsg('')
    if (mode === 'up') { const p = emailProblem(email, lang); if (p) return setErr(p) }
    setBusy(true)
    const r: any = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password })
      : mode === 'up' ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin })
    setBusy(false)
    if (r.error) setErr(r.error.message)
    else if (mode === 'reset') setMsg(t('resetSent'))
    else if (mode === 'up' && !r.data.session) setMsg('Check your email to confirm your account, then sign in.')
  }
  return <div className="auth card"><h1>TailorBook</h1>
    <form onSubmit={submit}>
      <label>{t('email')}</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      {mode !== 'reset' && <><label>{t('password')}</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></>}
      {mode === 'up' && <p style={{ opacity: .7, fontSize: '.85rem' }}>{lang === 'ur' ? 'اصلی ای میل لکھیں، تصدیق کا لنک اسی پر آئے گا۔' : 'Use your real email: the confirmation link is sent there.'}</p>}
      {err && <p className="err" role="alert">{err}</p>}{msg && <p>{msg}</p>}
      <p><button className="gold" disabled={busy}>{mode === 'in' ? t('signIn') : mode === 'up' ? t('signUp') : t('save')}</button></p>
    </form>
    <p><a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'in' ? 'up' : 'in') }}>{mode === 'in' ? t('signUp') : t('signIn')}</a> · <a href="#" onClick={e => { e.preventDefault(); setMode('reset') }}>{t('forgot')}</a></p>
    <LangSwitch /></div>
}
function LangSwitch() { const { lang, setLang } = useT(); return <button className="ghost" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}>{lang === 'en' ? 'اردو' : 'English'}</button> }

function ShopSetup({ onDone }: { onDone: () => void }) {
  const { t } = useT(); const [name, setName] = useState(''); const [err, setErr] = useState('')
  async function go(e: FormEvent) {
    e.preventDefault(); if (!name.trim()) return setErr(t('required'))
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('shops').insert({ name: name.trim(), owner_id: u.user!.id })
    error ? setErr(error.message) : onDone()
  }
  return <div className="auth card"><h1>{t('createShop')}</h1><form onSubmit={go}><label>{t('shopName')}</label><input value={name} onChange={e => setName(e.target.value)} />{err && <p className="err">{err}</p>}<p><button className="gold">{t('save')}</button></p></form></div>
}

export default function App() {
  const [session, setSession] = useState<any>(undefined); const [shop, setShop] = useState<any>(undefined)
  const { t, lang } = useT()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: s } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess))
    return () => s.subscription.unsubscribe()
  }, [])
  const loadShop = async () => { const { data } = await supabase.from('shops').select('*').maybeSingle(); setShop(data) }
  useEffect(() => { if (session) loadShop(); else setShop(undefined) }, [session])
  if (location.pathname.startsWith('/c/')) return <Routes><Route path="/c/:token" element={<Portal />} /></Routes>   // public customer page, no login
  if (session === undefined) return <div className="main"><Skeleton /></div>
  if (!session) return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Auth />} /><Route path="*" element={<Navigate to="/" />} /></Routes>
  if (shop === undefined) return <div className="main"><Skeleton /></div>
  if (!shop) return <ShopSetup onDone={loadShop} />
  return <ShopCtx.Provider value={shop}><div className="shell">
    <nav className="side"><div className="logo">TailorBook</div>
      <NavLink to="/">{t('dashboard')}</NavLink><NavLink to="/customers">{t('customers')}</NavLink><NavLink to="/orders">{t('orders')}</NavLink><NavLink to="/settings">{lang === 'ur' ? 'ترتیبات' : 'Settings'}</NavLink>
      <span style={{ flex: 1 }} /><LangSwitch /><button className="ghost" style={{ color: '#fff' }} onClick={() => supabase.auth.signOut()}>{t('signOut')}</button></nav>
    <main className="main"><Routes>
      <Route path="/" element={<Dashboard />} /><Route path="/customers" element={<Customers />} /><Route path="/customers/:id" element={<CustomerPage />} />
      <Route path="/orders" element={<Orders />} /><Route path="/orders/new" element={<NewOrder />} /><Route path="/orders/:id" element={<OrderPage />} />
      <Route path="/settings" element={<Settings shop={shop} onSaved={loadShop} />} />
      <Route path="*" element={<Navigate to="/" />} /></Routes></main></div></ShopCtx.Provider>
}

function Dashboard() {
  const { t } = useT(); const shop = useContext(ShopCtx); const [d, setD] = useState<any>(null)
  useEffect(() => {
    (async () => {
      const [o, c] = await Promise.all([supabase.from('orders').select('*, order_items(qty,price), payments(amount,paid_on)'), supabase.from('customers').select('id', { count: 'exact', head: true })])
      setD({ orders: o.data || [], customers: c.count || 0 })
    })()
  }, [])
  if (!d) return <Skeleton />
  const live = d.orders.filter((o: any) => o.status !== 'Cancelled')
  const cnt = (s: string) => d.orders.filter((o: any) => o.status === s).length
  const month = today().slice(0, 7)
  const received = live.reduce((s: number, o: any) => s + paid(o), 0)
  const monthRec = d.orders.reduce((s: number, o: any) => s + (o.payments || []).filter((p: any) => p.paid_on.startsWith(month)).reduce((a: number, p: any) => a + Number(p.amount), 0), 0)
  const outstanding = live.reduce((s: number, o: any) => s + (total(o) - paid(o)), 0)
  const stat = (l: string, v: any) => <div className="card stat"><span>{l}</span><b>{v}</b></div>
  const max = Math.max(1, ...STATUSES.map(cnt))
  return <><h1>{shop.name}</h1>
    {d.orders.length === 0 && <div className="card"><h3>{t('noData')}</h3><Link className="btn gold" to="/customers">{t('customers')}</Link></div>}
    <div className="grid">{stat(t('totalCustomers'), d.customers)}{stat(t('totalOrders'), d.orders.length)}
      {stat(t('todayDeliveries'), live.filter((o: any) => o.delivery_date === today() && o.status !== 'Delivered').length)}
      {stat(t('overdue'), live.filter(isOverdue).length)}{stat(t('received'), money(received))}{stat(t('thisMonth'), money(monthRec))}{stat(t('outstanding'), money(outstanding))}</div>
    <Charts orders={d.orders} />
    <div className="card">{STATUSES.map(s => <div key={s} className="row" style={{ alignItems: 'center', margin: '6px 0' }}><span style={{ flex: '0 0 110px' }}>{t(s)} ({cnt(s)})</span><div style={{ flex: 1 }}><div className="bar" style={{ width: `${(cnt(s) / max) * 100}%`, minWidth: 4 }} /></div></div>)}</div></>
}

function Customers() {
  const { t, lang } = useT(); const shop = useContext(ShopCtx); const [rows, setRows] = useState<any[] | null>(null); const [q, setQ] = useState(''); const [bal, setBal] = useState<any>({}); const [onlyDue, setOnlyDue] = useState(false)
  const [f, setF] = useState({ name: '', phone: '', address: '', notes: '' }); const [err, setErr] = useState('')
  const load = async () => {
    const [c, o] = await Promise.all([supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('customer_id,status,order_items(qty,price),payments(amount)')])
    const m: any = {}; (o.data || []).filter((x: any) => x.status !== 'Cancelled').forEach((x: any) => { m[x.customer_id] = (m[x.customer_id] || 0) + total(x) - paid(x) })
    setBal(m); setRows(c.data || [])
  }
  useEffect(() => { load() }, [])
  async function add(e: FormEvent) {
    e.preventDefault(); if (!f.name.trim()) return setErr(t('required')); setErr('')
    const { error } = await supabase.from('customers').insert({ ...f, name: f.name.trim(), shop_id: shop.id })
    if (error) setErr(error.message); else { setF({ name: '', phone: '', address: '', notes: '' }); load() }
  }
  const list = (rows || []).filter(r => (r.name + (r.phone || '')).toLowerCase().includes(q.toLowerCase()) && (!onlyDue || (bal[r.id] || 0) > 0))
  return <><h1>{t('customers')}</h1>
    <form className="card" onSubmit={add}><div className="row">
      <div><label>{t('name')}</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
      <div><label>{t('phone')}</label><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
      <div><label>{t('address')}</label><input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
      <button className="gold">{t('add')}</button></div>{err && <p className="err">{err}</p>}</form>
    <input placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 8 }} />
    <p><label><input type="checkbox" style={{ width: 'auto' }} checked={onlyDue} onChange={e => setOnlyDue(e.target.checked)} /> {lang === 'ur' ? 'صرف بقایا والے گاہک' : 'Only customers with a balance'}</label></p>
    {!rows ? <Skeleton /> : list.length === 0 ? <div className="card">{t('noData')}</div> :
      <div className="card"><table><tbody>{list.map(c => <tr key={c.id}><td><Link to={`/customers/${c.id}`}>{c.name}</Link></td><td>{c.phone}</td><td>{c.address}</td><td style={{ color: (bal[c.id] || 0) > 0 ? 'var(--danger)' : undefined }}>{t('balance')}: {money(bal[c.id] || 0)}</td></tr>)}</tbody></table></div>}</>
}

function CustomerPage() {
  const { id } = useParams(); const { t, lang } = useT(); const shop = useContext(ShopCtx); const nav = useNavigate()
  const [copied, setCopied] = useState(false)
  const [c, setC] = useState<any>(null); const [ms, setMs] = useState<any[]>([]); const [orders, setOrders] = useState<any[]>([])
  const [vals, setVals] = useState<any>({}); const [custom, setCustom] = useState(''); const [mnotes, setMnotes] = useState('')
  const load = async () => {
    const [a, b, o] = await Promise.all([supabase.from('customers').select('*').eq('id', id).maybeSingle(),
    supabase.from('measurements').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*, order_items(qty,price), payments(amount)').eq('customer_id', id).order('order_no', { ascending: false })])
    setC(a.data); setMs(b.data || []); setOrders(o.data || []); if (b.data?.[0]) setVals(b.data[0].vals)
  }
  useEffect(() => { load() }, [id])
  async function saveC(e: FormEvent) { e.preventDefault(); await supabase.from('customers').update({ name: c.name, phone: c.phone, address: c.address, notes: c.notes }).eq('id', id); load() }
  async function del() { if (confirm(t('confirmDelete'))) { const { error } = await supabase.from('customers').delete().eq('id', id); error ? alert(error.message) : nav('/customers') } }
  async function saveM(e: FormEvent) {
    e.preventDefault()   // every save creates a NEW row = version history
    const clean: any = {}; Object.entries(vals).forEach(([k, v]) => { if (v !== '' && v != null) clean[k] = v })
    await supabase.from('measurements').insert({ shop_id: shop.id, customer_id: id, vals: clean, notes: mnotes }); setMnotes(''); load()
  }
  if (!c) return <Skeleton />
  const bal = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + total(o) - paid(o), 0)
  const link = `${location.origin}/c/${c.share_token}`
  let ph = (c.phone || '').replace(/\D/g, ''); if (ph.startsWith('0')) ph = '92' + ph.slice(1)
  const msg = lang === 'ur' ? `السلام علیکم ${c.name}، ${shop.name} میں اپنے آرڈرز، بقایا اور رسید یہاں دیکھیں: ${link}` : `Assalam o Alaikum ${c.name}, see your orders, balance and receipts at ${shop.name} here: ${link}`
  const waUrl = `https://wa.me/${ph}?text=${encodeURIComponent(msg)}`
  const waAnyUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`   // no number: WhatsApp lets you choose who to send to
  const copyLink = async () => { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const newLink = async () => { if (confirm(lang === 'ur' ? 'پرانا لنک بند ہو جائے گا۔ نیا لنک بنائیں؟' : 'The old link will stop working. Create a new link?')) { await supabase.from('customers').update({ share_token: crypto.randomUUID() }).eq('id', id); load() } }
  return <><h1>{c.name}</h1>
    <div className="card"><b>{t('balance')}: {money(bal)}</b> &nbsp; <Link className="btn gold" to={`/orders/new?customer=${id}`}>{t('newOrder')}</Link></div>
    <div className="card"><h3>{lang === 'ur' ? 'گاہک کو لنک بھیجیں' : 'Share with customer'}</h3>
      <p style={{ opacity: .75, fontSize: '.85rem' }}>{lang === 'ur' ? 'یہ لنک گاہک کو اس کے آرڈرز، بقایا اور رسید دکھاتا ہے۔ جس کے پاس لنک ہو وہ یہ سب دیکھ سکتا ہے۔' : 'This link shows the customer their orders, balance and receipts. Anyone who has the link can see them.'}</p>
      <p><a className="btn gold" href={waUrl} target="_blank" rel="noreferrer">WhatsApp</a> <a className="btn" href={waAnyUrl} target="_blank" rel="noreferrer">{lang === 'ur' ? 'کسی اور کو بھیجیں' : 'Send to someone else'}</a> <button className="ghost" onClick={newLink}>{lang === 'ur' ? 'نیا لنک بنائیں' : 'New link'}</button></p></div>
    <form className="card" onSubmit={saveC}><div className="row">
      <div><label>{t('name')}</label><input value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></div>
      <div><label>{t('phone')}</label><input value={c.phone || ''} onChange={e => setC({ ...c, phone: e.target.value })} /></div>
      <div><label>{t('address')}</label><input value={c.address || ''} onChange={e => setC({ ...c, address: e.target.value })} /></div></div>
      <label>{t('notes')}</label><textarea value={c.notes || ''} onChange={e => setC({ ...c, notes: e.target.value })} />
      <p><button>{t('save')}</button> <button type="button" className="danger" onClick={del}>{t('delete')}</button></p></form>
    <form className="card" onSubmit={saveM}><h3>{t('measurements')} ({shop.unit})</h3>
      <div className="grid">{[...FIELDS, ...Object.keys(vals).filter(k => !FIELDS.includes(k))].map(k => <div key={k}><label>{FIELDS.includes(k) ? t(k) : k}</label>
        <input inputMode="decimal" value={vals[k] ?? ''} onChange={e => setVals({ ...vals, [k]: e.target.value })} /></div>)}</div>
      <div className="row"><div><label>{t('customField')}</label><input value={custom} onChange={e => setCustom(e.target.value)} /></div>
        <button type="button" className="ghost" onClick={() => { if (custom.trim()) { setVals({ ...vals, [custom.trim()]: '' }); setCustom('') } }}>{t('add')}</button></div>
      <label>{t('notes')}</label><textarea value={mnotes} onChange={e => setMnotes(e.target.value)} /><p><button className="gold">{t('save')}</button></p></form>
    <div className="card"><h3>{t('history')}</h3>{ms.length === 0 ? t('noData') : ms.map(m => <details key={m.id}><summary>{new Date(m.created_at).toLocaleString()}</summary>
      <p>{Object.entries(m.vals).map(([k, v]) => `${FIELDS.includes(k) ? t(k) : k}: ${v}`).join(' · ')}</p>{m.notes && <p>{m.notes}</p>}</details>)}</div>
    <div className="card"><h3>{t('orders')}</h3>{orders.length === 0 ? t('noData') : <table><tbody>{orders.map(o => <tr key={o.id}><td><Link to={`/orders/${o.id}`}>#{o.order_no}</Link></td><td>{t(o.status)}</td><td>{money(total(o) - paid(o))}</td></tr>)}</tbody></table>}</div></>
}

function Orders() {
  const { t } = useT(); const [rows, setRows] = useState<any[] | null>(null); const [q, setQ] = useState(''); const [st, setSt] = useState(''); const [by, setBy] = useState('')
  useEffect(() => { supabase.from('orders').select('*, customers(name,phone), order_items(qty,price), payments(amount)').order('order_no', { ascending: false }).then(({ data }) => setRows(data || [])) }, [])
  const list = (rows || []).filter(o => (!st || o.status === st) && (!by || o.delivery_date === by) &&
    `${o.order_no} ${o.customers?.name} ${o.customers?.phone || ''}`.toLowerCase().includes(q.toLowerCase()))
  return <><h1>{t('orders')}</h1><p><Link className="btn gold" to="/orders/new">{t('newOrder')}</Link></p>
    <div className="row"><input placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
      <select value={st} onChange={e => setSt(e.target.value)}><option value="">{t('all')}</option>{STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}</select>
      <input type="date" value={by} onChange={e => setBy(e.target.value)} /></div><br />
    {!rows ? <Skeleton /> : list.length === 0 ? <div className="card">{t('noData')}</div> :
      <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>#</th><th>{t('customer')}</th><th>{t('status')}</th><th>{t('deliveryDate')}</th><th>{t('balance')}</th></tr></thead>
        <tbody>{list.map(o => <tr key={o.id}><td><Link to={`/orders/${o.id}`}>{o.order_no}</Link></td><td>{o.customers?.name}</td><td>{t(o.status)}</td>
          <td>{o.delivery_date} {isOverdue(o) && <span className="badge bad">{t('overdue')}</span>}</td><td>{money(total(o) - paid(o))}</td></tr>)}</tbody></table></div>}</>
}

function NewOrder() {
  const { t } = useT(); const shop = useContext(ShopCtx); const nav = useNavigate(); const [sp] = useSearchParams()
  const [customers, setCustomers] = useState<any[]>([]); const [ms, setMs] = useState<any[]>([])
  const [o, setO] = useState<any>({ customer_id: sp.get('customer') || '', measurement_id: '', order_date: today(), trial_date: '', delivery_date: '', notes: '' })
  const [items, setItems] = useState<any[]>([{ garment: GARMENTS[0], qty: 1, fabric: '', price: '', instructions: '' }]); const [err, setErr] = useState('')
  useEffect(() => { supabase.from('customers').select('id,name').order('name').then(({ data }) => setCustomers(data || [])) }, [])
  useEffect(() => { if (o.customer_id) supabase.from('measurements').select('id,created_at').eq('customer_id', o.customer_id).order('created_at', { ascending: false }).then(({ data }) => setMs(data || [])); else setMs([]) }, [o.customer_id])
  const setItem = (i: number, k: string, v: any) => setItems(items.map((x, j) => j === i ? { ...x, [k]: v } : x))
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (!o.customer_id) return setErr(t('customer') + ': ' + t('required'))
    if (items.some(i => !i.garment || Number(i.qty) < 1 || Number(i.price) < 0 || i.price === '')) return setErr(t('price') + ': ' + t('required'))
    const { data, error } = await supabase.from('orders').insert({
      shop_id: shop.id, customer_id: o.customer_id, measurement_id: o.measurement_id || null,
      order_date: o.order_date, trial_date: o.trial_date || null, delivery_date: o.delivery_date || null, notes: o.notes
    }).select().single()
    if (error) return setErr(error.message)
    const r = await supabase.from('order_items').insert(items.map(i => ({ shop_id: shop.id, order_id: data.id, garment: i.garment, qty: Number(i.qty), fabric: i.fabric, price: Number(i.price), instructions: i.instructions })))
    if (r.error) return setErr(r.error.message)
    nav(`/orders/${data.id}`)
  }
  return <><h1>{t('newOrder')}</h1><form className="card" onSubmit={submit}>
    <div className="row"><div><label>{t('customer')}</label><select value={o.customer_id} onChange={e => setO({ ...o, customer_id: e.target.value })}><option value="">—</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label>{t('savedMeasurement')}</label><select value={o.measurement_id} onChange={e => setO({ ...o, measurement_id: e.target.value })}><option value="">{t('none')}</option>{ms.map(m => <option key={m.id} value={m.id}>{new Date(m.created_at).toLocaleDateString()}</option>)}</select></div></div>
    <div className="row"><div><label>{t('orderDate')}</label><input type="date" value={o.order_date} onChange={e => setO({ ...o, order_date: e.target.value })} /></div>
      <div><label>{t('trialDate')}</label><input type="date" value={o.trial_date} onChange={e => setO({ ...o, trial_date: e.target.value })} /></div>
      <div><label>{t('deliveryDate')}</label><input type="date" value={o.delivery_date} onChange={e => setO({ ...o, delivery_date: e.target.value })} /></div></div>
    <h3>{t('items')}</h3>{items.map((it, i) => <div className="row" key={i}>
      <div><label>{t('garment')}</label><select value={it.garment} onChange={e => setItem(i, 'garment', e.target.value)}>{GARMENTS.map(g => <option key={g}>{g}</option>)}</select></div>
      <div style={{ maxWidth: 80 }}><label>{t('qty')}</label><input type="number" min={1} value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} /></div>
      <div><label>{t('price')}</label><input type="number" min={0} step="0.01" value={it.price} onChange={e => setItem(i, 'price', e.target.value)} /></div>
      <div><label>{t('fabric')}</label><input value={it.fabric} onChange={e => setItem(i, 'fabric', e.target.value)} /></div>
      <div><label>{t('instructions')}</label><input value={it.instructions} onChange={e => setItem(i, 'instructions', e.target.value)} /></div>
      {items.length > 1 && <button type="button" className="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</button>}</div>)}
    <p><button type="button" className="ghost" onClick={() => setItems([...items, { garment: GARMENTS[0], qty: 1, fabric: '', price: '', instructions: '' }])}>{t('addItem')}</button></p>
    <label>{t('notes')}</label><textarea value={o.notes} onChange={e => setO({ ...o, notes: e.target.value })} />
    {err && <p className="err" role="alert">{err}</p>}<p><button className="gold">{t('save')}</button></p></form></>
}

function OrderPage() {
  const nav = useNavigate(); const { id } = useParams(); const { t } = useT(); const shop = useContext(ShopCtx); const [o, setO] = useState<any>(null)
  const [amt, setAmt] = useState(''); const [method, setMethod] = useState('Cash'); const [err, setErr] = useState('')
  const load = async () => { const { data } = await supabase.from('orders').select('*, customers(name,phone,address), order_items(*), payments(*)').eq('id', id).maybeSingle(); setO(data) }
  useEffect(() => { load() }, [id])
  async function delOrder() { if (confirm(t('confirmDelete'))) { const { error } = await supabase.from('orders').delete().eq('id', id); error ? alert(error.message) : nav('/orders') } }
  async function setStatus(s: string) { await supabase.from('orders').update({ status: s }).eq('id', id); load() }
  async function pay(e: FormEvent) {
    e.preventDefault(); setErr(''); const a = Number(amt); const bal = total(o) - paid(o)
    if (!(a > 0)) return setErr(t('amount') + ': ' + t('required')); if (a > bal) return setErr(t('overpay'))
    const { error } = await supabase.from('payments').insert({ shop_id: shop.id, order_id: id, amount: a, method }); if (error) setErr(error.message); else { setAmt(''); load() }
  }
  if (!o) return <Skeleton />
  const idx = STATUSES.indexOf(o.status), tot = total(o), pd = paid(o)
  return <><div className="noprint"><h1>#{o.order_no} · {o.customers?.name} {isOverdue(o) && <span className="badge bad">{t('overdue')}</span>}</h1>
    <div className="card row" style={{ alignItems: 'center' }}>{STATUSES.slice(0, 5).map((s, i) => <button key={s} className={i <= idx && o.status !== 'Cancelled' ? 'gold' : 'ghost'} onClick={() => setStatus(s)}>{t(s)}</button>)}
      <button className="danger" onClick={() => setStatus('Cancelled')}>{t('Cancelled')}</button></div>
    <div className="card"><table><tbody>{o.order_items.map((i: any) => <tr key={i.id}><td>{i.garment} × {i.qty}</td><td>{i.fabric}</td><td>{money(i.qty * i.price)}</td></tr>)}</tbody></table>
      <p><b>{t('total')}: {money(tot)} · {t('paid')}: {money(pd)} · {t('balance')}: {money(tot - pd)}</b></p></div>
    <form className="card row" onSubmit={pay}><div><label>{t('amount')}</label><input type="number" step="0.01" value={amt} onChange={e => setAmt(e.target.value)} /></div>
      <div><label>{t('method')}</label><select value={method} onChange={e => setMethod(e.target.value)}><option value="Cash">{t('Cash')}</option><option value="Card">{t('Card')}</option><option value="Transfer">{t('Transfer')}</option></select></div>
      <button className="gold">{t('addPayment')}</button></form>{err && <p className="err" role="alert">{err}</p>}
    <div className="card"><h3>{t('paid')}</h3>{o.payments.length === 0 ? t('noData') : <table><tbody>{o.payments.map((p: any) => <tr key={p.id}><td>{p.paid_on}</td><td>{t(p.method)}</td><td>{money(p.amount)}</td></tr>)}</tbody></table>}</div>
    <button onClick={() => window.print()}>{t('print')}</button> <button className="danger" onClick={delOrder}>{t('delete')}</button></div>
    <div className="receipt"><Logo shop={shop} height={70} /><h1>{shop.name}</h1><p>{shop.phone} {shop.address}</p><h3>{t('receipt')} #{o.order_no}</h3>
      <p>{o.customers?.name} · {o.customers?.phone}</p><p>{t('orderDate')}: {o.order_date} · {t('deliveryDate')}: {o.delivery_date || '—'}</p>
      <table><tbody>{o.order_items.map((i: any) => <tr key={i.id}><td>{i.garment} × {i.qty}</td><td>{money(i.qty * i.price)}</td></tr>)}</tbody></table>
      <p>{t('total')}: {money(tot)}<br />{t('paid')}: {money(pd)}<br /><b>{t('balance')}: {money(tot - pd)}</b></p></div></>
}
