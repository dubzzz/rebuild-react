// @ts-check

/**
 * @typedef {{ type: string; props: object }} JSX
 */

/**
 * @param {Fiber} fiber
 */
function traverse(fiber) {
  fiber.children = Array.isArray(fiber.props.children)
    ? fiber.props.children
    : fiber.props.children != null
    ? [fiber.props.children]
    : [];
  for (let index = 0; index !== fiber.children.length; ++index) {
    const child = fiber.children[index];
    if (typeof child === "string") {
      fiber.children[index] = {
        type: "text",
        props: {},
        children: [],
        parent: fiber,
        dom: undefined,
        content: child,
      };
    }
  }
  for (const child of fiber.children) {
    child.parent = fiber;
    traverse(child);
  }
}

/**
 * @param {Fiber} fiber
 */
function commit(fiber) {
  const parentDom = fiber.parent.dom;
  if (!fiber.dom) {
    fiber.dom =
      fiber.type === "text"
        ? document.createTextNode(fiber.content)
        : document.createElement(fiber.type);
  }
  parentDom.appendChild(fiber.dom);
  for (const child of fiber.children) {
    console.log({ child });
    commit(child);
  }
}

/** @typedef {JSX & { children?: Fiber[]; parent?: Fiber; dom?: HTMLElement }} Fiber */

export const createRoot = (rootElement) => {
  return {
    /**
     * @param {JSX} component
     */
    render: (component) => {
      /** @type {Fiber} */
      const rootFiber = {
        type: "root",
        props: { children: [component] },
        children: [component],
        dom: rootElement,
      };
      traverse(rootFiber);
      commit(rootFiber.children[0]);
    },
  };
};
