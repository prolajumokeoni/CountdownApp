<template>
  <div class="flip-unit">
    <div class="tile">
      <!-- Static background: upper and lower halves showing the new value -->
      <div class="card upper"><div class="dw"><span class="digit">{{ displayed }}</span></div></div>
      <div class="card lower"><div class="dw"><span class="digit">{{ displayed }}</span></div></div>

      <!-- Horizontal fold line -->
      <div class="fold" />

      <!-- Animated: old top folds away, new bottom folds in -->
      <template v-if="flipping">
        <div class="card upper upper-flip"><div class="dw"><span class="digit">{{ prev }}</span></div></div>
        <div class="card lower lower-flip"><div class="dw"><span class="digit">{{ displayed }}</span></div></div>
      </template>
    </div>
    <span v-if="label" class="lbl">{{ label }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  label: { type: String, default: '' },
})

const pad = (n) => String(Math.abs(n)).padStart(2, '0')

const displayed = ref(pad(props.value))
const prev      = ref(pad(props.value))
const flipping  = ref(false)

watch(() => props.value, (newVal) => {
  const next = pad(newVal)
  if (next === displayed.value) return
  prev.value = displayed.value
  displayed.value = next
  flipping.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flipping.value = true
      setTimeout(() => { flipping.value = false }, 650)
    })
  })
})
</script>

<style scoped>
.flip-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.tile {
  position: relative;
  width: var(--tile-w, 90px);
  height: var(--tile-h, 110px);
  perspective: 500px;
}

.card {
  position: absolute;
  left: 0; right: 0;
  height: 50%;
  overflow: hidden;
}

.upper {
  top: 0;
  border-radius: var(--tile-r, 14px) var(--tile-r, 14px) 0 0;
  background: linear-gradient(to bottom, #272727, #1d1d1d);
}

.lower {
  bottom: 0;
  border-radius: 0 0 var(--tile-r, 14px) var(--tile-r, 14px);
  background: linear-gradient(to bottom, #1a1a1a, #212121);
  box-shadow: inset 0 3px 8px rgba(0,0,0,0.65);
}

/* Full-tile-height wrapper so digit appears vertically centered across the fold */
.dw {
  position: absolute;
  left: 0; right: 0;
  height: 200%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upper .dw { top: 0; }
.lower .dw { bottom: 0; }

.digit {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--tile-font, 4rem);
  font-weight: 800;
  color: var(--flip-accent, #f97316);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  user-select: none;
}

/* The physical fold/crease line */
.fold {
  position: absolute;
  left: 0; right: 0;
  top: calc(50% - 1px);
  height: 2px;
  background: rgba(0,0,0,0.9);
  z-index: 10;
  pointer-events: none;
}

/* Old top: folds down and away (0 → -90deg) */
.upper-flip {
  transform-origin: bottom center;
  animation: ftop 0.27s cubic-bezier(0.55, 0, 1, 0.45) forwards;
  z-index: 5;
  backface-visibility: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
}

/* New bottom: folds in from behind (90 → 0deg), delayed until top finishes */
.lower-flip {
  transform-origin: top center;
  transform: rotateX(90deg);
  animation: fbot 0.27s cubic-bezier(0, 0.55, 0.45, 1) 0.27s forwards;
  z-index: 5;
  backface-visibility: hidden;
  box-shadow: 0 -10px 24px rgba(0,0,0,0.5);
}

@keyframes ftop {
  to { transform: rotateX(-90deg); }
}
@keyframes fbot {
  to { transform: rotateX(0deg); }
}

.lbl {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.4);
}
</style>
