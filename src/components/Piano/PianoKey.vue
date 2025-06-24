<template>
  <!-- ФОРТЕПИАННАЯ КЛАВИША -->
  <!-- Важные для структуры стили описаны инлайн -->
  <div
    :data-piano-key="info.color"
    :style="{ pointerEvents: isKeyDisabled ? 'none' : 'auto' }"
    :class="{ active: isKeyPressed }"
    :disabled="isKeyDisabled"
    @mousedown="onMouseDown"
  ></div>
</template>

<script lang="ts">
/* --------------------------------- Импорты -------------------------------- */

// типы
import type { ComputedRef, Ref } from "vue";
import type { KeyInfo, SoundInfo, SoundStatus } from "./types";
import type { AudioSettings } from "./composables/usePianoSound";
// общее
import { computed, ref } from "vue";
// функции
import { useAudio } from "@composables/useAudio";
import { usePianoSound } from "./composables/usePianoSound";

export default {
  name: "PianoKey",
};
</script>

<script setup lang="ts">
/* --------------------------------- Пропсы --------------------------------- */

interface Props {
  info: KeyInfo;
  audio: AudioSettings & { path: string };
  disabled: boolean;
}

const props = defineProps<Props>();

/* ------------------------------- Переменные ------------------------------- */

const isAudioAvailable: Ref<boolean> = ref(false);
const isKeyPressed: Ref<boolean> = ref(false);

const sound: Ref<Record<SoundStatus, () => void>> = ref({
  start: () => {},
  end: () => {},
});

const { path: audioPath, keyPressThreshold, playbackRates } = props.audio;

/* ------------------------------- Вычисления ------------------------------- */

const isKeyDisabled: ComputedRef<boolean> = computed(
  () => props.disabled || !isAudioAvailable.value
);

/* --------------------------------- Функции -------------------------------- */

/**
 * Инициация звука родительским компонентом
 * @param duration - продолжительность воспроизведения
 */
const playKey = (duration: number): void => {
  playSound({ status: "start", initiator: "app" });
  setTimeout(() => {
    playSound({ status: "end", initiator: "app" });
  }, duration);
};

/**
 * Воспроизведение звука
 * @param soundInfo.status - статус воспроизведения звука
 * @param soundInfo.initiator - источник воспроизведения
 */
const playSound = ({ status, initiator }: Omit<SoundInfo, "key">): void => {
  emit("sound", { key: props.info, status, initiator });

  isKeyPressed.value = status === "start";

  sound.value[status]();
};

/* ------------------------------- Обработчики ------------------------------ */

/**
 * Передача информации о клавише, валидности аудио
 * и возможности воспроизведения родительскому компоненту
 * после завершения загрузки
 * @param audio - элемент аудио
 * @param isSuccess - успешность загрузки аудио
 */
const onAudioLoadEnd = (
  audio: HTMLAudioElement,
  isSuccess: boolean = true
): void => {
  isAudioAvailable.value = isSuccess;

  if (isSuccess)
    sound.value = usePianoSound(audio, {
      keyPressThreshold,
      playbackRates,
    });

  emit("ready", {
    key: props.info,
    isAvailable: isAudioAvailable.value,
    play: playKey,
  });
};

/**
 * Инициация воспроизведения звука при клике на клавишу юзером
 */
const onMouseDown = (): void => {
  playSound({ status: "start", initiator: "user" });
  document.addEventListener("mouseup", onMouseUp);
};

/**
 * Инициация остановки звука при отпускании клавиши юзером
 */
const onMouseUp = (): void => {
  playSound({ status: "end", initiator: "user" });
  document.removeEventListener("mouseup", onMouseUp);
};

/* -------------------------------- Основное -------------------------------- */

useAudio(audioPath, {
  onSuccess: onAudioLoadEnd,
  onError: (audio: HTMLAudioElement) => onAudioLoadEnd(audio, false),
});

/* ---------------------------------- Эмиты --------------------------------- */

const emit = defineEmits(["ready", "sound"]);
</script>

<style scoped>
/* --------------------------- Стили по умолчанию --------------------------- */
[data-piano-key] {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  transition: box-shadow, background-color, 0.2s;
}

[data-piano-key]:not(:disabled) {
  cursor: pointer;
}

[data-piano-key="white"] {
  background: #fff;
  border: 1px solid #bbb;
  height: 100%;
  width: 100%;
}

[data-piano-key="white"].active {
  box-shadow: inset 0 0 20px 0 #aaa;
}

[data-piano-key="black"] {
  background: #000;
  width: 50%;
  height: 60%;
}

[data-piano-key="black"].active {
  box-shadow: 0 0 10px 5px #aaa;
  background-color: #000;
}
</style>
