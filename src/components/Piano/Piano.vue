<template>
  <!-- КЛАВИАТУРА ФОРТЕПИАНО -->
  <!-- Важные для структуры стили описаны инлайн -->
  <div
    :style="{
      [WHITE_KEYS_WIDTH_VAR]: `calc(100% / ${keyboardInfo.amounts.white})`,
      position: 'relative',
      height: '100%',
      width: '100%',
      display: 'flex',
    }"
  >
    <!-- Блоки для расположения и регулирования размера клавиш -->
    <div
      v-for="keyInfo in keyboardInfo.keys"
      :key="keyInfo.index"
      :data-white-idx="keyInfo.noteAlias ? ++whiteKeysCounter : null"
      :style="[
        {
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          pointerEvents: 'none',
        },
        keyInfo.noteAlias
          ? { flexGrow: 1 }
          : {
              position: 'absolute',
              left: `calc(${whiteKeysCounter} * var(${WHITE_KEYS_WIDTH_VAR}))`,
              width: `var(${WHITE_KEYS_WIDTH_VAR})`,
              transform: 'translateX(-50%)',
            },
      ]"
    >
      <!-- Клавиши -->
      <PianoKey
        :info="keyInfo"
        :audio="{
          keyPressThreshold: pressThreshold,
          playbackRates: {
            whileKeyPressed: pressSpeed,
            afterKeyReleased: releaseSpeed,
          },
          path: audioPath(keyInfo),
        }"
        :disabled="disabled"
        :class="keyClassNames[keyInfo.color]"
        @ready="onReady"
        @sound="onSound"
      />
    </div>
  </div>
</template>

<script lang="ts">
/* --------------------------------- Импорты -------------------------------- */

// типы
import type { ComputedRef, PropType } from "vue";
import type { KeyColor, KeyInfo, KeyPlay, NoteAlias, SoundInfo } from "./types";
// общее
import { computed, watch } from "vue";
// константы
import { NOTE_ALIASES } from "./constants";
// функции
import { usePianoKeyboardInfo } from "./composables/usePianoKeyboardInfo";
// компоненты
import PianoKey from "./PianoKey.vue";

export default {
  name: "PianoKeyboard",
};

type AudioPathMaker = (keyInfo: KeyInfo) => string;

/* --------------------------- Локальные константы -------------------------- */

const WHITE_KEYS_WIDTH_VAR = "--white-key-width";
</script>

<script setup lang="ts">
/* --------------------------------- Пропсы --------------------------------- */

const props = defineProps({
  /** Количество октав */
  octavesAmount: {
    type: Number,
    default: 1,
  },
  /** Первая нота клавиатуры */
  firstNote: {
    type: String as PropType<NoteAlias>,
    default: NOTE_ALIASES[0],
  },
  /** Последняя нота клавиатуры */
  lastNote: {
    type: String as PropType<NoteAlias>,
    default: NOTE_ALIASES[NOTE_ALIASES.length - 1],
  },
  /** Получить информацию также о недоступных для воспроизведения клавишах */
  full: {
    type: Boolean,
    default: false,
  },
  /** Путь до звуковых файлов */
  audioPath: {
    type: Function as PropType<AudioPathMaker>,
    default: (keyInfo: KeyInfo) => `pianoKeys/${keyInfo.index}.mp3`,
  },
  /** Заблокировать клавиатуру для юзера */
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * Тонкая настройка аудио:
   * порог нажатия на клавишу, после которого аудио начинает "тянуться"
   */
  pressThreshold: {
    type: Number,
    default: 1000,
  },
  /**
   * Тонкая настройка аудио:
   * скорость "растяжения" звука после прохождения порога нажатия
   */
  pressSpeed: {
    type: Number,
    default: 0.5,
  },
  /**
   * Тонкая настройка аудио:
   * скорость "завершения" звука при отпускании клавиши
   */
  releaseSpeed: {
    type: Number,
    default: 2.5,
  },
  /** Название класса для белых клавиш (подклюение с deep) */
  whiteClass: String,
  /** Название класса для черных клавиш (подклюение с deep) */
  blackClass: String,
});

/* ------------------------------- Переменные ------------------------------- */

const keyPlays: KeyPlay[] = [];

const keyboardInfo = computed(() =>
  usePianoKeyboardInfo({
    octavesAmount: props.octavesAmount,
    notesAliasesRange: { from: props.firstNote, to: props.lastNote },
  })
);

let whiteKeysCounter = 0;

/* ------------------------------- Вычисления ------------------------------- */

const keyClassNames: ComputedRef<Record<KeyColor, string | undefined>> =
  computed(() => ({
    white: props.whiteClass,
    black: props.blackClass,
  }));

/* -------------------------------- Слушатели ------------------------------- */

watch(props, () => (whiteKeysCounter = 0));

/* --------------------------------- Функции -------------------------------- */

/**
 * Выбор показа активной или полной клавиатуры
 * @param keyPlays - информация о клавишах c методами воспроизведения
 * @param isFullKeyboard - показывать ли клавиатуру с недоступными клавишами
 */
const getPianoKeyboard = (
  keyPlays: KeyPlay[],
  isFullKeyboard: boolean
): KeyPlay[] => {
  const sortedKeys: KeyPlay[] = keyPlays.sort(
    (a, b) => a.key.index - b.key.index
  );

  return isFullKeyboard
    ? sortedKeys
    : sortedKeys
        .filter((keyResponse) => keyResponse.isAvailable)
        .map((keyResponse) => ({
          key: keyResponse.key,
          play: keyResponse.play,
        }));
};

/* ------------------------------- Обработчики ------------------------------ */

/**
 * Сбор клавиатуры с методами воспроизведения клавиш
 * и передача их родительскому компоненту
 * @param keyPlay - информация о клавише с методом воспроизведения
 */
const onReady = (keyPlay: KeyPlay): void => {
  keyPlays.push(keyPlay);
  if (keyPlays.length === keyboardInfo.value.keys.length)
    emit("ready", getPianoKeyboard(keyPlays, props.full));
};

/**
 * Передача информации об извлеченном клавишей звуке родительскому компоненту
 * @param soundInfo Информация о звуке
 */
const onSound = (soundInfo: SoundInfo): void => emit("sound", soundInfo);

/* ---------------------------------- Эмиты --------------------------------- */

const emit = defineEmits(["ready", "sound"]);
</script>

<style scoped></style>
