/**
 * Получение функций генерации случайных целых чисел
 * в заданном диапазоне
 * @param min - минимальное значение
 * @param max - максимальное значение
 */
export function useRandomInteger(
  min: number,
  max: number
): { generate: () => number } | never {
  checkArguments(min, max);

  /** Генерация случайного целого числа */
  const generate = (): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  return { generate };
}

/**
 * Проверка аргументов
 * @param min - минимальное значение
 * @param max - максимальное значение
 */
function checkArguments(min: number, max: number): void | never {
  if ([min, max].some((n) => !Number.isInteger(n)))
    throw new Error("Min and max values must be integers");
  if (min > max) throw new Error("Min value must be less than max value");
}
