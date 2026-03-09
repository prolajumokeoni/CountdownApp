<template>
  <div class="page">

    <!-- Header: only visible when timers exist -->
    <header v-if="sortedTimers.length" class="header">
      <button class="inline-flex items-center gap-[0.35rem] py-2 px-4 bg-[var(--text)] text-white border-0 rounded-full text-[0.8rem] font-semibold cursor-pointer tracking-[0.01em] transition-all duration-150 hover:bg-[#2d2b4e] active:scale-[0.97]" @click="openNew">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Countdown
      </button>
    </header>

    <!-- Hero: always visible, zeros when no timers -->
    <section
      class="hero"
      :class="{ 'hero--full': !sortedTimers.length }"
      :style="{ background: heroDisplay.bg, '--flip-accent': heroDisplay.accent }"
    >
      <div class="hero-center">
        <p class="hero-eye">
          {{ !heroConfig ? 'No countdowns yet' : heroMsLeft <= 0 ? "Time\'s up" : 'Next up' }}
        </p>
        <h2 class="hero-title" :class="{ 'hero-title--empty': !heroConfig }">
          {{ heroConfig ? featuredTimer.name : 'Start your first countdown' }}
        </h2>
        <div class="flip-row">
          <template v-if="heroDisplay.time.days > 0">
            <FlipUnit :value="heroDisplay.time.days" label="days" />
            <span class="sep">:</span>
          </template>
          <FlipUnit :value="heroDisplay.time.hours" label="hrs" />
          <span class="sep">:</span>
          <FlipUnit :value="heroDisplay.time.mins" label="min" />
          <span class="sep">:</span>
          <FlipUnit :value="heroDisplay.time.secs" label="sec" />
        </div>

        <!-- CTA when empty -->
        <button
          v-if="!sortedTimers.length"
          class="inline-flex items-center gap-2 mt-8 py-3 px-7 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-full text-[0.9rem] font-semibold cursor-pointer tracking-[0.01em] transition-all duration-200 backdrop-blur-sm active:scale-[0.97]"
          @click="openNew"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create your first countdown
        </button>
      </div>
    </section>

    <!-- Timer grid -->
    <div v-if="sortedTimers.length" class="app">
      <main class="grid">
        <TimerCard
          v-for="timer in sortedTimers"
          :key="timer.id"
          :timer="timer"
          :featured="timer.id === featuredId"
          @edit="openEdit(timer)"
          @delete="confirmDelete(timer.id)"
        />
      </main>

    </div>

    <!-- Form modal -->
    <TimerForm
      v-if="showForm"
      :edit-timer="editTarget"
      @submit="handleSubmit"
      @close="closeForm"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useToast } from 'vue-toastification'
import { useTimers } from './composables/useTimers.js'
import TimerCard from './components/TimerCard.vue'
import TimerForm from './components/TimerForm.vue'
import FlipUnit from './components/FlipUnit.vue'

const toast = useToast()
const { timers, addTimer, updateTimer, deleteTimer } = useTimers()

// ── Form modal ────────────────────────────────────────────────────
const showForm   = ref(false)
const editTarget = ref(null)

function openNew()       { editTarget.value = null;  showForm.value = true }
function openEdit(timer) { editTarget.value = timer; showForm.value = true }
function closeForm()     { showForm.value = false; editTarget.value = null }

function handleSubmit(data) {
  if (editTarget.value) {
    updateTimer(editTarget.value.id, data)
    toast.success(`"${data.name}" updated`)
  } else {
    addTimer(data)
    toast.success(`"${data.name}" created`)
  }
  closeForm()
}

// ── Reactive clock (drives sorting, featured selection, and hero) ──
const now = ref(Date.now())
let heroTick = null
onMounted(() => { heroTick = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(heroTick))

// ── Sorted timers ─────────────────────────────────────────────────
const sortedTimers = computed(() => {
  const t = now.value
  return [...timers.value].sort((a, b) => {
    const aLeft = new Date(a.targetDate).getTime() - t
    const bLeft = new Date(b.targetDate).getTime() - t
    if (aLeft >= 0 && bLeft >= 0) return aLeft - bLeft
    if (aLeft < 0  && bLeft < 0)  return bLeft - aLeft
    return aLeft >= 0 ? -1 : 1
  })
})

// Most urgent upcoming event; falls back to most recently expired if none upcoming
const featuredId = computed(() => {
  const first = sortedTimers.value.find(
    (t) => new Date(t.targetDate).getTime() > now.value
  )
  return (first ?? sortedTimers.value[0])?.id ?? null
})

const featuredTimer = computed(() =>
  featuredId.value ? timers.value.find((t) => t.id === featuredId.value) ?? null : null
)

const heroMsLeft = computed(() =>
  featuredTimer.value ? new Date(featuredTimer.value.targetDate).getTime() - now.value : 0
)

const heroConfig = computed(() => {
  if (!featuredTimer.value) return null
  const ms = Math.max(0, heroMsLeft.value)
  const expired = heroMsLeft.value <= 0

  let urg = 'distant'
  if (expired || ms < 3_600_000) urg = 'happening'
  else if (ms < 86_400_000)      urg = 'imminent'
  else {
    const d = ms / 86_400_000
    if (d < 7)       urg = 'near'
    else if (d < 30) urg = 'soon'
  }

  const PALETTE = {
    distant:   { bg: 'linear-gradient(160deg, #0f172a, #1e1b4b)', accent: '#818cf8' },
    soon:      { bg: 'linear-gradient(160deg, #1e1b4b, #4c1d95)', accent: '#c084fc' },
    near:      { bg: 'linear-gradient(160deg, #0c4a6e, #1e3a5f)', accent: '#38bdf8' },
    imminent:  { bg: 'linear-gradient(160deg, #450a0a, #7f1d1d)', accent: '#fca5a5' },
    happening: { bg: 'linear-gradient(160deg, #1c0019, #450a0a)', accent: '#f0abfc' },
  }

  const secs  = Math.floor(ms / 1000)    % 60
  const mins  = Math.floor(ms / 60000)   % 60
  const hours = Math.floor(ms / 3600000) % 24
  const days  = Math.floor(ms / 86400000)

  const colors = featuredTimer.value.heroBg
    ? { bg: featuredTimer.value.heroBg, accent: featuredTimer.value.heroAccent }
    : PALETTE[urg]

  return { ...colors, time: { days, hours, mins, secs } }
})

const EMPTY_HERO = {
  bg: 'linear-gradient(160deg, #0f172a, #1e1b4b)',
  accent: '#818cf8',
  time: { days: 0, hours: 0, mins: 0, secs: 0 },
}
const heroDisplay = computed(() => heroConfig.value ?? EMPTY_HERO)

// ── Delete with undo toast ────────────────────────────────────────
function confirmDelete(id) {
  const timer = timers.value.find((t) => t.id === id)
  if (!timer) return

  const snapshot = JSON.parse(JSON.stringify(timer))
  deleteTimer(id)

  let undone = false
  let toastId = null

  function undo() {
    if (undone) return
    undone = true
    timers.value.push(snapshot)
    toast.dismiss(toastId)
    toast.info(`"${snapshot.name}" restored`)
  }

  toastId = toast(
    {
      component: {
        render() {
          return h('div', { class: 'undo-toast' }, [
            h('span', { class: 'undo-msg' }, `"${snapshot.name}" deleted`),
            h('button', { class: 'undo-btn', onClick: undo }, 'Undo'),
          ])
        },
      },
    },
    { timeout: 5000, icon: false }
  )
}
</script>

<style scoped>
/* ── Page: lock to viewport, no scroll ── */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.header {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
}

/* ── Hero: upper portion of viewport ── */
.hero {
  flex: 0 0 48vh;
  transition: flex 0.4s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  --tile-w: 85px;
  --tile-h: 100px;
  --tile-font: 3.8rem;
  --tile-r: 14px;
}

.hero-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.hero-eye {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 0.35rem;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 1.75rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.hero-title--empty {
  opacity: 0.4;
  font-weight: 600;
}

.flip-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.sep {
  font-size: 2rem;
  font-weight: 800;
  color: rgba(255,255,255,0.25);
  line-height: 1;
  padding-bottom: 1.2rem;
  user-select: none;
}

.hero--full { flex: 1; }

/* ── Grid area: fill remaining space ── */
.app {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem 2rem 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 280px));
  justify-content: center;
  gap: 1rem;
}

/* ── Empty state ── */
.empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
}

.empty-icon { font-size: 2.5rem; opacity: 0.4; margin-bottom: 0.5rem; }
.empty-title { font-size: 1.1rem; font-weight: 700; color: var(--text); letter-spacing: 0.02em; }
.empty-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem; max-width: 300px; }
</style>
