export default {};
export const useState = (initialValue) => {
  const fiber = globalThis.currentFiber;
  if (fiber.hookInitMode) {
    const state = [
      initialValue,
      (newValue) => {
        state[0] = newValue;
        fiber.rerender();
      },
    ];
    fiber.hooks[fiber.hookIndex++] = state;
    return state;
  }
  return fiber.hooks[fiber.hookIndex++];
};
