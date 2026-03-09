<template>
  <article
    class="card"
    :class="[`urgency-${urgency}`, { 'card--featured': featured, 'card--past': isPast && !showConfetti }]"
    :style="{ '--accent': cfg.color, '--bg-tint': cfg.tint }"
  >
    <!-- Top row: urgency badge + signal bars + actions -->
    <div class="card-top">
      <div class="badge-group">
        <span class="urgency-badge">{{ cfg.label }}</span>

        <!-- Signal strength bars -->
        <svg
          class="signal-bars"
          width="16" height="11"
          viewBox="0 0 16 11"
          aria-label="urgency level"
          :class="{ 'signal--pulse': urgency === 'imminent' || urgency === 'happening' }"
        >
          <rect x="0"  y="8"   width="3" height="3"   rx="0.75" :opacity="urgencyLevel >= 1 ? 1 : 0.15"/>
          <rect x="4"  y="5.5" width="3" height="5.5" rx="0.75" :opacity="urgencyLevel >= 2 ? 1 : 0.15"/>
          <rect x="8"  y="3"   width="3" height="8"   rx="0.75" :opacity="urgencyLevel >= 3 ? 1 : 0.15"/>
          <rect x="12" y="0"   width="3" height="11"  rx="0.75" :opacity="urgencyLevel >= 4 ? 1 : 0.15"/>
        </svg>
      </div>

      <div class="card-actions">
        <button class="inline-flex items-center justify-center w-[30px] h-[30px] bg-transparent border-0 rounded-lg text-[var(--text-muted)] cursor-pointer transition-all duration-150 hover:bg-black/[0.07] hover:text-[var(--text)]" title="Edit" @click="$emit('edit')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="inline-flex items-center justify-center w-[30px] h-[30px] bg-transparent border-0 rounded-lg text-[var(--text-muted)] cursor-pointer transition-all duration-150 hover:bg-red-500/10 hover:text-red-600" title="Delete" @click="$emit('delete')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Ring + countdown numbers -->
    <div class="card-center">
      <div class="ring-wrapper">
        <!-- Category watermark behind ring -->
        <span class="cat-watermark" aria-hidden="true">{{ category.icon }}</span>

        <svg
          viewBox="0 0 120 120"
          class="ring-svg"
          :class="{ 'ring--pulse': urgency === 'imminent' || urgency === 'happening' }"
          aria-hidden="true"
          style="overflow: visible; pointer-events: none;"
        >
          <!-- Track -->
          <circle cx="60" cy="60" r="50" fill="none" class="ring-track" />
          <!-- Glow layer -->
          <circle
            cx="60" cy="60" r="50" fill="none"
            class="ring-glow"
            stroke-linecap="round"
            :stroke="cfg.color"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="displayedOffset"
            transform="rotate(-90 60 60)"
          />
          <!-- Sharp fill -->
          <circle
            cx="60" cy="60" r="50" fill="none"
            class="ring-fill"
            stroke-linecap="round"
            :stroke="cfg.color"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="displayedOffset"
            transform="rotate(-90 60 60)"
          />
          <!-- Progress tip dot -->
          <circle
            v-if="!isPast && progress > 0.01"
            cx="60" cy="10" r="5"
            :fill="cfg.color"
            stroke="white"
            stroke-width="2"
            class="ring-tip"
            :class="{ 'ring-tip--pulse': urgency === 'imminent' || urgency === 'happening' }"
            :style="{ transform: `rotate(${tipRotation}deg)`, transformOrigin: '60px 60px' }"
          />
        </svg>

        <div class="ring-inner">
          <template v-if="!isPast">
            <span class="time-primary" :aria-label="`${primaryDisplay.value} ${primaryDisplay.unit} remaining`">
              {{ primaryDisplay.value }}
            </span>
            <span class="time-label">{{ primaryDisplay.unit }}</span>
            <span v-if="secondaryHMS" class="time-hms">{{ secondaryHMS }}</span>
          </template>
          <template v-else>
            <span class="time-ended">END</span>
            <span class="time-ago">{{ pastLabel }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Event info -->
    <div class="card-bottom">
      <h2 class="event-name">{{ timer.name }}</h2>
      <div class="event-meta">
        <span class="cat-chip">
          <span>{{ category.icon }}</span>
          <span>{{ category.label }}</span>
        </span>
        <time class="event-date">{{ formattedDate }}</time>
      </div>
      <span v-if="relativeLabel" class="event-relative">{{ relativeLabel }}</span>
      <p v-if="timer.description" class="event-desc">{{ timer.description }}</p>
    </div>

    <!-- Bottom urgency proximity bar -->
    <div class="urgency-bar" aria-hidden="true">
      <div class="urgency-bar__fill" />
    </div>

    <!-- Confetti burst when this timer hits zero -->
    <div v-if="showConfetti" class="confetti-overlay" aria-hidden="true">
      <div
        v-for="n in 50"
        :key="n"
        class="confetti-piece"
        :style="confettiStyle(n)"
      />
    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CATEGORIES } from '../composables/useTimers.js'

const props = defineProps({
  timer: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

// ── Live tick ────────────────────────────────────────────────────
const now = ref(Date.now())
let interval = null

const animated = ref(false)
onMounted(() => {
  interval = setInterval(() => { now.value = Date.now() }, 1000)
  requestAnimationFrame(() => { animated.value = true })
})
onUnmounted(() => {
  clearInterval(interval)
  if (confettiTimer) clearTimeout(confettiTimer)
})

// ── Core computed ────────────────────────────────────────────────
const target  = computed(() => new Date(props.timer.targetDate).getTime())
const created = computed(() => new Date(props.timer.createdAt).getTime())
const msLeft  = computed(() => target.value - now.value)
const isPast  = computed(() => msLeft.value < 0)

const breakdown = computed(() => {
  const ms       = Math.abs(msLeft.value)
  const totalSec = Math.floor(ms / 1000)
  const s        = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const m        = totalMin % 60
  const totalH   = Math.floor(totalMin / 60)
  const h        = totalH % 24
  const d        = Math.floor(totalH / 24)
  return { d, h, m, s }
})

// ── Urgency ──────────────────────────────────────────────────────
const URGENCY = {
  distant:   { color: '#6366f1', tint: 'rgba(99,102,241,0.04)',  label: 'Coming Soon'  },
  soon:      { color: '#a855f7', tint: 'rgba(168,85,247,0.08)',  label: 'Getting closer'  },
  near:      { color: '#f59e0b', tint: 'rgba(245,158,11,0.13)',  label: 'Almost time!'    },
  imminent:  { color: '#ef4444', tint: 'rgba(239,68,68,0.18)',   label: 'Happening today' },
  happening: { color: '#dc2626', tint: 'rgba(220,38,38,0.24)',   label: 'Any minute now'  },
  past:      { color: '#94a3b8', tint: 'rgba(148,163,184,0.04)', label: 'All done ✓'     },
}

const urgency = computed(() => {
  if (isPast.value) return 'past'
  const ms = msLeft.value
  if (ms < 3_600_000)  return 'happening'
  if (ms < 86_400_000) return 'imminent'
  const days = ms / 86_400_000
  if (days < 7)  return 'near'
  if (days < 30) return 'soon'
  return 'distant'
})

const cfg = computed(() => URGENCY[urgency.value])

const urgencyLevel = computed(() => {
  if (isPast.value) return 0
  const map = { distant: 1, soon: 2, near: 3, imminent: 4, happening: 4 }
  return map[urgency.value] ?? 1
})

// ── Confetti ─────────────────────────────────────────────────────
const showConfetti = ref(false)
let confettiTimer = null

watch(isPast, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    showConfetti.value = true
    confettiTimer = setTimeout(() => { showConfetti.value = false }, 4000)
  }
})

function confettiStyle(n) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1', '#a855f7', '#ec4899', '#06b6d4']
  const angle  = n * 137.508
  return {
    left:              `${((angle * 1.234) % 100)}%`,
    top:               '-12px',
    background:        colors[n % colors.length],
    animationDelay:    `${(n * 0.07) % 1.2}s`,
    animationDuration: `${1.8 + (n % 5) * 0.3}s`,
    width:             `${6 + (n % 4) * 2}px`,
    height:            `${8 + (n % 3) * 4}px`,
    borderRadius:      n % 3 === 0 ? '50%' : '2px',
  }
}

// ── Category ─────────────────────────────────────────────────────
const category = computed(() => CATEGORIES[props.timer.category] ?? CATEGORIES.other)

// ── SVG progress ring ────────────────────────────────────────────
const RING_R        = 50
const CIRCUMFERENCE = 2 * Math.PI * RING_R

const progress = computed(() => {
  const total = target.value - created.value
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, (now.value - created.value) / total))
})

const strokeDashoffset = computed(() => CIRCUMFERENCE * (1 - progress.value))

const displayedOffset = computed(() => animated.value ? strokeDashoffset.value : CIRCUMFERENCE)

const tipRotation = computed(() => progress.value * 360)

// ── Formatting ───────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')

const formattedDate = computed(() =>
  new Date(props.timer.targetDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
)

const primaryDisplay = computed(() => {
  if (isPast.value) return null
  const { d, h, m, s } = breakdown.value
  if (d > 0) return { value: d, unit: d === 1 ? 'day'  : 'days'  }
  if (h > 0) return { value: h, unit: h === 1 ? 'hour' : 'hours' }
  if (m > 0) return { value: m, unit: m === 1 ? 'min'  : 'mins'  }
  return             { value: s, unit: 'sec' }
})

const secondaryHMS = computed(() => {
  if (!primaryDisplay.value || urgency.value === 'distant') return null
  const { d, h, m, s } = breakdown.value
  if (d > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  if (h > 0) return `${pad(m)}:${pad(s)}`
  if (m > 0) return `:${pad(s)}`
  return null
})

const pastLabel = computed(() => {
  const { d, h, m } = breakdown.value
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return `${m}m ago`
})

const relativeLabel = computed(() => {
  if (isPast.value) return null
  const days = msLeft.value / 86_400_000
  if (days >= 365) { const y  = Math.floor(days / 365); return `in about ${y} ${y === 1 ? 'year' : 'years'}` }
  if (days >= 60)  { const mo = Math.floor(days / 30);  return `in about ${mo} months` }
  if (days >= 14)  { const w  = Math.floor(days / 7);   return `in ${w} ${w === 1 ? 'week' : 'weeks'}` }
  if (days >= 2)   { return `in ${Math.floor(days)} days` }
  if (days >= 1)   { return 'tomorrow' }
  const { h, m } = breakdown.value
  if (h > 0)       return `in ${h}h ${m}m`
  return `in ${m} ${m === 1 ? 'minute' : 'minutes'}`
})
</script>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease, opacity 0.2s ease;
  animation: fade-in 0.35s ease;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% -10%, var(--bg-tint), transparent 65%);
  pointer-events: none;
  border-radius: inherit;
}

.card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
  transition: width 0.3s ease, opacity 0.3s ease;
}

/* ── URGENCY VISUAL DIFFERENTIATION ── */

.urgency-distant { opacity: 0.75; }
.urgency-distant:hover { opacity: 1; }
.urgency-distant::before { background: radial-gradient(ellipse at 50% -40%, var(--bg-tint), transparent 45%) !important; }
.urgency-distant::after { top: 38%; bottom: 38%; width: 2px; opacity: 0.35; }
.urgency-distant .ring-wrapper { width: 112px; height: 112px; }
.urgency-distant .ring-fill  { stroke-width: 2.5; }
.urgency-distant .ring-glow  { stroke-width: 7; opacity: 0.1; }
.urgency-distant .ring-track { stroke-width: 3; }
.urgency-distant .time-primary { font-size: 1.9rem; color: var(--text-muted); }
.urgency-distant .time-label   { opacity: 0.6; }
.urgency-distant .event-name   { font-size: 0.88rem; color: var(--text-muted); }

.urgency-soon::before { background: radial-gradient(ellipse at 50% -15%, var(--bg-tint), transparent 55%) !important; }
.urgency-soon::after { top: 28%; bottom: 28%; width: 3px; opacity: 0.6; }
.urgency-soon .ring-wrapper { width: 138px; height: 138px; }
.urgency-soon .ring-fill  { stroke-width: 4; }
.urgency-soon .ring-glow  { stroke-width: 10; opacity: 0.2; }
.urgency-soon .ring-track { stroke-width: 3.5; }
.urgency-soon .time-primary { font-size: 2.3rem; }

.urgency-near {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow: 0 2px 16px rgba(245, 158, 11, 0.07);
}
.urgency-near:hover { box-shadow: 0 6px 24px rgba(245, 158, 11, 0.14); }
.urgency-near::before { background: radial-gradient(ellipse at 50% 5%, var(--bg-tint), transparent 62%) !important; }
.urgency-near::after { top: 20%; bottom: 20%; width: 3px; opacity: 0.9; }
.urgency-near .ring-wrapper { width: 158px; height: 158px; }
.urgency-near .ring-fill  { stroke-width: 5.5; }
.urgency-near .ring-glow  { stroke-width: 13; opacity: 0.35; }
.urgency-near .ring-track { stroke-width: 4; }
.urgency-near .time-primary { font-size: 2.6rem; }
.urgency-near .card-actions { opacity: 0.7; }

.urgency-imminent {
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.08), 0 4px 28px rgba(239, 68, 68, 0.14);
  animation: fade-in 0.35s ease, pulse-glow 2.5s ease-in-out infinite;
}
.urgency-imminent::before { background: radial-gradient(ellipse at 50% 40%, var(--bg-tint), transparent 72%) !important; }
.urgency-imminent::after { top: 12%; bottom: 12%; width: 4px; opacity: 1; box-shadow: 0 0 10px var(--accent); }
.urgency-imminent .ring-wrapper { width: 172px; height: 172px; }
.urgency-imminent .ring-fill  { stroke-width: 7; }
.urgency-imminent .ring-glow  { stroke-width: 16; opacity: 0.5; }
.urgency-imminent .ring-track { stroke-width: 5; }
.urgency-imminent .time-primary { font-size: 3.1rem; }
.urgency-imminent .card-actions { opacity: 0.9; }

.urgency-happening {
  border-color: rgba(220, 38, 38, 0.4);
  box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.12), 0 4px 32px rgba(220, 38, 38, 0.2);
  animation: fade-in 0.35s ease, pulse-glow 1.8s ease-in-out infinite;
}
.urgency-happening::before { background: radial-gradient(ellipse at 50% 40%, var(--bg-tint), transparent 72%) !important; }
.urgency-happening::after { top: 8%; bottom: 8%; width: 5px; opacity: 1; box-shadow: 0 0 14px var(--accent); }
.urgency-happening .ring-wrapper { width: 175px; height: 175px; }
.urgency-happening .ring-fill  { stroke-width: 7.5; }
.urgency-happening .ring-glow  { stroke-width: 18; opacity: 0.6; }
.urgency-happening .ring-track { stroke-width: 5; }
.urgency-happening .time-primary { font-size: 3.2rem; animation: tick 1s ease infinite; }
.urgency-happening .card-actions { opacity: 0.9; }

.card--past { opacity: 0.4; filter: saturate(0.3) brightness(0.95); }
.card--past::after { top: 38%; bottom: 38%; width: 2px; opacity: 0.2; }
.card--past:hover  { opacity: 0.65; }


.card:not(.urgency-imminent):not(.urgency-happening):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
}

/* ── Top row ── */
.card-top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.urgency-badge {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.signal-bars {
  fill: var(--accent);
  flex-shrink: 0;
}
.signal--pulse { animation: ring-pulse 1.5s ease-in-out infinite; }

.card-actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.18s;
}
.card:hover .card-actions { opacity: 1; }

/* ── Ring ── */
.card-center { display: flex; justify-content: center; position: relative; }

.ring-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
}

.ring-svg { width: 100%; height: 100%; }

.ring-track { stroke: rgba(0, 0, 0, 0.08); stroke-width: 4; }

.ring-glow {
  opacity: 0.2;
  filter: blur(5px);
  transition: stroke-dashoffset 1.2s ease, stroke 1.5s ease, opacity 0.3s ease;
}

.ring-fill { transition: stroke-dashoffset 1.2s ease, stroke 1.5s ease, stroke-width 0.3s ease; }

.ring--pulse { animation: ring-pulse 1.8s ease-in-out infinite; }

.ring-tip {
  transition: transform 1s ease;
  filter: drop-shadow(0 0 3px currentColor);
}

@keyframes tip-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
.ring-tip--pulse { animation: tip-pulse 1.2s ease-in-out infinite; }

.cat-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  opacity: 0.06;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  pointer-events: none;
  z-index: 1;
}

.time-primary {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  color: var(--accent);
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.time-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-top: 1px;
}

.time-hms {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.time-ended {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.time-ago {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* ── Card bottom ── */
.card-bottom { text-align: center; width: 100%; }

.event-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
  margin-bottom: 0.4rem;
}

.event-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.2rem;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.4;
}

.event-date {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.event-relative {
  display: block;
  font-size: 0.72rem;
  color: var(--accent);
  margin-top: 0.15rem;
  opacity: 0.85;
  font-weight: 600;
}

.event-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
  font-style: italic;
  opacity: 0.8;
}

/* ── Bottom urgency proximity bar ── */
.urgency-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}
.urgency-bar__fill {
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width 0.5s ease;
}
.urgency-distant  .urgency-bar__fill { width: 15%; opacity: 0.45; }
.urgency-soon     .urgency-bar__fill { width: 42%; opacity: 0.65; }
.urgency-near     .urgency-bar__fill { width: 75%; opacity: 0.85; }
.urgency-imminent  .urgency-bar__fill { width: 100%; opacity: 1; animation: bar-pulse 2.5s ease-in-out infinite; }
.urgency-happening .urgency-bar__fill { width: 100%; opacity: 1; animation: bar-pulse 1.5s ease-in-out infinite; }
.card--past .urgency-bar__fill        { width: 100%; opacity: 0.18; background: var(--text-muted); }

@keyframes bar-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* ── Confetti ── */
.confetti-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.confetti-piece {
  position: absolute;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
</style>
