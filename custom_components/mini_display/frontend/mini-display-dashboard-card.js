const z = globalThis, F = z.ShadowRoot && (z.ShadyCSS === void 0 || z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = /* @__PURE__ */ Symbol(), tt = /* @__PURE__ */ new WeakMap();
let ht = class {
  constructor(t, s, i) {
    if (this._$cssResult$ = !0, i !== Z) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (F && t === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (t = tt.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && tt.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const yt = (e) => new ht(typeof e == "string" ? e : e + "", void 0, Z), J = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + e[o + 1], e[0]);
  return new ht(s, e, Z);
}, bt = (e, t) => {
  if (F) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), r = z.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = s.cssText, e.appendChild(i);
  }
}, et = F ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return yt(s);
})(e) : e;
const { is: vt, defineProperty: _t, getOwnPropertyDescriptor: wt, getOwnPropertyNames: xt, getOwnPropertySymbols: At, getPrototypeOf: St } = Object, B = globalThis, st = B.trustedTypes, Et = st ? st.emptyScript : "", Ct = B.reactiveElementPolyfillSupport, M = (e, t) => e, j = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Et : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let s = e;
  switch (t) {
    case Boolean:
      s = e !== null;
      break;
    case Number:
      s = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(e);
      } catch {
        s = null;
      }
  }
  return s;
} }, K = (e, t) => !vt(e, t), it = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: K };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), B.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = it) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, s);
      r !== void 0 && _t(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, s, i) {
    const { get: r, set: o } = wt(this.prototype, t) ?? { get() {
      return this[s];
    }, set(n) {
      this[s] = n;
    } };
    return { get: r, set(n) {
      const l = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(M("elementProperties"))) return;
    const t = St(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(M("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(M("properties"))) {
      const s = this.properties, i = [...xt(s), ...At(s)];
      for (const r of i) this.createProperty(r, s[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [i, r] of s) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const r = this._$Eu(s, i);
      r !== void 0 && this._$Eh.set(r, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) s.unshift(et(r));
    } else t !== void 0 && s.push(et(t));
    return s;
  }
  static _$Eu(t, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
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
    const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return bt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, i) {
    this._$AK(t, i);
  }
  _$ET(t, s) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : j).toAttribute(s, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : j;
      this._$Em = r;
      const l = n.fromAttribute(s, o.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, s, i, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), i ??= n.getPropertyOptions(t), !((i.hasChanged ?? K)(o, s) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: i, reflect: r, wrapped: o }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? s ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, o] of i) {
        const { wrapped: n } = o, l = this[r];
        n !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, o, l);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(s);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[M("elementProperties")] = /* @__PURE__ */ new Map(), C[M("finalized")] = /* @__PURE__ */ new Map(), Ct?.({ ReactiveElement: C }), (B.reactiveElementVersions ??= []).push("2.1.2");
const G = globalThis, rt = (e) => e, L = G.trustedTypes, ot = L ? L.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, pt = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ut = "?" + v, kt = `<${ut}>`, A = document, U = () => A.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", Q = Array.isArray, Pt = (e) => Q(e) || typeof e?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, at = />/g, _ = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), lt = /'/g, dt = /"/g, gt = /^(?:script|style|textarea|title)$/i, Ot = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), d = Ot(1), k = /* @__PURE__ */ Symbol.for("lit-noChange"), h = /* @__PURE__ */ Symbol.for("lit-nothing"), ct = /* @__PURE__ */ new WeakMap(), w = A.createTreeWalker(A, 129);
function ft(e, t) {
  if (!Q(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ot !== void 0 ? ot.createHTML(t) : t;
}
const Tt = (e, t) => {
  const s = e.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = T;
  for (let l = 0; l < s; l++) {
    const a = e[l];
    let p, u, c = -1, m = 0;
    for (; m < a.length && (n.lastIndex = m, u = n.exec(a), u !== null); ) m = n.lastIndex, n === T ? u[1] === "!--" ? n = nt : u[1] !== void 0 ? n = at : u[2] !== void 0 ? (gt.test(u[2]) && (r = RegExp("</" + u[2], "g")), n = _) : u[3] !== void 0 && (n = _) : n === _ ? u[0] === ">" ? (n = r ?? T, c = -1) : u[1] === void 0 ? c = -2 : (c = n.lastIndex - u[2].length, p = u[1], n = u[3] === void 0 ? _ : u[3] === '"' ? dt : lt) : n === dt || n === lt ? n = _ : n === nt || n === at ? n = T : (n = _, r = void 0);
    const b = n === _ && e[l + 1].startsWith("/>") ? " " : "";
    o += n === T ? a + kt : c >= 0 ? (i.push(p), a.slice(0, c) + pt + a.slice(c) + v + b) : a + v + (c === -2 ? l : b);
  }
  return [ft(e, o + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class N {
  constructor({ strings: t, _$litType$: s }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [p, u] = Tt(t, s);
    if (this.el = N.createElement(p, i), w.currentNode = this.el.content, s === 2 || s === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = w.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(pt)) {
          const m = u[n++], b = r.getAttribute(c).split(v), H = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: o, name: H[2], strings: b, ctor: H[1] === "." ? Ut : H[1] === "?" ? Dt : H[1] === "@" ? Nt : I }), r.removeAttribute(c);
        } else c.startsWith(v) && (a.push({ type: 6, index: o }), r.removeAttribute(c));
        if (gt.test(r.tagName)) {
          const c = r.textContent.split(v), m = c.length - 1;
          if (m > 0) {
            r.textContent = L ? L.emptyScript : "";
            for (let b = 0; b < m; b++) r.append(c[b], U()), w.nextNode(), a.push({ type: 2, index: ++o });
            r.append(c[m], U());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ut) a.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(v, c + 1)) !== -1; ) a.push({ type: 7, index: o }), c += v.length - 1;
      }
      o++;
    }
  }
  static createElement(t, s) {
    const i = A.createElement("template");
    return i.innerHTML = t, i;
  }
}
function P(e, t, s = e, i) {
  if (t === k) return t;
  let r = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const o = D(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(e), r._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = r : s._$Cl = r), r !== void 0 && (t = P(e, r._$AS(e, t.values), r, i)), t;
}
class Mt {
  constructor(t, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: s }, parts: i } = this._$AD, r = (t?.creationScope ?? A).importNode(s, !0);
    w.currentNode = r;
    let o = w.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let p;
        a.type === 2 ? p = new R(o, o.nextSibling, this, t) : a.type === 1 ? p = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (p = new Rt(o, this, t)), this._$AV.push(p), a = i[++l];
      }
      n !== a?.index && (o = w.nextNode(), n++);
    }
    return w.currentNode = A, r;
  }
  p(t) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, s), s += i.strings.length - 2) : i._$AI(t[s])), s++;
  }
}
class R {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, i, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && t?.nodeType === 11 && (t = s.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, s = this) {
    t = P(this, t, s), D(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== k && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Pt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && D(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = N.createElement(ft(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(s);
    else {
      const o = new Mt(r, this), n = o.u(this.options);
      o.p(s), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let s = ct.get(t.strings);
    return s === void 0 && ct.set(t.strings, s = new N(t)), s;
  }
  k(t) {
    Q(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, r = 0;
    for (const o of t) r === s.length ? s.push(i = new R(this.O(U()), this.O(U()), this, this.options)) : i = s[r], i._$AI(o), r++;
    r < s.length && (this._$AR(i && i._$AB.nextSibling, r), s.length = r);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const i = rt(t).nextSibling;
      rt(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class I {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, i, r, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = s, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(t, s = this, i, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = P(this, t, s, 0), n = !D(t) || t !== this._$AH && t !== k, n && (this._$AH = t);
    else {
      const l = t;
      let a, p;
      for (t = o[0], a = 0; a < o.length - 1; a++) p = P(this, l[i + a], s, a), p === k && (p = this._$AH[a]), n ||= !D(p) || p !== this._$AH[a], p === h ? t = h : t !== h && (t += (p ?? "") + o[a + 1]), this._$AH[a] = p;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ut extends I {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Dt extends I {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Nt extends I {
  constructor(t, s, i, r, o) {
    super(t, s, i, r, o), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = P(this, t, s, 0) ?? h) === k) return;
    const i = this._$AH, r = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== h && (i === h || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Rt {
  constructor(t, s, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    P(this, t);
  }
}
const Ht = G.litHtmlPolyfillSupport;
Ht?.(N, R), (G.litHtmlVersions ??= []).push("3.3.3");
const zt = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = s?.renderBefore ?? null;
    i._$litPart$ = r = new R(t.insertBefore(U(), o), o, void 0, s ?? {});
  }
  return r._$AI(e), r;
};
const X = globalThis;
class x extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = zt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return k;
  }
}
x._$litElement$ = !0, x.finalized = !0, X.litElementHydrateSupport?.({ LitElement: x });
const jt = X.litElementPolyfillSupport;
jt?.({ LitElement: x });
(X.litElementVersions ??= []).push("4.2.2");
const Y = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
const Lt = { attribute: !0, type: String, converter: j, reflect: !1, hasChanged: K }, Bt = (e = Lt, t, s) => {
  const { kind: i, metadata: r } = s;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(s.name, e), i === "accessor") {
    const { name: n } = s;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, e, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, e, l), l;
    } };
  }
  if (i === "setter") {
    const { name: n } = s;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, e, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function S(e) {
  return (t, s) => typeof s == "object" ? Bt(e, t, s) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(e, t, s);
}
function f(e) {
  return S({ ...e, state: !0, attribute: !1 });
}
var It = Object.defineProperty, Wt = Object.getOwnPropertyDescriptor, E = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Wt(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && It(t, s, r), r;
};
let $ = class extends x {
  constructor() {
    super(...arguments), this.page = 0, this.autoRotate = !1, this.now = /* @__PURE__ */ new Date(), this.autoPage = 0, this.pageShownAt = Date.now();
  }
  connectedCallback() {
    super.connectedCallback(), this.clockTimer = window.setInterval(() => {
      this.now = /* @__PURE__ */ new Date();
      const e = this.dashboard?.pages ?? [], t = (e[this.autoPage]?.durationSeconds ?? 10) * 1e3;
      this.autoRotate && e.length > 1 && Date.now() - this.pageShownAt >= t && (this.autoPage = (this.autoPage + 1) % e.length, this.pageShownAt = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    window.clearInterval(this.clockTimer), super.disconnectedCallback();
  }
  cardValue(e) {
    if (e.type === "clock") return this.now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: e.showSeconds ? "2-digit" : void 0, hour12: e.format === "12h" });
    const t = e.source ? this.hass?.states[e.source]?.state ?? "—" : e.text ?? "—";
    return e.type === "status" ? ["on", "true", "1", "open", "home"].includes(t.toLowerCase()) ? e.onText ?? "On" : e.offText ?? "Off" : `${t}${e.unit ? ` ${e.unit}` : ""}`;
  }
  render() {
    const e = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page];
    return e ? d`<div class="screen">${e.title ? d`<h3>${e.title}</h3>` : null}${e.rows.map((t) => d`<div class="group" style="flex:${t.weight ?? 1}">${t.title && t.showTitle !== !1 ? d`<div class="title">${t.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${t.cards.length},minmax(0,1fr))">${t.cards.map((s) => {
      const i = s.source ? this.hass?.states[s.source]?.state ?? "—" : s.text ?? "—", r = Number(i), o = s.minimum ?? 0, n = s.maximum ?? 100, l = Number.isFinite(r) && n > o ? Math.max(0, Math.min(100, (r - o) / (n - o) * 100)) : 0, a = { sans: "sans-serif", "sans-bold": "sans-serif", mono: "monospace", serif: "serif" }[s.valueStyle?.fontFamily ?? "sans"], p = { auto: 14, small: 10, medium: 13, large: 17, xlarge: 22 }[s.valueStyle?.fontSize ?? "auto"], u = s.style?.background ?? "#20242d", c = s.style?.accent ?? "#42a5f5";
      return d`<div class="card" style=${`background:${u};color:${s.style?.foreground ?? "white"}`}><small>${s.title ?? ""}</small><div class="value" style=${`font-family:${a};font-size:${p}px;font-weight:${s.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`}>${this.cardValue(s)}</div>${s.progress === "bar" ? d`<div class="bar"><i style=${`width:${l}%;background:${c}`}></i></div>` : s.progress === "ring" ? d`<div class="ring" style=${`background:conic-gradient(${c} ${l}%,#3d424e 0);--ring-bg:${u}`}></div>` : null}</div>`;
    })}</div></div>`)}</div>` : d`<div class="screen loading" aria-label="Loading display preview"></div>`;
  }
};
$.styles = J`
    :host{display:block;width:240px;max-width:100%}.screen{box-sizing:border-box;width:100%;aspect-ratio:1;padding:6px;background:#090b10;color:white;border-radius:8px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.22)}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;text-align:center}.card small{font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value{font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring{width:42px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;margin:3px auto}.ring:after{content:"";width:30px;aspect-ratio:1;border-radius:50%;background:var(--ring-bg,#20242d)}
    @keyframes loading{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.loading{animation:none}}
  `;
E([
  S({ attribute: !1 })
], $.prototype, "dashboard", 2);
E([
  S({ attribute: !1 })
], $.prototype, "hass", 2);
E([
  S({ type: Number })
], $.prototype, "page", 2);
E([
  S({ type: Boolean })
], $.prototype, "autoRotate", 2);
E([
  f()
], $.prototype, "now", 2);
E([
  f()
], $.prototype, "autoPage", 2);
$ = E([
  Y("mini-display-preview")
], $);
var Vt = Object.defineProperty, qt = Object.getOwnPropertyDescriptor, W = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? qt(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && Vt(t, s, r), r;
};
let O = class extends x {
  constructor() {
    super(...arguments), this.dashboardUpdated = (e) => {
      e.detail?.configEntryId === this.config?.config_entry_id && this.load();
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("mini-display-dashboard-updated", this.dashboardUpdated);
  }
  disconnectedCallback() {
    window.removeEventListener("mini-display-dashboard-updated", this.dashboardUpdated), super.disconnectedCallback();
  }
  setConfig(e) {
    if (!e.config_entry_id) throw new Error("Select a Mini-Display");
    this.config = e, this.load();
  }
  updated(e) {
    e.has("hass") && !this.dashboard && this.load();
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
    return d`<ha-card><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass} .autoRotate=${!0}></mini-display-preview></ha-card>`;
  }
};
O.styles = J`ha-card{padding:16px}mini-display-preview{width:max-content;margin:auto}`;
W([
  S({ attribute: !1 })
], O.prototype, "hass", 2);
W([
  f()
], O.prototype, "config", 2);
W([
  f()
], O.prototype, "dashboard", 2);
O = W([
  Y("mini-display-dashboard-card")
], O);
const q = (e = "number") => e === "clock" ? { type: e, format: "24h", showDate: !0 } : e === "text" ? { type: e, text: "Text" } : e === "status" ? { type: e, source: "", onText: "On", offText: "Off" } : { type: e, source: "", progress: "none" }, mt = () => ({ weight: 1, gap: "small", cards: [q("clock")] }), $t = (e) => ({ id: `page_${e}`, title: `Page ${e}`, durationSeconds: 10, enabled: !0, rows: [mt()] }), Ft = () => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [$t(1)] });
var Zt = Object.defineProperty, Jt = Object.getOwnPropertyDescriptor, y = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Jt(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && Zt(t, s, r), r;
};
let g = class extends x {
  constructor() {
    super(...arguments), this.config = { config_entry_id: "" }, this.displays = [], this.pageIndex = 0, this.syncState = "idle", this.syncMessage = "";
  }
  setConfig(e) {
    this.config = e, this.load();
  }
  updated(e) {
    e.has("hass") && !this.dashboard && this.load();
  }
  disconnectedCallback() {
    window.clearTimeout(this.syncTimer), this.syncState === "syncing" && this.sync(), super.disconnectedCallback();
  }
  async load() {
    this.hass && (this.displays = await this.hass.callWS({ type: "mini_display/displays" }), this.config.config_entry_id && (this.dashboard = await this.hass.callWS({ type: "mini_display/dashboard/get", config_entry_id: this.config.config_entry_id }) ?? Ft()));
  }
  selectDisplay(e) {
    this.config = { ...this.config, config_entry_id: e }, this.dispatchEvent(new CustomEvent("config-changed", { bubbles: !0, composed: !0, detail: { config: this.config } })), this.dashboard = void 0, this.pageIndex = 0, this.selected = void 0, this.load();
  }
  changed() {
    this.dashboard = structuredClone(this.dashboard), this.syncState = "syncing", this.syncMessage = "Synchronizing", window.clearTimeout(this.syncTimer), this.syncTimer = window.setTimeout(() => {
      this.sync();
    }, 500);
  }
  async sync() {
    if (!(!this.hass || !this.dashboard || !this.config.config_entry_id))
      try {
        await this.hass.callWS({ type: "mini_display/dashboard/set", config_entry_id: this.config.config_entry_id, dashboard: this.dashboard }), this.syncState = "success", this.syncMessage = "Synchronized", window.dispatchEvent(new CustomEvent("mini-display-dashboard-updated", { detail: { configEntryId: this.config.config_entry_id } }));
      } catch (e) {
        this.syncState = "error", this.syncMessage = String(e);
      }
  }
  field(e, t, s, i = "text") {
    return d`<label>${e}<input type=${i} .value=${String(t ?? "")} @input=${(r) => s(r.target.value)}></label>`;
  }
  select(e, t, s, i) {
    return d`<label>${e}<select .value=${t} @change=${(r) => i(r.target.value)}>${s.map((r) => d`<option value=${r}>${r}</option>`)}</select></label>`;
  }
  entity(e) {
    return d`<ha-form .hass=${this.hass} .data=${{ entity: e.source ?? "" }} .schema=${[{ name: "entity", required: !0, selector: { entity: {} } }]} .computeLabel=${() => "Entity"} @value-changed=${(t) => {
      e.source = t.detail.value.entity, this.changed();
    }}></ha-form>`;
  }
  menu(e) {
    return d`<details class="menu"><summary aria-label="More actions"><ha-icon icon="mdi:dots-vertical"></ha-icon></summary><div class="menu-popover">${e}</div></details>`;
  }
  styleEditor(e) {
    const t = e.style ??= {}, s = e.valueStyle ??= {};
    return d`<details class="style"><summary>Appearance</summary><div class="grid">${this.field("Background", t.background, (i) => {
      t.background = i, this.changed();
    })}${this.field("Text color", t.foreground, (i) => {
      t.foreground = i, this.changed();
    })}${this.field("Accent", t.accent, (i) => {
      t.accent = i, this.changed();
    })}${this.select("Font", s.fontFamily ?? "sans", ["sans", "sans-bold", "mono", "serif"], (i) => {
      s.fontFamily = i, this.changed();
    })}${this.select("Font size", s.fontSize ?? "auto", ["auto", "small", "medium", "large", "xlarge"], (i) => {
      s.fontSize = i, this.changed();
    })}</div></details>`;
  }
  cardSettings(e, t, s) {
    const i = this.dashboard.pages[this.pageIndex].rows[t].cards;
    return d`<section class="card-settings"><div class="card-head"><strong>${e.title || `Card ${s + 1}`}</strong>${this.menu(d`<button @click=${() => {
      i.splice(s + 1, 0, structuredClone(e)), this.selected = { row: t, card: s + 1 }, this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${i.length === 1} @click=${() => {
      i.length > 1 && (i.splice(s, 1), this.selected = void 0, this.changed());
    }}>Delete</button>`)}</div><div class="grid">${this.select("Type", e.type, ["number", "text", "clock", "status"], (r) => {
      Object.keys(e).forEach((o) => delete e[o]), Object.assign(e, q(r)), this.changed();
    })}${this.field("Title", e.title, (r) => {
      e.title = r, this.changed();
    })}${["number", "status", "text"].includes(e.type) ? this.entity(e) : h}${e.type === "number" ? d`${this.field("Unit", e.unit, (r) => {
      e.unit = r, this.changed();
    })}${this.field("Minimum", e.minimum, (r) => {
      e.minimum = Number(r), this.changed();
    }, "number")}${this.field("Maximum", e.maximum, (r) => {
      e.maximum = Number(r), this.changed();
    }, "number")}${this.select("Progress", e.progress ?? "none", ["none", "bar", "ring"], (r) => {
      e.progress = r, this.changed();
    })}` : h}${e.type === "text" ? this.field("Static text", e.text, (r) => {
      e.text = r, this.changed();
    }) : h}${e.type === "status" ? d`${this.field("On text", e.onText, (r) => {
      e.onText = r, this.changed();
    })}${this.field("Off text", e.offText, (r) => {
      e.offText = r, this.changed();
    })}` : h}</div>${this.styleEditor(e)}</section>`;
  }
  rowEditor(e, t) {
    const s = this.dashboard.pages[this.pageIndex];
    return d`<section class="row-panel"><div class="row-head"><div class="row-title"><strong>Row ${t + 1}</strong><small>${e.cards.length} ${e.cards.length === 1 ? "card" : "cards"}</small></div>${this.menu(d`<button @click=${() => {
      s.rows.splice(t + 1, 0, structuredClone(e)), this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${s.rows.length === 1} @click=${() => {
      s.rows.length > 1 && (s.rows.splice(t, 1), this.selected = void 0, this.changed());
    }}>Delete</button>`)}</div><div class="grid">${this.field("Row title", e.title, (i) => {
      e.title = i, this.changed();
    })}${this.field("Height weight", e.weight, (i) => {
      e.weight = Number(i), this.changed();
    }, "number")}</div><div class="cards" style=${`grid-template-columns:repeat(${e.cards.length},minmax(0,1fr))`}>${e.cards.map((i, r) => d`<button class="tile" ?selected=${this.selected?.row === t && this.selected?.card === r} aria-pressed=${this.selected?.row === t && this.selected?.card === r} @click=${() => this.selected = { row: t, card: r }}><span class="kind">${i.type}</span><strong>${i.title || i.type}</strong><small>${i.source || i.text || ""}</small></button>`)}</div>${this.selected?.row === t ? this.cardSettings(e.cards[this.selected.card], t, this.selected.card) : h}${e.cards.length < 3 ? d`<button class="add" @click=${() => {
      e.cards.push(q()), this.selected = { row: t, card: e.cards.length - 1 }, this.changed();
    }}>Add card</button>` : h}</section>`;
  }
  render() {
    const e = this.dashboard?.pages[this.pageIndex];
    return d`<div class="layout"><main class="editor"><div class="topbar"><label>Display<select .value=${this.config.config_entry_id} @change=${(t) => this.selectDisplay(t.target.value)}><option value="">Select display</option>${this.displays.map((t) => d`<option value=${t.config_entry_id}>${t.title}${t.available ? "" : " (offline)"}</option>`)}</select></label><div class="sync ${this.syncState}" role="status" aria-live="polite"><i></i><span>${this.syncMessage}</span></div></div>${e ? d`<nav class="tabs" aria-label="Dashboard pages">${this.dashboard.pages.map((t, s) => d`<button class=${s === this.pageIndex ? "active" : ""} @click=${() => {
      this.pageIndex = s, this.selected = void 0;
    }}>${t.title || t.id}</button>`)}<button @click=${() => {
      this.dashboard.pages.push($t(this.dashboard.pages.length + 1)), this.pageIndex = this.dashboard.pages.length - 1, this.selected = void 0, this.changed();
    }}>Add page</button></nav><details class="page-settings"><summary>Page settings</summary><div class="grid">${this.field("Page ID", e.id, (t) => {
      e.id = t, this.changed();
    })}${this.field("Title", e.title, (t) => {
      e.title = t, this.changed();
    })}${this.field("Duration in seconds", e.durationSeconds, (t) => {
      e.durationSeconds = Number(t), this.changed();
    }, "number")}</div></details><div class="rows">${e.rows.map((t, s) => this.rowEditor(t, s))}</div>${e.rows.length < 6 ? d`<button class="add" @click=${() => {
      e.rows.push(mt()), this.changed();
    }}>Add row</button>` : h}` : h}</main><aside class="preview"><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass} .page=${this.pageIndex}></mini-display-preview></aside></div>`;
  }
};
g.styles = J`
    :host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}.layout{display:grid;grid-template-columns:minmax(420px,1fr) 264px;gap:24px;align-items:start}.editor{display:grid;gap:16px;min-width:0}.preview{position:sticky;top:16px;padding:12px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px}.topbar,.row-head,.card-head,.sync{display:flex;align-items:center;justify-content:space-between;gap:8px}.sync{justify-content:flex-start;min-height:20px;font-size:12px;color:var(--secondary-text-color)}.sync i{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.sync.syncing i{background:var(--warning-color)}.sync.success i{background:var(--success-color)}.sync.error{color:var(--error-color)}.sync.error i{background:var(--error-color)}.tabs{display:flex;gap:8px;overflow:auto;padding:2px}.tabs button{white-space:nowrap}.tabs button.active{background:var(--primary-color);color:var(--text-primary-color);border-color:var(--primary-color)}.page-settings,.row-panel,.card-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.page-settings[open],.card-settings{display:grid;gap:12px}.page-settings>summary{font-weight:600}.rows{display:grid;gap:12px}.row-panel{display:grid;gap:12px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 2%)}.row-title{display:flex;align-items:center;gap:8px}.row-title small{color:var(--secondary-text-color)}.cards{display:grid;gap:10px}.tile{min-width:0;aspect-ratio:1.45;padding:12px;border:1px solid var(--divider-color);border-radius:10px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transition:border-color .15s,background .15s}.tile:hover{border-color:var(--primary-color)}.tile[selected]{outline:2px solid var(--primary-color);outline-offset:1px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 8%)}.tile .kind{font-size:10px;line-height:16px;text-transform:uppercase;letter-spacing:.08em;color:var(--secondary-text-color)}.tile strong,.tile small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tile small{color:var(--secondary-text-color)}.card-settings{border-color:var(--primary-color);background:var(--card-background-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}label{display:grid;gap:5px;font-size:12px;color:var(--secondary-text-color)}input,select,button{min-height:40px;padding:8px 11px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px;font:inherit}input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button{cursor:pointer}button.add{width:100%;border-style:dashed;color:var(--primary-color)}button:disabled{opacity:.45;cursor:default}.menu{position:relative}.menu>summary{list-style:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;cursor:pointer}.menu>summary::-webkit-details-marker{display:none}.menu>summary:hover{background:var(--secondary-background-color)}.menu-popover{position:absolute;right:0;z-index:5;width:160px;padding:6px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:10px;box-shadow:var(--ha-card-box-shadow);display:grid}.menu-popover button{border:0;text-align:left}.menu-popover .danger{color:var(--error-color)}details>summary{cursor:pointer}.style{padding-top:4px}ha-form{display:block}
    @media(max-width:850px){.layout{grid-template-columns:1fr}.preview{position:static;order:-1;width:max-content;max-width:100%;margin:auto}.grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.tile{transition:none}}
  `;
y([
  S({ attribute: !1 })
], g.prototype, "hass", 2);
y([
  f()
], g.prototype, "config", 2);
y([
  f()
], g.prototype, "dashboard", 2);
y([
  f()
], g.prototype, "displays", 2);
y([
  f()
], g.prototype, "pageIndex", 2);
y([
  f()
], g.prototype, "selected", 2);
y([
  f()
], g.prototype, "syncState", 2);
y([
  f()
], g.prototype, "syncMessage", 2);
g = y([
  Y("mini-display-dashboard-card-editor")
], g);
window.customCards ??= [];
window.customCards.some((e) => e.type === "mini-display-dashboard-card") || window.customCards.push({ type: "mini-display-dashboard-card", name: "Home Assistant Mini-Display", description: "Configure and preview a physical Mini-Display", preview: !0 });
//# sourceMappingURL=mini-display-dashboard-card.js.map
