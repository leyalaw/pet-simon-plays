export type NumberLimit = "min" | "max";
export type IntegerRange = Record<NumberLimit, number>;

export type IntegerRangeInstance = {
  max: number;
  min: number;
  includes: (n: number) => boolean;
  foreach: (cb: (n: number, i: number) => void) => void;
  random: () => number;
};

export function useIntegerRange(range: IntegerRange): IntegerRangeInstance {
  if (!isRangeValid(range)) throw new Error("Invalid integer range");

  const { min, max } = range;

  const includes = (n: number): boolean => n >= min && n <= max;

  const foreach = (cb: (n: number, i: number) => void): void => {
    let n: number = min;
    let i: number = 0;
    const end: number = max;

    while (n <= end) {
      cb(n, i);
      n++;
      i++;
    }
  };

  const random = (): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  return { max, min, includes, foreach, random };
}

function isRangeValid({ min, max }: IntegerRange): boolean {
  return [min, max].every((n: number) => Number.isInteger(n)) && min <= max;
}
