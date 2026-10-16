import { useT } from './i18n'

const D: any = {
    en: { rev: 'Payments received, last 6 months', ord: 'New orders, last 6 months', none: 'No data yet. Charts appear after your first order and payment.' },
    ur: { rev: 'موصول ادائیگیاں، پچھلے 6 مہینے', ord: 'نئے آرڈرز، پچھلے 6 مہینے', none: 'ابھی ڈیٹا نہیں ہے۔ پہلے آرڈر اور ادائیگی کے بعد چارٹ نظر آئیں گے۔' }
}

function lastMonths(n: number) {
    const out: string[] = []; const now = new Date()
    for (let i = n - 1; i >= 0; i--) {
        const x = new Date(now.getFullYear(), now.getMonth() - i, 1)
        out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`)
    }
    return out
}

function Bars({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
    const max = Math.max(1, ...values); const W = 360, H = 170, base = 135, top = 22
    const slot = W / values.length, bw = Math.min(40, slot * 0.6)
    return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520 }} role="img">
        <line x1="0" y1={base} x2={W} y2={base} stroke="currentColor" opacity=".25" />
        {values.map((v, i) => {
            const h = (v / max) * (base - top); const x = i * slot + (slot - bw) / 2
            return <g key={i}>
                <rect x={x} y={base - h} width={bw} height={Math.max(h, v > 0 ? 2 : 0)} rx="4" fill={color} />
                <text x={x + bw / 2} y={base - h - 6} textAnchor="middle" fontSize="11" fill="currentColor">{v > 0 ? v.toLocaleString() : ''}</text>
                <text x={x + bw / 2} y={base + 18} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".8">{labels[i]}</text>
            </g>
        })}
    </svg>
}

export function Charts({ orders }: { orders: any[] }) {
    const { lang } = useT(); const d = D[lang]
    const months = lastMonths(6)
    const labels = months.map(m => new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { month: 'short' }))
    const rev = months.map(m => orders.reduce((s, o) => s + (o.payments || []).filter((p: any) => (p.paid_on || '').startsWith(m)).reduce((a: number, p: any) => a + Number(p.amount), 0), 0))
    const cnt = months.map(m => orders.filter(o => o.status !== 'Cancelled' && (o.order_date || '').startsWith(m)).length)
    if (rev.every(v => v === 0) && cnt.every(v => v === 0)) return <div className="card">{d.none}</div>
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="card"><h3>{d.rev}</h3><Bars labels={labels} values={rev} color="var(--gold)" /></div>
        <div className="card"><h3>{d.ord}</h3><Bars labels={labels} values={cnt} color="var(--navy2)" /></div>
    </div>
}
