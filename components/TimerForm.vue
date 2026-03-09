<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="isEditing ? 'Edit Countdown' : 'New Countdown'">

        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? 'Edit  Countdown' : 'New  Countdown' }}</h2>
          <button class="inline-flex items-center justify-center w-[30px] h-[30px] bg-transparent border-0 rounded-lg text-[var(--text-muted)] cursor-pointer transition-all duration-150 hover:bg-black/[0.07] hover:text-[var(--text)]" @click="$emit('close')" aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmit" novalidate>

          <!-- Category picker -->
          <div class="flex flex-col gap-[0.45rem]">
            <label class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em]">Category</label>
            <div class="category-grid">
              <button
                v-for="(cat, key) in CATEGORIES"
                :key="key"
                type="button"
                class="cat-btn"
                :class="{ 'cat-btn--active': form.category === key }"
                @click="form.category = key"
              >
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-label">{{ cat.label }}</span>
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-[0.45rem]">
            <label for="f-name" class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em]">Event Name</label>
            <input
              id="f-name"
              v-model="form.name"
              type="text"
              placeholder="e.g. Mom's 60th, Product Launch…"
              autocomplete="off"
              autofocus
              class="bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] px-[0.9rem] py-[0.7rem] text-[var(--text)] text-[0.95rem] outline-none transition-[border-color,box-shadow] duration-150 w-full focus:border-indigo-500 focus:[box-shadow:0_0_0_3px_rgba(99,102,241,0.12)] font-[inherit]"
              :class="{ 'input--error': errors.name }"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="flex flex-col gap-[0.45rem]">
            <label class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em]">Date &amp; Time</label>
            <DatePicker
              v-model:value="form.targetDate"
              type="datetime"
              format="MMM D, YYYY  HH:mm"
              value-type="date"
              placeholder="Pick a date & time"
              :editable="false"
              :clearable="true"
              :class="{ 'picker--error': errors.targetDate }"
            />
            <span v-if="errors.targetDate" class="field-error">{{ errors.targetDate }}</span>
          </div>

          <div class="flex flex-col gap-[0.45rem]">
            <label for="f-desc" class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em]">Description <span class="optional">(optional)</span></label>
            <textarea
              id="f-desc"
              v-model="form.description"
              placeholder="Add a short note…"
              rows="2"
              class="bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] px-[0.9rem] py-[0.7rem] text-[var(--text)] text-[0.95rem] outline-none transition-[border-color,box-shadow] duration-150 w-full focus:border-indigo-500 focus:[box-shadow:0_0_0_3px_rgba(99,102,241,0.12)] font-[inherit] resize-none"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="inline-flex items-center py-[0.6rem] px-5 bg-transparent text-[var(--text-muted)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-black/[0.04] hover:text-[var(--text)]" @click="$emit('close')">Cancel</button>
            <button type="submit" class="inline-flex items-center gap-[0.35rem] py-[0.6rem] px-5 bg-[var(--text)] text-white border-0 rounded-[var(--radius-sm)] text-sm font-semibold cursor-pointer transition-all duration-150 hover:bg-[#2d2b4e] active:scale-[0.97]">
              {{ isEditing ? 'Save Changes' : 'Create Countdown' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DatePicker from 'vue-datepicker-next'
import { CATEGORIES } from '../composables/useTimers.js'

const props = defineProps({
  editTimer: { type: Object, default: null },
})

const emit = defineEmits(['submit', 'close'])

const isEditing = computed(() => !!props.editTimer)

const form   = ref({ name: '', category: 'other', targetDate: null, description: '' })
const errors = ref({})

function reset() {
  if (props.editTimer) {
    form.value = {
      name: props.editTimer.name,
      category: props.editTimer.category || 'other',
      targetDate: new Date(props.editTimer.targetDate),
      description: props.editTimer.description || '',
    }
  } else {
    form.value = { name: '', category: 'other', targetDate: null, description: '' }
  }
  errors.value = {}
}

watch(() => props.editTimer, reset, { immediate: true })

function onKeydown(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = 'Event name is required'
  if (!form.value.targetDate)  e.targetDate = 'Date & time is required'
  errors.value = e
  return Object.keys(e).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: form.value.name.trim(),
    category: form.value.category,
    targetDate: form.value.targetDate.toISOString(),
    description: form.value.description.trim(),
  })
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(1, 5, 18, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
  animation: fade-in 0.15s ease;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: 1.75rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slide-up 0.22s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.modal-form { display: flex; flex-direction: column; gap: 1.1rem; }

/* ── Category grid ── */
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.4rem;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  font-family: inherit;
  position: relative;
}

.cat-btn:hover {
  border-color: var(--accent, #6366f1);
  background: rgba(99, 102, 241, 0.05);
}

.cat-btn--active {
  border-color: var(--accent, #6366f1);
  background: rgba(99, 102, 241, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.cat-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.cat-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.cat-btn--active .cat-label {
  color: var(--accent, #6366f1);
}

/* ── Errors ── */
.input--error { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }

.picker--error :deep(.mx-input) {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: -0.1rem;
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.7rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.25rem;
}
</style>
