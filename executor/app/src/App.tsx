import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'sonner'

const CONTRACT = '0xB0A44D12b898C641f2DD3d97c5268be076a56B80'

interface Condition {
  text: string
  met: boolean
}

interface Will {
  id: string
  title: string
  beneficiary: string
  conditions: Condition[]
  triggered: boolean
  checking?: boolean
}

const SEED_WILLS: Will[] = [
  {
    id: 'WILL-007',
    title: 'Estate of A. Whitman',
    beneficiary: '0x91…beneficiary.eth',
    conditions: [
      { text: 'No verified activity on owner address for 365 days', met: true },
      { text: 'Death certificate reference present in registry feed', met: true },
      { text: 'No active dispute filed by named executors', met: true },
    ],
    triggered: true,
  },
  {
    id: 'WILL-006',
    title: 'Legacy Trust — Coastal Property',
    beneficiary: 'maria.lex.eth',
    conditions: [
      { text: 'Beneficiary reaches the age of 25', met: true },
      { text: 'Probate court ruling published to oracle', met: false },
    ],
    triggered: false,
  },
  {
    id: 'WILL-005',
    title: 'Founders Vesting Bequest',
    beneficiary: '0x4c…heirs.eth',
    conditions: [
      { text: 'Company acquisition confirmed by filing', met: false },
      { text: 'Owner inactivity window of 180 days elapsed', met: false },
    ],
    triggered: false,
  },
]

const STEPS = [
  { n: 'I', title: 'Draft the conditions', body: 'Write your wishes in plain language — "if I am inactive for a year, transfer to my daughter." No legalese, no code.' },
  { n: 'II', title: 'Name the beneficiary', body: 'Bind the estate to a wallet or ENS name and point the executor at the data sources that prove each condition.' },
  { n: 'III', title: 'Validators watch', body: 'GenLayer validators periodically read live data and judge, in consensus, whether your conditions are satisfied.' },
  { n: 'IV', title: 'The transfer triggers', body: 'When every condition is met, the bequest executes on-chain — dignified, automatic, and tamper-proof.' },
]

const FEATURES = [
  { icon: '✒︎', title: 'Plain-language clauses', body: 'Express intent the way you would to a trusted solicitor. The words themselves are the instruction set.' },
  { icon: '⚖︎', title: 'Consensus verification', body: 'No single oracle decides. A validator set independently confirms each condition before anything moves.' },
  { icon: '🜂', title: 'Live-data conditions', body: 'Conditions can reference registries, activity feeds, or public filings — checked against the real world.' },
  { icon: '🛡︎', title: 'Tamper-proof execution', body: 'Once recorded, your wishes cannot be quietly altered by an intermediary or contested institution.' },
  { icon: '🕊︎', title: 'Dignified by design', body: 'A solemn, transparent process that honours your intent without exposing your family to friction.' },
  { icon: '⏳', title: 'Patient & autonomous', body: 'The executor waits as long as it must, re-checking conditions until the moment they are finally satisfied.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
}

export default function App() {
  const [wills, setWills] = useState<Will[]>(SEED_WILLS)
  const [title, setTitle] = useState('')
  const [conditions, setConditions] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [checking, setChecking] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!conditions.trim() || !beneficiary.trim()) {
      toast.error('Conditions and beneficiary are required.')
      return
    }
    const id = `WILL-${String(8 + wills.length).padStart(3, '0')}`
    const condList: Condition[] = conditions
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((text) => ({ text, met: false }))
    if (condList.length === 0) condList.push({ text: conditions.trim(), met: false })

    const fresh: Will = {
      id,
      title: title.trim() || 'Untitled Bequest',
      beneficiary: beneficiary.trim(),
      conditions: condList,
      triggered: false,
      checking: true,
    }
    setWills((w) => [fresh, ...w])
    setChecking(true)
    toast(`${id} recorded — validators reviewing the conditions…`, { icon: '🕯️' })

    setTimeout(() => {
      const allMet = (title.length + beneficiary.length) % 4 !== 0
      setWills((w) =>
        w.map((will) =>
          will.id === id
            ? {
                ...will,
                checking: false,
                triggered: allMet,
                conditions: will.conditions.map((c, i) => ({
                  ...c,
                  met: allMet ? true : i < will.conditions.length - 1,
                })),
              }
            : will,
        ),
      )
      setChecking(false)
      if (allMet) {
        toast.success(`${id} — all conditions met. Transfer executed to ${fresh.beneficiary}.`)
      } else {
        toast(`${id} — conditions pending. The executor will keep watch.`, { icon: '⏳' })
      }
      setTitle('')
      setConditions('')
      setBeneficiary('')
    }, 3000)
  }

  return (
    <div className="min-h-screen text-[#e8e3d6] overflow-x-hidden">
      <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: '#242017', border: '1px solid #c9a22744', color: '#e8e3d6', fontFamily: 'EB Garamond, serif' } }} />

      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#1a1a1a]/85 border-b border-[#c9a227]/20">
        <nav className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-full border border-[#c9a227] text-[#c9a227] font-display text-xl">W</span>
            <span className="font-display text-2xl tracking-wide">Will<span className="text-[#c9a227]">Executor</span></span>
          </a>
          <div className="hidden md:flex items-center gap-9 text-[15px] text-[#b6ad97]">
            <a href="#how" className="hover:text-[#c9a227] transition">Process</a>
            <a href="#features" className="hover:text-[#c9a227] transition">Assurances</a>
            <a href="#registry" className="hover:text-[#c9a227] transition">Registry</a>
          </div>
          <a href="#demo" className="text-[15px] px-5 py-2 rounded-sm border border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-[#1a1a1a] transition">
            Record a will
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative">
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-28 text-center">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
            className="text-[#c9a227] tracking-[0.3em] text-xs uppercase mb-6">
            Autonomous Estate Execution
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-display text-5xl md:text-7xl leading-[1.08] max-w-4xl mx-auto">
            Your final wishes,
            <span className="block text-[#c9a227] italic">faithfully carried out.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-8 text-xl text-[#b6ad97] max-w-2xl mx-auto leading-relaxed">
            Write your conditions in plain language. GenLayer validators verify them against live data
            and execute the transfer the moment they are met — no court, no custodian, no doubt.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <a href="#demo" className="px-7 py-3.5 rounded-sm bg-[#c9a227] text-[#1a1a1a] font-medium tracking-wide hover:bg-[#d9b43a] transition">
              Record a will
            </a>
            <a href="#how" className="px-7 py-3.5 rounded-sm border border-[#c9a227]/40 text-[#e8e3d6] hover:border-[#c9a227] transition">
              Understand the process
            </a>
          </motion.div>
          <div className="mx-auto mt-16 h-px w-40 gold-rule" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <SectionHead kicker="The Process" title="Four steps, faithfully observed" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="text-center px-2">
              <span className="font-display text-4xl text-[#c9a227]">{s.n}</span>
              <div className="mx-auto my-4 h-px w-12 gold-rule" />
              <h3 className="font-display text-xl mb-2">{s.title}</h3>
              <p className="text-[15px] text-[#b6ad97] leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-y border-[#c9a227]/15 bg-[#161616]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <SectionHead kicker="Assurances" title="Why families place their trust here" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                className="rounded-sm border border-[#c9a227]/20 bg-[#1c1c1c] p-7 hover:border-[#c9a227]/50 transition">
                <div className="text-2xl text-[#c9a227] mb-4">{f.icon}</div>
                <h3 className="font-display text-xl mb-2.5">{f.title}</h3>
                <p className="text-[15px] text-[#b6ad97] leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO + REGISTRY */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-24">
        <SectionHead kicker="The Registry" title="Record a will, watch the conditions resolve" />
        <div className="grid lg:grid-cols-[400px_1fr] gap-10 mt-14">
          {/* form */}
          <motion.form
            onSubmit={handleSubmit}
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.55 }}
            className="rounded-sm border border-[#c9a227]/30 bg-[#1c1c1c] p-7 h-fit">
            <h3 className="font-display text-2xl text-[#c9a227] mb-1">Draft a bequest</h3>
            <p className="text-sm text-[#b6ad97] mb-6">Validators review your conditions in ~3 seconds.</p>

            <label className="block text-sm text-[#b6ad97] mb-1.5">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Estate of J. Doe"
              className="w-full bg-[#1a1a1a] border border-[#c9a227]/25 rounded-sm px-3.5 py-2.5 mb-4 text-[15px] placeholder-[#5c5648] outline-none focus:border-[#c9a227]" />

            <label className="block text-sm text-[#b6ad97] mb-1.5">Conditions <span className="text-[#5c5648]">(one per line)</span></label>
            <textarea
              value={conditions} onChange={(e) => setConditions(e.target.value)} rows={4}
              placeholder={'No activity on my address for 365 days\nDeath certificate filed to registry'}
              className="w-full bg-[#1a1a1a] border border-[#c9a227]/25 rounded-sm px-3.5 py-2.5 mb-4 text-[15px] placeholder-[#5c5648] outline-none focus:border-[#c9a227] resize-none" />

            <label className="block text-sm text-[#b6ad97] mb-1.5">Beneficiary</label>
            <input
              value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="wallet address or ENS name"
              className="w-full bg-[#1a1a1a] border border-[#c9a227]/25 rounded-sm px-3.5 py-2.5 mb-6 text-[15px] placeholder-[#5c5648] outline-none focus:border-[#c9a227]" />

            <button
              type="submit" disabled={checking}
              className="w-full rounded-sm py-3 bg-[#c9a227] text-[#1a1a1a] font-medium tracking-wide hover:bg-[#d9b43a] transition disabled:opacity-50 disabled:cursor-not-allowed">
              {checking ? 'Validators reviewing…' : 'Record & verify'}
            </button>
          </motion.form>

          {/* will cards */}
          <motion.div
            id="registry"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-5">
            {wills.map((will) => (
              <motion.article
                key={will.id} layout
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-sm border border-[#c9a227]/20 bg-[#1c1c1c] p-6 flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs tracking-widest text-[#8a8169]">{will.id}</span>
                  {will.checking ? (
                    <span className="text-xs text-[#c9a227] animate-pulse">verifying…</span>
                  ) : will.triggered ? (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/40">TRIGGERED</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-[#2a2a2a] text-[#b6ad97] border border-[#444]">PENDING</span>
                  )}
                </div>
                <h3 className="font-display text-xl mb-1">{will.title}</h3>
                <p className="text-sm text-[#8a8169] mb-4">to <span className="text-[#c9a227]">{will.beneficiary}</span></p>

                <ul className="space-y-2.5 mt-auto">
                  {will.conditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px]">
                      <span className={`mt-0.5 grid place-items-center w-4 h-4 rounded-full text-[10px] shrink-0 ${c.met ? 'bg-[#c9a227] text-[#1a1a1a]' : 'border border-[#5c5648] text-transparent'}`}>
                        ✓
                      </span>
                      <span className={c.met ? 'text-[#e8e3d6]' : 'text-[#8a8169]'}>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#c9a227]/15 bg-[#161616]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-full border border-[#c9a227] text-[#c9a227] font-display">W</span>
            <span className="font-display text-xl">Will<span className="text-[#c9a227]">Executor</span></span>
          </div>
          <p className="text-xs text-[#8a8169] text-center break-all">
            Contract <span className="text-[#c9a227]">{CONTRACT}</span> · GenLayer Bradbury
          </p>
          <p className="text-xs text-[#8a8169]">© {new Date().getFullYear()} WillExecutor</p>
        </div>
      </footer>
    </div>
  )
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.55 }}
      className="text-center">
      <p className="text-[#c9a227] tracking-[0.3em] text-xs uppercase mb-3">{kicker}</p>
      <h2 className="font-display text-4xl md:text-5xl">{title}</h2>
      <div className="mx-auto mt-5 h-px w-24 gold-rule" />
    </motion.div>
  )
}
