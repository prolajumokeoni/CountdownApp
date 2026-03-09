# Countdown App ◈

Multiple countdown timers for important events like birthdays, deadlines, launches
##  Deployed Link

[countdown-app-pied.vercel.app](https://countdown-app-pied.vercel.app/)


--- 

## Video Demo
https://github.com/user-attachments/assets/dc272190-9a96-4d2e-999b-60481bbdcf0f

--- 
 
 ## Screenshots

<img width="1440" height="900" alt="Image" src="https://github.com/user-attachments/assets/c1d58a3b-6f63-49f1-a1b2-b78356bb6096" />
<img width="1440" height="900" alt="Image" src="https://github.com/user-attachments/assets/b018c573-e0db-4f44-b32b-43d5df230382" />
<img width="1440" height="900" alt="Image" src="https://github.com/user-attachments/assets/c9609225-a607-440a-8240-b8bb62c145d5" />

---

##  How the App works

- Create countdowns with a name, category, date & time, and an optional note 
- 8 categories to choose from: Birthday, Anniversary, Deadline, Launch, Meeting, Travel, Holiday, Other 
- The most urgent upcoming event always takes the hero spot at the top
- Confetti fires when a countdown hits zero 

---

 
## Challenges

The trickiest part was making sure the sorting and hero updates were actually reactive.  

 
---

## If I had more time

 
- Drag to reorder / pin timers 

---

## Stack

- [Vue 3](https://vuejs.org/) — Composition API with `<script setup>`
- [Nuxt 3](https://nuxt.com/)  used for structure and Tailwind integration
- [Tailwind CSS](https://tailwindcss.com/) — utility classes for layout and buttons
- [vue-datepicker-next](https://github.com/mengxiong10/vue-datepicker-next) — date & time picker
- [vue-toastification](https://github.com/Maronato/vue-toastification) — toast notifications
- `localStorage` for persistence 

---

## Run locally

To get a local copy up and running, follow these steps.

```bash
git clone https://github.com/prolajumokeoni/CountdownApp
cd CountdownApp
npm install
npm run dev
```
 
