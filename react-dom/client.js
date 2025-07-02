// @ts-check

/**
 * @typedef {{ type: string | ((props: any) => JSX); props: object }} JSX
 */

const deletions = [];

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
 * @param {Fiber[]|undefined} prevChildren
 */
function reconcile(fiber, prevChildren) {
  sanitize(fiber);
  for (
    let index = 0;
    index !== Math.max(fiber.children.length, (prevChildren || []).length);
    ++index
  ) {
    const child = fiber.children[index];
    const prevChild = prevChildren && prevChildren[index];
    if (child?.type !== prevChild?.type) {
      if (child) {
        child.parent = fiber;
        traverse(child);
      }
      if (prevChild) {
        deletions.push(prevChild);
      }
    } else {
      fiber.children[index] = prevChild;
      prevChild.parent = fiber;
      prevChild.prevProps = prevChild.props;
      prevChild.props = child.props;
      prevChild.content = child.content;
      traverse(prevChild);
    }
  }
}

/**
 * @param {Fiber} fiber
 */
function traverse(fiber) {
  if (typeof fiber.type === "function") {
    globalThis.currentFiber = fiber;
    fiber.hookInitMode = fiber.hooks == null;
    fiber.hooks = fiber.hooks || [];
    fiber.hookIndex = 0;
    fiber.rerender = () => {
      traverse(fiber);
      deletions.forEach(commitDeletion);
      deletions.splice(0, deletions.length);
      commit(fiber);
    };
    const prevChildren = fiber.children;
    fiber.children = [fiber.type(fiber.props)];
    reconcile(fiber, prevChildren);
    return;
  }
  if (typeof fiber.type === "string") {
    const prevChildren = fiber.children;
    fiber.children = Array.isArray(fiber.props.children)
      ? fiber.props.children
      : fiber.props.children != null
      ? [fiber.props.children]
      : [];
    reconcile(fiber, prevChildren);
  }
}

/**
 * @param {HTMLElement} node
 * @param {object} prevProps
 * @param {object} nextProps
 */
function updateDom(node, prevProps, nextProps) {
  for (const [key, value] of Object.entries(prevProps)) {
    if (key.startsWith("on")) {
      node.removeEventListener(key.substring(2).toLocaleLowerCase(), value);
    } else if (key !== "children") {
      node.removeAttribute(key);
    }
  }
  for (const [key, value] of Object.entries(nextProps)) {
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
    updateDom(fiber.dom, fiber.prevProps || {}, fiber.props);
    if (fiber.type === "text") {
      fiber.dom.nodeValue = fiber.content;
    }
    parentDom.appendChild(fiber.dom);
  }
  for (const child of fiber.children) {
    commit(child);
  }
}

/**
 * @param {Fiber} fiber
 */
function commitDeletion(fiber) {
  const parentDom = closestParentDom(fiber);
  let current = fiber;
  while (!fiber.dom) {
    current = fiber.children[0];
  }
  parentDom.removeChild(current.dom);
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
      deletions.forEach(commitDeletion);
      deletions.splice(0, deletions.length);
      commit(rootFiber.children[0]);
    },
  };
};
