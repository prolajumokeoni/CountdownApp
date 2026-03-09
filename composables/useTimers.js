import { ref, watch } from 'vue'

const STORAGE_KEY = 'countdown_v2'

export const CATEGORIES = {
  birthday:    { label: 'Birthday',    icon: '🎂' },
  anniversary: { label: 'Anniversary', icon: '💍' },
  deadline:    { label: 'Deadline',    icon: '⚡' },
  launch:      { label: 'Launch',      icon: '🚀' },
  meeting:     { label: 'Meeting',     icon: '🗓️' },
  travel:      { label: 'Travel',      icon: '✈️' },
  holiday:     { label: 'Holiday',     icon: '🏖️' },
  other:       { label: 'Other',       icon: '◈'  },
}

function makeDefaultTimers() {
  const now = new Date()
  const y   = now.getFullYear()

  const sub = (days) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days)
    return d.toISOString()
  }

  // Next Wednesday at 10:00 (if today is Wed, skip to the following one)
  const wed = new Date(now)
  const daysToWed = (3 - now.getDay() + 7) % 7 || 7
  wed.setDate(now.getDate() + daysToWed)
  wed.setHours(10, 0, 0, 0)

  // Same calendar date next month at noon
  const birthday = new Date(y, now.getMonth() + 1, now.getDate(), 12, 0, 0)

  return [
    {
      id: 'demo-1',
      name: "International Women's Day 🌸",
      category: 'holiday',
      targetDate: new Date(y, 2, 8, 23, 59, 0).toISOString(),
      description: 'Celebrating the achievements and resilience of women everywhere',
      createdAt: sub(30),
    },
    {
      id: 'demo-2',
      name: 'Product Launch 🚀',
      category: 'launch',
      targetDate: wed.toISOString(),
      description: 'v2.0 goes live — all hands on deck',
      createdAt: sub(14),
    },
    {
      id: 'demo-3',
      name: "Alex's Birthday 🎂",
      category: 'birthday',
      targetDate: birthday.toISOString(),
      description: 'Remember to order the cake!',
      createdAt: sub(7),
    },
    {
      id: 'demo-4',
      name: 'Summer Solstice 🌞',
      category: 'holiday',
      targetDate: new Date(y, 5, 21, 12, 0, 0).toISOString(),
      description: 'Longest day of the year — soak it up',
      createdAt: sub(60),
    },
  ]
}

export function useTimers() {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : makeDefaultTimers()
    } catch {
      return makeDefaultTimers()
    }
  }

  const timers = ref(load())

  watch(
    timers,
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { deep: true }
  )

  function addTimer({ name, category, targetDate, description }) {
    timers.value.push({
      id: crypto.randomUUID(),
      name,
      category: category || 'other',
      targetDate,
      description: description || '',
      createdAt: new Date().toISOString(),
    })
  }

  function updateTimer(id, updates) {
    const i = timers.value.findIndex((t) => t.id === id)
    if (i >= 0) Object.assign(timers.value[i], updates)
  }

  function deleteTimer(id) {
    timers.value = timers.value.filter((t) => t.id !== id)
  }

  return { timers, addTimer, updateTimer, deleteTimer }
}
