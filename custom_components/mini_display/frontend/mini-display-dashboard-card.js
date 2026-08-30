const R = globalThis, F = R.ShadowRoot && (R.ShadyCSS === void 0 || R.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = /* @__PURE__ */ Symbol(), tt = /* @__PURE__ */ new WeakMap();
let ct = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== Z) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (F && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = tt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && tt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const yt = (i) => new ct(typeof i == "string" ? i : i + "", void 0, Z), J = (i, ...t) => {
  const e = i.length === 1 ? i[0] : t.reduce((s, r, n) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[n + 1], i[0]);
  return new ct(e, i, Z);
}, vt = (i, t) => {
  if (F) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), r = R.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = e.cssText, i.appendChild(s);
  }
}, et = F ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return yt(e);
})(i) : i;
const { is: bt, defineProperty: _t, getOwnPropertyDescriptor: xt, getOwnPropertyNames: At, getOwnPropertySymbols: wt, getPrototypeOf: Et } = Object, z = globalThis, st = z.trustedTypes, St = st ? st.emptyScript : "", Ct = z.reactiveElementPolyfillSupport, T = (i, t) => i, j = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? St : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, K = (i, t) => !bt(i, t), it = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: K };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let w = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = it) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, s, e);
      r !== void 0 && _t(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: r, set: n } = xt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(o) {
      this[e] = o;
    } };
    return { get: r, set(o) {
      const l = r?.call(this);
      n?.call(this, o), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(T("elementProperties"))) return;
    const t = Et(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(T("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(T("properties"))) {
      const e = this.properties, s = [...At(e), ...wt(e)];
      for (const r of s) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, r] of e) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const r = this._$Eu(e, s);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const r of s) e.unshift(et(r));
    } else t !== void 0 && e.push(et(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return vt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    const s = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, s);
    if (r !== void 0 && s.reflect === !0) {
      const n = (s.converter?.toAttribute !== void 0 ? s.converter : j).toAttribute(e, s.type);
      this._$Em = t, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, r = s._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const n = s.getPropertyOptions(r), o = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : j;
      this._$Em = r;
      const l = o.fromAttribute(e, n.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, r = !1, n) {
    if (t !== void 0) {
      const o = this.constructor;
      if (r === !1 && (n = this[t]), s ??= o.getPropertyOptions(t), !((s.hasChanged ?? K)(n, e) || s.useDefault && s.reflect && n === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: r, wrapped: n }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? e ?? this[t]), n !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, n] of this._$Ep) this[r] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, n] of s) {
        const { wrapped: o } = n, l = this[r];
        o !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, n, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
w.elementStyles = [], w.shadowRootOptions = { mode: "open" }, w[T("elementProperties")] = /* @__PURE__ */ new Map(), w[T("finalized")] = /* @__PURE__ */ new Map(), Ct?.({ ReactiveElement: w }), (z.reactiveElementVersions ??= []).push("2.1.2");
const G = globalThis, rt = (i) => i, I = G.trustedTypes, nt = I ? I.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, pt = "$lit$", m = `lit$${Math.random().toFixed(9).slice(2)}$`, ut = "?" + m, Pt = `<${ut}>`, A = document, U = () => A.createComment(""), k = (i) => i === null || typeof i != "object" && typeof i != "function", Q = Array.isArray, Ot = (i) => Q(i) || typeof i?.[Symbol.iterator] == "function", q = `[ 	
\f\r]`, M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ot = /-->/g, at = />/g, b = RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), lt = /'/g, ht = /"/g, gt = /^(?:script|style|textarea|title)$/i, Mt = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), c = Mt(1), E = /* @__PURE__ */ Symbol.for("lit-noChange"), h = /* @__PURE__ */ Symbol.for("lit-nothing"), dt = /* @__PURE__ */ new WeakMap(), _ = A.createTreeWalker(A, 129);
function $t(i, t) {
  if (!Q(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return nt !== void 0 ? nt.createHTML(t) : t;
}
const Tt = (i, t) => {
  const e = i.length - 1, s = [];
  let r, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = M;
  for (let l = 0; l < e; l++) {
    const a = i[l];
    let p, u, d = -1, $ = 0;
    for (; $ < a.length && (o.lastIndex = $, u = o.exec(a), u !== null); ) $ = o.lastIndex, o === M ? u[1] === "!--" ? o = ot : u[1] !== void 0 ? o = at : u[2] !== void 0 ? (gt.test(u[2]) && (r = RegExp("</" + u[2], "g")), o = b) : u[3] !== void 0 && (o = b) : o === b ? u[0] === ">" ? (o = r ?? M, d = -1) : u[1] === void 0 ? d = -2 : (d = o.lastIndex - u[2].length, p = u[1], o = u[3] === void 0 ? b : u[3] === '"' ? ht : lt) : o === ht || o === lt ? o = b : o === ot || o === at ? o = M : (o = b, r = void 0);
    const f = o === b && i[l + 1].startsWith("/>") ? " " : "";
    n += o === M ? a + Pt : d >= 0 ? (s.push(p), a.slice(0, d) + pt + a.slice(d) + m + f) : a + m + (d === -2 ? l : f);
  }
  return [$t(i, n + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class N {
  constructor({ strings: t, _$litType$: e }, s) {
    let r;
    this.parts = [];
    let n = 0, o = 0;
    const l = t.length - 1, a = this.parts, [p, u] = Tt(t, e);
    if (this.el = N.createElement(p, s), _.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (r = _.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const d of r.getAttributeNames()) if (d.endsWith(pt)) {
          const $ = u[o++], f = r.getAttribute(d).split(m), H = /([.?@])?(.*)/.exec($);
          a.push({ type: 1, index: n, name: H[2], strings: f, ctor: H[1] === "." ? kt : H[1] === "?" ? Nt : H[1] === "@" ? Dt : L }), r.removeAttribute(d);
        } else d.startsWith(m) && (a.push({ type: 6, index: n }), r.removeAttribute(d));
        if (gt.test(r.tagName)) {
          const d = r.textContent.split(m), $ = d.length - 1;
          if ($ > 0) {
            r.textContent = I ? I.emptyScript : "";
            for (let f = 0; f < $; f++) r.append(d[f], U()), _.nextNode(), a.push({ type: 2, index: ++n });
            r.append(d[$], U());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ut) a.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = r.data.indexOf(m, d + 1)) !== -1; ) a.push({ type: 7, index: n }), d += m.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const s = A.createElement("template");
    return s.innerHTML = t, s;
  }
}
function S(i, t, e = i, s) {
  if (t === E) return t;
  let r = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const n = k(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== n && (r?._$AO?.(!1), n === void 0 ? r = void 0 : (r = new n(i), r._$AT(i, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = r : e._$Cl = r), r !== void 0 && (t = S(i, r._$AS(i, t.values), r, s)), t;
}
class Ut {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, r = (t?.creationScope ?? A).importNode(e, !0);
    _.currentNode = r;
    let n = _.nextNode(), o = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let p;
        a.type === 2 ? p = new D(n, n.nextSibling, this, t) : a.type === 1 ? p = new a.ctor(n, a.name, a.strings, this, t) : a.type === 6 && (p = new Ht(n, this, t)), this._$AV.push(p), a = s[++l];
      }
      o !== a?.index && (n = _.nextNode(), o++);
    }
    return _.currentNode = A, r;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class D {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, s, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = S(this, t, e), k(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ot(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && k(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, r = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = N.createElement($t(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const n = new Ut(r, this), o = n.u(this.options);
      n.p(e), this.T(o), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = dt.get(t.strings);
    return e === void 0 && dt.set(t.strings, e = new N(t)), e;
  }
  k(t) {
    Q(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, r = 0;
    for (const n of t) r === e.length ? e.push(s = new D(this.O(U()), this.O(U()), this, this.options)) : s = e[r], s._$AI(n), r++;
    r < e.length && (this._$AR(s && s._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = rt(t).nextSibling;
      rt(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class L {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, r, n) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(t, e = this, s, r) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) t = S(this, t, e, 0), o = !k(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
    else {
      const l = t;
      let a, p;
      for (t = n[0], a = 0; a < n.length - 1; a++) p = S(this, l[s + a], e, a), p === E && (p = this._$AH[a]), o ||= !k(p) || p !== this._$AH[a], p === h ? t = h : t !== h && (t += (p ?? "") + n[a + 1]), this._$AH[a] = p;
    }
    o && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class kt extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Nt extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Dt extends L {
  constructor(t, e, s, r, n) {
    super(t, e, s, r, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = S(this, t, e, 0) ?? h) === E) return;
    const s = this._$AH, r = t === h && s !== h || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, n = t !== h && (s === h || r);
    r && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ht {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S(this, t);
  }
}
const Rt = G.litHtmlPolyfillSupport;
Rt?.(N, D), (G.litHtmlVersions ??= []).push("3.3.3");
const jt = (i, t, e) => {
  const s = e?.renderBefore ?? t;
  let r = s._$litPart$;
  if (r === void 0) {
    const n = e?.renderBefore ?? null;
    s._$litPart$ = r = new D(t.insertBefore(U(), n), n, void 0, e ?? {});
  }
  return r._$AI(i), r;
};
const X = globalThis;
class x extends w {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = jt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return E;
  }
}
x._$litElement$ = !0, x.finalized = !0, X.litElementHydrateSupport?.({ LitElement: x });
const It = X.litElementPolyfillSupport;
It?.({ LitElement: x });
(X.litElementVersions ??= []).push("4.2.2");
const Y = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
const zt = { attribute: !0, type: String, converter: j, reflect: !1, hasChanged: K }, Lt = (i = zt, t, e) => {
  const { kind: s, metadata: r } = e;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), n.set(e.name, i), s === "accessor") {
    const { name: o } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(o, a, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: o } = e;
    return function(l) {
      const a = this[o];
      t.call(this, l), this.requestUpdate(o, a, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function O(i) {
  return (t, e) => typeof e == "object" ? Lt(i, t, e) : ((s, r, n) => {
    const o = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, s), o ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(i, t, e);
}
function y(i) {
  return O({ ...i, state: !0, attribute: !1 });
}
var Bt = Object.defineProperty, Wt = Object.getOwnPropertyDescriptor, B = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Wt(t, e) : t, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(t, e, r) : o(r)) || r);
  return s && r && Bt(t, e, r), r;
};
let C = class extends x {
  constructor() {
    super(...arguments), this.page = 0;
  }
  render() {
    const i = this.dashboard?.pages[this.page];
    return i ? c`<div class="screen">${i.title ? c`<h3>${i.title}</h3>` : null}${i.rows.map((t) => c`<div class="group" style="flex:${t.weight ?? 1}">${t.title && t.showTitle !== !1 ? c`<div class="title">${t.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${t.cards.length},minmax(0,1fr))">${t.cards.map((e) => {
      const s = e.source ? this.hass?.states[e.source]?.state ?? "—" : e.type === "clock" ? (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : e.text ?? "—", r = Number(s), n = e.minimum ?? 0, o = e.maximum ?? 100, l = Number.isFinite(r) && o > n ? Math.max(0, Math.min(100, (r - n) / (o - n) * 100)) : 0;
      return c`<div class="card" style=${`background:${e.style?.background ?? "#20242d"};color:${e.style?.foreground ?? "white"}`}><small>${e.title ?? ""}</small><div class="value">${s}${e.unit ? ` ${e.unit}` : ""}</div>${e.progress && e.progress !== "none" ? c`<div class="bar"><i style=${`width:${l}%;background:${e.style?.accent ?? "#42a5f5"}`}></i></div>` : null}</div>`;
    })}</div></div>`)}</div>` : c`<div class="screen">No dashboard</div>`;
  }
};
C.styles = J`
    :host{display:block}.screen{box-sizing:border-box;width:240px;height:240px;padding:6px;background:#090b10;color:white;border-radius:10px;display:flex;flex-direction:column;gap:4px;overflow:hidden}
    h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.card small{font:9px sans-serif;color:#bbb}.value{font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px}.bar i{display:block;height:100%;background:#42a5f5}
  `;
B([
  O({ attribute: !1 })
], C.prototype, "dashboard", 2);
B([
  O({ attribute: !1 })
], C.prototype, "hass", 2);
B([
  O({ type: Number })
], C.prototype, "page", 2);
C = B([
  Y("mini-display-preview")
], C);
var qt = Object.defineProperty, Vt = Object.getOwnPropertyDescriptor, W = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Vt(t, e) : t, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(t, e, r) : o(r)) || r);
  return s && r && qt(t, e, r), r;
};
let P = class extends x {
  setConfig(i) {
    if (!i.config_entry_id) throw new Error("Select a Mini-Display");
    this.config = i, this.load();
  }
  updated(i) {
    i.has("hass") && !this.dashboard && this.load();
  }
  async load() {
    !this.hass || !this.config || (this.dashboard = await this.hass.callWS({ type: "mini_display/dashboard/get", config_entry_id: this.config.config_entry_id }));
  }
  static getConfigElement() {
    return document.createElement("mini-display-dashboard-card-editor");
  }
  static getStubConfig() {
    return { config_entry_id: "", show_preview: !0 };
  }
  getCardSize() {
    return 4;
  }
  getGridOptions() {
    return { columns: 6, rows: 4, min_columns: 3, min_rows: 2 };
  }
  render() {
    return c`<ha-card><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass}></mini-display-preview></ha-card>`;
  }
};
P.styles = J`ha-card{padding:16px}mini-display-preview{width:max-content;margin:auto}`;
W([
  O({ attribute: !1 })
], P.prototype, "hass", 2);
W([
  y()
], P.prototype, "config", 2);
W([
  y()
], P.prototype, "dashboard", 2);
P = W([
  Y("mini-display-dashboard-card")
], P);
const V = (i = "number") => i === "clock" ? { type: i, format: "24h", showDate: !0 } : i === "text" ? { type: i, text: "Text" } : i === "status" ? { type: i, source: "binary_sensor.example", onText: "On", offText: "Off" } : { type: i, source: "sensor.example", progress: "none" }, ft = () => ({ weight: 1, gap: "small", cards: [V("clock")] }), mt = (i) => ({ id: `page_${i}`, title: `Page ${i}`, durationSeconds: 10, enabled: !0, rows: [ft()] }), Ft = () => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [mt(1)] });
var Zt = Object.defineProperty, Jt = Object.getOwnPropertyDescriptor, v = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Jt(t, e) : t, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(t, e, r) : o(r)) || r);
  return s && r && Zt(t, e, r), r;
};
let g = class extends x {
  constructor() {
    super(...arguments), this.config = { config_entry_id: "" }, this.displays = [], this.pageIndex = 0, this.message = "";
  }
  setConfig(i) {
    this.config = i, this.load();
  }
  changed() {
    this.dashboard = structuredClone(this.dashboard), this.message = "Unsaved changes";
  }
  async load() {
    this.hass && (this.displays = await this.hass.callWS({ type: "mini_display/displays" }), this.config.config_entry_id && (this.dashboard = await this.hass.callWS({ type: "mini_display/dashboard/get", config_entry_id: this.config.config_entry_id }) ?? Ft()));
  }
  updated(i) {
    i.has("hass") && !this.dashboard && this.load();
  }
  emitConfig(i) {
    this.config = { ...this.config, config_entry_id: i }, this.dispatchEvent(new CustomEvent("config-changed", { bubbles: !0, composed: !0, detail: { config: this.config } })), this.dashboard = void 0, this.load();
  }
  async apply() {
    !this.hass || !this.dashboard || (await this.hass.callWS({ type: "mini_display/dashboard/set", config_entry_id: this.config.config_entry_id, dashboard: this.dashboard }), this.message = "Saved and sent to display");
  }
  field(i, t, e, s = "text") {
    return c`<label>${i}<input type=${s} .value=${String(t ?? "")} @change=${(r) => e(r.target.value)}></label>`;
  }
  select(i, t, e, s) {
    return c`<label>${i}<select .value=${t} @change=${(r) => s(r.target.value)}>${e.map((r) => c`<option value=${r}>${r}</option>`)}</select></label>`;
  }
  entity(i) {
    return c`<label>Entity<ha-entity-picker .hass=${this.hass} .value=${i.source ?? ""} allow-custom-entity @value-changed=${(t) => {
      i.source = t.detail.value, this.changed();
    }}></ha-entity-picker></label>`;
  }
  styleEditor(i) {
    const t = i.style ??= {}, e = i.valueStyle ??= {};
    return c`<details><summary>Colors and font</summary><div class="grid">${this.field("Background", t.background, (s) => {
      t.background = s, this.changed();
    })}${this.field("Foreground", t.foreground, (s) => {
      t.foreground = s, this.changed();
    })}${this.field("Accent", t.accent, (s) => {
      t.accent = s, this.changed();
    })}${this.select("Font", e.fontFamily ?? "sans", ["sans", "sans-bold", "mono", "serif"], (s) => {
      e.fontFamily = s, this.changed();
    })}${this.select("Font size", e.fontSize ?? "auto", ["auto", "small", "medium", "large", "xlarge"], (s) => {
      e.fontSize = s, this.changed();
    })}</div></details>`;
  }
  cardSettings(i, t, e) {
    return c`<div class="settings"><div class="card-head"><b>Card ${e + 1} settings</b><button class="danger" @click=${() => {
      const s = this.dashboard.pages[this.pageIndex].rows[t].cards;
      s.length > 1 && (s.splice(e, 1), this.selected = void 0, this.changed());
    }}>Delete</button></div><div class="grid">${this.select("Type", i.type, ["number", "text", "clock", "status"], (s) => {
      Object.keys(i).forEach((r) => delete i[r]), Object.assign(i, V(s)), this.changed();
    })}${this.field("Title", i.title, (s) => {
      i.title = s, this.changed();
    })}${["number", "status", "text"].includes(i.type) ? this.entity(i) : h}${i.type === "number" ? c`${this.field("Unit", i.unit, (s) => {
      i.unit = s, this.changed();
    })}${this.field("Minimum", i.minimum, (s) => {
      i.minimum = Number(s), this.changed();
    }, "number")}${this.field("Maximum", i.maximum, (s) => {
      i.maximum = Number(s), this.changed();
    }, "number")}${this.select("Progress", i.progress ?? "none", ["none", "bar", "ring"], (s) => {
      i.progress = s, this.changed();
    })}` : h}${i.type === "text" ? this.field("Static text", i.text, (s) => {
      i.text = s, this.changed();
    }) : h}${i.type === "status" ? c`${this.field("On text", i.onText, (s) => {
      i.onText = s, this.changed();
    })}${this.field("Off text", i.offText, (s) => {
      i.offText = s, this.changed();
    })}` : h}</div>${this.styleEditor(i)}</div>`;
  }
  render() {
    const i = this.dashboard?.pages[this.pageIndex];
    return c`<div class="layout"><div class="editor"><label>Display<select .value=${this.config.config_entry_id} @change=${(t) => this.emitConfig(t.target.value)}><option value="">Select display</option>${this.displays.map((t) => c`<option value=${t.config_entry_id}>${t.title}${t.available ? "" : " (offline)"}</option>`)}</select></label>${i ? c`<div class="tabs">${this.dashboard.pages.map((t, e) => c`<button class=${e === this.pageIndex ? "primary" : ""} @click=${() => {
      this.pageIndex = e, this.selected = void 0;
    }}>${t.title || t.id}</button>`)}<button @click=${() => {
      this.dashboard.pages.push(mt(this.dashboard.pages.length + 1)), this.pageIndex = this.dashboard.pages.length - 1, this.changed();
    }}>+ Page</button></div><div class="panel"><div class="toolbar"><b>Page</b><button class="danger" @click=${() => {
      this.dashboard.pages.length > 1 && (this.dashboard.pages.splice(this.pageIndex, 1), this.pageIndex = Math.max(0, this.pageIndex - 1), this.changed());
    }}>Delete</button></div><div class="grid">${this.field("ID", i.id, (t) => {
      i.id = t, this.changed();
    })}${this.field("Title", i.title, (t) => {
      i.title = t, this.changed();
    })}${this.field("Duration seconds", i.durationSeconds, (t) => {
      i.durationSeconds = Number(t), this.changed();
    }, "number")}</div></div>${i.rows.map((t, e) => c`<div class="row-panel"><div class="row-head"><b>Row ${e + 1}</b><span><button class="danger" @click=${() => {
      i.rows.length > 1 && (i.rows.splice(e, 1), this.changed());
    }}>Delete</button></span></div><div class="grid">${this.field("Row title", t.title, (s) => {
      t.title = s, this.changed();
    })}${this.field("Height weight", t.weight, (s) => {
      t.weight = Number(s), this.changed();
    }, "number")}</div><div class="cards" style=${`grid-template-columns:repeat(${t.cards.length},minmax(0,1fr))`}>${t.cards.map((s, r) => c`<div class="tile" ?selected=${this.selected?.row === e && this.selected?.card === r} @click=${() => this.selected = { row: e, card: r }}><strong>${s.title || s.type}</strong><small>${s.source || s.text || s.type}</small></div>`)}</div>${this.selected?.row === e ? this.cardSettings(t.cards[this.selected.card], e, this.selected.card) : h}${t.cards.length < 3 ? c`<button @click=${() => {
      t.cards.push(V()), this.selected = { row: e, card: t.cards.length - 1 }, this.changed();
    }}>+ Card</button>` : h}</div>`)}${i.rows.length < 6 ? c`<button @click=${() => {
      i.rows.push(ft()), this.changed();
    }}>+ Row</button>` : h}<button class="primary" @click=${this.apply}>Apply to display</button><div class="message">${this.message}</div>` : h}</div><aside class="preview"><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass} .page=${this.pageIndex}></mini-display-preview></aside></div>`;
  }
};
g.styles = J`
    :host{display:block}.layout{display:grid;grid-template-columns:minmax(320px,1fr) 270px;gap:16px}.editor{display:grid;gap:12px}.preview{position:sticky;top:8px;height:max-content}.toolbar,.tabs,.row-head,.card-head{display:flex;align-items:center;justify-content:space-between;gap:6px}.tabs{justify-content:flex-start;overflow:auto}.panel,.row-panel,.settings{padding:12px;border:1px solid var(--divider-color);border-radius:10px;display:grid;gap:10px}.cards{display:grid;gap:8px}.tile{min-width:0;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 5%);cursor:pointer}.tile[selected]{outline:2px solid var(--primary-color)}.tile strong,.tile small{display:block;overflow:hidden;text-overflow:ellipsis}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}label{display:grid;gap:4px;font-size:12px}input,select,button{box-sizing:border-box;min-height:36px;padding:6px 9px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px}button{cursor:pointer}.primary{background:var(--primary-color);color:var(--text-primary-color)}.danger{color:var(--error-color)}ha-entity-picker{display:block}.message{color:var(--secondary-text-color)}
    @media(max-width:800px){.layout{grid-template-columns:1fr}.preview{position:static;order:-1}.grid{grid-template-columns:1fr}}
  `;
v([
  O({ attribute: !1 })
], g.prototype, "hass", 2);
v([
  y()
], g.prototype, "config", 2);
v([
  y()
], g.prototype, "dashboard", 2);
v([
  y()
], g.prototype, "displays", 2);
v([
  y()
], g.prototype, "pageIndex", 2);
v([
  y()
], g.prototype, "selected", 2);
v([
  y()
], g.prototype, "message", 2);
g = v([
  Y("mini-display-dashboard-card-editor")
], g);
window.customCards ??= [];
window.customCards.some((i) => i.type === "mini-display-dashboard-card") || window.customCards.push({ type: "mini-display-dashboard-card", name: "Home Assistant Mini-Display", description: "Configure and preview a physical Mini-Display", preview: !0 });
//# sourceMappingURL=mini-display-dashboard-card.js.map
