// @ts-check

/**
 * @typedef {{ type: string | ((props: any) => JSX); props: object }} JSX
 */

/**
 * @param {Fiber} fiber
 */
function sanitize(fiber) {
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
}

/**
 * @param {Fiber} fiber
 */
function reconcile(fiber) {
  sanitize(fiber);
  for (const child of fiber.children) {
    child.parent = fiber;
    traverse(child);
  }
}

/**
 * @param {Fiber} fiber
 */
function traverse(fiber) {
  if (typeof fiber.type === "function") {
    fiber.children = [fiber.type(fiber.props)];
    reconcile(fiber);
    return;
  }
  if (typeof fiber.type === "string") {
    fiber.children = Array.isArray(fiber.props.children)
      ? fiber.props.children
      : fiber.props.children != null
      ? [fiber.props.children]
      : [];
    reconcile(fiber);
  }
}

/**
 * @param {HTMLElement} node
 * @param {object} props
 */
function updateDom(node, props) {
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on")) {
      node.addEventListener(key.substring(2).toLocaleLowerCase(), value);
    } else if (key !== "children") {
      node.setAttribute(key, String(value));
    }
  }
}

/**
 * @param {Fiber} fiber
 */
function closestParentDom(fiber) {
  let current = fiber.parent;
  while (!current.dom) {
    current = current.parent;
  }
  return current.dom;
}

/**
 * @param {Fiber} fiber
 */
function commit(fiber) {
  const parentDom = closestParentDom(fiber);
  if (!fiber.dom && typeof fiber.type === "string") {
    fiber.dom =
      fiber.type === "text"
        ? document.createTextNode(fiber.content)
        : document.createElement(fiber.type);
  }
  if (fiber.dom) {
    updateDom(fiber.dom, fiber.props);
    parentDom.appendChild(fiber.dom);
  }
  for (const child of fiber.children) {
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
