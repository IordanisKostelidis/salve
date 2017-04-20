/**
 * Pattern and walker for RNG's ``attribute`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { AttributeNameError, AttributeValueError } from "../errors";
import { HashMap } from "../hashstructs";
import * as namePatterns from "../name_patterns";
import { NameResolver } from "../name_resolver";
import { TrivialMap } from "../types";
import { addWalker, BasePattern, EndResult, Event, EventSet,
         FireEventResult, isHashMap, isNameResolver, OneSubpattern, Pattern,
         Walker } from "./base";

/**
 * A pattern for attributes.
 */
export class Attribute extends OneSubpattern {
  /**
   * @param xmlPath This is a string which uniquely identifies the
   * element from the simplified RNG tree. Used in debugging.
   *
   * @param name The qualified name of the attribute.
   *
   * @param pat The pattern contained by this one.
   */

  constructor(xmlPath: string, readonly name: namePatterns.Name,
              pat: Pattern) {
    super(xmlPath, pat);
  }

  _prepare(namespaces: TrivialMap<number>): void {
    const nss: TrivialMap<number> = Object.create(null);
    this.name._recordNamespaces(nss);

    // A lack of namespace on an attribute should not be recorded.
    delete nss[""];

    // Copy the resulting namespaces.
    // tslint:disable-next-line:forin
    for (const key in nss) {
      namespaces[key] = 1;
    }
  }

  _hasAttrs(): boolean {
    return true;
  }
}

/**
 * Walker for [[Attribute]].
 */
class AttributeWalker extends Walker<Attribute> {
  private seenName: boolean;
  private seenValue: boolean;
  private subwalker: Walker<BasePattern> | undefined;
  private readonly attrNameEvent: Event;
  private readonly nameResolver: NameResolver;

  /**
   * @param el The pattern for which this walker was
   * created.
   *
   * @param nameResolver The name resolver that
   * can be used to convert namespace prefixes to namespaces.
   */
  protected constructor(walker: AttributeWalker, memo: HashMap);
  protected constructor(el: Attribute, nameResolver: NameResolver);
  protected constructor(elOrWalker: AttributeWalker | Attribute,
                        nameResolverOrMemo: HashMap | NameResolver) {
    if (elOrWalker instanceof AttributeWalker) {
      const walker: AttributeWalker = elOrWalker;
      const memo: HashMap = isHashMap(nameResolverOrMemo);
      super(walker, memo);
      this.nameResolver = this._cloneIfNeeded(walker.nameResolver, memo);
      this.seenName = walker.seenName;
      this.seenValue = walker.seenValue;
      this.subwalker = walker.subwalker !== undefined ?
        walker.subwalker._clone(memo) : undefined;
      // No need to clone; values are immutable.
      this.attrNameEvent = walker.attrNameEvent;
    }
    else {
      const el: Attribute = elOrWalker;
      const nameResolver: NameResolver = isNameResolver(nameResolverOrMemo);
      super(el);
      this.nameResolver = nameResolver;
      this.attrNameEvent = new Event("attributeName", el.name);
      this.seenName = false;
      this.seenValue = false;
    }
  }

  _possible(): EventSet {
    // We've been suppressed!
    if (this.suppressedAttributes) {
      return new EventSet();
    }

    if (!this.seenName) {
      return new EventSet(this.attrNameEvent);
    }
    else if (!this.seenValue) {
      if (this.subwalker === undefined) {
        this.subwalker = this.el!.pat.newWalker(this.nameResolver);
      }

      const sub: EventSet = this.subwalker._possible();
      const ret: EventSet = new EventSet();
      // Convert text events to attributeValue events.
      sub.forEach((ev: Event) => {
        if (ev.params[0] !== "text") {
          throw new Error(`unexpected event type: ${ev.params[0]}`);
        }
        ret.add(new Event("attributeValue", ev.params[1]));
      });
      return ret;
    }

    return new EventSet();
  }

  possible(): EventSet {
    // _possible always return new sets.
    return this._possible();
  }

  fireEvent(ev: Event): FireEventResult {
    if (this.suppressedAttributes) {
      return undefined;
    }

    if (this.seenName) {
      if (!this.seenValue && ev.params[0] === "attributeValue") {
        this.seenValue = true;

        if (this.subwalker === undefined) {
          this.subwalker = this.el!.pat.newWalker(this.nameResolver);
        }

        // Convert the attributeValue event to a text event.
        const textEv: Event = new Event("text", ev.params[1]);
        let ret: FireEventResult = this.subwalker.fireEvent(textEv);

        if (ret === undefined) {
          return [new AttributeValueError("invalid attribute value",
                                          this.el.name)];
        }

        // Attributes end immediately.
        if (ret === false) {
          ret = this.subwalker.end();
        }

        return ret;
      }
    }
    else if (ev.params[0] === "attributeName" &&
             this.el.name.match(ev.params[1] as string,
                                ev.params[2] as string)) {
      this.seenName = true;
      return false;
    }

    return undefined;
  }

  _suppressAttributes(): void {
    this.suppressedAttributes = true;
  }

  canEnd(attribute: boolean = false): boolean {
    return this.seenValue;
  }

  end(attribute: boolean = false): EndResult {
    if (!this.seenName) {
      return [new AttributeNameError("attribute missing", this.el.name)];
    }
    else if (!this.seenValue) {
      return [new AttributeValueError("attribute value missing", this.el.name)];
    }
    return false;
  }
}

addWalker(Attribute, AttributeWalker);