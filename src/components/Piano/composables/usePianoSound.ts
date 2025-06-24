import type { SoundStatus } from "../types";

/* ---------------------------------- Типы ---------------------------------- */

/** Настройки воспроизведения звука */
export type AudioSettings = {
  /** Порог нажатия на клавишу, после которого аудио начинает "тянуться" */
  keyPressThreshold: number;
  /** Скорости воспроизведения звука при удерживании и при отпускании клавиши */
  playbackRates: AudioPlaybackRates;
};

/**
 * Скорости воспроизведения звука при удерживании
 * и при отпускании клавиши
 */
export type AudioPlaybackRates = Record<
  "whileKeyPressed" | "afterKeyReleased",
  number
>;

/* -------------------------------------------------------------------------- */
/*            Функции воспроизведения и остановки клавишного звука            */
/* -------------------------------------------------------------------------- */

export function usePianoSound(
  audio: HTMLAudioElement,
  { keyPressThreshold, playbackRates }: AudioSettings
): Record<SoundStatus, () => void> | never {
  /* -------------------------------- Основное -------------------------------- */

  checkAudioSettings({
    keyPressThreshold,
    playbackRates,
  });

  let slowDownSoundIfKeptPressed: ReturnType<typeof setTimeout>;

  const { restart, slowDown, speedUp } = getAudioChangers(playbackRates);

  /**
   * Начало воспроизведения звука
   */
  const startSound = (): void => {
    restart(audio);
    slowDownSoundIfKeptPressed = setTimeout(
      () => slowDown(audio),
      keyPressThreshold
    );
  };

  /**
   * Остановка воспроизведения звука
   */
  const endSound = (): void => {
    clearTimeout(slowDownSoundIfKeptPressed);
    speedUp(audio);
  };

  /* --------------------------------- Возврат -------------------------------- */
  return {
    /** Запуск клавишного звука */
    start: startSound,
    /** Остановка клавишного звука */
    end: endSound,
  };
}

/* ------------------------- Вспомогательные функции ------------------------ */

/**
 * Выброс ошибки, если настройки воспроизведения звука не валидны
 * @param audioSettings.keyPressThreshold - порог нажатия на клавишу,
 * после которого аудио начинает "тянуться"
 * @param audioSettings.playbackRates - скорости воспроизведения звука
 * при удерживании и при отпускании клавиши
 */
function checkAudioSettings({
  keyPressThreshold,
  playbackRates,
}: AudioSettings): void | never {
  checkThreshold(keyPressThreshold);
  checkPlaybackRates(playbackRates);
}

/**
 * Выброс ошибки, если порог нажатия на клавишу не валиден
 * @param threshold - порог нажатия на клавишу
 */
function checkThreshold(threshold: number): void | never {
  if (threshold <= 0 || threshold % 100 !== 0)
    throw new Error(
      "Порог нажатия на клавишу должен быть больше нуля и кратен 100"
    );
}

/**
 * Выброс ошибки, если скорости воспроизведения звука не валидны
 * @param playbackRates.whileKeyPressed - скорость "тянущегося" звука
 * при удерживании клавиши
 * @param playbackRates.afterKeyReleased - скорость "завершающегося" звука
 * при отпускании клавиши
 */
function checkPlaybackRates({
  whileKeyPressed: pressSpeed,
  afterKeyReleased: releaseSpeed,
}: AudioPlaybackRates): void | never {
  if ([pressSpeed, releaseSpeed].some((speed) => speed <= 0))
    throw new Error("Скорость воспроизведения звука должна быть больше нуля");

  if (pressSpeed > releaseSpeed)
    throw new Error(
      "Скорость воспроизведения звука при удерживании должна быть меньше скорости при отпускании"
    );
}

/**
 * Получение функций для изменений звука
 * @param playbackRates - скорости воспроизведения звука
 */
function getAudioChangers(
  playbackRates: AudioPlaybackRates
): Record<
  "restart" | "slowDown" | "speedUp",
  (sound: HTMLAudioElement) => void
> {
  const restart = (sound: HTMLAudioElement) => {
    sound.playbackRate = 1;
    sound.currentTime = 0;
    sound.play();
  };
  const slowDown = (sound: HTMLAudioElement) =>
    (sound.playbackRate = playbackRates.whileKeyPressed);
  const speedUp = (sound: HTMLAudioElement) =>
    (sound.playbackRate = playbackRates.afterKeyReleased);

  return {
    restart,
    slowDown,
    speedUp,
  };
}
