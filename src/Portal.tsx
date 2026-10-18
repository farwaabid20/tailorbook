import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabase'
import { useT } from './i18n'

const FIELDS = ['shoulder', 'chest', 'waist', 'hip', 'shirt_length', 'sleeve_length', 'neck', 'trouser_length', 'inseam', 'thigh', 'knee', 'bottom']
const STEPS = ['New', 'Cutting', 'Stitching', 'Ready', 'Delivered']
const money = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const total = (o: any) => (o.items || []).reduce((s: number, i: any) => s + i.qty * Number(i.price), 0)
const paid = (o: any) => (o.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
const today = () => new Date().toISOString().slice(0, 10)
const D: any = {
    en: { hello: 'Assalam o Alaikum', sub: 'Here are your orders, balance and receipts.', none: 'This link is not valid. Please ask your tailor for a new one.', noOrders: 'No orders yet.', due: 'Balance due', order: 'Order', payments: 'Payments', contact: 'Contact', powered: 'Powered by TailorBook' },
    ur: { hello: 'السلام علیکم', sub: 'یہ آپ کے آرڈرز، بقایا رقم اور رسیدیں ہیں۔', none: 'یہ لنک درست نہیں۔ براہ کرم اپنے درزی سے نیا لنک مانگیں۔', noOrders: 'ابھی کوئی آرڈر نہیں۔', due: 'بقایا رقم', order: 'آرڈر', payments: 'ادائیگیاں', contact: 'رابطہ', powered: 'TailorBook کے ذریعے' }
}

export default function Portal() {
    const { token } = useParams(); const { t, lang, setLang } = useT(); const d = D[lang]
    const [data, setData] = useState<any>(undefined); const [sel, setSel] = useState<any>(null)
    useEffect(() => { supabase.rpc('customer_portal', { p_token: token }).then(({ data, error }) => setData(error ? null : data)) }, [token])
    const printReceipt = (o: any) => { setSel(o); setTimeout(() => window.print(), 400) }
    if (data === undefined) return <div style={{ padding: 24 }}><div className="skel" /></div>
    if (!data) return <div className="auth card"><p>{d.none}</p></div>
    const live = data.orders.filter((o: any) => o.status !== 'Cancelled')
    const sumTotal = live.reduce((s: number, o: any) => s + total(o), 0)
    const sumPaid = live.reduce((s: number, o: any) => s + paid(o), 0)
    const due = sumTotal - sumPaid
    const m = data.measurement
    const logoUrl = data.shop.logo_path ? supabase.storage.from('logos').getPublicUrl(data.shop.logo_path).data.publicUrl : ''
    const hide = (e: any) => { e.currentTarget.style.display = 'none' }
    return <div>
        <div className="noprint">
            <header className="pt-head"><div className="pt-in">
                {logoUrl && <img className="pt-logo" src={logoUrl} alt="" onError={hide} />}
                <div className="pt-name"><h1>{data.shop.name}</h1>
                    <p>{[data.shop.phone && `${d.contact}: ${data.shop.phone}`, data.shop.address].filter(Boolean).join(' · ')}</p></div>
                <button className="ghost pt-lang" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}>{lang === 'en' ? 'اردو' : 'English'}</button>
            </div></header>

            <main className="pt-wrap">
                <div className="card"><h2 style={{ margin: 0 }}>{d.hello} {data.customer.name}</h2><p style={{ margin: '4px 0 0', opacity: .8 }}>{d.sub}</p></div>
                <div className="pt-stats">
                    <div className="pt-stat"><span>{t('total')}</span><b>{money(sumTotal)}</b></div>
                    <div className="pt-stat"><span>{t('paid')}</span><b>{money(sumPaid)}</b></div>
                    <div className={`pt-stat ${due > 0 ? 'due' : 'ok'}`}><span>{d.due}</span><b>{money(due)}</b></div>
                </div>

                {data.orders.length === 0 && <div className="card">{d.noOrders}</div>}
                {data.orders.map((o: any) => {
                    const idx = STEPS.indexOf(o.status), tot = total(o), pd = paid(o)
                    const late = o.delivery_date && o.delivery_date < today() && !['Delivered', 'Cancelled'].includes(o.status)
                    return <section className="card" key={o.order_no}>
                        <div className="pt-oh"><h3 style={{ margin: 0 }}>{d.order} #{o.order_no}</h3>
                            <span>{late && <span className="pt-badge st-late">{t('overdue')}</span>} <span className={`pt-badge st-${o.status}`}>{t(o.status)}</span></span></div>
                        {o.status !== 'Cancelled' && <div className="pt-steps">{STEPS.map((s, i) => <div key={s} className={`pt-step ${i <= idx ? 'done' : ''} ${i === idx ? 'now' : ''}`}><div className="pt-dot" />{t(s)}</div>)}</div>}
                        <div className="pt-dates">
                            <div><span>{t('orderDate')}</span>{o.order_date}</div>
                            <div><span>{t('trialDate')}</span>{o.trial_date || '—'}</div>
                            <div style={late ? { color: 'var(--danger)', fontWeight: 600 } : undefined}><span>{t('deliveryDate')}</span>{o.delivery_date || '—'}</div>
                        </div>
                        <div style={{ marginTop: 10 }}>{o.items.map((i: any, k: number) => <div className="pt-line" key={k}>
                            <span>{i.garment} × {i.qty}{i.fabric && <small style={{ opacity: .65 }}> · {i.fabric}</small>}</span><b>{money(i.qty * i.price)}</b></div>)}</div>
                        <div className="pt-bar" style={{ marginTop: 12 }}><i style={{ width: `${tot > 0 ? Math.min(100, (pd / tot) * 100) : 0}%` }} /></div>
                        <p style={{ margin: '8px 0' }}>{t('total')}: <b>{money(tot)}</b> · {t('paid')}: <b>{money(pd)}</b> · {t('balance')}: <b style={{ color: tot - pd > 0 ? 'var(--danger)' : '#2f7d4f' }}>{money(tot - pd)}</b></p>
                        {o.payments.length > 0 && <details><summary>{d.payments} ({o.payments.length})</summary>
                            {o.payments.map((p: any, k: number) => <div className="pt-line" key={k}><span>{p.paid_on} · {t(p.method)}</span><b>{money(p.amount)}</b></div>)}</details>}
                        <p style={{ marginBottom: 0 }}><button onClick={() => printReceipt(o)}>{t('receipt')} · {t('print')}</button></p>
                    </section>
                })}

                {m && <section className="card"><h3 style={{ marginTop: 0 }}>{t('measurements')} ({data.shop.unit})</h3>
                    <div className="pt-meas">{Object.entries(m.vals).map(([k, v]) => <div key={k}><span>{FIELDS.includes(k) ? t(k) : k}</span><b>{String(v)}</b></div>)}</div></section>}
                <p className="pt-foot">{d.powered}</p>
            </main>
        </div>

        {sel && <div className="receipt">{logoUrl && <img src={logoUrl} alt="" onError={hide} style={{ height: 70, maxWidth: '100%', objectFit: 'contain' }} />}<h1>{data.shop.name}</h1><p>{data.shop.phone} {data.shop.address}</p><h3>{t('receipt')} #{sel.order_no}</h3>
            <p>{data.customer.name} · {data.customer.phone}</p><p>{t('orderDate')}: {sel.order_date} · {t('deliveryDate')}: {sel.delivery_date || '—'}</p>
            <table><tbody>{sel.items.map((i: any, k: number) => <tr key={k}><td>{i.garment} × {i.qty}</td><td>{money(i.qty * i.price)}</td></tr>)}</tbody></table>
            <p>{t('total')}: {money(total(sel))}<br />{t('paid')}: {money(paid(sel))}<br /><b>{t('balance')}: {money(total(sel) - paid(sel))}</b></p></div>}
    </div>
}
