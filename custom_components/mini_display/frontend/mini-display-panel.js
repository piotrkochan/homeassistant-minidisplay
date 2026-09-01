const j = globalThis, F = j.ShadowRoot && (j.ShadyCSS === void 0 || j.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = /* @__PURE__ */ Symbol(), tt = /* @__PURE__ */ new WeakMap();
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
const $t = (e) => new ht(typeof e == "string" ? e : e + "", void 0, Z), J = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + e[o + 1], e[0]);
  return new ht(s, e, Z);
}, bt = (e, t) => {
  if (F) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), r = j.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = s.cssText, e.appendChild(i);
  }
}, et = F ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return $t(s);
})(e) : e;
const { is: vt, defineProperty: _t, getOwnPropertyDescriptor: xt, getOwnPropertyNames: wt, getOwnPropertySymbols: At, getPrototypeOf: St } = Object, I = globalThis, st = I.trustedTypes, Et = st ? st.emptyScript : "", kt = I.reactiveElementPolyfillSupport, M = (e, t) => e, L = { toAttribute(e, t) {
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
} }, K = (e, t) => !vt(e, t), it = { attribute: !0, type: String, converter: L, reflect: !1, useDefault: !1, hasChanged: K };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let P = class extends HTMLElement {
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
    const { get: r, set: o } = xt(this.prototype, t) ?? { get() {
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
      const s = this.properties, i = [...wt(s), ...At(s)];
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : L).toAttribute(s, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : L;
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
P.elementStyles = [], P.shadowRootOptions = { mode: "open" }, P[M("elementProperties")] = /* @__PURE__ */ new Map(), P[M("finalized")] = /* @__PURE__ */ new Map(), kt?.({ ReactiveElement: P }), (I.reactiveElementVersions ??= []).push("2.1.2");
const G = globalThis, rt = (e) => e, B = G.trustedTypes, ot = B ? B.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, pt = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, ut = "?" + _, Pt = `<${ut}>`, S = document, D = () => S.createComment(""), U = (e) => e === null || typeof e != "object" && typeof e != "function", Q = Array.isArray, Ct = (e) => Q(e) || typeof e?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, O = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, at = />/g, x = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), lt = /'/g, dt = /"/g, gt = /^(?:script|style|textarea|title)$/i, Tt = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), d = Tt(1), C = /* @__PURE__ */ Symbol.for("lit-noChange"), h = /* @__PURE__ */ Symbol.for("lit-nothing"), ct = /* @__PURE__ */ new WeakMap(), w = S.createTreeWalker(S, 129);
function ft(e, t) {
  if (!Q(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ot !== void 0 ? ot.createHTML(t) : t;
}
const Ot = (e, t) => {
  const s = e.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = O;
  for (let l = 0; l < s; l++) {
    const a = e[l];
    let p, u, c = -1, $ = 0;
    for (; $ < a.length && (n.lastIndex = $, u = n.exec(a), u !== null); ) $ = n.lastIndex, n === O ? u[1] === "!--" ? n = nt : u[1] !== void 0 ? n = at : u[2] !== void 0 ? (gt.test(u[2]) && (r = RegExp("</" + u[2], "g")), n = x) : u[3] !== void 0 && (n = x) : n === x ? u[0] === ">" ? (n = r ?? O, c = -1) : u[1] === void 0 ? c = -2 : (c = n.lastIndex - u[2].length, p = u[1], n = u[3] === void 0 ? x : u[3] === '"' ? dt : lt) : n === dt || n === lt ? n = x : n === nt || n === at ? n = O : (n = x, r = void 0);
    const v = n === x && e[l + 1].startsWith("/>") ? " " : "";
    o += n === O ? a + Pt : c >= 0 ? (i.push(p), a.slice(0, c) + pt + a.slice(c) + _ + v) : a + _ + (c === -2 ? l : v);
  }
  return [ft(e, o + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class N {
  constructor({ strings: t, _$litType$: s }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [p, u] = Ot(t, s);
    if (this.el = N.createElement(p, i), w.currentNode = this.el.content, s === 2 || s === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = w.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(pt)) {
          const $ = u[n++], v = r.getAttribute(c).split(_), H = /([.?@])?(.*)/.exec($);
          a.push({ type: 1, index: o, name: H[2], strings: v, ctor: H[1] === "." ? Dt : H[1] === "?" ? Ut : H[1] === "@" ? Nt : W }), r.removeAttribute(c);
        } else c.startsWith(_) && (a.push({ type: 6, index: o }), r.removeAttribute(c));
        if (gt.test(r.tagName)) {
          const c = r.textContent.split(_), $ = c.length - 1;
          if ($ > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let v = 0; v < $; v++) r.append(c[v], D()), w.nextNode(), a.push({ type: 2, index: ++o });
            r.append(c[$], D());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ut) a.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(_, c + 1)) !== -1; ) a.push({ type: 7, index: o }), c += _.length - 1;
      }
      o++;
    }
  }
  static createElement(t, s) {
    const i = S.createElement("template");
    return i.innerHTML = t, i;
  }
}
function T(e, t, s = e, i) {
  if (t === C) return t;
  let r = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const o = U(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(e), r._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = r : s._$Cl = r), r !== void 0 && (t = T(e, r._$AS(e, t.values), r, i)), t;
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
    const { el: { content: s }, parts: i } = this._$AD, r = (t?.creationScope ?? S).importNode(s, !0);
    w.currentNode = r;
    let o = w.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let p;
        a.type === 2 ? p = new R(o, o.nextSibling, this, t) : a.type === 1 ? p = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (p = new Rt(o, this, t)), this._$AV.push(p), a = i[++l];
      }
      n !== a?.index && (o = w.nextNode(), n++);
    }
    return w.currentNode = S, r;
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
    t = T(this, t, s), U(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== C && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ct(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(S.createTextNode(t)), this._$AH = t;
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
    for (const o of t) r === s.length ? s.push(i = new R(this.O(D()), this.O(D()), this, this.options)) : i = s[r], i._$AI(o), r++;
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
class W {
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
    if (o === void 0) t = T(this, t, s, 0), n = !U(t) || t !== this._$AH && t !== C, n && (this._$AH = t);
    else {
      const l = t;
      let a, p;
      for (t = o[0], a = 0; a < o.length - 1; a++) p = T(this, l[i + a], s, a), p === C && (p = this._$AH[a]), n ||= !U(p) || p !== this._$AH[a], p === h ? t = h : t !== h && (t += (p ?? "") + o[a + 1]), this._$AH[a] = p;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Dt extends W {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Ut extends W {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Nt extends W {
  constructor(t, s, i, r, o) {
    super(t, s, i, r, o), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = T(this, t, s, 0) ?? h) === C) return;
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
    T(this, t);
  }
}
const zt = G.litHtmlPolyfillSupport;
zt?.(N, R), (G.litHtmlVersions ??= []).push("3.3.3");
const Ht = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = s?.renderBefore ?? null;
    i._$litPart$ = r = new R(t.insertBefore(D(), o), o, void 0, s ?? {});
  }
  return r._$AI(e), r;
};
const X = globalThis;
class A extends P {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ht(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return C;
  }
}
A._$litElement$ = !0, A.finalized = !0, X.litElementHydrateSupport?.({ LitElement: A });
const jt = X.litElementPolyfillSupport;
jt?.({ LitElement: A });
(X.litElementVersions ??= []).push("4.2.2");
const Y = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
const Lt = { attribute: !0, type: String, converter: L, reflect: !1, hasChanged: K }, Bt = (e = Lt, t, s) => {
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
function f(e) {
  return (t, s) => typeof s == "object" ? Bt(e, t, s) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(e, t, s);
}
function m(e) {
  return f({ ...e, state: !0, attribute: !1 });
}
const q = (e = "number") => e === "clock" ? { type: e, format: "24h", showDate: !0 } : e === "text" ? { type: e, text: "Text" } : e === "status" ? { type: e, source: "", onText: "On", offText: "Off" } : { type: e, source: "", progress: "none" }, mt = () => ({ weight: 1, gap: "small", cards: [q("clock")] }), yt = (e) => ({ id: `page_${e}`, title: `Page ${e}`, durationSeconds: 10, enabled: !0, rows: [mt()] }), It = () => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [yt(1)] });
var Wt = Object.defineProperty, Vt = Object.getOwnPropertyDescriptor, k = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Vt(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && Wt(t, s, r), r;
};
let b = class extends A {
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
    return e ? d`<div class="screen">${e.title && e.showTitle !== !1 ? d`<h3>${e.title}</h3>` : null}${e.rows.map((t) => d`<div class="group" style="flex:${t.weight ?? 1}">${t.title && t.showTitle !== !1 ? d`<div class="title">${t.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${t.cards.length},minmax(0,1fr))">${t.cards.map((s) => {
      const i = s.source ? this.hass?.states[s.source]?.state ?? "—" : s.text ?? "—", r = Number(i), o = s.minimum ?? 0, n = s.maximum ?? 100, l = Number.isFinite(r) && n > o ? Math.max(0, Math.min(100, (r - o) / (n - o) * 100)) : 0, a = { sans: "sans-serif", "sans-bold": "sans-serif", mono: "monospace", serif: "serif" }[s.valueStyle?.fontFamily ?? "sans"], p = { auto: 14, small: 10, medium: 13, large: 17, xlarge: 22 }[s.valueStyle?.fontSize ?? "auto"], u = s.style?.background ?? "#20242d", c = s.style?.accent ?? "#42a5f5";
      return d`<div class="card" style=${`background:${u};color:${s.style?.foreground ?? "white"}`}><small>${s.title ?? ""}</small><div class="value" style=${`font-family:${a};font-size:${p}px;font-weight:${s.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`}>${this.cardValue(s)}</div>${s.progress === "bar" ? d`<div class="bar"><i style=${`width:${l}%;background:${c}`}></i></div>` : s.progress === "ring" ? d`<div class="ring" style=${`background:conic-gradient(${c} ${l}%,#3d424e 0);--ring-bg:${u}`}></div>` : null}</div>`;
    })}</div></div>`)}</div>` : d`<div class="screen loading" aria-label="Loading display preview"></div>`;
  }
};
b.styles = J`
    :host{display:block;width:240px;max-width:100%}.screen{box-sizing:border-box;width:100%;aspect-ratio:1;padding:6px;background:#090b10;color:white;border-radius:8px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.22)}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;text-align:center}.card small{font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value{font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring{width:42px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;margin:3px auto}.ring:after{content:"";width:30px;aspect-ratio:1;border-radius:50%;background:var(--ring-bg,#20242d)}
    @keyframes loading{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.loading{animation:none}}
  `;
k([
  f({ attribute: !1 })
], b.prototype, "dashboard", 2);
k([
  f({ attribute: !1 })
], b.prototype, "hass", 2);
k([
  f({ type: Number })
], b.prototype, "page", 2);
k([
  f({ type: Boolean })
], b.prototype, "autoRotate", 2);
k([
  m()
], b.prototype, "now", 2);
k([
  m()
], b.prototype, "autoPage", 2);
b = k([
  Y("mini-display-preview")
], b);
var qt = Object.defineProperty, Ft = Object.getOwnPropertyDescriptor, y = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Ft(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && qt(t, s, r), r;
};
let g = class extends A {
  constructor() {
    super(...arguments), this.config = { config_entry_id: "" }, this.displays = [], this.pageIndex = 0, this.syncState = "idle", this.syncMessage = "", this.loaded = !1;
  }
  setConfig(e) {
    this.config = e, this.loaded = !1, this.load();
  }
  updated(e) {
    e.has("hass") && !this.loaded && this.load();
  }
  disconnectedCallback() {
    window.clearTimeout(this.syncTimer), this.syncState === "syncing" && this.sync(), super.disconnectedCallback();
  }
  async load() {
    if (this.hass) {
      this.loaded = !0;
      try {
        this.displays = await this.hass.callWS({ type: "mini_display/displays" });
        const e = this.config.config_entry_id || this.displays[0]?.config_entry_id || "";
        this.config = { ...this.config, config_entry_id: e }, e && (this.dashboard = await this.hass.callWS({ type: "mini_display/dashboard/get", config_entry_id: e }) ?? It(), this.selected = { row: 0, card: 0 });
      } catch (e) {
        this.syncState = "error", this.syncMessage = String(e);
      }
    }
  }
  selectDisplay(e) {
    this.config = { ...this.config, config_entry_id: e }, this.dashboard = void 0, this.pageIndex = 0, this.selected = void 0, this.loaded = !1, this.load();
  }
  changed() {
    this.dashboard = structuredClone(this.dashboard), this.syncState = "syncing", this.syncMessage = "Synchronizing", window.clearTimeout(this.syncTimer), this.syncTimer = window.setTimeout(() => {
      this.sync();
    }, 500);
  }
  async sync() {
    if (!(!this.hass || !this.dashboard || !this.config.config_entry_id))
      try {
        await this.hass.callWS({ type: "mini_display/dashboard/set", config_entry_id: this.config.config_entry_id, dashboard: this.dashboard, page_id: this.dashboard.pages[this.pageIndex].id }), this.syncState = "success", this.syncMessage = "Synchronized", window.dispatchEvent(new CustomEvent("mini-display-dashboard-updated", { detail: { configEntryId: this.config.config_entry_id } }));
      } catch (e) {
        this.syncState = "error", this.syncMessage = String(e);
      }
  }
  async showPage(e) {
    if (this.pageIndex = e, this.selected = { row: 0, card: 0 }, !(!this.hass || !this.config.config_entry_id || !this.dashboard))
      try {
        await this.hass.callWS({ type: "mini_display/page/show", config_entry_id: this.config.config_entry_id, page_id: this.dashboard.pages[e].id });
      } catch (t) {
        this.syncState = "error", this.syncMessage = String(t);
      }
  }
  field(e, t, s, i = "text") {
    return d`<label>${e}<input type=${i} .value=${String(t ?? "")} @input=${(r) => s(r.target.value)}></label>`;
  }
  select(e, t, s, i) {
    return d`<label>${e}<select @change=${(r) => i(r.target.value)}>${s.map((r) => d`<option value=${r} ?selected=${r === t}>${r}</option>`)}</select></label>`;
  }
  checkbox(e, t, s) {
    return d`<label class="check"><input type="checkbox" .checked=${t} @change=${(i) => s(i.target.checked)}>${e}</label>`;
  }
  entity(e) {
    const t = {
      number: ["sensor", "number", "input_number", "counter"],
      status: ["binary_sensor", "switch", "input_boolean", "lock", "cover", "person", "device_tracker"],
      text: ["sensor", "text", "input_text", "select", "input_select"],
      clock: []
    };
    return d`<ha-form .hass=${this.hass} .data=${{ entity: e.source ?? "" }} .schema=${[{ name: "entity", required: e.type !== "text", selector: { entity: { domain: t[e.type] } } }]} .computeLabel=${() => e.type === "number" ? "Numeric entity" : e.type === "status" ? "State entity" : "Text entity (optional)"} @value-changed=${(s) => {
      e.source = s.detail.value.entity, this.changed();
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
    const i = this.dashboard.pages[this.pageIndex].rows[t].cards, r = { number: "Displays a numeric value with an optional unit and progress visualization.", text: "Displays text from an entity or the static text below.", status: "Maps a state entity to two readable labels.", clock: "Displays local time without using an entity." };
    return d`<section class="card-settings"><div class="card-head"><strong>${e.title || `Card ${s + 1}`}</strong>${this.menu(d`<button @click=${() => {
      i.splice(s + 1, 0, structuredClone(e)), this.selected = { row: t, card: s + 1 }, this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${i.length === 1} @click=${() => {
      i.length > 1 && (i.splice(s, 1), this.selected = void 0, this.changed());
    }}>Delete</button>`)}</div><div class="grid">${this.select("Type", e.type, ["number", "text", "clock", "status"], (o) => {
      Object.keys(e).forEach((n) => delete e[n]), Object.assign(e, q(o)), this.changed();
    })}${this.field("Title", e.title, (o) => {
      e.title = o, this.changed();
    })}<p class="hint">${r[e.type]}</p>${["number", "status", "text"].includes(e.type) ? this.entity(e) : h}${e.type === "number" ? d`${this.field("Unit", e.unit, (o) => {
      e.unit = o, this.changed();
    })}${this.field("Minimum", e.minimum, (o) => {
      e.minimum = Number(o), this.changed();
    }, "number")}${this.field("Maximum", e.maximum, (o) => {
      e.maximum = Number(o), this.changed();
    }, "number")}${this.select("Progress", e.progress ?? "none", ["none", "bar", "ring"], (o) => {
      e.progress = o, this.changed();
    })}` : h}${e.type === "text" ? this.field("Static text", e.text, (o) => {
      e.text = o, this.changed();
    }) : h}${e.type === "status" ? d`${this.field("On text", e.onText, (o) => {
      e.onText = o, this.changed();
    })}${this.field("Off text", e.offText, (o) => {
      e.offText = o, this.changed();
    })}` : h}</div>${this.styleEditor(e)}</section>`;
  }
  rowEditor(e, t) {
    const s = this.dashboard.pages[this.pageIndex];
    return d`<section class="row-panel"><div class="row-head"><div class="row-title"><strong>Row ${t + 1}</strong><small>${e.cards.length} ${e.cards.length === 1 ? "card" : "cards"}</small></div>${this.menu(d`<button @click=${() => {
      s.rows.splice(t + 1, 0, structuredClone(e)), this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${s.rows.length === 1} @click=${() => {
      s.rows.length > 1 && (s.rows.splice(t, 1), this.selected = void 0, this.changed());
    }}>Delete</button>`)}</div>${this.field("Row title", e.title, (i) => {
      e.title = i, this.changed();
    })}<nav class="card-tabs" aria-label=${`Cards in row ${t + 1}`}>${e.cards.map((i, r) => d`<button class=${this.selected?.row === t && this.selected?.card === r ? "active" : ""} aria-pressed=${this.selected?.row === t && this.selected?.card === r} @click=${() => this.selected = { row: t, card: r }}>Card ${r + 1} · ${i.type}</button>`)}</nav>${this.selected?.row === t ? this.cardSettings(e.cards[this.selected.card], t, this.selected.card) : h}${e.cards.length < 3 ? d`<button class="add" @click=${() => {
      e.cards.push(q()), this.selected = { row: t, card: e.cards.length - 1 }, this.changed();
    }}>Add card</button>` : h}</section>`;
  }
  render() {
    const e = this.dashboard?.pages[this.pageIndex];
    return d`<main class="editor"><div class="topbar"><label>Display<select .value=${this.config.config_entry_id} @change=${(t) => this.selectDisplay(t.target.value)}><option value="">Select display</option>${this.displays.map((t) => d`<option value=${t.config_entry_id}>${t.title}${t.available ? "" : " (offline)"}</option>`)}</select></label><div class="sync ${this.syncState}" role="status" aria-live="polite"><i></i><span>${this.syncMessage}</span></div></div>${this.displays.length === 0 && this.loaded ? d`<div class="empty">No Mini Displays configured. Add one from Settings, Devices &amp; services.</div>` : e ? d`<div class="workspace"><section class="controls"><nav class="tabs" aria-label="Dashboard pages">${this.dashboard.pages.map((t, s) => d`<button class=${s === this.pageIndex ? "active" : ""} @click=${() => {
      this.showPage(s);
    }}>${t.title || t.id}</button>`)}<button @click=${() => {
      this.dashboard.pages.push(yt(this.dashboard.pages.length + 1)), this.pageIndex = this.dashboard.pages.length - 1, this.selected = { row: 0, card: 0 }, this.changed();
    }}>Add page</button></nav><details class="page-settings"><summary>Page settings</summary><div class="grid">${this.field("Page ID", e.id, (t) => {
      e.id = t, this.changed();
    })}${this.field("Title", e.title, (t) => {
      e.title = t, this.changed();
    })}${this.field("Duration in seconds", e.durationSeconds, (t) => {
      e.durationSeconds = Number(t), this.changed();
    }, "number")}${this.checkbox("Show title", e.showTitle !== !1, (t) => {
      e.showTitle = t, this.changed();
    })}</div></details><div class="rows">${e.rows.map((t, s) => this.rowEditor(t, s))}</div>${e.rows.length < 6 ? d`<button class="add" @click=${() => {
      e.rows.push(mt()), this.changed();
    }}>Add row</button>` : h}</section><aside class="preview-panel"><h2>Display preview</h2><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass} .page=${this.pageIndex}></mini-display-preview></aside></div>` : h}</main>`;
  }
};
g.styles = J`
    :host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}.editor{display:grid;gap:16px;min-width:0}.topbar,.row-head,.card-head,.sync{display:flex;align-items:center;justify-content:space-between;gap:8px}.topbar{padding:16px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px}.topbar label{min-width:min(320px,100%)}.sync{justify-content:flex-start;min-height:20px;font-size:12px;color:var(--secondary-text-color)}.sync i{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.sync.syncing i{background:var(--warning-color)}.sync.success i{background:var(--success-color)}.sync.error{color:var(--error-color)}.sync.error i{background:var(--error-color)}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:20px;align-items:start}.controls{display:grid;gap:16px;min-width:0}.preview-panel{position:sticky;top:16px;padding:16px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px}.preview-panel h2{margin:0 0 12px;font-size:16px;font-weight:500}.preview-panel mini-display-preview{margin:auto}.empty{padding:40px 20px;text-align:center;color:var(--secondary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px}.tabs,.card-tabs{display:flex;gap:8px;overflow:auto;padding:2px}.tabs button,.card-tabs button{white-space:nowrap}.tabs button.active,.card-tabs button.active{background:var(--primary-color);color:var(--text-primary-color);border-color:var(--primary-color)}.page-settings,.row-panel,.card-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.page-settings[open],.card-settings{display:grid;gap:12px}.page-settings>summary{font-weight:600}.rows{display:grid;gap:12px}.row-panel{display:grid;gap:12px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 2%)}.row-title{display:flex;align-items:center;gap:8px}.row-title small{color:var(--secondary-text-color)}.card-settings{border-color:var(--primary-color);background:var(--card-background-color)}.hint{grid-column:1/-1;margin:0;color:var(--secondary-text-color);font-size:12px;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid>ha-form{grid-column:1/-1;display:block;width:100%;min-width:0}.check{display:flex;align-items:center;gap:8px;color:var(--primary-text-color)}.check input{min-height:auto;width:18px;height:18px}label{display:grid;gap:5px;font-size:12px;color:var(--secondary-text-color)}input,select,button{min-height:40px;padding:8px 11px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px;font:inherit}input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button{cursor:pointer}button.add{width:100%;border-style:dashed;color:var(--primary-color)}button:disabled{opacity:.45;cursor:default}.menu{position:relative}.menu>summary{list-style:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;cursor:pointer}.menu>summary::-webkit-details-marker{display:none}.menu>summary:hover{background:var(--secondary-background-color)}.menu-popover{position:absolute;right:0;z-index:5;width:160px;padding:6px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:10px;box-shadow:var(--ha-card-box-shadow);display:grid}.menu-popover button{border:0;text-align:left}.menu-popover .danger{color:var(--error-color)}details>summary{cursor:pointer}.style{padding-top:4px}ha-form{display:block;width:100%;min-width:0}
    @media(max-width:900px){.workspace{grid-template-columns:1fr}.preview-panel{position:static;order:-1}}@media(max-width:600px){.grid{grid-template-columns:1fr}.topbar{align-items:stretch;flex-direction:column}.topbar label{min-width:0}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  `;
y([
  f({ attribute: !1 })
], g.prototype, "hass", 2);
y([
  m()
], g.prototype, "config", 2);
y([
  m()
], g.prototype, "dashboard", 2);
y([
  m()
], g.prototype, "displays", 2);
y([
  m()
], g.prototype, "pageIndex", 2);
y([
  m()
], g.prototype, "selected", 2);
y([
  m()
], g.prototype, "syncState", 2);
y([
  m()
], g.prototype, "syncMessage", 2);
y([
  m()
], g.prototype, "loaded", 2);
g = y([
  Y("mini-display-editor")
], g);
var Zt = Object.defineProperty, Jt = Object.getOwnPropertyDescriptor, z = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Jt(t, s) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (r = (i ? n(t, s, r) : n(r)) || r);
  return i && r && Zt(t, s, r), r;
};
let E = class extends A {
  constructor() {
    super(...arguments), this.narrow = !1;
  }
  render() {
    return d`
      <div class="shell">
        <header>
          <ha-icon icon="mdi:monitor-dashboard"></ha-icon>
          <div>
            <h1>Mini Displays</h1>
            <p>Configure pages and content shown on your displays.</p>
          </div>
        </header>
        <mini-display-editor .hass=${this.hass}></mini-display-editor>
      </div>
    `;
  }
};
E.styles = J`
    :host {
      display: block;
      min-height: 100%;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
    }
    .shell {
      width: min(1440px, 100%);
      margin: 0 auto;
      padding: 24px;
      box-sizing: border-box;
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    header ha-icon {
      color: var(--primary-color);
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.25;
      font-weight: 500;
    }
    p {
      margin: 4px 0 0;
      color: var(--secondary-text-color);
    }
    @media (max-width: 600px) {
      .shell { padding: 16px; }
      header { margin-bottom: 16px; }
      h1 { font-size: 21px; }
    }
  `;
z([
  f({ attribute: !1 })
], E.prototype, "hass", 2);
z([
  f({ attribute: !1 })
], E.prototype, "narrow", 2);
z([
  f({ attribute: !1 })
], E.prototype, "route", 2);
z([
  f({ attribute: !1 })
], E.prototype, "panel", 2);
E = z([
  Y("mini-display-panel")
], E);
//# sourceMappingURL=mini-display-panel.js.map
