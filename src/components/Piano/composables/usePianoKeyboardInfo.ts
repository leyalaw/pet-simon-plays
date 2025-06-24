// типы
import type { KeyColor, KeyInfo, NoteAlias } from "../types";
import type { IntegerRangeInstance } from "@composables/useIntegerRange";
// константы
import { BEFORE_SEMITONES_NOTES, NOTE_ALIASES } from "../constants";
// функции
import { useIntegerRange } from "@composables/useIntegerRange";

/* ---------------------------------- Типы ---------------------------------- */

export type KeyboardInfo = {
  /** Информация о каждой клавише */
  keys: KeyInfo[];
  /** Количество клавиш каждого цвета */
  amounts: Record<KeyColor, number>;
};

/** Параметры размера клавиатуры */
export type KeyboardInfoParameters = {
  /** Количество октав */
  octavesAmount: number;
  /** Буквенные обозначения крайних нот */
  notesAliasesRange: Record<"from" | "to", NoteAlias>;
};

/** Информация о клавише, независимая от октавы */
export type DefaultKeyInfo = Omit<KeyInfo, "octaveIndex" | "index">;

/* -------------------------------------------------------------------------- */
/*                           Информация о клавиатуре                          */
/* -------------------------------------------------------------------------- */

export function usePianoKeyboardInfo({
  octavesAmount,
  notesAliasesRange,
}: KeyboardInfoParameters): KeyboardInfo {
  checkArguments({ octavesAmount, notesAliasesRange });

  const keysInfo: KeyInfo[] = [];
  const keysAmounts: Record<KeyColor, number> = { white: 0, black: 0 };

  eachKey(
    octavesAmount,
    notesAliasesRange.from,
    notesAliasesRange.to,
    (keyInfo: KeyInfo) => {
      keysInfo.push(keyInfo);
      keysAmounts[keyInfo.color]++;
    }
  );

  return { keys: keysInfo, amounts: keysAmounts };
}

/* ------------------------- Вспомогательные функции ------------------------ */

/**
 * Выкинуть ошибку в случае некорректных значений размера клавиатуры
 * @param settings.octavesAmount - количество октав
 * @param settings.notesAliasesRange - диапазон нот
 */
function checkArguments({
  octavesAmount,
  notesAliasesRange,
}: KeyboardInfoParameters): void | never {
  const isOctavesAmountValid =
    Number.isInteger(octavesAmount) && octavesAmount >= 1;
  if (!isOctavesAmountValid)
    throw new Error(
      "Количество октав должно быть целым числом больше или равным 1"
    );

  const { from: fromNote, to: toNote } = notesAliasesRange;

  // когда затребована одна октава, первая нота не может идти после последней
  const isNoteAliasesRangeValid =
    octavesAmount !== 1 ||
    NOTE_ALIASES.indexOf(fromNote) <= NOTE_ALIASES.indexOf(toNote);
  if (!isNoteAliasesRangeValid) throw new Error("Некорректный диапазон нот");
}

/**
 * Пробежаться по клавиатуре и получить информацию о каждой клавише
 * @param octavesAmount - количество октав
 * @param fromNote - начальная нота
 * @param toNote - конечная нота
 * @param cb - функция, которая будет выполнена для каждой клавиши
 */
function eachKey(
  octavesAmount: number,
  fromNote: NoteAlias,
  toNote: NoteAlias,
  cb: (keyInfo: KeyInfo) => void
) {
  const octaveRange: IntegerRangeInstance = useIntegerRange({
    min: 0,
    max: octavesAmount - 1,
  });
  const defaultOctaveKeys = getDefaultOctaveKeys();

  let keyIndex: number = 0;
  let isInKeyboard: boolean = false;

  octaveRange.foreach((octaveIndex: number) => {
    defaultOctaveKeys.forEach((defaultKeyInfo: DefaultKeyInfo) => {
      const isFirstKey = (): boolean =>
        octaveIndex === octaveRange.min &&
        defaultKeyInfo.noteAlias === fromNote;

      const isLastKey = (): boolean =>
        octaveIndex === octaveRange.max && defaultKeyInfo.noteAlias === toNote;

      // начало клавиатуры
      if (isFirstKey()) isInKeyboard = true;

      if (!isInKeyboard) return;

      cb({
        ...defaultKeyInfo,
        octaveIndex,
        index: keyIndex++,
      });

      // конец клавиатуры
      if (isLastKey()) isInKeyboard = false;
    });
  });
}

/**
 * Получить информацию о клавишах абстрактной октавы
 */
function getDefaultOctaveKeys(): DefaultKeyInfo[] {
  const keys: DefaultKeyInfo[] = [];

  let noteIndex: number = 0;

  const pushKey = (noteAlias: NoteAlias | null): void => {
    keys.push({
      noteIndex: noteIndex++,
      noteAlias,
      color: noteAlias ? "white" : "black",
    });
  };

  for (const noteAlias of NOTE_ALIASES) {
    pushKey(noteAlias);

    // если это не ми или си, то добавляем после черную ноту
    const isBeforeBlackKey = !BEFORE_SEMITONES_NOTES.some(
      (alias) => alias === noteAlias
    );

    if (isBeforeBlackKey) pushKey(null);
  }

  return keys;
}
