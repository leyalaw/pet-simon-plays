<template>
  <Transition
    name="fade"
    :mode="mode"
    :style="cssTimeVariables"
    :appear="appear"
  >
    <slot></slot>
  </Transition>
</template>

<script lang="ts">
// типы
import type { PropType, ComputedRef } from "vue";
// общее
import { computed } from "vue";

/* -------------------------------- Константы ------------------------------- */

const CSS_VAR_PREFIX = "transition-fade";
const TRANSITION_PARTS = ["duration", "delay"] as const;
const TRANSITION_DIRECTIONS = ["enter", "leave"] as const;

/* ---------------------------------- Типы ---------------------------------- */

export type TransitionPart = (typeof TRANSITION_PARTS)[number];
export type TransitionDirection = (typeof TRANSITION_DIRECTIONS)[number];

export type TimePropValue = Partial<TimePropObject> | number;
export type TimePropObject = Record<TransitionDirection, number>;

export type CSSTimeVariables = Record<CSSTimeVariable, CSSTimeValue>;
export type CSSTimeVariable =
  `--${typeof CSS_VAR_PREFIX}-${TransitionPart}-${TransitionDirection}`;
export type CSSTimeValue = `${number}ms` | `${number}ms`;

export default {
  name: "TransitionFade",
};
</script>

<script setup lang="ts">
/* --------------------------------- Пропсы --------------------------------- */
const props = defineProps({
  /**
   * Продолжительность перехода в миллисекундах:
   * объект со свойствами enter и/или leave или число,
   * которое будет применено к обоим состояниям
   */
  duration: {
    type: [Object, Number] as PropType<TimePropValue>,
    default: () => ({ enter: 2000, leave: 1000 }),
  },
  /**
   * Задержка перехода в миллисекундах:
   * объект со свойствами enter и/или leave или число,
   * которое будет применено к обоим состояниям
   */
  delay: {
    type: [Object, Number] as PropType<TimePropValue>,
    default: 0,
  },
  /** Режим перехода */
  mode: {
    type: String as PropType<"in-out" | "out-in">,
    default: "out-in",
  },
  /** Переход при появлении */
  appear: {
    type: Boolean,
    default: true,
  },
});

/* ------------------------------- Вычисления ------------------------------- */

// CSS переменные времени
const cssTimeVariables: ComputedRef<CSSTimeVariables> = computed(() =>
  // Пробегаем по частям перехода (duration и delay)
  TRANSITION_PARTS.reduce((cssTimeVariables, part: TransitionPart) => {
    // Пробегаем по направлениям перехода (enter и leave)
    // и создаем CSS переменные с текущими частями и направлениями
    const cssTimePartValiables = TRANSITION_DIRECTIONS.reduce(
      (cssTimePartValiables, direction: TransitionDirection) => {
        const cssTimeVariable: CSSTimeVariable = `--${CSS_VAR_PREFIX}-${part}-${direction}`;

        const timePropValue: TimePropValue = props[part];

        const timeValueNumber: number =
          typeof timePropValue === "number"
            ? timePropValue
            : timePropValue[direction] || 0;

        if (!Number.isInteger(timeValueNumber) || timeValueNumber < 0)
          throw Error("Некорректное значение времени перехода");

        return {
          ...cssTimePartValiables,
          [cssTimeVariable]: `${timeValueNumber}ms`,
        };
      },
      {} as CSSTimeVariables
    );

    // Объединяем CSS переменные в общий объект
    return {
      ...cssTimeVariables,
      ...cssTimePartValiables,
    };
  }, {} as CSSTimeVariables)
);
</script>

<style lang="scss" scoped>
/* ---------------------------------- Стили --------------------------------- */
.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
}

.fade-enter-active {
  transition-duration: var(--transition-fade-duration-enter);
  transition-delay: var(--transition-fade-delay-enter);
}

.fade-leave-active {
  transition-duration: var(--transition-fade-duration-leave);
  transition-delay: var(--transition-fade-delay-leave);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
