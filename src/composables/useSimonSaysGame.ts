// типы
import type { Ref } from "vue";
// общее
import { ref, watch } from "vue";
// функции
import { useIntegerRange } from "./useIntegerRange";

/* ---------------------------------- Константы ---------------------------------- */

/** Статусы игры */
export const STATUS = {
  INITIAL: "initial",
  SPEAKING: "speaking",
  LISTENING: "listening",
  VICTORY: "victory",
  DEFEAT: "defeat",
} as const;

/* ---------------------------------- Типы ---------------------------------- */

export type Game = {
  /** Начать новую игру/перейти к следующему раунду */
  run: () => void;
  /** Проверить ответ */
  check: (guess: number) => void;
  /** Сбросить игру */
  reset: () => void;
};

/** Настройки игры */
export type Settings = {
  /** Пределы чисел для игры */
  numberRange: { min: number; max: number };
  /** Обработчики */
  handlers: Handlers;
  /** Промежуток времени между объявлениями */
  speakingPace?: number;
};

/** Обработчики */
export type Handlers = {
  /** Функция, вызываемая при объявлении каждого числа */
  onSayingNumber: (n: number) => void;
  /** Функция, вызываемая при изменении раунда */
  onRoundChange?: (newRound: number, oldRound: number) => void;
  /** Функция, вызываемая при изменении статуса */
  onStatusChange?: (newStatus: Status, oldStatus: Status) => void;
};

/** Статусы игры */
export type Status = (typeof STATUS)[keyof typeof STATUS];

/** Ответ на предположение */
export type CheckAnswer = {
  isRight: boolean;
  isVictory: boolean;
  isDefeat: boolean;
};

/* -------------------------------------------------------------------------- */
/*                         Функции для игры Simon Says                        */
/* -------------------------------------------------------------------------- */

export function useSimonSaysGame({
  numberRange = { min: 0, max: 9 },
  handlers = {
    onSayingNumber: () => {},
    onRoundChange: () => {},
    onStatusChange: () => {},
  },
  speakingPace = 1000,
}: Settings): Game {
  /* -------------------------------- Основное -------------------------------- */

  const currStatus: Ref<Status> = ref(STATUS.INITIAL);
  const roundCounter: Ref<number> = ref(0);
  const numberSequence: Ref<number[]> = ref([]);

  const { random: getRandomNumber } = useIntegerRange(numberRange);
  let checker: Generator<boolean, boolean, number> | null = null;

  /**
   * Начать новую игру/перейти к следующему раунду
   */
  const run = (): void => {
    if (isStatus(STATUS.DEFEAT)) resetRoundData();
    setNextRound();
    saySequenceNumbers().then(() => doAfterPause(startListening));
  };

  /**
   * Проверить предположение
   * @param guess - предполагаемое число
   */
  const check = (guess: number): CheckAnswer | undefined => {
    if (!isStatus(STATUS.LISTENING)) return;

    const answer = checkGuess(guess);

    if (answer.isVictory) setStatus(STATUS.VICTORY);
    if (answer.isDefeat) setStatus(STATUS.DEFEAT);

    return answer;
  };

  /**
   * Сбросить игру
   */
  const reset = (): void => {
    resetRoundData();
    setStatus(STATUS.INITIAL);
  };

  /* -------------------------------- Слушатели ------------------------------- */

  watch(currStatus, handlers.onStatusChange || (() => {}));
  watch(roundCounter, handlers.onRoundChange || (() => {}));

  /* ---------------------------- Локальные функции --------------------------- */

  /**
   * Проверить статус игры
   * @param status - ожидаемый статус
   */
  function isStatus(status: Status): boolean {
    return currStatus.value === status;
  }

  /**
   * Установить новый статус
   * @param status - новый статус
   */
  function setStatus(status: Status): void {
    currStatus.value = status;
  }

  /**
   * Сбросить данные раунда
   */
  function resetRoundData(): void {
    roundCounter.value = 0;
    numberSequence.value = [];
    checker = null;
  }

  /**
   * Создать новый раунд
   */
  function setNextRound(): void {
    roundCounter.value++;
    numberSequence.value.push(getRandomNumber());
  }

  /**
   * Объявить последовательность загаданных чисел
   */
  async function saySequenceNumbers(): Promise<void> {
    setStatus(STATUS.SPEAKING);

    for (const secretNum of numberSequence.value) {
      await new Promise<void>((resolve) =>
        doAfterPause(() => {
          handlers.onSayingNumber(secretNum);
          resolve();
        })
      );
    }
  }

  /**
   * Задержка перед выполнением следующего действия
   * @param cb - функция, которая будет выполнена после задержки
   */
  function doAfterPause(cb: () => void): void {
    setTimeout(() => {
      cb();
    }, speakingPace);
  }

  /**
   * Начать слушать ответы
   */
  function startListening(): void {
    checker = checkerGenerator(numberSequence.value);
    checker.next();
    setStatus(STATUS.LISTENING);
  }

  /**
   * Создать ответ на предположение
   * @param guess - предполагаемое число
   */
  function checkGuess(guess: number): CheckAnswer {
    const answer: CheckAnswer = {
      isRight: false,
      isVictory: false,
      isDefeat: false,
    };

    const checkResult: IteratorResult<boolean> = checker!.next(guess);

    if (!checkResult.value) answer.isDefeat = true;
    else {
      answer.isRight = true;
      if (checkResult.done) answer.isVictory = true;
    }

    return answer;
  }

  /**
   * Генератор последовательности ответов
   * @param sequence - последовательность загаданных чисел
   */
  function* checkerGenerator(sequence: number[]) {
    for (const num of sequence) {
      const guess: number = yield true;
      if (guess !== num) return false;
    }
    return true;
  }

  /* --------------------------------- Возврат -------------------------------- */

  return { run, check, reset };
}
