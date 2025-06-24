import { NOTE_ALIASES } from "./constants";

/** Информация о звуке */
export interface SoundInfo {
  key: KeyInfo;
  status: SoundStatus;
  initiator: SoundInitiator;
}

/** Информация о клавише с методом воспроизведения */
export interface KeyPlay {
  key: KeyInfo;
  isAvailable?: boolean;
  play: (duration: number) => void;
}

/** Информация о клавише */
export interface KeyInfo {
  index: number;
  noteIndex: number;
  octaveIndex: number;
  color: KeyColor;
  noteAlias: NoteAlias | null;
}

/** Статус звука */
export type SoundStatus = "start" | "end";

/** Инициатор звука */
export type SoundInitiator = "user" | "app";

/** Цвет клавиши */
export type KeyColor = "white" | "black";

/** Буквенное обозначение ноты */
export type NoteAlias = (typeof NOTE_ALIASES)[number];
