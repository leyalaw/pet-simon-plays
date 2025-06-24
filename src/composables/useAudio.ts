/* -------------------------------------------------------------------------- */
/*                         Функция для загрузки аудио                         */
/* -------------------------------------------------------------------------- */

export function useAudio(
  /** Путь к аудио */
  audioPath: string,
  {
    /** Функция, вызываемая при успешном завершении загрузки аудио */
    onSuccess,
    /** Функция, вызываемая при ошибке загрузки аудио */
    onError,
  }: Record<"onSuccess" | "onError", (audio: HTMLAudioElement) => void>
): {
  /** Элемент аудио */
  audio: HTMLAudioElement;
} {
  const audio: HTMLAudioElement = new Audio();
  audio.src = audioPath;

  audio.onloadeddata = () => onSuccess(audio);
  audio.onerror = () => onError(audio);

  return { audio };
}
