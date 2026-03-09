<template>
  <div class="w-full ">

    <!-- Header -->
    <header class="flex items-center justify-end pt-7 pb-8 mb-8">

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
      class="rounded-[var(--radius)] px-6 pt-12 pb-14 text-center mb-10
             [--tile-w:110px] [--tile-h:130px] [--tile-font:5rem] [--tile-r:18px]
             max-[600px]:[--tile-w:75px] max-[600px]:[--tile-h:90px] max-[600px]:[--tile-font:3.2rem] max-[600px]:[--tile-r:12px]
             max-[600px]:px-4 max-[600px]:pt-8 max-[600px]:pb-10"
      :style="{ background: heroConfig.bg, '--flip-accent': heroConfig.accent }"
    >
      <p class="text-[0.62rem] font-bold tracking-[0.2em] uppercase text-white/50 mb-1.5">Next up</p>
      <h2 class="text-[1.75rem] font-extrabold text-white tracking-[-0.03em] mb-10 [text-shadow:0_2px_10px_rgba(0,0,0,0.2)] max-[600px]:text-[1.2rem] max-[600px]:mb-7">{{ featuredTimer.name }}</h2>
      <div class="flex items-center justify-center gap-[0.7rem] flex-wrap">
        <template v-if="heroConfig.time.days > 0">
          <FlipUnit :value="heroConfig.time.days" label="days" />
          <span class="text-[2.5rem] font-extrabold text-white/25 leading-none pb-[1.4rem] select-none max-[600px]:text-[1.6rem] max-[600px]:pb-4">:</span>
        </template>
        <FlipUnit :value="heroConfig.time.hours" label="hrs" />
        <span class="text-[2.5rem] font-extrabold text-white/25 leading-none pb-[1.4rem] select-none max-[600px]:text-[1.6rem] max-[600px]:pb-4">:</span>
        <FlipUnit :value="heroConfig.time.mins" label="min" />
        <span class="text-[2.5rem] font-extrabold text-white/25 leading-none pb-[1.4rem] select-none max-[600px]:text-[1.6rem] max-[600px]:pb-4">:</span>
        <FlipUnit :value="heroConfig.time.secs" label="sec" />
      </div>
    </section>

    <!-- Timer grid -->
    <main v-if="sortedTimers.length" class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[1.1rem]">
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
    <div v-else class="flex flex-col items-center justify-center text-center gap-3 py-24 px-4">
      <div class="text-5xl opacity-40 mb-2" aria-hidden="true">⏳</div>
      <h2 class="text-[1.1rem] font-bold text-[var(--text)] tracking-[0.02em]">No timers yet</h2>
      <p class="text-[0.9rem] text-[var(--text-muted)] mb-2 max-w-[300px]">Create your first countdown for an event that matters.</p>
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
