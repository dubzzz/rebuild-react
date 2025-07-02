// @ts-check

/**
 * @typedef {{ type: string; props: object }} JSX
 */

/**
 *
 * @param {HTMLElement} parentElement
 * @param {JSX} component
 */
function render(parentElement, component) {
  if (component.type == "text") {
    const element = document.createTextNode(component.props.children);
    parentElement.appendChild(element);
    return;
  }
  const element = document.createElement(component.type);
  const children = Array.isArray(component.props.children)
    ? component.props.children
    : component.props.children != null
    ? [component.props.children]
    : [];
  for (const child of children) {
    const revampedChild =
      typeof child === "string"
        ? { type: "text", props: { children: [child] } }
        : child;
    render(element, revampedChild);
  }
  parentElement.appendChild(element);
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
      render(rootElement, component);
    },
  };
};
