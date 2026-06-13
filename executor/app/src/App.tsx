import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";

const CONTRACT = "0xB0A44D12b898C641f2DD3d97c5268be076a56B80";

interface Condition {
  id: number;
  text: string;
}

interface WillState {
  conditions: Condition[];
  beneficiary: string;
  beneficiaryAddr: string;
  asset: string;
  source: string;
  sourceLabel: string;
}

const STEPS = [
  { key: "conditions", title: "Conditions", caption: "Define the triggers" },
  { key: "beneficiary", title: "Beneficiary", caption: "Name the heir" },
  { key: "source", title: "Check Source", caption: "Verify against data" },
  { key: "review", title: "Review & Seal", caption: "Commit on-chain" },
] as const;

const SOURCES = [
  { id: "registry", label: "National death registry (oracle)" },
  { id: "inactivity", label: "On-chain inactivity (dead-man switch)" },
  { id: "medical", label: "Attested medical record feed" },
  { id: "court", label: "Probate court attestation" },
];

let _cid = 10;

const initialWill: WillState = {
  conditions: [
    { id: 1, text: "Confirmed deceased per national registry oracle." },
    { id: 2, text: "No wallet activity for 180 consecutive days." },
  ],
  beneficiary: "",
  beneficiaryAddr: "",
  asset: "12.5 ETH + estate vault NFTs",
  source: "registry",
  sourceLabel: SOURCES[0].label,
};

function App() {
  const [step, setStep] = useState(0);
  const [will, setWill] = useState<WillState>(initialWill);
  const [sealed, setSealed] = useState(false);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [checking, setChecking] = useState(false);

  const set = <K extends keyof WillState>(key: K, value: WillState[K]) =>
    setWill((w) => ({ ...w, [key]: value }));

  const addCondition = () =>
    setWill((w) => ({
      ...w,
      conditions: [...w.conditions, { id: ++_cid, text: "" }],
    }));

  const updateCondition = (id: number, text: string) =>
    setWill((w) => ({
      ...w,
      conditions: w.conditions.map((c) => (c.id === id ? { ...c, text } : c)),
    }));

  const removeCondition = (id: number) =>
    setWill((w) => ({
      ...w,
      conditions: w.conditions.filter((c) => c.id !== id),
    }));

  const canAdvance = (): boolean => {
    if (step === 0)
      return will.conditions.filter((c) => c.text.trim()).length >= 1;
    if (step === 1)
      return will.beneficiary.trim().length > 0 && /^0x/.test(will.beneficiaryAddr.trim());
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      if (step === 0) toast.error("Add at least one condition.");
      else if (step === 1)
        toast.error("Enter a beneficiary name and a 0x… address.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const runSourceCheck = () => {
    setChecking(true);
    setChecks({});
    toast.loading("AI verifying conditions against the source…", { id: "chk" });
    const live = will.conditions.filter((c) => c.text.trim());
    live.forEach((c, i) => {
      setTimeout(
        () => {
          setChecks((prev) => ({ ...prev, [c.id]: true }));
          if (i === live.length - 1) {
            setChecking(false);
            toast.success("All conditions evaluated against the source.", {
              id: "chk",
            });
          }
        },
        700 * (i + 1)
      );
    });
  };

  const seal = () => {
    setSealed(true);
    toast.success("Will sealed and committed on-chain ⚜", { id: "seal" });
  };

  const allChecked =
    will.conditions.filter((c) => c.text.trim()).length > 0 &&
    will.conditions
      .filter((c) => c.text.trim())
      .every((c) => checks[c.id]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#e8e3d6]">
      <Toaster theme="dark" position="top-center" richColors />

      {/* solemn masthead */}
      <header className="border-b border-[#c9a227]/20 px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-[#c9a227]">⚜</span>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-wide text-[#f3eee0]">
                WillExecutor
              </h1>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#c9a227]/60">
                Autonomous Estate Instrument
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[10px] text-[#e8e3d6]/30 sm:block">
            {CONTRACT}
          </p>
        </div>
        <div className="gold-rule mx-auto mt-6 h-px max-w-5xl" />
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-[220px_1fr]">
        {/* vertical stepper rail */}
        <nav aria-label="Progress" className="md:pt-2">
          <ol className="relative space-y-7">
            <span className="absolute left-[15px] top-2 h-[calc(100%-2rem)] w-px bg-[#c9a227]/20" />
            {STEPS.map((s, i) => {
              const state =
                i < step ? "done" : i === step ? "active" : "todo";
              return (
                <li key={s.key} className="relative flex items-start gap-3">
                  <span
                    className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm transition ${
                      state === "active"
                        ? "border-[#c9a227] bg-[#c9a227] text-[#1A1A1A]"
                        : state === "done"
                          ? "border-[#c9a227]/60 bg-[#1A1A1A] text-[#c9a227]"
                          : "border-[#e8e3d6]/20 bg-[#1A1A1A] text-[#e8e3d6]/30"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <div className="pt-1">
                    <p
                      className={`font-display text-base leading-none ${
                        state === "todo"
                          ? "text-[#e8e3d6]/40"
                          : "text-[#f3eee0]"
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="mt-1 text-[11px] italic text-[#e8e3d6]/35">
                      {s.caption}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* step panel */}
        <section className="min-h-[420px]">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#c9a227]/60">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#f3eee0]">
              {STEPS[step].title}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 1 — CONDITIONS */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm italic text-[#e8e3d6]/55">
                    Write, in plain language, the circumstances under which this
                    estate shall be released.
                  </p>
                  {will.conditions.map((c, i) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <span className="mt-3 font-display text-[#c9a227]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <textarea
                        value={c.text}
                        onChange={(e) => updateCondition(c.id, e.target.value)}
                        rows={2}
                        placeholder="e.g. Confirmed deceased per registry oracle…"
                        className="flex-1 resize-none rounded-sm border border-[#c9a227]/20 bg-[#222] px-3 py-2 text-sm text-[#f3eee0] outline-none focus:border-[#c9a227]/60"
                      />
                      {will.conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(c.id)}
                          className="mt-2 text-[#e8e3d6]/30 transition hover:text-[#c9a227]"
                          aria-label="Remove condition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addCondition}
                    className="text-sm italic text-[#c9a227] underline-offset-4 transition hover:underline"
                  >
                    + add another condition
                  </button>
                </div>
              )}

              {/* STEP 2 — BENEFICIARY */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Beneficiary name
                    </label>
                    <input
                      value={will.beneficiary}
                      onChange={(e) => set("beneficiary", e.target.value)}
                      placeholder="Full legal name"
                      className="w-full rounded-sm border border-[#c9a227]/20 bg-[#222] px-3 py-2.5 text-sm text-[#f3eee0] outline-none focus:border-[#c9a227]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Beneficiary wallet
                    </label>
                    <input
                      value={will.beneficiaryAddr}
                      onChange={(e) => set("beneficiaryAddr", e.target.value)}
                      placeholder="0x…"
                      className="w-full rounded-sm border border-[#c9a227]/20 bg-[#222] px-3 py-2.5 font-mono text-sm text-[#f3eee0] outline-none focus:border-[#c9a227]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Bequeathed assets
                    </label>
                    <input
                      value={will.asset}
                      onChange={(e) => set("asset", e.target.value)}
                      className="w-full rounded-sm border border-[#c9a227]/20 bg-[#222] px-3 py-2.5 text-sm text-[#f3eee0] outline-none focus:border-[#c9a227]/60"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 — CHECK SOURCE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Verification source
                    </label>
                    <select
                      value={will.source}
                      onChange={(e) => {
                        const s = SOURCES.find((x) => x.id === e.target.value)!;
                        set("source", s.id);
                        set("sourceLabel", s.label);
                        setChecks({});
                      }}
                      className="w-full rounded-sm border border-[#c9a227]/20 bg-[#222] px-3 py-2.5 text-sm text-[#f3eee0] outline-none focus:border-[#c9a227]/60"
                    >
                      {SOURCES.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#222]">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-sm border border-[#c9a227]/15 bg-[#202020] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm italic text-[#e8e3d6]/55">
                        AI evaluation of each condition against the source
                      </p>
                      <button
                        onClick={runSourceCheck}
                        disabled={checking}
                        className="rounded-sm border border-[#c9a227]/50 px-3 py-1 text-xs font-medium text-[#c9a227] transition hover:bg-[#c9a227]/10 disabled:opacity-50"
                      >
                        {checking ? "checking…" : "run check"}
                      </button>
                    </div>
                    <ul className="space-y-2.5">
                      {will.conditions
                        .filter((c) => c.text.trim())
                        .map((c) => (
                          <li key={c.id} className="flex items-start gap-3 text-sm">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                                checks[c.id]
                                  ? "border-[#7da87d] bg-[#7da87d]/20 text-[#9fd09f]"
                                  : "border-[#e8e3d6]/20 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span
                              className={
                                checks[c.id]
                                  ? "text-[#f3eee0]"
                                  : "text-[#e8e3d6]/50"
                              }
                            >
                              {c.text}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP 4 — REVIEW & SEAL */}
              {step === 3 && (
                <div className="space-y-5">
                  <motion.article
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-sm border bg-[#211f1a] p-6 transition ${
                      sealed ? "border-[#c9a227]" : "border-[#c9a227]/25"
                    }`}
                  >
                    {sealed && (
                      <motion.span
                        initial={{ scale: 0, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: -12, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="absolute -right-2 -top-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c9a227] bg-[#1A1A1A] font-display text-[10px] font-bold uppercase tracking-wider text-[#c9a227]"
                      >
                        Sealed
                      </motion.span>
                    )}
                    <h3 className="font-display text-2xl text-[#f3eee0]">
                      Last Will &amp; Testament
                    </h3>
                    <div className="gold-rule my-3 h-px" />

                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Beneficiary
                    </p>
                    <p className="mb-3 text-[#f3eee0]">
                      {will.beneficiary || "—"}{" "}
                      <span className="font-mono text-xs text-[#e8e3d6]/40">
                        {will.beneficiaryAddr}
                      </span>
                    </p>

                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Bequest
                    </p>
                    <p className="mb-3 text-[#f3eee0]">{will.asset}</p>

                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#c9a227]/60">
                      Conditions ({will.sourceLabel})
                    </p>
                    <ul className="mt-1 space-y-1.5">
                      {will.conditions
                        .filter((c) => c.text.trim())
                        .map((c) => (
                          <li
                            key={c.id}
                            className="flex items-start gap-2 text-sm text-[#e8e3d6]/80"
                          >
                            <span
                              className={
                                checks[c.id]
                                  ? "text-[#9fd09f]"
                                  : "text-[#e8e3d6]/30"
                              }
                            >
                              {checks[c.id] ? "✓" : "○"}
                            </span>
                            {c.text}
                          </li>
                        ))}
                    </ul>

                    <div className="gold-rule my-4 h-px" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs italic text-[#e8e3d6]/45">
                        Trigger status
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          allChecked
                            ? "bg-[#7da87d]/20 text-[#9fd09f]"
                            : "bg-[#e8e3d6]/10 text-[#e8e3d6]/50"
                        }`}
                      >
                        {allChecked ? "Conditions met · armed" : "Pending verification"}
                      </span>
                    </div>
                  </motion.article>

                  {!sealed ? (
                    <button
                      onClick={seal}
                      className="w-full rounded-sm bg-[#c9a227] py-3 font-display text-base font-semibold text-[#1A1A1A] transition hover:brightness-110"
                    >
                      ⚜ Seal &amp; commit on-chain
                    </button>
                  ) : (
                    <p className="text-center text-sm italic text-[#9fd09f]">
                      This instrument is now immutable and watching the source.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* nav controls */}
          {!sealed && (
            <div className="mt-10 flex items-center justify-between border-t border-[#c9a227]/15 pt-5">
              <button
                onClick={back}
                disabled={step === 0}
                className="text-sm text-[#e8e3d6]/60 transition hover:text-[#f3eee0] disabled:opacity-30"
              >
                ← Back
              </button>
              {step < STEPS.length - 1 && (
                <button
                  onClick={next}
                  className="rounded-sm border border-[#c9a227]/60 px-6 py-2 text-sm font-medium text-[#c9a227] transition hover:bg-[#c9a227] hover:text-[#1A1A1A]"
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
