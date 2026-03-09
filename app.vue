<template>
  <div class="app">

    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <span class="logo-mark" aria-hidden="true">◉</span>
        <h1 class="site-title">Countdown</h1>
      </div>
      <button class="btn-primary" @click="openNew">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Timer
      </button>
    </header>

    <!-- Hero flip clock: featured timer displayed as flip tiles -->
    <section
      v-if="heroConfig"
      class="hero"
      :style="{ background: heroConfig.bg, '--flip-accent': heroConfig.accent }"
    >
      <p class="hero-eye">Next up</p>
      <h2 class="hero-title">{{ featuredTimer.name }}</h2>
      <div class="flip-row">
        <template v-if="heroConfig.time.days > 0">
          <FlipUnit :value="heroConfig.time.days" label="days" />
          <span class="sep">:</span>
        </template>
        <FlipUnit :value="heroConfig.time.hours" label="hrs" />
        <span class="sep">:</span>
        <FlipUnit :value="heroConfig.time.mins" label="min" />
        <span class="sep">:</span>
        <FlipUnit :value="heroConfig.time.secs" label="sec" />
      </div>
    </section>

    <!-- Timer grid -->
    <main v-if="sortedTimers.length" class="grid">
      <TimerCard
        v-for="timer in sortedTimers"
        :key="timer.id"
        :timer="timer"
        :featured="timer.id === featuredId"
        @edit="openEdit(timer)"
        @delete="confirmDelete(timer.id)"
      />
    </main>

    <!-- Empty state -->
    <div v-else class="empty">
      <div class="empty-icon" aria-hidden="true">⏳</div>
      <h2 class="empty-title">No timers yet</h2>
      <p class="empty-sub">Create your first countdown for an event that matters.</p>
      <button class="btn-primary" @click="openNew">Create a Timer</button>
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

// ── Sorted timers ─────────────────────────────────────────────────
const sortedTimers = computed(() => {
  const now = Date.now()
  return [...timers.value].sort((a, b) => {
    const aLeft = new Date(a.targetDate).getTime() - now
    const bLeft = new Date(b.targetDate).getTime() - now
    if (aLeft >= 0 && bLeft >= 0) return aLeft - bLeft
    if (aLeft < 0  && bLeft < 0)  return bLeft - aLeft
    return aLeft >= 0 ? -1 : 1
  })
})

// Most urgent *upcoming* event gets the featured slot
const featuredId = computed(() => {
  const now = Date.now()
  const first = sortedTimers.value.find(
    (t) => new Date(t.targetDate).getTime() > now
  )
  return sortedTimers.value.length >= 2 ? (first?.id ?? null) : null
})

// ── Hero flip clock ───────────────────────────────────────────────
const now = ref(Date.now())
let heroTick = null
onMounted(() => { heroTick = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(heroTick))

const featuredTimer = computed(() =>
  featuredId.value ? timers.value.find((t) => t.id === featuredId.value) ?? null : null
)

const heroMsLeft = computed(() =>
  featuredTimer.value ? new Date(featuredTimer.value.targetDate).getTime() - now.value : 0
)

const heroConfig = computed(() => {
  if (!featuredTimer.value || heroMsLeft.value <= 0) return null
  const ms = heroMsLeft.value

  let urg = 'distant'
  if (ms < 3_600_000)       urg = 'happening'
  else if (ms < 86_400_000) urg = 'imminent'
  else {
    const d = ms / 86_400_000
    if (d < 7)       urg = 'near'
    else if (d < 30) urg = 'soon'
  }

  const PALETTE = {
    distant:   { bg: '#3730a3', accent: '#a5b4fc' },
    soon:      { bg: '#5b21b6', accent: '#d8b4fe' },
    near:      { bg: '#92400e', accent: '#fde68a' },
    imminent:  { bg: '#991b1b', accent: '#fca5a5' },
    happening: { bg: '#7f1d1d', accent: '#fca5a5' },
  }

  const secs  = Math.floor(ms / 1000)    % 60
  const mins  = Math.floor(ms / 60000)   % 60
  const hours = Math.floor(ms / 3600000) % 24
  const days  = Math.floor(ms / 86400000)

  return { ...PALETTE[urg], time: { days, hours, mins, secs } }
})

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
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem 0 2rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-mark {
  font-size: 1.1rem;
  color: #6366f1;
  line-height: 1;
}

.site-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
}

/* ── Hero flip clock ── */
.hero {
  border-radius: var(--radius);
  padding: 3rem 1.5rem 3.5rem;
  text-align: center;
  margin-bottom: 2.5rem;
  --tile-w: 110px;
  --tile-h: 130px;
  --tile-font: 5rem;
  --tile-r: 18px;
}

.hero-eye {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 0.4rem;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 2.5rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.flip-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.sep {
  font-size: 2.5rem;
  font-weight: 800;
  color: rgba(255,255,255,0.25);
  line-height: 1;
  padding-bottom: 1.4rem;
  user-select: none;
}

@media (max-width: 600px) {
  .hero {
    --tile-w: 75px;
    --tile-h: 90px;
    --tile-font: 3.2rem;
    --tile-r: 12px;
    padding: 2rem 1rem 2.5rem;
  }
  .hero-title { font-size: 1.2rem; margin-bottom: 1.75rem; }
  .sep { font-size: 1.6rem; padding-bottom: 1rem; }
}

/* ── Grid ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.1rem;
}


/* ── Empty state ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  padding: 6rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.4;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.empty-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  max-width: 300px;
}
</style>
