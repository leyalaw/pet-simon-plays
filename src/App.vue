<template>
  <div class="wrapper">
    <TransitionFade
      :duration="TRANSITION_TIME.LONG"
      @after-enter="isInterfaceShown = true"
    >
      <div
        class="simon-plays"
        :style="{
          '--default-transition-duration': `${TRANSITION_TIME.SHORT}ms`,
        }"
      >
        <!-- МЕЖИГРОВОЙ ОВЕРЛЕЙ -->
        <TransitionFade
          :duration="{
            enter: isGreeting ? TRANSITION_TIME.LONG : TRANSITION_TIME.MEDIUM,
            leave: TRANSITION_TIME.SHORT,
          }"
          @afterEnter="isGreeting = false"
        >
          <div
            v-if="!isGameRunning && isInterfaceShown"
            class="simon-plays__game-block simon-plays__game-block--overlay"
          >
            <!-- Заголовок -->
            <h1 class="simon-plays__title">Simon Plays</h1>
            <!-- Кнопка запуска игры -->
            <TransitionFade
              :delay="{
                enter: isGreeting
                  ? TRANSITION_TIME.MEDIUM
                  : TRANSITION_TIME.SHORT,
              }"
              :duration="TRANSITION_TIME.LONG"
            >
              <button
                v-if="isGameReady"
                class="simon-plays__run-btn"
                @click="ssg.run"
              >
                <span class="simon-plays__run-btn-text">{{
                  isGameDefeat ? "Try Again" : "Start"
                }}</span>
              </button>
            </TransitionFade>
          </div>
        </TransitionFade>
        <!-- БЛОК С ИГРОИ -->
        <div
          class="simon-plays__game-block simon-plays__game-block--content"
          :class="{ 'simon-plays__game-block--disabled': !isGameRunning }"
        >
          <!-- Счётчик раундов -->
          <p class="simon-plays__round-counter">
            Round:
            <TransitionFade :duration="TRANSITION_TIME.SHORT">
              <span v-if="isRoundShown">{{ round }}</span>
            </TransitionFade>
          </p>
          <!-- Клавиатура -->
          <div class="simon-plays__piano">
            <Piano
              :octaves-amount="OCTAVES_AMOUNT"
              :audio-path="(keyInfo: PianoTypes.KeyInfo) => KEY_AUDIO_PATH(keyInfo.octaveIndex, keyInfo.noteIndex)"
              :disabled="!isListening"
              white-class="simon-plays__key"
              @sound="onPianoSound"
              @ready="onPianoReady"
            />
          </div>
        </div>
      </div>
    </TransitionFade>
  </div>
</template>

<script setup lang="ts">
/* --------------------------------- Импорты -------------------------------- */
// типы
import type { ComputedRef, Ref } from "vue";
import type * as SSGTypes from "@composables/useSimonSaysGame";
import type * as PianoTypes from "@components/Piano/types";
// общее
import { computed, ref } from "vue";
// константы
import {
  GAME_PACE,
  KEY_AUDIO_PATH,
  KEY_DURATION,
  OCTAVES_AMOUNT,
  TRANSITION_TIME,
} from "@/constants";
// функции
import {
  STATUS as ROUND_STATUS,
  useSimonSaysGame,
} from "@composables/useSimonSaysGame";
// компоненты
import Piano from "@components/Piano/Piano.vue";
import TransitionFade from "@components/TransitionFade.vue";

/* ------------------------------- Переменные ------------------------------- */

/** Инстанс игры Simon Says */
let ssg: SSGTypes.Game;
/** Клавиатура для игры */
let pianoKeyboard: PianoTypes.KeyPlay[];

/** Все готово для игры */
const isGameReady: Ref<boolean> = ref(false);
/** Показывать интерфейс */
const isInterfaceShown: Ref<boolean> = ref(false);
/** Игра еще не начиналась */
const isGreeting: Ref<boolean> = ref(true);

/** Статус игры */
const status: Ref<SSGTypes.Status> = ref(ROUND_STATUS.INITIAL);
/** Номер раунда */
const round: Ref<number> = ref(1);
/** Отображен ли номер раунда */
const isRoundShown: Ref<boolean> = ref(true);

/* ------------------------------- Вычисления ------------------------------- */

/** Игра проиграна */
const isGameDefeat: ComputedRef<boolean> = computed(
  () => status.value === ROUND_STATUS.DEFEAT
);

/** Игра идет */
const isGameRunning: ComputedRef<boolean> = computed(
  () =>
    status.value !== ROUND_STATUS.INITIAL &&
    status.value !== ROUND_STATUS.DEFEAT
);

/** Очередь игрока */
const isListening: ComputedRef<boolean> = computed(
  () => status.value === ROUND_STATUS.LISTENING
);

/* ------------------------------- Обработчики ------------------------------ */

/**
 * Создание игры Simon Says на основе клавишных индексов
 * @param keyboard - массив клавиш с методами воспроизведения
 */
const onPianoReady = (keyboard: PianoTypes.KeyPlay[]) => {
  pianoKeyboard = keyboard;

  ssg = useSimonSaysGame({
    // в качестве загадываемых чисел используем индексы клавиш
    numberRange: { min: 0, max: pianoKeyboard.length - 1 },
    handlers: {
      onSayingNumber,
      onRoundChange,
      onStatusChange,
    },
    // промежуток между звуками
    speakingPace: GAME_PACE,
  });

  isGameReady.value = true;
};

/**
 * "Нажатие" на клавишу с индексом равным загаданному числу
 * @param n - загаданное число
 */
function onSayingNumber(n: number): void {
  pianoKeyboard[n].play(KEY_DURATION);
}

/**
 * Смена раунда
 * @param newRound - новый раунд
 */
function onRoundChange(newRound: number): void {
  if (newRound === round.value) return;
  // переход между раундами
  else {
    isRoundShown.value = false;
    round.value = newRound;
    setTimeout(() => (isRoundShown.value = true), TRANSITION_TIME.SHORT);
  }
}

/**
 * Смеена статуса и начало нового раунда при победе
 * @param newStatus - новый статус
 */
function onStatusChange(newStatus: SSGTypes.Status): void {
  status.value = newStatus;
  if (newStatus === ROUND_STATUS.VICTORY) ssg.run();
}

/**
 * Сверка индекса клавиши с загаданным числом
 * @param sound - информация о звуке
 */
const onPianoSound = (sound: PianoTypes.SoundInfo) => {
  // игнорирование звуков, которые не были воспроизведены самой игрой,
  // а также звуков, которые еще длятся (когда клавиша еще не отпущена)
  if (sound.initiator !== "user" || sound.status !== "end") return;

  const i = pianoKeyboard.findIndex(
    (keyPlay) => keyPlay.key.index === sound.key.index
  );

  ssg.check(i);
};
</script>

<style scoped>
/* ---------------------------------- Стили --------------------------------- */
.wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.simon-plays {
  width: 80%;
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.simon-plays__game-block {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.simon-plays__game-block--content {
  transition-duration: var(--default-transition-duration);
  transition-property: opacity, filter;
}

.simon-plays__game-block--disabled {
  opacity: 0.5;
  pointer-events: none;
  transition-duration: var(--default-transition-duration);
  transition-property: opacity, filter;
}

.simon-plays__game-block + .simon-plays__game-block--disabled {
  filter: blur(2px);
}

.simon-plays__round-counter {
  font-size: 6rem;
  align-self: start;
}

.simon-plays__piano {
  width: 100%;
  height: 50%;
}

:deep(.simon-plays__key) {
  transition: background-color var(--default-transition-duration);
}

@media (hover: hover) and (pointer: fine) {
  :deep(.simon-plays__key:not(:disabled):hover) {
    background-color: #eee;
  }
}

.simon-plays__game-block--overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
}

.simon-plays__title {
  margin-top: 6rem;
  font-size: 22rem;
  text-align: center;
  font-weight: normal;
}

.simon-plays__run-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  align-self: center;
}

.simon-plays__run-btn-text {
  font-size: 8rem;
  transition-duration: var(--default-transition-duration);
  transition-property: text-shadow, color;
}

.simon-plays__run-btn:hover .simon-plays__run-btn-text {
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.8);
  color: #eee;
}

@media screen and (orientation: landscape) {
  .simon-plays__title {
    font-size: 16rem;
  }
}
</style>
