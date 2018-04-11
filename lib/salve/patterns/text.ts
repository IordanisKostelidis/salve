/**
 * Pattern and walker for RNG's ``text`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { HashMap } from "../hashstructs";
import { addWalker, Event, EventSet, InternalWalker, Pattern } from "./base";

/**
 * Pattern for ``<text/>``.
 */
export class Text extends Pattern {}

/**
 *
 * Walker for [[Text]]
 *
 */
class TextWalker extends InternalWalker<Text> {
  private static readonly _textEvent: Event = new Event("text", /^.*$/);

  private ended: boolean;

  /**
   * @param el The pattern for which this walker was constructed.
   */
  protected constructor(walker: TextWalker, memo: HashMap);
  protected constructor(el: Text);
  protected constructor(elOrWalker: TextWalker | Text, memo?: HashMap) {
    if ((elOrWalker as Text).newWalker !== undefined) {
      super(elOrWalker as Text);
      this.ended = false;
    }
    else {
      const walker = elOrWalker as TextWalker;
      super(walker, memo as HashMap);
      this.ended = walker.ended;
    }
  }

  _possible(): EventSet {
    if (this.possibleCached === undefined) {
      this.possibleCached = new EventSet(TextWalker._textEvent);
    }

    return this.possibleCached;
  }

  fireEvent(ev: Event): false | undefined {
    return !this.ended && (ev.params[0] === "text") ? false : undefined;
  }

  _suppressAttributes(): void {
    // We don't contain attributes...
  }

  end(): false {
    this.ended = true;

    return false;
  }
}
addWalker(Text, TextWalker);

//  LocalWords:  RNG's MPL possibleCached
