import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from './i18n'

const D: any = {
    en: {
        login: 'Sign in', start: 'Start free',
        title: 'Run your tailoring shop with calm, not paper.',
        sub: 'Customers, measurements, orders and payments in one elegant place. Print a professional receipt in one click, in English or Urdu.',
        f: [
            ['Customer book', 'Every customer with phone, address and full order history.'],
            ['Measurements that last', 'Save chest, waist, sleeve and more. Every change keeps an older version.'],
            ['Digital order book', 'Track each order from New to Delivered and see overdue deliveries at a glance.'],
            ['Payments and receipts', 'Advance and partial payments, exact balances, printable receipts.'],
            ['Shop dashboard', 'Today\'s deliveries, money received and money still owed.'],
            ['English and Urdu', 'Switch language any time, with proper right-to-left layout.'],
        ],
        howT: 'How it works',
        how: ['Add your customer and save their measurements.', 'Create the order with garments, price and delivery date.', 'Record payments and hand over a clean receipt.'],
        secure: 'Each shop has a private account. Other tailors can never see your customers or payments.',
        cta: 'Create your shop account', foot: 'Made for tailors and boutiques'
    },
    ur: {
        login: 'لاگ اِن', start: 'مفت شروع کریں',
        title: 'اپنی ٹیلرنگ شاپ کو کاغذ کے بجائے سکون سے چلائیں۔',
        sub: 'گاہک، ناپ، آرڈر اور ادائیگیاں ایک ہی خوبصورت جگہ پر۔ ایک کلک میں پیشہ ورانہ رسید پرنٹ کریں، اردو یا انگریزی میں۔',
        f: [
            ['گاہکوں کی کتاب', 'ہر گاہک کا فون، پتہ اور مکمل آرڈر ہسٹری۔'],
            ['ہمیشہ محفوظ ناپ', 'چھاتی، کمر، آستین وغیرہ محفوظ کریں۔ ہر تبدیلی پر پرانا ناپ بھی رہتا ہے۔'],
            ['ڈیجیٹل آرڈر بک', 'ہر آرڈر کو نیا سے ڈیلیور تک دیکھیں اور تاخیر والی ڈیلیوریاں فوراً پہچانیں۔'],
            ['ادائیگیاں اور رسیدیں', 'ایڈوانس اور قسطوں میں ادائیگی، درست بقایا اور پرنٹ ہونے والی رسید۔'],
            ['شاپ ڈیش بورڈ', 'آج کی ڈیلیوریاں، موصول رقم اور بقایا رقم۔'],
            ['اردو اور انگریزی', 'کسی بھی وقت زبان بدلیں، درست دائیں سے بائیں ترتیب کے ساتھ۔'],
        ],
        howT: 'یہ کیسے کام کرتا ہے',
        how: ['گاہک شامل کریں اور اس کا ناپ محفوظ کریں۔', 'لباس، قیمت اور ڈیلیوری کی تاریخ کے ساتھ آرڈر بنائیں۔', 'ادائیگیاں درج کریں اور صاف رسید دیں۔'],
        secure: 'ہر دکان کا اپنا نجی اکاؤنٹ ہے۔ دوسرے درزی آپ کے گاہک یا ادائیگیاں کبھی نہیں دیکھ سکتے۔',
        cta: 'اپنی دکان کا اکاؤنٹ بنائیں', foot: 'درزیوں اور بوتیک کے لیے'
    }
}

function Art() {
    // Decorative illustration drawn in code (no image files, so it can never break)
    const ticks = Array.from({ length: 24 }, (_, i) => <line key={i} x1={20 + i * 14} y1="0" x2={20 + i * 14} y2={i % 5 === 0 ? 16 : 9} stroke="#5a1a2b" strokeWidth="1.5" />)
    return <svg viewBox="0 0 380 320" role="img" aria-label="Measuring tape, scissors and thread" className="lp-art">
        <circle cx="190" cy="160" r="140" fill="#ece3d1" opacity=".16" />
        <g transform="translate(20 200) rotate(-8)"><rect width="350" height="32" rx="4" fill="#faf6ee" />{ticks}</g>
        <g transform="translate(120 70)" stroke="#b8933f" strokeWidth="6" strokeLinecap="round" fill="none">
            <circle cx="30" cy="95" r="20" /><circle cx="90" cy="95" r="20" /><path d="M42 78 L110 -10" /><path d="M78 78 L10 -10" /></g>
        <path d="M300 30 C260 90 340 120 290 180" stroke="#b8933f" strokeWidth="3" fill="none" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="300" cy="28" r="6" fill="#b8933f" />
    </svg>
}

// Optional real photos: put hero.jpg, photo1.jpg, photo2.jpg, photo3.jpg inside the "public" folder.
function Photo({ src }: { src: string }) {
    const [ok, setOk] = useState(true)
    return ok ? <img src={src} alt="" className="lp-photo" loading="lazy" onError={() => setOk(false)} /> : null
}
function Hero() {
    const [ok, setOk] = useState(true)
    return ok ? <img src="/hero.jpg" alt="Tailor at work" className="lp-photo" onError={() => setOk(false)} /> : <Art />
}

export default function Landing() {
    const { lang, setLang } = useT(); const c = D[lang]
    return <div className="lp">
        <header className="lp-nav"><span className="lp-logo">TailorBook</span><span style={{ flex: 1 }} />
            <button className="ghost lp-lang" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}>{lang === 'en' ? 'اردو' : 'English'}</button>
            <Link to="/login" className="lp-link">{c.login}</Link><Link to="/login?mode=up" className="btn gold">{c.start}</Link></header>
        <section className="lp-hero"><div><h1>{c.title}</h1><p>{c.sub}</p>
            <Link to="/login?mode=up" className="btn gold lp-big">{c.start}</Link></div><Hero /></section>
        <section className="lp-sec"><div className="lp-grid">{c.f.map((x: string[], i: number) => <div className="card" key={i}><span className="lp-num">0{i + 1}</span><h3>{x[0]}</h3><p>{x[1]}</p></div>)}</div></section>
        <section className="lp-sec lp-gallery"><Photo src="/photo1.jpg" /><Photo src="/photo2.jpg" /><Photo src="/photo3.jpg" /></section>
        <section className="lp-sec lp-how"><h2>{c.howT}</h2><ol>{c.how.map((x: string, i: number) => <li key={i}>{x}</li>)}</ol><p className="lp-secure">🔒 {c.secure}</p>
            <Link to="/login?mode=up" className="btn gold lp-big">{c.cta}</Link></section>
        <footer className="lp-foot">© TailorBook · {c.foot}</footer>
    </div>
}
