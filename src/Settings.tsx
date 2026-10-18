import { useEffect, useState, FormEvent } from 'react'
import { supabase } from './supabase'
import { useT } from './i18n'

const D: any = {
    en: { title: 'Shop settings', logo: 'Shop logo', upload: 'Upload logo', remove: 'Remove logo', saved: 'Saved.', bad: 'Logo must be a PNG, JPG or WebP image under 2 MB.', inches: 'Inches', cm: 'Centimetres', hint: 'PNG, JPG or WebP, up to 2 MB. Shown on receipts.', danger: 'Delete my shop', dangerText: 'This permanently deletes your shop, all customers, measurements, orders, payments and your logo. It cannot be undone. Type your shop name to confirm.', mismatch: 'The name you typed does not match your shop name.', sure: 'Last warning: delete everything permanently?' },
    ur: { title: 'دکان کی ترتیبات', logo: 'دکان کا لوگو', upload: 'لوگو اپ لوڈ کریں', remove: 'لوگو ہٹائیں', saved: 'محفوظ ہو گیا۔', bad: 'لوگو PNG، JPG یا WebP تصویر ہو اور 2 MB سے کم ہو۔', inches: 'انچ', cm: 'سینٹی میٹر', hint: 'PNG، JPG یا WebP، زیادہ سے زیادہ 2 MB۔ رسید پر نظر آئے گا۔', danger: 'میری دکان حذف کریں', dangerText: 'اس سے آپ کی دکان، تمام گاہک، ناپ، آرڈرز، ادائیگیاں اور لوگو ہمیشہ کے لیے حذف ہو جائیں گے۔ اسے واپس نہیں کیا جا سکتا۔ تصدیق کے لیے اپنی دکان کا نام لکھیں۔', mismatch: 'آپ نے جو نام لکھا وہ دکان کے نام سے نہیں ملتا۔', sure: 'آخری وارننگ: کیا سب کچھ مستقل طور پر حذف کریں؟' }
}

// Shows the shop logo (private file, opened with a temporary signed link)
export function Logo({ shop, height = 56 }: { shop: any; height?: number }) {
    const [url, setUrl] = useState('')
    useEffect(() => {
        let on = true; setUrl('')
        if (shop.logo_path) supabase.storage.from('logos').createSignedUrl(shop.logo_path, 3600).then(({ data }) => { if (on && data) setUrl(data.signedUrl) })
        return () => { on = false }
    }, [shop.logo_path])
    return url ? <img src={url} alt={shop.name} style={{ height, maxWidth: '100%', objectFit: 'contain' }} onError={() => setUrl('')} /> : null
}

export function Settings({ shop, onSaved }: { shop: any; onSaved: () => void }) {
    const { t, lang } = useT(); const d = D[lang]
    const [f, setF] = useState({ name: shop.name || '', phone: shop.phone || '', address: shop.address || '', unit: shop.unit || 'inches' })
    const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)

    async function save(e: FormEvent) {
        e.preventDefault(); setErr(''); setMsg('')
        if (!f.name.trim()) return setErr(t('required'))
        const { error } = await supabase.from('shops').update({ name: f.name.trim(), phone: f.phone, address: f.address, unit: f.unit }).eq('id', shop.id)
        if (error) setErr(error.message); else { setMsg(d.saved); onSaved() }
    }
    async function upload(file?: File) {
        setErr(''); setMsg(''); if (!file) return
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return setErr(d.bad)
        setBusy(true)
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${shop.id}/logo-${Date.now()}.${ext}`
        const up = await supabase.storage.from('logos').upload(path, file, { contentType: file.type })
        if (up.error) { setBusy(false); return setErr(up.error.message) }
        const { error } = await supabase.from('shops').update({ logo_path: path }).eq('id', shop.id)
        if (!error && shop.logo_path) await supabase.storage.from('logos').remove([shop.logo_path])
        setBusy(false); if (error) setErr(error.message); else { setMsg(d.saved); onSaved() }
    }
    const [confirmName, setConfirmName] = useState('')
    async function deleteShop() {
        setErr(''); setMsg('')
        if (confirmName.trim() !== shop.name) return setErr(d.mismatch)
        if (!confirm(d.sure)) return
        if (shop.logo_path) await supabase.storage.from('logos').remove([shop.logo_path])
        const { error } = await supabase.from('shops').delete().eq('id', shop.id)   // cascades to customers, orders, payments
        if (error) setErr(error.message); else onSaved()
    }
    async function removeLogo() {
        if (!shop.logo_path) return
        await supabase.storage.from('logos').remove([shop.logo_path])
        await supabase.from('shops').update({ logo_path: null }).eq('id', shop.id); onSaved()
    }
    return <><h1>{d.title}</h1>
        <form className="card" onSubmit={save}>
            <label>{t('shopName')}</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            <div className="row"><div><label>{t('phone')}</label><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
                <div><label>{t('unit')}</label><select value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}><option value="inches">{d.inches}</option><option value="cm">{d.cm}</option></select></div></div>
            <label>{t('address')}</label><input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
            <p><button className="gold">{t('save')}</button></p></form>
        <div className="card"><h3>{d.logo}</h3><p><Logo shop={shop} height={80} /></p>
            <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = '' }} />
            <p style={{ opacity: .7, fontSize: '.85rem' }}>{d.hint}</p>
            {shop.logo_path && <button className="ghost" onClick={removeLogo}>{d.remove}</button>}</div>
        {err && <p className="err" role="alert">{err}</p>}{msg && <p>{msg}</p>}
        <div className="card" style={{ borderColor: 'var(--danger)' }}><h3 style={{ color: 'var(--danger)' }}>{d.danger}</h3><p>{d.dangerText}</p>
            <input value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder={shop.name} />
            <p><button className="danger" onClick={deleteShop}>{d.danger}</button></p></div></>
}
