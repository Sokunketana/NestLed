import { Fragment, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Badge } from '../../components/ui/badge'
import { Button, buttonVariants } from '../../components/ui/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import './landing.css'

function scrollToAnchor(event: MouseEvent<HTMLAnchorElement>, targetId: string, afterNavigate?: () => void) {
  const target = document.getElementById(targetId)
  if (!target) return

  event.preventDefault()
  afterNavigate?.()
  window.history.pushState(null, '', `#${targetId}`)

  const startY = window.scrollY
  const targetY = Math.max(0, startY + target.getBoundingClientRect().top - 24)
  const distance = targetY - startY
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 2) {
    window.scrollTo(0, targetY)
    return
  }

  const duration = Math.min(1800, Math.max(1000, Math.abs(distance) * 0.55))
  const startedAt = performance.now()
  let frame = 0

  const finish = () => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('pointerdown', cancel)
    window.removeEventListener('keydown', cancel)
  }
  const cancel = () => {
    cancelAnimationFrame(frame)
    finish()
  }
  const animate = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1)
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2
    window.scrollTo(0, startY + distance * eased)

    if (progress < 1) frame = requestAnimationFrame(animate)
    else finish()
  }

  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('pointerdown', cancel, { passive: true })
  window.addEventListener('keydown', cancel)
  frame = requestAnimationFrame(animate)
}

function Brand() {
  return <Link className="lp-brand" to="/" aria-label="Nestled home">
    <span>Nestled<span className="lp-brand-dot">.</span></span>
  </Link>
}

function HomePath() {
  const places = [
    { icon: 'home' as const, label: 'HOME', name: 'Your home', tone: 'green' },
    { icon: 'home' as const, label: 'ROOM', name: 'Bedroom', tone: 'amber' },
    { icon: 'box' as const, label: 'STORAGE SPOT', name: 'Top drawer', tone: 'lilac' },
    { icon: 'tag' as const, label: 'ITEM', name: 'Passport', tone: 'coral' },
  ]

  return <section className="lp-path-section lp-container" aria-labelledby="lp-path-title">
    <Card className="lp-path-card">
      <div className="lp-path-copy">
        <Badge variant="secondary">THE NESTLED WAY</Badge>
        <h2 id="lp-path-title">Everything has an address.</h2>
        <p>From a room to a storage spot to the thing you need, follow one clear path through your home.</p>
      </div>
      <ol className="lp-path-list">{places.map(({ icon, label, name, tone }) => <li key={label}>
        <span className={'lp-path-icon ' + tone}><Icon name={icon} /></span>
        <small>{label}</small>
        <strong>{name}</strong>
        {label !== 'ITEM' && <Icon name="chevron-right" className="lp-path-arrow" />}
      </li>)}</ol>
    </Card>
  </section>
}

const features = [
  { icon: 'home' as const, label: 'SPACE BY SPACE', title: 'Organize the way you live.', description: 'Build a simple map of your home with rooms and storage spots. Every item gets an address you can remember.', tone: 'green', breadcrumb: ['Home', 'Bedroom', 'Top drawer'] },
  { icon: 'search' as const, label: 'FIND IT FAST', title: 'Skip the scavenger hunt.', description: 'Search for what you need and know exactly where to look, even for the things you tucked away months ago.', tone: 'amber', detail: 'Passport found in Top drawer', detailIcon: 'check' as const },
  { icon: 'users' as const, label: 'BETTER TOGETHER', title: 'Keep everyone in the know.', description: 'Invite your household so everyone shares the same clear picture of what’s at home and where it lives.', tone: 'lilac', detail: 'Your household stays in sync', detailIcon: 'users' as const },
]

const faqs = [
  { question: 'How is my inventory organized?', answer: 'Start with rooms, add storage spots inside them, and place items where they live. You can also group items by category.' },
  { question: 'Can I share my inventory with someone at home?', answer: 'Yes. Invite another person by email to join your household. Once they accept, you can both use the same inventory.' },
  { question: 'Can I add photos to items?', answer: 'Yes. Add a photo when you create or edit an item to make it easier to recognize later.' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return <div className="lp-page">
    <a className="lp-skip" href="#main-content">Skip to content</a>
    <header className="lp-header"><div className="lp-container lp-header-inner">
      <Brand />
      <nav className={`lp-nav ${menuOpen ? 'is-open' : ''}`} id="landing-navigation" aria-label="Main navigation">
        <a href="#features" onClick={event => scrollToAnchor(event, 'features', () => setMenuOpen(false))}>Features</a>
        <a href="#how-it-works" onClick={event => scrollToAnchor(event, 'how-it-works', () => setMenuOpen(false))}>How it works</a>
        <a href="#faq" onClick={event => scrollToAnchor(event, 'faq', () => setMenuOpen(false))}>FAQ</a>
      </nav>
      <div className="lp-header-actions"><Link className="lp-sign-in" to="/login">Sign in</Link><Link className={buttonVariants({ size: 'sm', className: 'lp-nav-cta' })} to="/login">Get started <Icon name="arrow-right" /></Link></div>
      <Button variant="outline" size="icon" className="lp-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="landing-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span className="lp-menu-lines"><i /><i /><i /></span></Button>
    </div></header>

    <main id="main-content">
      <section className="lp-hero lp-container" aria-labelledby="lp-title">
        <Badge variant="outline" className="lp-announcement"><Icon name="sparkles" /> THE HOME INVENTORY THAT FEELS LIKE HOME <Icon name="arrow-right" /></Badge>
        <h1 id="lp-title">A place for everything.<br /><span>Finally.</span></h1>
        <p>Keep track of what you own, know exactly where it lives, and bring your household along. A little organization goes a long way.</p>
        <div className="lp-hero-actions"><Link className={buttonVariants({ size: 'lg', className: 'lp-primary-cta' })} to="/login">Get started with Nestled <Icon name="arrow-right" /></Link><a className={buttonVariants({ variant: 'outline', size: 'lg', className: 'lp-secondary-cta' })} href="#how-it-works" onClick={event => scrollToAnchor(event, 'how-it-works')}>See how it works</a></div>
        <div className="lp-hero-points"><span><Icon name="check" /> Organize by room</span><span><Icon name="check" /> Find things faster</span><span><Icon name="check" /> Share with your household</span></div>
      </section>

      <HomePath />

      <section className="lp-trust-strip" aria-label="A simpler way to manage your home"><div className="lp-container"><span>Made for the way real homes work.</span><div><Icon name="home" /> Room by room</div><div><Icon name="search" /> Easy to find</div><div><Icon name="users" /> Better together</div></div></section>

      <section className="lp-section lp-container" id="features" aria-labelledby="lp-features-title"><div className="lp-section-heading"><Badge variant="secondary">WHY NESTLED</Badge><h2 id="lp-features-title">Your home makes more sense<br />when everything has a place.</h2><p>Spend less time remembering where things went and more time enjoying the space you’ve made.</p></div><div className="lp-feature-grid">{features.map(feature => <Card className="lp-feature-card" key={feature.label}><CardHeader><span className={`lp-feature-icon ${feature.tone}`}><Icon name={feature.icon} /></span><Badge variant="outline" className="lp-feature-label">{feature.label}</Badge><CardTitle>{feature.title}</CardTitle><CardDescription>{feature.description}</CardDescription></CardHeader><CardContent><div className="lp-feature-detail">{'breadcrumb' in feature ? <Breadcrumb className="lp-feature-breadcrumb"><BreadcrumbList>{feature.breadcrumb.map((crumb, index) => <Fragment key={crumb}>{index > 0 && <BreadcrumbSeparator />}<BreadcrumbItem>{index === feature.breadcrumb.length - 1 ? <BreadcrumbPage className="lp-feature-crumb-current">{crumb}</BreadcrumbPage> : <span className="lp-feature-crumb">{crumb}</span>}</BreadcrumbItem></Fragment>)}</BreadcrumbList></Breadcrumb> : <><Icon name={feature.detailIcon} /><span>{feature.detail}</span></>}</div></CardContent></Card>)}</div></section>

      <section className="lp-how" id="how-it-works" aria-labelledby="lp-how-title"><div className="lp-container lp-how-inner"><div className="lp-how-copy"><Badge variant="outline">SIMPLE FROM THE START</Badge><h2 id="lp-how-title">From “where is it?”<br />to “there it is.”</h2><p>There’s no complicated setup. Just build your home’s map as you go, one room and one item at a time.</p><Link className={buttonVariants({ size: 'lg' })} to="/login">Make yourself at home <Icon name="arrow-right" /></Link></div><div className="lp-step-list"><div><span>01</span><div><h3>Set up your spaces</h3><p>Add rooms and the storage spots inside them.</p></div><Icon name="home" /></div><div><span>02</span><div><h3>Put things in their place</h3><p>Save items with the details and photos that matter.</p></div><Icon name="box" /></div><div><span>03</span><div><h3>Find and share with ease</h3><p>Search your home and invite others to stay in sync.</p></div><Icon name="search" /></div></div></div></section>

      <section className="lp-faq lp-container" id="faq" aria-labelledby="lp-faq-title"><div className="lp-faq-heading"><Badge variant="secondary">GOOD TO KNOW</Badge><h2 id="lp-faq-title">A few questions, answered.</h2><p>Everything you need to feel at home with Nestled.</p></div><div className="lp-faq-list">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>)}</div></section>

    </main>

    <footer className="lp-footer"><div className="lp-container lp-footer-inner"><Brand /><span>© {new Date().getFullYear()} Nestled. Your home, organized with care.</span><a href="#main-content" onClick={event => scrollToAnchor(event, 'main-content')}>Back to top ↑</a></div></footer>
  </div>
}
