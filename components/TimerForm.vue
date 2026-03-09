<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="isEditing ? 'Edit timer' : 'New timer'">

        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? 'Edit Timer' : 'New Timer' }}</h2>
          <button class="btn-icon" @click="$emit('close')" aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmit" novalidate>

          <!-- Category picker -->
          <div class="field">
            <label>Category</label>
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

          <div class="field">
            <label for="f-name">Event Name</label>
            <input
              id="f-name"
              v-model="form.name"
              type="text"
              placeholder="e.g. Mom's 60th, Product Launch…"
              autocomplete="off"
              autofocus
              :class="{ 'input--error': errors.name }"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="field">
            <label>Date &amp; Time</label>
            <input
              type="datetime-local"
              v-model="dateInputValue"
              :class="{ 'input--error': errors.targetDate }"
            />
            <span v-if="errors.targetDate" class="field-error">{{ errors.targetDate }}</span>
          </div>

          <div class="field">
            <label for="f-desc">Description <span class="optional">(optional)</span></label>
            <textarea
              id="f-desc"
              v-model="form.description"
              placeholder="Add a short note…"
              rows="2"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-ghost" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn-primary">
              {{ isEditing ? 'Save Changes' : 'Create Timer' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CATEGORIES } from '../composables/useTimers.js'

const props = defineProps({
  editTimer: { type: Object, default: null },
})

const emit = defineEmits(['submit', 'close'])

const isEditing = computed(() => !!props.editTimer)

const dateInputValue = computed({
  get() {
    if (!form.value.targetDate) return ''
    const d = new Date(form.value.targetDate)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  },
  set(val) { form.value.targetDate = val ? new Date(val) : null },
})

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
