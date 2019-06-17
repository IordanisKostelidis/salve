/**
 * Simplification step 17.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
import { Element, isElement } from "../parser";
import { removeUnreferencedDefs } from "./util";

// These are elements that cannot contain notAllowed and cannot contain
// references.
const skip = new Set(["name", "anyName", "nsName", "param", "empty",
                      "text", "value", "notAllowed", "ref"]);

function walk(el: Element, refs: Set<string>): void {
  const { local, children } = el;

  // Since we walk the children first, all the transformations that pertain to
  // the children are applied before we deal with the parent, and there should
  // not be any need to process the tree multiple times.
  for (const child of children) {
    if (!isElement(child)) {
      continue;
    }

    // Skip those elements that cannot contain notAllowed.
    if (skip.has(child.local)) {
      continue;
    }

    walk(child, refs);
  }

  // Elements may be removed in the above loop.
  if (children.length === 0) {
    return;
  }

  const firstNA = (children[0] as Element).local === "notAllowed";
  const second = children[1] as Element;
  const secondNA = second !== undefined && second.local === "notAllowed";

  if (firstNA || secondNA) {
    // tslint:disable-next-line:no-non-null-assertion
    const parent = el.parent!;
    // We used to have a map from which we'd get a handler to call but that
    // method is not faster than this switch.
    switch (local) {
      case "choice":
        if (firstNA && secondNA) {
          // A choice with two notAllowed is replaced with notAllowed.
          parent.replaceChildWith(el, Element.makeElement("notAllowed", []));
        }
        else {
          // A choice with exactly one notAllowed is replaced with the other
          // child of the choice.
          parent.replaceChildWith(el, children[firstNA ? 1 : 0] as Element);
        }
        return;
      case "group":
      case "oneOrMore":
      case "interleave":
      case "attribute":
      case "list":
        // An attribute (or list, group, interleave, oneOrMore) with at least
        // one notAllowed is replaced with notAllowed.
        parent.replaceChildWith(el, Element.makeElement("notAllowed", []));
        return;
      case "except":
        // An except with notAllowed is removed.
        el.parent!.removeChild(el);
        return;
      default:
    }
  }

  for (const child of children) {
    if (!isElement(child) || child.local !== "ref") {
      continue;
    }

    refs.add(child.mustGetAttribute("name"));
  }
}

/**
 * Implements step 17 of the XSL pipeline. Namely:
 *
 * - All ``attribute``, ``list``, ``group``, ``interleave``, and ``oneOrMore``
 *   elements having a ``notAllowed`` child are replaced with a ``notAllowed``
 *   element.
 *
 * - A ``choice`` element with two ``notAllowed`` children is replaced with a
 *   ``notAllowed`` element.
 *
 * - A ``choice`` element with a single ``notAllowed`` child is replaced with
 *   the other child.
 *
 * - An ``except`` element with a ``notAllowed`` child is removed.
 *
 * These transformations are repeated until they no longer modify the tree. (The
 * way we apply the transformations obviates the need to repeat them.)
 *
 * Any ``define`` element that becomes unreachable after transformation is
 * removed.
 *
 * @param tree The tree to process. It is modified in-place.
 *
 * @returns The new root of the tree.
 */
export function step17(tree: Element): Element {
  const refs: Set<string> = new Set();
  walk(tree, refs);

  removeUnreferencedDefs(tree, refs);

  return tree;
}
