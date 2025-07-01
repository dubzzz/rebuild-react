// @ts-check

/**
 * @typedef {{type: string | ((props: any) => JSX), props: any}} JSX
 */

/**
 * @typedef {JSX & {children: Fiber[], dom: HTMLElement|null, parent: Fiber|null, reason: string; prevProps?: any; hooks?: any[]; hookIndex?: number; hookInitMode?: boolean}} Fiber
 */

const deletions = [];

/**
 *
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
function sanitize(fiber) {
  for (let index = 0; index !== fiber.children.length; ++index) {
    const child = fiber.children[index];
    if (typeof child === "string") {
      fiber.children[index] = {
        type: "text",
        props: {},
        children: [],
        dom: null,
        content: child,
        parent: fiber,
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
        child.reason = "add";
        child.parent = fiber;
        traverse(child);
      } else {
        prevChild.reason = "delete";
        deletions.push(prevChild);
      }
    } else {
      fiber.children[index] = prevChild;
      prevChild.reason = "update";
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
      : fiber.props.children == null
      ? []
      : [fiber.props.children];
    reconcile(fiber, prevChildren);
    return;
  }
  console.error({ fiber });
  throw new Error("Not supported");
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
function commitDeletion(fiber) {
  const parentDom = closestParentDom(fiber);
  if (fiber.dom) {
    parentDom.appendChild(fiber.dom);
  }
  let current = fiber;
  while (!fiber.dom) {
    current = fiber.children[0];
  }
  parentDom.removeChild(current.dom);
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
    updateDom(fiber.dom, {}, fiber.props);
  }
  if (fiber.dom) {
    parentDom.appendChild(fiber.dom);
  }
  for (const child of fiber.children) {
    if (child.reason === "add") {
      commit(child);
    } else if (child.reason === "update") {
      updateDom(child.dom, child.prevProps, child.props);
      if (child.content != null) {
        child.dom.nodeValue = child.content;
      }
      commit(child);
    }
  }
}

/**
 * @param {HTMLElement} rootElement
 */
export const createRoot = (rootElement) => {
  return {
    /**
     * @param {JSX} component
     */
    render: (component) => {
      /** @type {Fiber} */
      const rootFiber = {
        type: "root",
        props: {
          children: [component],
        },
        dom: rootElement,
        parent: null,
      };
      traverse(rootFiber);
      deletions.forEach(commitDeletion);
      deletions.splice(0, deletions.length);
      commit(rootFiber.children[0]);
    },
  };
};
