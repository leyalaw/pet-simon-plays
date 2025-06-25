export const GAME_PACE = 1000;

export const KEY_DURATION = (GAME_PACE / 10) * 9;

export const OCTAVES_AMOUNT = 1;

export const KEY_AUDIO_PATH = (
  octaveIndex: number,
  noteIndex: number
): string => `/audio/pianoKeys/${octaveIndex}-${noteIndex}.wav`;

export const TRANSITION_TIME = Object.freeze({
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 2000,
});
