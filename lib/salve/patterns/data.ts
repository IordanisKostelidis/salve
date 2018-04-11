/**
 * Pattern and walker for RNG's ``data`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Datatype, RawParameter, registry } from "../datatypes";
import { ValidationError } from "../errors";
import { HashMap } from "../hashstructs";
import { NameResolver } from "../name_resolver";
import { addWalker, EndResult, Event, EventSet, InternalWalker,
         Pattern } from "./base";
/**
 * Data pattern.
 */
export class Data extends Pattern {
  readonly datatype: Datatype;
  readonly rngParams: RawParameter[];
  private _params: any;

  /**
   *
   * @param xmlPath This is a string which uniquely identifies the
   * element from the simplified RNG tree. Used in debugging.
   *
   * @param type The type of value.
   *
   * @param datatypeLibrary The URI of the datatype library to use.
   *
   * @param params The parameters from the RNG file.
   *
   * @param except The exception pattern.
   */
  // tslint:disable-next-line: no-reserved-keywords
  constructor(xmlPath: string, readonly type: string = "token",
              readonly datatypeLibrary: string = "", params?: RawParameter[],
              readonly except?: Pattern) {
    super(xmlPath);
    this.datatype = registry.get(this.datatypeLibrary).types[this.type];
    if (this.datatype === undefined) {
      throw new Error(`unknown type: ${type}`);
    }
    this.rngParams = params !== undefined ? params : [];
  }

  get params(): any {
    let ret: any = this._params;
    if (ret != null) {
      return ret;
    }

    ret = this._params = this.datatype.parseParams(this.xmlPath,
                                                   this.rngParams);

    return ret;
  }
}

/**
 * Walker for [[Data]].
 */
class DataWalker extends InternalWalker<Data> {
  private readonly context: { resolver: NameResolver } | undefined;
  private matched: boolean;
  private readonly nameResolver: NameResolver;

  /**
   * @param el The pattern for which this walker was created.
   *
   * @param resolver The name resolver that can be used to convert namespace
   * prefixes to namespaces.
   */
  protected constructor(other: DataWalker, memo: HashMap);
  protected constructor(el: Data, nameResolver: NameResolver);
  protected constructor(elOrWalker: DataWalker | Data,
                        nameResolverOrMemo: NameResolver | HashMap) {
    if ((elOrWalker as Data).newWalker !== undefined) {
      const el = elOrWalker as Data;
      const nameResolver = nameResolverOrMemo as NameResolver;
      super(el);

      this.nameResolver = nameResolver;
      this.context = el.datatype.needsContext ?
        { resolver: this.nameResolver } : undefined;
      this.matched = false;
    }
    else {
      const walker = elOrWalker as DataWalker;
      const memo = nameResolverOrMemo as HashMap;
      super(walker, memo);
      this.nameResolver = this._cloneIfNeeded(walker.nameResolver, memo);
      this.context = walker.context !== undefined ?
        { resolver: this.nameResolver } : undefined;
      this.matched = walker.matched;
    }
  }

  _possible(): EventSet {
    if (this.possibleCached === undefined) {
      // We completely ignore the possible exception when producing the
      // possibilities. There is no clean way to specify such an exception.
      this.possibleCached = this.matched ? new EventSet() :
        new EventSet(new Event("text", this.el.datatype.regexp));
    }

    return this.possibleCached;
  }

  fireEvent(ev: Event): false | undefined {
    if (this.matched || ev.params[0] !== "text" ||
        this.el.datatype.disallows(ev.params[1] as string, this.el.params,
                                   this.context)) {
      return undefined;
    }

    if (this.el.except !== undefined) {
      const walker = this.el.except.newWalker(this.nameResolver);
      const exceptRet = walker.fireEvent(ev);

      // False, so the except does match the text, and so this pattern does
      // not match it.
      if (exceptRet === false) {
        return undefined;
      }

      // Otherwise, it is undefined, in which case it means the except does
      // not match the text, and we are fine. Or it would be possible for the
      // walker to have returned an error but there is nothing we can do with
      // such errors here.
    }

    this.matched = true;
    this.possibleCached = undefined;

    return false;
  }

  canEnd(attribute: boolean = false): boolean {
    // If we matched, we are done. salve does not allow text that appears in
    // an XML element to be passed as two "text" events. So there is nothing
    // to come that could falsify the match. (If a client *does* pass
    // multiple text events one after the other, it is using salve
    // incorrectly.)
    if (this.matched) {
      return true;
    }

    // We have not matched anything. Therefore we have to check whether we
    // allow the empty string.
    if (this.el.except !== undefined) {
      const walker = this.el.except.newWalker(this.nameResolver);
      if (walker.canEnd()) { // Matches the empty string
        return false;
      }
    }

    return !this.el.datatype.disallows("", this.el.params, this.context);
  }

  end(attribute: boolean = false): EndResult {
    return this.canEnd(attribute) ? false :
      [new ValidationError("value required")];
  }

  _suppressAttributes(): void {
    // No child attributes.
  }
}

addWalker(Data, DataWalker);

//  LocalWords:  RNG's MPL RNG nd possibleCached
