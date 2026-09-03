const K = globalThis, re = K.ShadowRoot && (K.ShadyCSS === void 0 || K.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, oe = /* @__PURE__ */ Symbol(), ye = /* @__PURE__ */ new WeakMap();
let Pe = class {
  constructor(e, i, s) {
    if (this._$cssResult$ = !0, s !== oe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (re && e === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (e = ye.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && ye.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Re = (t) => new Pe(typeof t == "string" ? t : t + "", void 0, oe), I = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((s, a, r) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + t[r + 1], t[0]);
  return new Pe(i, t, oe);
}, He = (t, e) => {
  if (re) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const s = document.createElement("style"), a = K.litNonce;
    a !== void 0 && s.setAttribute("nonce", a), s.textContent = i.cssText, t.appendChild(s);
  }
}, ve = re ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const s of e.cssRules) i += s.cssText;
  return Re(i);
})(t) : t;
const { is: Le, defineProperty: We, getOwnPropertyDescriptor: qe, getOwnPropertyNames: Fe, getOwnPropertySymbols: Ve, getPrototypeOf: Be } = Object, ee = globalThis, fe = ee.trustedTypes, Je = fe ? fe.emptyScript : "", Ze = ee.reactiveElementPolyfillSupport, W = (t, e) => t, Q = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Je : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let i = t;
  switch (e) {
    case Boolean:
      i = t !== null;
      break;
    case Number:
      i = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(t);
      } catch {
        i = null;
      }
  }
  return i;
} }, ne = (t, e) => !Le(t, e), be = { attribute: !0, type: String, converter: Q, reflect: !1, useDefault: !1, hasChanged: ne };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), ee.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let z = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = be) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const s = /* @__PURE__ */ Symbol(), a = this.getPropertyDescriptor(e, s, i);
      a !== void 0 && We(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, i, s) {
    const { get: a, set: r } = qe(this.prototype, e) ?? { get() {
      return this[i];
    }, set(o) {
      this[i] = o;
    } };
    return { get: a, set(o) {
      const d = a?.call(this);
      r?.call(this, o), this.requestUpdate(e, d, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? be;
  }
  static _$Ei() {
    if (this.hasOwnProperty(W("elementProperties"))) return;
    const e = Be(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(W("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(W("properties"))) {
      const i = this.properties, s = [...Fe(i), ...Ve(i)];
      for (const a of s) this.createProperty(a, i[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [s, a] of i) this.elementProperties.set(s, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const a = this._$Eu(i, s);
      a !== void 0 && this._$Eh.set(a, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const a of s) i.unshift(ve(a));
    } else e !== void 0 && i.push(ve(e));
    return i;
  }
  static _$Eu(e, i) {
    const s = i.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const s of i.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return He(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, s) {
    this._$AK(e, s);
  }
  _$ET(e, i) {
    const s = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, s);
    if (a !== void 0 && s.reflect === !0) {
      const r = (s.converter?.toAttribute !== void 0 ? s.converter : Q).toAttribute(i, s.type);
      this._$Em = e, r == null ? this.removeAttribute(a) : this.setAttribute(a, r), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const s = this.constructor, a = s._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const r = s.getPropertyOptions(a), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Q;
      this._$Em = a;
      const d = o.fromAttribute(i, r.type);
      this[a] = d ?? this._$Ej?.get(a) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, i, s, a = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (a === !1 && (r = this[e]), s ??= o.getPropertyOptions(e), !((s.hasChanged ?? ne)(r, i) || s.useDefault && s.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, s)))) return;
      this.C(e, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: s, reflect: a, wrapped: r }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? i ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (i = void 0), this._$AL.set(e, i)), a === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [a, r] of this._$Ep) this[a] = r;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [a, r] of s) {
        const { wrapped: o } = r, d = this[a];
        o !== !0 || this._$AL.has(a) || d === void 0 || this.C(a, void 0, r, d);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
z.elementStyles = [], z.shadowRootOptions = { mode: "open" }, z[W("elementProperties")] = /* @__PURE__ */ new Map(), z[W("finalized")] = /* @__PURE__ */ new Map(), Ze?.({ ReactiveElement: z }), (ee.reactiveElementVersions ??= []).push("2.1.2");
const le = globalThis, xe = (t) => t, X = le.trustedTypes, $e = X ? X.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Ce = "$lit$", D = `lit$${Math.random().toFixed(9).slice(2)}$`, Me = "?" + D, Ge = `<${Me}>`, E = document, q = () => E.createComment(""), F = (t) => t === null || typeof t != "object" && typeof t != "function", de = Array.isArray, Ke = (t) => de(t) || typeof t?.[Symbol.iterator] == "function", ie = `[ 	
\f\r]`, H = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, we = /-->/g, _e = />/g, C = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Se = /'/g, ke = /"/g, Ee = /^(?:script|style|textarea|title)$/i, Ye = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), l = Ye(1), U = /* @__PURE__ */ Symbol.for("lit-noChange"), c = /* @__PURE__ */ Symbol.for("lit-nothing"), De = /* @__PURE__ */ new WeakMap(), M = E.createTreeWalker(E, 129);
function Ne(t, e) {
  if (!de(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return $e !== void 0 ? $e.createHTML(e) : e;
}
const Qe = (t, e) => {
  const i = t.length - 1, s = [];
  let a, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = H;
  for (let d = 0; d < i; d++) {
    const n = t[d];
    let u, y, h = -1, f = 0;
    for (; f < n.length && (o.lastIndex = f, y = o.exec(n), y !== null); ) f = o.lastIndex, o === H ? y[1] === "!--" ? o = we : y[1] !== void 0 ? o = _e : y[2] !== void 0 ? (Ee.test(y[2]) && (a = RegExp("</" + y[2], "g")), o = C) : y[3] !== void 0 && (o = C) : o === C ? y[0] === ">" ? (o = a ?? H, h = -1) : y[1] === void 0 ? h = -2 : (h = o.lastIndex - y[2].length, u = y[1], o = y[3] === void 0 ? C : y[3] === '"' ? ke : Se) : o === ke || o === Se ? o = C : o === we || o === _e ? o = H : (o = C, a = void 0);
    const b = o === C && t[d + 1].startsWith("/>") ? " " : "";
    r += o === H ? n + Ge : h >= 0 ? (s.push(u), n.slice(0, h) + Ce + n.slice(h) + D + b) : n + D + (h === -2 ? d : b);
  }
  return [Ne(t, r + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class V {
  constructor({ strings: e, _$litType$: i }, s) {
    let a;
    this.parts = [];
    let r = 0, o = 0;
    const d = e.length - 1, n = this.parts, [u, y] = Qe(e, i);
    if (this.el = V.createElement(u, s), M.currentNode = this.el.content, i === 2 || i === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (a = M.nextNode()) !== null && n.length < d; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const h of a.getAttributeNames()) if (h.endsWith(Ce)) {
          const f = y[o++], b = a.getAttribute(h).split(D), P = /([.?@])?(.*)/.exec(f);
          n.push({ type: 1, index: r, name: P[2], strings: b, ctor: P[1] === "." ? et : P[1] === "?" ? tt : P[1] === "@" ? it : te }), a.removeAttribute(h);
        } else h.startsWith(D) && (n.push({ type: 6, index: r }), a.removeAttribute(h));
        if (Ee.test(a.tagName)) {
          const h = a.textContent.split(D), f = h.length - 1;
          if (f > 0) {
            a.textContent = X ? X.emptyScript : "";
            for (let b = 0; b < f; b++) a.append(h[b], q()), M.nextNode(), n.push({ type: 2, index: ++r });
            a.append(h[f], q());
          }
        }
      } else if (a.nodeType === 8) if (a.data === Me) n.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = a.data.indexOf(D, h + 1)) !== -1; ) n.push({ type: 7, index: r }), h += D.length - 1;
      }
      r++;
    }
  }
  static createElement(e, i) {
    const s = E.createElement("template");
    return s.innerHTML = e, s;
  }
}
function j(t, e, i = t, s) {
  if (e === U) return e;
  let a = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const r = F(e) ? void 0 : e._$litDirective$;
  return a?.constructor !== r && (a?._$AO?.(!1), r === void 0 ? a = void 0 : (a = new r(t), a._$AT(t, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = a : i._$Cl = a), a !== void 0 && (e = j(t, a._$AS(t, e.values), a, s)), e;
}
class Xe {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: s } = this._$AD, a = (e?.creationScope ?? E).importNode(i, !0);
    M.currentNode = a;
    let r = M.nextNode(), o = 0, d = 0, n = s[0];
    for (; n !== void 0; ) {
      if (o === n.index) {
        let u;
        n.type === 2 ? u = new J(r, r.nextSibling, this, e) : n.type === 1 ? u = new n.ctor(r, n.name, n.strings, this, e) : n.type === 6 && (u = new st(r, this, e)), this._$AV.push(u), n = s[++d];
      }
      o !== n?.index && (r = M.nextNode(), o++);
    }
    return M.currentNode = E, a;
  }
  p(e) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, i), i += s.strings.length - 2) : s._$AI(e[i])), i++;
  }
}
class J {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, s, a) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = s, this.options = a, this._$Cv = a?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = j(this, e, i), F(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== U && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ke(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && F(this._$AH) ? this._$AA.nextSibling.data = e : this.T(E.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: s } = e, a = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = V.createElement(Ne(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === a) this._$AH.p(i);
    else {
      const r = new Xe(a, this), o = r.u(this.options);
      r.p(i), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let i = De.get(e.strings);
    return i === void 0 && De.set(e.strings, i = new V(e)), i;
  }
  k(e) {
    de(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, a = 0;
    for (const r of e) a === i.length ? i.push(s = new J(this.O(q()), this.O(q()), this, this.options)) : s = i[a], s._$AI(r), a++;
    a < i.length && (this._$AR(s && s._$AB.nextSibling, a), i.length = a);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const s = xe(e).nextSibling;
      xe(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class te {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, s, a, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = a, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(e, i = this, s, a) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = j(this, e, i, 0), o = !F(e) || e !== this._$AH && e !== U, o && (this._$AH = e);
    else {
      const d = e;
      let n, u;
      for (e = r[0], n = 0; n < r.length - 1; n++) u = j(this, d[s + n], i, n), u === U && (u = this._$AH[n]), o ||= !F(u) || u !== this._$AH[n], u === c ? e = c : e !== c && (e += (u ?? "") + r[n + 1]), this._$AH[n] = u;
    }
    o && !a && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class et extends te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class tt extends te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class it extends te {
  constructor(e, i, s, a, r) {
    super(e, i, s, a, r), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = j(this, e, i, 0) ?? c) === U) return;
    const s = this._$AH, a = e === c && s !== c || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, r = e !== c && (s === c || a);
    a && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class st {
  constructor(e, i, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    j(this, e);
  }
}
const at = le.litHtmlPolyfillSupport;
at?.(V, J), (le.litHtmlVersions ??= []).push("3.3.3");
const rt = (t, e, i) => {
  const s = i?.renderBefore ?? e;
  let a = s._$litPart$;
  if (a === void 0) {
    const r = i?.renderBefore ?? null;
    s._$litPart$ = a = new J(e.insertBefore(q(), r), r, void 0, i ?? {});
  }
  return a._$AI(t), a;
};
const ce = globalThis;
class $ extends z {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = rt(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return U;
  }
}
$._$litElement$ = !0, $.finalized = !0, ce.litElementHydrateSupport?.({ LitElement: $ });
const ot = ce.litElementPolyfillSupport;
ot?.({ LitElement: $ });
(ce.litElementVersions ??= []).push("4.2.2");
const R = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
const nt = { attribute: !0, type: String, converter: Q, reflect: !1, hasChanged: ne }, lt = (t = nt, e, i) => {
  const { kind: s, metadata: a } = i;
  let r = globalThis.litPropertyMetadata.get(a);
  if (r === void 0 && globalThis.litPropertyMetadata.set(a, r = /* @__PURE__ */ new Map()), s === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(i.name, t), s === "accessor") {
    const { name: o } = i;
    return { set(d) {
      const n = e.get.call(this);
      e.set.call(this, d), this.requestUpdate(o, n, t, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(o, void 0, t, d), d;
    } };
  }
  if (s === "setter") {
    const { name: o } = i;
    return function(d) {
      const n = this[o];
      e.call(this, d), this.requestUpdate(o, n, t, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function p(t) {
  return (e, i) => typeof i == "object" ? lt(t, e, i) : ((s, a, r) => {
    const o = a.hasOwnProperty(r);
    return a.constructor.createProperty(r, s), o ? Object.getOwnPropertyDescriptor(a, r) : void 0;
  })(t, e, i);
}
function m(t) {
  return p({ ...t, state: !0, attribute: !1 });
}
const ae = (t = "number") => t === "clock" ? { type: t, format: "24h", showDate: !0 } : t === "text" ? { type: t, text: "Text" } : t === "status" ? { type: t, source: "", onText: "On", offText: "Off" } : { type: t, source: "", progress: "none" }, Te = () => ({ weight: 1, gap: "small", cards: [ae("clock")] }), Ie = (t) => ({ id: `page_${t}`, title: `Page ${t}`, durationSeconds: 10, enabled: !0, transition: { type: "none" }, rows: [Te()] }), dt = () => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [Ie(1)] }), ct = (t, e) => {
  if (t.type === "number") {
    const i = Number(e);
    if (Number.isFinite(i)) {
      for (const s of t.valueMappings ?? [])
        if ((s.minimum === void 0 || i >= s.minimum) && (s.maximum === void 0 || i <= s.maximum))
          return { value: s.value, mapped: !0 };
    }
  }
  if (t.type === "text") {
    for (const i of t.valueMappings ?? [])
      if (i.operator === "equals" ? e === i.match : i.operator === "starts_with" ? e.startsWith(i.match) : i.operator === "ends_with" ? e.endsWith(i.match) : e.includes(i.match)) return { value: i.value, mapped: !0 };
  }
  return { value: e, mapped: !1 };
}, pt = (t, e) => {
  if (t.type === "number") {
    const i = Number(e);
    if (Number.isFinite(i))
      return (t.colorMappings ?? []).find((s) => (s.minimum === void 0 || i >= s.minimum) && (s.maximum === void 0 || i <= s.maximum));
  }
  if (t.type === "text")
    return (t.colorMappings ?? []).find((i) => i.operator === "equals" ? e === i.match : i.operator === "starts_with" ? e.startsWith(i.match) : i.operator === "ends_with" ? e.endsWith(i.match) : e.includes(i.match));
}, ht = /* @__PURE__ */ new Set(["unknown", "unavailable"]);
function Ae(t, e) {
  if (!e) return !0;
  const i = e.conditions.map((s) => {
    const a = t?.states[s.entity]?.state, r = a !== void 0 && !ht.has(a);
    if (s.operator === "available") return r;
    if (s.operator === "unavailable") return !r;
    if (!r) return !1;
    if (s.operator === "equals") return a === (s.value ?? "");
    if (s.operator === "not_equals") return a !== (s.value ?? "");
    const o = Number(a), d = Number(s.value);
    return !Number.isFinite(o) || !Number.isFinite(d) ? !1 : s.operator === "above" ? o > d : o < d;
  });
  return e.mode === "any" ? i.some(Boolean) : i.every(Boolean);
}
var ut = Object.defineProperty, gt = Object.getOwnPropertyDescriptor, pe = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? gt(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && ut(e, i, a), a;
};
const Y = {
  background: "#000000",
  surface: "#1e222a",
  primary: "#ffffff",
  secondary: "#9e9e9e",
  muted: "#666666",
  accent: "#00ffff",
  success: "#00ff00",
  warning: "#ffa500",
  error: "#ff0000"
};
let B = class extends $ {
  constructor() {
    super(...arguments), this.label = "Color", this.value = "";
  }
  render() {
    const t = this.value.startsWith("#"), e = t ? "custom" : this.value || "default";
    return l`
      <span>${this.label}</span>
      <div class="control">
        <select .value=${e} @change=${this.selectColor}>
          <option value="default">Default</option>
          <option value="background">Black</option>
          <option value="surface">Charcoal</option>
          <option value="primary">White</option>
          <option value="secondary">Light gray</option>
          <option value="muted">Gray</option>
          <option value="accent">Cyan</option>
          <option value="success">Green</option>
          <option value="warning">Orange</option>
          <option value="error">Red</option>
          <option value="custom">Custom</option>
        </select>
        <input type="color" aria-label="Custom color" .value=${t ? this.value : Y[e] ?? "#ffffff"} ?disabled=${!t} @input=${this.customColor}>
      </div>
    `;
  }
  selectColor(t) {
    const e = t.target.value;
    this.emit(e === "default" ? "" : e === "custom" ? "#ffffff" : e);
  }
  customColor(t) {
    this.emit(t.target.value);
  }
  emit(t) {
    this.dispatchEvent(new CustomEvent("color-changed", { detail: t, bubbles: !0, composed: !0 }));
  }
};
B.styles = I`
    :host { display: grid; gap: 5px; color: var(--secondary-text-color); font: 12px var(--ha-font-family-body,Roboto,sans-serif); }
    .control { display: grid; grid-template-columns: minmax(0,1fr) 42px; gap: 8px; }
    select, input { width: 100%; min-height: 40px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; }
    select { padding: 8px; font: inherit; font-size: 14px; }
    input { height: 40px; padding: 3px; cursor: pointer; }
  `;
pe([
  p()
], B.prototype, "label", 2);
pe([
  p()
], B.prototype, "value", 2);
B = pe([
  R("mini-display-color-field")
], B);
var mt = Object.defineProperty, A = (t, e, i, s) => {
  for (var a = void 0, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = o(e, i, a) || a);
  return a && mt(e, i, a), a;
};
const he = class he extends $ {
  constructor() {
    super(...arguments), this.page = 0, this.autoRotate = !1, this.width = 240, this.height = 240, this.now = /* @__PURE__ */ new Date(), this.autoPage = 0, this.pageShownAt = Date.now();
  }
  connectedCallback() {
    super.connectedCallback(), this.clockTimer = window.setInterval(() => {
      this.now = /* @__PURE__ */ new Date();
      const e = this.dashboard?.pages ?? [], i = (e[this.autoPage]?.durationSeconds ?? 10) * 1e3;
      this.autoRotate && e.length > 1 && Date.now() - this.pageShownAt >= i && (this.autoPage = (this.autoPage + 1) % e.length, this.pageShownAt = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    window.clearInterval(this.clockTimer), super.disconnectedCallback();
  }
  cardValue(e) {
    if (e.type === "clock") return this.now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: e.showSeconds ? "2-digit" : void 0, hour12: e.format === "12h" });
    const i = e.source ? this.hass?.states[e.source]?.state ?? "—" : e.text ?? "—";
    if (e.type === "status") return ["on", "true", "1", "open", "home"].includes(i.toLowerCase()) ? e.onText ?? "On" : e.offText ?? "Off";
    const s = ct(e, i);
    return `${s.value}${!s.mapped && e.unit ? ` ${e.unit}` : ""}`;
  }
  render() {
    const e = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page], i = `aspect-ratio:${Math.max(1, this.width)}/${Math.max(1, this.height)}`;
    if (!e) return l`<div class="screen-frame" style=${i}><div class="screen loading" aria-label="Loading display preview"></div></div>`;
    const s = e.rows.filter((a) => Ae(this.hass, a.visibility)).map((a) => ({ ...a, cards: a.cards.filter((r) => Ae(this.hass, r.visibility)) })).filter((a) => a.cards.length > 0);
    return s.length === 0 ? l`<div class="screen-frame" style=${i}><div class="screen"><div class="card"><div class="value">No visible content</div></div></div></div>` : l`<div class="screen-frame" style=${i}><div class="screen">${e.title && e.showTitle !== !1 ? l`<h3>${e.title}</h3>` : null}${s.map((a) => l`<div class="group" style="flex:${a.weight ?? 1}">${a.title && a.showTitle !== !1 ? l`<div class="title">${a.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${a.cards.length},minmax(0,1fr))">${a.cards.map((r) => {
      const o = r.source ? this.hass?.states[r.source]?.state ?? "—" : r.text ?? "—", d = Number(o), n = r.minimum ?? 0, u = r.maximum ?? 100, y = Number.isFinite(d) && u > n ? Math.max(0, Math.min(100, (d - n) / (u - n) * 100)) : 0, h = { sans: "sans-serif", "sans-bold": "sans-serif", mono: "monospace", serif: "serif" }[r.valueStyle?.fontFamily ?? "sans"], f = { auto: 14, small: 10, medium: 13, large: 17, xlarge: 22 }[r.valueStyle?.fontSize ?? "auto"], b = pt(r, o), P = b?.background ?? r.style?.background ?? "", ue = b?.foreground ?? r.style?.foreground ?? "", ge = (Y[P] ?? P) || "#20242d", me = Y[r.style?.accent ?? ""] ?? r.style?.accent ?? "#42a5f5", Oe = (Y[ue] ?? ue) || "white", ze = { left: "flex-start", center: "center", right: "flex-end" }[r.valueStyle?.horizontalAlign ?? "center"], Ue = { top: "flex-start", middle: "center", bottom: "flex-end" }[r.valueStyle?.verticalAlign ?? "middle"], je = r.valueStyle?.horizontalAlign ?? "center";
      return l`<div class="card" style=${`background:${ge};color:${Oe}`}><small>${r.title ?? ""}</small><div class="value-wrap" style=${`align-items:${Ue};justify-content:${ze};text-align:${je}`}><div class="value" style=${`font-family:${h};font-size:${f}px;font-weight:${r.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`}>${this.cardValue(r)}</div></div>${r.progress === "bar" ? l`<div class="bar"><i style=${`width:${y}%;background:${me}`}></i></div>` : r.progress === "ring" ? l`<div class="ring" style=${`background:conic-gradient(${me} ${y}%,#3d424e 0);--ring-bg:${ge}`}></div>` : null}</div>`;
    })}</div></div>`)}</div></div>`;
  }
};
he.styles = I`
    :host{display:block;width:240px;max-width:100%}.screen-frame{position:relative;width:100%;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.22)}.screen{position:absolute;inset:0;box-sizing:border-box;padding:6px;background:#090b10;color:white;display:flex;flex-direction:column;gap:4px;overflow:hidden}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden}.card small{font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value-wrap{display:flex;min-width:0;min-height:0}.value{max-width:100%;font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring{width:42px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;margin:3px auto}.ring:after{content:"";width:30px;aspect-ratio:1;border-radius:50%;background:var(--ring-bg,#20242d)}
    @keyframes loading{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.loading{animation:none}}
  `;
let w = he;
A([
  p({ attribute: !1 })
], w.prototype, "dashboard");
A([
  p({ attribute: !1 })
], w.prototype, "hass");
A([
  p({ type: Number })
], w.prototype, "page");
A([
  p({ type: Boolean })
], w.prototype, "autoRotate");
A([
  p({ type: Number })
], w.prototype, "width");
A([
  p({ type: Number })
], w.prototype, "height");
A([
  m()
], w.prototype, "now");
A([
  m()
], w.prototype, "autoPage");
customElements.get("mini-display-preview") || customElements.define("mini-display-preview", w);
var yt = Object.defineProperty, vt = Object.getOwnPropertyDescriptor, k = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? vt(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && yt(e, i, a), a;
};
const L = (t, e, i) => {
  t.dispatchEvent(new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 }));
};
let _ = class extends $ {
  constructor() {
    super(...arguments), this.displays = [], this.dashboards = {}, this.pages = {}, this.dirtyDisplays = /* @__PURE__ */ new Set(), this.selectedDisplayId = "", this.selectedSceneId = "", this.selectedSceneName = "";
  }
  render() {
    return l`
      <h2>Preview</h2>
      ${this.displays.map((t) => this.renderDisplay(t))}
    `;
  }
  renderDisplay(t) {
    const e = this.dashboards[t.config_entry_id], i = Math.min(this.pages[t.config_entry_id] ?? 0, Math.max(0, (e?.pages.length ?? 1) - 1)), s = t.preview_scene_id === this.selectedSceneId, a = t.active_scene_id === this.selectedSceneId, r = !!e;
    return l`
      <ha-card
        class=${t.config_entry_id === this.selectedDisplayId ? "selected" : ""}
        @click=${() => L(this, "display-selected", t.config_entry_id)}
      >
        <header>
          <div><strong>${t.title}</strong><small>Active: ${t.active_scene_name ?? "Unknown"}</small></div>
          <button
            class="icon ${s ? "active" : ""}"
            title=${s ? "Stop temporary preview" : e ? "Show temporarily for 5 minutes" : "Add a layout first"}
            aria-label=${s ? "Stop temporary preview" : "Show temporary preview"}
            ?disabled=${!s && !r}
            @click=${(o) => {
      o.stopPropagation(), L(this, "preview-toggle", t);
    }}
          >
            <ha-icon icon=${s ? "mdi:eye" : "mdi:eye-off-outline"}></ha-icon>
          </button>
        </header>
        ${e ? l`
          <mini-display-preview .dashboard=${e} .hass=${this.hass} .page=${i} .width=${t.width} .height=${t.height}></mini-display-preview>
          ${e.pages.length > 1 ? l`
            <nav>
              <button class="icon" aria-label="Previous page" @click=${(o) => {
      o.stopPropagation(), L(this, "preview-page", { displayId: t.config_entry_id, delta: -1 });
    }}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <span>${i + 1} / ${e.pages.length}</span>
              <button class="icon" aria-label="Next page" @click=${(o) => {
      o.stopPropagation(), L(this, "preview-page", { displayId: t.config_entry_id, delta: 1 });
    }}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </nav>
          ` : c}
        ` : l`<ha-alert alert-type="info">No layout in this scene.</ha-alert>`}
        ${!a && e ? l`<ha-button .disabled=${this.dirtyDisplays.has(t.config_entry_id)} @click=${(o) => {
      o.stopPropagation(), L(this, "scene-activate", t);
    }}>Activate ${this.selectedSceneName}</ha-button>` : c}
      </ha-card>
    `;
  }
};
_.styles = I`
    :host { display: grid; gap: 12px; max-height: calc(100vh - 120px); overflow-y: auto; position: sticky; top: 16px; font-family: var(--ha-font-family-body, Roboto, sans-serif); }
    h2 { margin: 0 2px; font-size: 16px; font-weight: 500; }
    ha-card { display: grid; gap: 10px; padding: 12px; border: 2px solid transparent; cursor: pointer; }
    ha-card.selected { border-color: var(--primary-color); }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    strong, small { display: block; }
    strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { margin-top: 3px; color: var(--secondary-text-color); }
    .icon { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; color: var(--secondary-text-color); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
    .icon:hover, .icon.active { color: var(--primary-color); background: var(--secondary-background-color); }
    mini-display-preview { margin: auto; }
    nav { display: flex; align-items: center; justify-content: center; gap: 4px; color: var(--secondary-text-color); font-size: 12px; }
    nav .icon { width: 32px; height: 32px; }
    ha-button { width: 100%; }
    @media(max-width:1100px) { :host { grid-column: 1/-1; grid-template-columns: repeat(auto-fit,minmax(272px,1fr)); max-height: none; overflow: visible; position: static; } h2 { grid-column: 1/-1; } }
    @media(max-width:700px) { :host { grid-column: auto; grid-template-columns: 1fr; } }
  `;
k([
  p({ attribute: !1 })
], _.prototype, "hass", 2);
k([
  p({ attribute: !1 })
], _.prototype, "displays", 2);
k([
  p({ attribute: !1 })
], _.prototype, "dashboards", 2);
k([
  p({ attribute: !1 })
], _.prototype, "pages", 2);
k([
  p({ attribute: !1 })
], _.prototype, "dirtyDisplays", 2);
k([
  p()
], _.prototype, "selectedDisplayId", 2);
k([
  p()
], _.prototype, "selectedSceneId", 2);
k([
  p()
], _.prototype, "selectedSceneName", 2);
_ = k([
  R("mini-display-preview-list")
], _);
var ft = Object.defineProperty, bt = Object.getOwnPropertyDescriptor, O = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? bt(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && ft(e, i, a), a;
};
const x = (t, e, i) => {
  t.dispatchEvent(new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 }));
};
let S = class extends $ {
  constructor() {
    super(...arguments), this.displays = [], this.scenes = [], this.selectedDisplayId = "", this.selectedSceneId = "", this.form = null, this.sceneName = "";
  }
  render() {
    const t = this.displays.find((e) => e.config_entry_id === this.selectedDisplayId);
    return l`
      <ha-card>
        <header><h2>Display</h2></header>
        <div class="picker">
          <label>
            Display
            <select
              .value=${this.selectedDisplayId}
              @change=${(e) => x(this, "display-selected", e.target.value)}
            >
              ${this.displays.map((e) => l`<option value=${e.config_entry_id}>${e.title}</option>`)}
            </select>
          </label>
          <span class="status ${t?.available ? "online" : ""}"><i></i>${t?.available ? "Online" : "Offline"}</span>
        </div>
        <header>
          <h2>Scenes</h2>
          <button class="icon" title="Add scene" aria-label="Add scene" @click=${() => x(this, "scene-create")}>
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
        </header>
        <div class="list">
          ${this.scenes.map((e) => l`
            <div class="row ${e.id === this.selectedSceneId ? "active" : ""}">
              <button class="scene" @click=${() => x(this, "scene-selected", e.id)}>
                <ha-icon icon="mdi:layers-outline"></ha-icon>
                <span>${e.name}</span>
                ${e.is_default ? l`<ha-icon class="default" icon="mdi:star" title="Default scene"></ha-icon>` : c}
              </button>
              ${e.id === this.selectedSceneId ? l`
                <details>
                  <summary aria-label="Scene actions"><ha-icon icon="mdi:dots-vertical"></ha-icon></summary>
                  <div class="menu">
                    <button @click=${() => x(this, "scene-rename")}>Rename</button>
                    <button @click=${() => x(this, "scene-duplicate")}>Duplicate</button>
                    ${e.is_default ? c : l`<button @click=${() => x(this, "scene-default")}>Set as default</button>`}
                    ${e.is_default ? c : l`<button class="danger" @click=${() => x(this, "scene-delete")}>Delete</button>`}
                  </div>
                </details>
              ` : c}
            </div>
          `)}
        </div>
        ${this.form ? l`
          <div class="form">
            <strong>Rename scene</strong>
            <ha-textfield
              label="Scene name"
              .value=${this.sceneName}
              @input=${(e) => x(this, "scene-name", e.target.value)}
              @keydown=${(e) => {
      e.key === "Enter" && x(this, "scene-save");
    }}
            ></ha-textfield>
            <div class="actions">
              <ha-button @click=${() => x(this, "scene-cancel")}>Cancel</ha-button>
              <ha-button .disabled=${!this.sceneName.trim()} @click=${() => x(this, "scene-save")}>Save</ha-button>
            </div>
          </div>
        ` : c}
      </ha-card>
    `;
  }
};
S.styles = I`
    :host { display: block; font-family: var(--ha-font-family-body, Roboto, sans-serif); }
    ha-card { overflow: hidden; border: 1px solid var(--divider-color); }
    header { display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 10px 12px; border-bottom: 1px solid var(--divider-color); }
    h2 { margin: 0; font-size: 16px; font-weight: 500; }
    .picker, .form { display: grid; gap: 8px; padding: 12px; border-bottom: 1px solid var(--divider-color); }
    label { display: grid; gap: 5px; color: var(--secondary-text-color); font-size: 12px; }
    select { width: 100%; min-height: 40px; padding: 8px; color: var(--primary-text-color); font: inherit; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; }
    .status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
    .status i { width: 7px; height: 7px; border-radius: 50%; background: var(--error-color); }
    .status.online i { background: var(--success-color); }
    .list { display: grid; gap: 4px; padding: 8px; }
    .row { display: grid; grid-template-columns: minmax(0, 1fr) 36px; align-items: center; border-radius: 10px; }
    .row.active { background: var(--secondary-background-color); }
    .scene { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 10px; color: var(--primary-text-color); font: inherit; text-align: left; background: transparent; border: 0; cursor: pointer; }
    .scene span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scene .default { flex: none; color: var(--primary-color); }
    .scene ha-icon { color: var(--secondary-text-color); }
    .active .scene ha-icon { color: var(--primary-color); }
    .icon { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; color: var(--primary-text-color); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
    .icon:hover { background: var(--card-background-color); }
    details { position: relative; }
    summary { display: grid; place-items: center; width: 36px; height: 36px; list-style: none; cursor: pointer; }
    summary::-webkit-details-marker { display: none; }
    .menu { position: absolute; right: 0; z-index: 20; display: grid; width: 150px; padding: 6px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; box-shadow: var(--ha-card-box-shadow); }
    .menu button { min-height: 38px; padding: 8px; color: var(--primary-text-color); font: inherit; text-align: left; background: transparent; border: 0; cursor: pointer; }
    .menu .danger { color: var(--error-color); }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .form strong { font-size: 14px; }
    .form small { color: var(--secondary-text-color); line-height: 1.4; }
  `;
O([
  p({ attribute: !1 })
], S.prototype, "displays", 2);
O([
  p({ attribute: !1 })
], S.prototype, "scenes", 2);
O([
  p()
], S.prototype, "selectedDisplayId", 2);
O([
  p()
], S.prototype, "selectedSceneId", 2);
O([
  p()
], S.prototype, "form", 2);
O([
  p()
], S.prototype, "sceneName", 2);
S = O([
  R("mini-display-scene-sidebar")
], S);
var xt = Object.defineProperty, $t = Object.getOwnPropertyDescriptor, Z = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? $t(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && xt(e, i, a), a;
};
const wt = {
  equals: "is",
  not_equals: "is not",
  above: "is above",
  below: "is below",
  available: "is available",
  unavailable: "is unavailable"
}, se = (t, e, i) => {
  t.dispatchEvent(new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 }));
};
let N = class extends $ {
  constructor() {
    super(...arguments), this.targetName = "", this.draft = { mode: "all", conditions: [] };
  }
  connectedCallback() {
    super.connectedCallback(), this.draft = structuredClone(this.value ?? { mode: "all", conditions: [{ entity: "", operator: "equals", value: "" }] });
  }
  render() {
    return l`
      <ha-card role="dialog" aria-modal="true" aria-labelledby="visibility-title" @click=${(t) => t.stopPropagation()}>
        <header><h2 id="visibility-title">${this.targetName} visibility</h2></header>
        <main>
          <p>Show this item only when the entity conditions match.</p>
          ${this.draft.conditions.length > 1 ? l`
            <label>Match<select .value=${this.draft.mode} @change=${(t) => this.draft = { ...this.draft, mode: t.target.value }}><option value="all">All conditions</option><option value="any">Any condition</option></select></label>
          ` : c}
          ${this.draft.conditions.map((t, e) => this.renderCondition(t, e))}
          <ha-button .disabled=${this.draft.conditions.length >= 5} @click=${this.addCondition}>Add condition</ha-button>
        </main>
        <footer class="actions">
          <ha-button @click=${() => se(this, "visibility-clear")}>Always visible</ha-button>
          <div class="right"><ha-button @click=${() => se(this, "visibility-cancel")}>Cancel</ha-button><ha-button @click=${() => se(this, "visibility-save", this.draft)}>Save</ha-button></div>
        </footer>
      </ha-card>
    `;
  }
  renderCondition(t, e) {
    const i = !["available", "unavailable"].includes(t.operator);
    return l`
      <div class="condition">
        <ha-form
          .hass=${this.hass}
          .data=${{ entity: t.entity }}
          .schema=${[{ name: "entity", required: !0, selector: { entity: {} } }]}
          .computeLabel=${() => "Entity"}
          @value-changed=${(s) => this.updateCondition(e, { entity: s.detail.value.entity })}
        ></ha-form>
        <label>Condition<select .value=${t.operator} @change=${(s) => this.updateCondition(e, { operator: s.target.value })}>${Object.entries(wt).map(([s, a]) => l`<option value=${s}>${a}</option>`)}</select></label>
        ${i ? l`<label>Value<input .value=${t.value ?? ""} @input=${(s) => this.updateCondition(e, { value: s.target.value })}></label>` : l`<span></span>`}
        <button class="icon" aria-label="Remove condition" @click=${() => this.removeCondition(e)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>
    `;
  }
  updateCondition(t, e) {
    this.draft = { ...this.draft, conditions: this.draft.conditions.map((i, s) => s === t ? { ...i, ...e } : i) };
  }
  addCondition() {
    this.draft = { ...this.draft, conditions: [...this.draft.conditions, { entity: "", operator: "equals", value: "" }] };
  }
  removeCondition(t) {
    this.draft = { ...this.draft, conditions: this.draft.conditions.filter((e, i) => i !== t) };
  }
};
N.styles = I`
    :host { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; font-family: var(--ha-font-family-body, Roboto, sans-serif); background: rgba(0,0,0,.48); }
    ha-card { width: min(620px,100%); max-height: min(760px,calc(100vh - 32px)); overflow: auto; }
    header { padding: 16px; border-bottom: 1px solid var(--divider-color); }
    h2 { margin: 0; font-size: 20px; font-weight: 500; }
    main { display: grid; gap: 14px; padding: 16px; }
    p { margin: 0; color: var(--secondary-text-color); font-size: 13px; }
    label { display: grid; gap: 5px; color: var(--secondary-text-color); font-size: 12px; }
    select, input { min-height: 40px; padding: 8px; color: var(--primary-text-color); font: inherit; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; }
    .condition { display: grid; grid-template-columns: minmax(180px,1fr) 140px minmax(100px,.7fr) 40px; gap: 8px; align-items: end; padding: 12px; border: 1px solid var(--divider-color); border-radius: 10px; }
    .icon { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; color: var(--error-color); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
    .actions { display: flex; justify-content: space-between; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .right { display: flex; gap: 8px; }
    @media(max-width:650px) { .condition { grid-template-columns: 1fr; } .icon { justify-self: end; } }
  `;
Z([
  p({ attribute: !1 })
], N.prototype, "hass", 2);
Z([
  p()
], N.prototype, "targetName", 2);
Z([
  p({ attribute: !1 })
], N.prototype, "value", 2);
Z([
  m()
], N.prototype, "draft", 2);
N = Z([
  R("mini-display-visibility-dialog")
], N);
var _t = Object.defineProperty, St = Object.getOwnPropertyDescriptor, v = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? St(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && _t(e, i, a), a;
};
let g = class extends $ {
  constructor() {
    super(...arguments), this.displays = [], this.scenes = [], this.dashboards = {}, this.savedDashboards = {}, this.selectedDisplayId = "", this.selectedSceneId = "", this.pageIndex = 0, this.previewPages = {}, this.syncState = "idle", this.syncMessage = "", this.loaded = !1, this.sceneForm = null, this.sceneName = "", this.dirtyDisplays = /* @__PURE__ */ new Set(), this.previewsStarted = /* @__PURE__ */ new Set(), this.allowNavigation = !1, this.beforeUnload = (t) => {
      this.stopPanelPreviews(), !(!this.dirtyDisplays.size || this.allowNavigation) && (t.preventDefault(), t.returnValue = "");
    }, this.interceptNavigation = (t) => {
      if (!this.dirtyDisplays.size || this.allowNavigation || t.defaultPrevented || t.button !== 0) return;
      const e = t.composedPath().find((s) => s instanceof HTMLAnchorElement);
      if (!e?.href || e.target === "_blank" || e.hasAttribute("download")) return;
      const i = new URL(e.href, window.location.href);
      i.pathname === window.location.pathname && i.search === window.location.search && i.hash === window.location.hash || (t.preventDefault(), t.stopImmediatePropagation(), this.confirmation = { kind: "leave", href: i.href });
    };
  }
  updated(t) {
    t.has("hass") && !this.loaded && this.load();
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("beforeunload", this.beforeUnload), window.addEventListener("click", this.interceptNavigation, !0);
  }
  disconnectedCallback() {
    this.stopPanelPreviews(), window.removeEventListener("beforeunload", this.beforeUnload), window.removeEventListener("click", this.interceptNavigation, !0), super.disconnectedCallback();
  }
  stopPanelPreviews() {
    if (!this.hass) return;
    const t = new Set(this.previewsStarted);
    for (const e of this.displays)
      e.preview_scene_id && t.add(e.config_entry_id);
    for (const e of t)
      this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: e });
    this.previewsStarted.clear();
  }
  get selectedDisplay() {
    return this.displays.find((t) => t.config_entry_id === this.selectedDisplayId);
  }
  get selectedScene() {
    return this.scenes.find((t) => t.id === this.selectedSceneId);
  }
  get dashboard() {
    return this.dashboards[this.selectedDisplayId];
  }
  errorMessage(t) {
    if (typeof t == "string") return t;
    if (t instanceof Error) return t.message;
    if (t && typeof t == "object") {
      const e = t;
      if (typeof e.message == "string")
        return typeof e.code == "string" ? `${e.message} (${e.code})` : e.message;
      try {
        return JSON.stringify(t);
      } catch {
        return "Unknown error";
      }
    }
    return String(t);
  }
  retryableSaveError(t) {
    if (!t || typeof t != "object") return !1;
    const e = t;
    if (e.code === "display_unavailable") return !0;
    if (typeof e.message != "string") return !1;
    const i = e.message.toLowerCase();
    return i.includes("did not respond") || i.includes("timeout");
  }
  async saveDashboardWithRetry(t) {
    if (!this.hass) return;
    const e = [0, 300, 800];
    for (let i = 0; i < e.length; i += 1) {
      e[i] && (this.syncMessage = `Retrying save (${i + 1}/${e.length})`, await new Promise((s) => window.setTimeout(s, e[i])));
      try {
        await this.hass.callWS(t);
        return;
      } catch (s) {
        if (i === e.length - 1 || !this.retryableSaveError(s))
          throw s;
      }
    }
  }
  async load(t) {
    if (this.hass) {
      this.loaded = !0;
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "mini_display/displays" }),
          this.hass.callWS({ type: "mini_display/scenes" })
        ]);
        this.displays = e, this.scenes = i, e.some((r) => r.config_entry_id === this.selectedDisplayId) || (this.selectedDisplayId = e[0]?.config_entry_id ?? "");
        const s = this.selectedDisplay?.active_scene_id ?? i[0]?.id ?? "", a = t ?? this.selectedSceneId;
        this.selectedSceneId = i.some((r) => r.id === a) ? a : s, await this.loadSceneDashboards(), this.syncState = "idle", this.syncMessage = "";
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
    }
  }
  async loadSceneDashboards() {
    if (!this.hass || !this.selectedSceneId) {
      this.dashboards = {};
      return;
    }
    const t = await Promise.all(this.displays.map(async (e) => {
      const i = await this.hass.callWS({ type: "mini_display/dashboard/get", config_entry_id: e.config_entry_id, scene_id: this.selectedSceneId });
      return [e.config_entry_id, i];
    }));
    this.dashboards = Object.fromEntries(t), this.savedDashboards = structuredClone(this.dashboards), this.dirtyDisplays = /* @__PURE__ */ new Set(), this.previewPages = Object.fromEntries(this.displays.map((e) => [e.config_entry_id, 0])), this.pageIndex = 0, this.selected = { row: 0, card: 0 };
  }
  async selectScene(t) {
    t !== this.selectedSceneId && (this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and switch scene?") || (this.stopPanelPreviews(), this.displays = this.displays.map((e) => ({ ...e, preview_scene_id: null })), this.selectedSceneId = t, this.syncState = "idle", this.syncMessage = "", await this.loadSceneDashboards()));
  }
  selectDisplay(t) {
    this.selectedDisplayId = t, this.pageIndex = this.previewPages[t] ?? 0, this.selected = { row: 0, card: 0 };
  }
  changed() {
    this.dashboard && (this.stopPreviewFor(this.selectedDisplayId), this.dashboards = { ...this.dashboards, [this.selectedDisplayId]: structuredClone(this.dashboard) }, this.dirtyDisplays = new Set(this.dirtyDisplays).add(this.selectedDisplayId), this.syncState = "idle", this.syncMessage = "Unsaved changes");
  }
  async save() {
    if (!(!this.hass || !this.dashboard || !this.selectedDisplayId || !this.selectedSceneId))
      try {
        this.syncState = "syncing", this.syncMessage = "Saving", await this.saveDashboardWithRetry({ type: "mini_display/dashboard/set", config_entry_id: this.selectedDisplayId, scene_id: this.selectedSceneId, dashboard: this.dashboard }), this.savedDashboards = { ...this.savedDashboards, [this.selectedDisplayId]: structuredClone(this.dashboard) };
        const t = new Set(this.dirtyDisplays);
        t.delete(this.selectedDisplayId), this.dirtyDisplays = t, this.syncState = "success", this.syncMessage = "Saved";
      } catch (t) {
        this.syncState = "error", this.syncMessage = this.errorMessage(t);
      }
  }
  async showPage(t) {
    await this.stopPreviewFor(this.selectedDisplayId), this.pageIndex = t, this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: t }, this.selected = { row: 0, card: 0 };
  }
  discard() {
    const t = this.savedDashboards[this.selectedDisplayId];
    if (t === void 0) return;
    this.dashboards = {
      ...this.dashboards,
      [this.selectedDisplayId]: t ? structuredClone(t) : null
    };
    const e = new Set(this.dirtyDisplays);
    e.delete(this.selectedDisplayId), this.dirtyDisplays = e, this.pageIndex = 0, this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: 0 }, this.selected = { row: 0, card: 0 }, this.syncState = "idle", this.syncMessage = "Changes discarded";
  }
  async stopPreviewFor(t) {
    const e = this.displays.find((i) => i.config_entry_id === t);
    if (!(!this.hass || !e?.preview_scene_id))
      try {
        await this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: t }), this.previewsStarted.delete(t), this.displays = this.displays.map((i) => i.config_entry_id === t ? { ...i, preview_scene_id: null } : i);
      } catch (i) {
        this.syncState = "error", this.syncMessage = this.errorMessage(i);
      }
  }
  async activateScene(t) {
    if (this.hass)
      try {
        await this.hass.callWS({ type: "mini_display/scene/activate", config_entry_id: t.config_entry_id, scene_id: this.selectedSceneId }), this.previewsStarted.delete(t.config_entry_id), this.displays = this.displays.map((e) => e.config_entry_id === t.config_entry_id ? { ...e, active_scene_id: this.selectedSceneId, active_scene_name: this.selectedScene?.name ?? null, preview_scene_id: null } : e), this.syncState = "success", this.syncMessage = "Scene activated";
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
  }
  async togglePreview(t) {
    if (!this.hass) return;
    const e = t.preview_scene_id === this.selectedSceneId;
    try {
      if (e)
        await this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: t.config_entry_id }), this.previewsStarted.delete(t.config_entry_id);
      else {
        const i = this.dashboards[t.config_entry_id], s = this.previewPages[t.config_entry_id] ?? 0;
        await this.hass.callWS({ type: "mini_display/scene/preview/start", config_entry_id: t.config_entry_id, scene_id: this.selectedSceneId, page_id: i?.pages[s]?.id, dashboard: i }), this.previewsStarted.add(t.config_entry_id);
      }
      this.displays = this.displays.map((i) => i.config_entry_id === t.config_entry_id ? { ...i, preview_scene_id: e ? null : this.selectedSceneId } : i), this.syncState = "success", this.syncMessage = e ? "Preview stopped" : "Preview shown for 5 minutes";
    } catch (i) {
      this.syncState = "error", this.syncMessage = this.errorMessage(i);
    }
  }
  async createScene() {
    if (!this.hass || this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and create a scene?")) return;
    const t = new Set(this.scenes.map((s) => s.name.toLocaleLowerCase()));
    let e = "New scene", i = 1;
    for (; t.has(e.toLocaleLowerCase()); ) e = `New scene (${i++})`;
    try {
      const s = await this.hass.callWS({ type: "mini_display/scene/create", name: e });
      await this.load(s.id), this.syncState = "success", this.syncMessage = "Scene created";
    } catch (s) {
      this.syncState = "error", this.syncMessage = this.errorMessage(s);
    }
  }
  openRenameScene() {
    this.sceneForm = "rename", this.sceneName = this.selectedScene?.name ?? "";
  }
  async saveSceneForm() {
    const t = this.sceneName.trim();
    if (!(!this.hass || !t))
      try {
        this.sceneForm === "rename" && this.selectedSceneId && (await this.hass.callWS({ type: "mini_display/scene/rename", scene_id: this.selectedSceneId, name: t }), this.sceneForm = null, await this.load(this.selectedSceneId));
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
  }
  async deleteScene() {
    if (!(!this.hass || this.selectedScene?.is_default || !window.confirm(`Delete scene "${this.selectedScene?.name}"?`)))
      try {
        await this.hass.callWS({ type: "mini_display/scene/delete", scene_id: this.selectedSceneId }), await this.load(this.scenes.find((t) => t.is_default)?.id);
      } catch (t) {
        this.syncState = "error", this.syncMessage = this.errorMessage(t);
      }
  }
  async duplicateScene() {
    if (!(!this.hass || !this.selectedSceneId))
      try {
        const t = await this.hass.callWS({
          type: "mini_display/scene/duplicate",
          source_scene_id: this.selectedSceneId
        });
        await this.load(t.id), this.syncState = "success", this.syncMessage = "Scene duplicated";
      } catch (t) {
        this.syncState = "error", this.syncMessage = this.errorMessage(t);
      }
  }
  async setDefaultScene() {
    if (!(!this.hass || !this.selectedSceneId || this.selectedScene?.is_default))
      try {
        await this.hass.callWS({
          type: "mini_display/scene/default",
          scene_id: this.selectedSceneId
        }), await this.load(this.selectedSceneId), this.syncState = "success", this.syncMessage = "Default scene changed";
      } catch (t) {
        this.syncState = "error", this.syncMessage = this.errorMessage(t);
      }
  }
  createLayout() {
    !this.selectedDisplayId || this.dashboard || (this.dashboards = {
      ...this.dashboards,
      [this.selectedDisplayId]: dt()
    }, this.pageIndex = 0, this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: 0 }, this.selected = { row: 0, card: 0 }, this.dirtyDisplays = new Set(this.dirtyDisplays).add(this.selectedDisplayId), this.syncState = "idle", this.syncMessage = "Unsaved changes");
  }
  deletePage() {
    if (!this.dashboard || this.dashboard.pages.length <= 1) return;
    const t = this.dashboard.pages[this.pageIndex];
    window.confirm(`Delete page "${t.title || t.id}"?`) && (this.dashboard.pages.splice(this.pageIndex, 1), this.pageIndex = Math.min(this.pageIndex, this.dashboard.pages.length - 1), this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: this.pageIndex }, this.selected = { row: 0, card: 0 }, this.changed());
  }
  visibilityObject() {
    if (!this.visibilityTarget || !this.dashboard) return;
    const t = this.dashboard.pages[this.pageIndex]?.rows[this.visibilityTarget.row];
    if (t)
      return this.visibilityTarget.kind === "row" ? t : t.cards[this.visibilityTarget.card ?? -1];
  }
  openVisibility(t, e, i) {
    this.visibilityTarget = { kind: t, row: e, card: i };
  }
  saveVisibility(t) {
    const e = this.visibilityObject();
    if (!e) return;
    const i = t.conditions.map((s) => ({ ...s, entity: s.entity.trim() })).filter((s) => s.entity);
    i.length ? e.visibility = { ...t, conditions: i } : delete e.visibility, this.visibilityTarget = void 0, this.changed();
  }
  clearVisibility() {
    const t = this.visibilityObject();
    t && delete t.visibility, this.visibilityTarget = void 0, this.changed();
  }
  requestDeleteRow(t) {
    this.confirmation = { kind: "delete-row", row: t };
  }
  closeConfirmation() {
    this.confirmation = void 0;
  }
  async confirmAction() {
    const t = this.confirmation;
    if (this.confirmation = void 0, !t) return;
    if (t.kind === "delete-row") {
      const i = this.dashboard?.pages[this.pageIndex];
      if (!i || i.rows.length <= 1 || !i.rows[t.row]) return;
      i.rows.splice(t.row, 1), this.selected = void 0, this.changed();
      return;
    }
    this.allowNavigation = !0, this.stopPanelPreviews();
    const e = new URL(t.href);
    e.origin === window.location.origin ? (history.pushState(null, "", `${e.pathname}${e.search}${e.hash}`), window.dispatchEvent(new Event("location-changed"))) : window.location.assign(e.href);
  }
  async previewPage(t, e) {
    await this.stopPreviewFor(t);
    const i = this.dashboards[t];
    if (!i) return;
    const a = ((this.previewPages[t] ?? 0) + e + i.pages.length) % i.pages.length;
    this.previewPages = { ...this.previewPages, [t]: a }, t === this.selectedDisplayId && (this.pageIndex = a, this.selected = { row: 0, card: 0 });
  }
  field(t, e, i, s = "text") {
    return l`<label class="field">${t}<input type=${s} .value=${String(e ?? "")} @input=${(a) => i(a.target.value)}></label>`;
  }
  select(t, e, i, s) {
    return l`<label class="field">${t}<select @change=${(a) => s(a.target.value)}>${i.map((a) => l`<option value=${a} ?selected=${a === e}>${a}</option>`)}</select></label>`;
  }
  checkbox(t, e, i) {
    return l`<label class="check"><input type="checkbox" .checked=${e} @change=${(s) => i(s.target.checked)}>${t}</label>`;
  }
  segmented(t, e, i, s) {
    return l`<div class="segmented-field"><span>${t}</span><div class="segmented" role="radiogroup" aria-label=${t}>${i.map((a) => l`<button class="segment ${a.value === e ? "active" : ""}" role="radio" aria-checked=${a.value === e} title=${a.label} @click=${() => s(a.value)}>${a.icon ? l`<ha-icon icon=${a.icon}></ha-icon>` : c}<span>${a.label}</span></button>`)}</div></div>`;
  }
  textPosition(t) {
    const e = t.horizontalAlign ?? "center", i = t.verticalAlign ?? "middle";
    return l`<div class="position-field"><span>Text position</span><div class="position-grid" role="radiogroup" aria-label="Text position">${[
      { horizontal: "left", vertical: "top", label: "Top left" },
      { horizontal: "center", vertical: "top", label: "Top center" },
      { horizontal: "right", vertical: "top", label: "Top right" },
      { horizontal: "left", vertical: "middle", label: "Middle left" },
      { horizontal: "center", vertical: "middle", label: "Center" },
      { horizontal: "right", vertical: "middle", label: "Middle right" },
      { horizontal: "left", vertical: "bottom", label: "Bottom left" },
      { horizontal: "center", vertical: "bottom", label: "Bottom center" },
      { horizontal: "right", vertical: "bottom", label: "Bottom right" }
    ].map((a) => {
      const r = a.horizontal === e && a.vertical === i;
      return l`<button class="position-button ${r ? "active" : ""}" role="radio" aria-checked=${r} aria-label=${a.label} title=${a.label} @click=${() => {
        t.horizontalAlign = a.horizontal, t.verticalAlign = a.vertical, this.changed();
      }}><span class="position-dot"></span></button>`;
    })}</div></div>`;
  }
  entity(t) {
    const e = { number: ["sensor", "number", "input_number", "counter"], status: ["binary_sensor", "switch", "input_boolean", "lock", "cover", "person", "device_tracker"], text: ["sensor", "text", "input_text", "select", "input_select"], clock: [] };
    return l`<ha-form .hass=${this.hass} .data=${{ entity: t.source ?? "" }} .schema=${[{ name: "entity", required: t.type !== "text", selector: { entity: { domain: e[t.type] } } }]} .computeLabel=${() => t.type === "number" ? "Numeric entity" : t.type === "status" ? "State entity" : "Text entity (optional)"} @value-changed=${(i) => {
      t.source = i.detail.value.entity, this.changed();
    }}></ha-form>`;
  }
  menu(t) {
    return l`<details class="menu"><summary aria-label="More actions"><ha-icon icon="mdi:dots-vertical"></ha-icon></summary><div class="menu-popover">${t}</div></details>`;
  }
  styleEditor(t) {
    const e = t.style ??= {}, i = t.valueStyle ??= {};
    return l`<details class="style"><summary>Appearance</summary><div class="grid"><mini-display-color-field label="Background" .value=${e.background ?? ""} @color-changed=${(s) => {
      e.background = s.detail || void 0, this.changed();
    }}></mini-display-color-field><mini-display-color-field label="Text color" .value=${e.foreground ?? ""} @color-changed=${(s) => {
      e.foreground = s.detail || void 0, this.changed();
    }}></mini-display-color-field><mini-display-color-field label="Accent" .value=${e.accent ?? ""} @color-changed=${(s) => {
      e.accent = s.detail || void 0, this.changed();
    }}></mini-display-color-field>${this.select("Font", i.fontFamily ?? "sans", ["sans", "sans-bold", "mono", "serif"], (s) => {
      i.fontFamily = s, this.changed();
    })}${this.select("Font size", i.fontSize ?? "auto", ["auto", "small", "medium", "large", "xlarge"], (s) => {
      i.fontSize = s, this.changed();
    })}${this.textPosition(i)}</div></details>`;
  }
  transitionEditor(t) {
    const e = t.transition ?? { type: "none" }, i = (n) => {
      t.transition = n, this.changed();
    }, s = (n) => i({ ...e, ...n }), a = [
      { type: "none", label: "None", icon: "mdi:cancel" },
      { type: "random", label: "Random", icon: "mdi:shuffle-variant" },
      { type: "slide", label: "Slide", icon: "mdi:arrow-right-bold" },
      { type: "bounce", label: "Bounce", icon: "mdi:arrow-up-bold-circle-outline" },
      { type: "fade", label: "Fade", icon: "mdi:brightness-6" },
      { type: "wipe", label: "Wipe", icon: "mdi:transition-masked" },
      { type: "dissolve", label: "Dissolve", icon: "mdi:dots-grid" },
      { type: "curtain", label: "Curtain", icon: "mdi:curtains" },
      { type: "blinds", label: "Blinds", icon: "mdi:blinds-horizontal" },
      { type: "mosaic", label: "Mosaic", icon: "mdi:view-grid-plus" },
      { type: "doors", label: "Doors", icon: "mdi:door-sliding" },
      { type: "spiral", label: "Spiral", icon: "mdi:reload" }
    ], r = (n) => n === "none" ? { type: n } : n === "random" ? { type: n, speed: "normal" } : ["dissolve", "mosaic", "spiral"].includes(n) ? { type: n, speed: "normal", tileSize: "medium" } : n === "fade" ? { type: n, speed: "normal", intensity: "strong" } : n === "bounce" ? { type: n, direction: "left", speed: "normal", intensity: "subtle" } : ["curtain", "blinds"].includes(n) ? { type: n, direction: "left", speed: "normal" } : { type: n, direction: "left", speed: "normal" }, o = [
      { value: "left", label: "Left", icon: "mdi:arrow-left" },
      { value: "right", label: "Right", icon: "mdi:arrow-right" },
      { value: "up", label: "Up", icon: "mdi:arrow-up" },
      { value: "down", label: "Down", icon: "mdi:arrow-down" }
    ], d = [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ];
    return l`<details class="transition-settings"><summary class="transition-summary">Transition to next page · ${a.find((n) => n.type === e.type)?.label ?? "None"}</summary><div class="effect-grid">${a.map((n) => l`<button class="effect ${e.type === n.type ? "active" : ""}" aria-pressed=${n.type === e.type} @click=${() => i(r(n.type))}><ha-icon icon=${n.icon}></ha-icon><span>${n.label}</span></button>`)}</div>${e.type !== "none" ? l`<div class="transition-options">${["slide", "bounce", "wipe", "curtain", "blinds"].includes(e.type) ? this.segmented("Direction", e.direction ?? "left", o, (n) => s({ direction: n })) : c}${this.segmented("Speed", e.speed ?? "normal", d, (n) => s({ speed: n }))}${["bounce", "fade"].includes(e.type) ? this.segmented("Intensity", e.intensity ?? "subtle", [{ value: "subtle", label: "Subtle" }, { value: "strong", label: "Strong" }], (n) => s({ intensity: n })) : c}${["dissolve", "mosaic", "spiral"].includes(e.type) ? this.segmented("Tile size", e.tileSize ?? "medium", [{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }], (n) => s({ tileSize: n })) : c}</div>` : c}</details>`;
  }
  dragMapping(t, e, i) {
    this.draggedMapping = { kind: t, index: e }, i.dataTransfer?.setData("text/plain", `${t}:${e}`), i.dataTransfer && (i.dataTransfer.effectAllowed = "move"), this.requestUpdate();
  }
  dropMapping(t, e, i, s) {
    s.preventDefault();
    const a = this.draggedMapping;
    if (this.draggedMapping = void 0, !a || a.kind !== e || a.index === i) {
      this.requestUpdate();
      return;
    }
    const r = e === "value" ? t.valueMappings : t.colorMappings;
    if (!r) return;
    const [o] = r.splice(a.index, 1);
    r.splice(i, 0, o), this.changed();
  }
  dragHandle(t, e) {
    return l`<span
      class="drag-handle"
      draggable="true"
      title="Drag to reorder"
      aria-label="Drag to reorder"
      @dragstart=${(i) => this.dragMapping(t, e, i)}
      @dragend=${() => {
      this.draggedMapping = void 0, this.requestUpdate();
    }}
    ><ha-icon icon="mdi:drag-vertical"></ha-icon></span>`;
  }
  dragCard(t, e, i) {
    this.draggedCard = { row: t, index: e }, i.dataTransfer?.setData("text/plain", `card:${t}:${e}`), i.dataTransfer && (i.dataTransfer.effectAllowed = "move"), this.requestUpdate();
  }
  dropCard(t, e, i) {
    i.preventDefault();
    const s = this.draggedCard;
    if (this.draggedCard = void 0, !s || s.row !== t || s.index === e) {
      this.requestUpdate();
      return;
    }
    const a = this.dashboard?.pages[this.pageIndex]?.rows[t]?.cards;
    if (!a) return;
    const [r] = a.splice(s.index, 1);
    a.splice(e, 0, r), this.selected = { row: t, card: e }, this.changed();
  }
  valueMappingsEditor(t) {
    if (t.type !== "number" && t.type !== "text") return c;
    const e = t.valueMappings ?? [], i = (a, r, o) => {
      const d = e[a];
      o.trim() === "" ? delete d[r] : d[r] = Number(o), this.changed();
    }, s = (a) => {
      e.splice(a, 1), e.length || delete t.valueMappings, this.changed();
    };
    return l`<details class="mappings">
      <summary>Value mappings${e.length ? ` (${e.length})` : ""}</summary>
      <div class="mapping-list">
        <p class="mapping-copy">Rules are checked from top to bottom. The first match wins.</p>
        ${e.map((a, r) => t.type === "number" ? l`
          <div class="mapping-rule ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === r ? "dragging" : ""}" @dragover=${(o) => o.preventDefault()} @drop=${(o) => this.dropMapping(t, "value", r, o)}>
            ${this.dragHandle("value", r)}
            ${this.field("From", a.minimum, (o) => i(r, "minimum", o), "number")}
            ${this.field("To", a.maximum, (o) => i(r, "maximum", o), "number")}
            ${this.field("Display as", a.value, (o) => {
      a.value = o, this.changed();
    })}
            <button class="icon-button danger" title="Delete mapping" aria-label="Delete mapping" @click=${() => s(r)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        ` : l`
          <div class="mapping-rule text ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === r ? "dragging" : ""}" @dragover=${(o) => o.preventDefault()} @drop=${(o) => this.dropMapping(t, "value", r, o)}>
            ${this.dragHandle("value", r)}
            ${this.select("Match", a.operator, ["equals", "starts_with", "ends_with", "contains"], (o) => {
      a.operator = o, this.changed();
    })}
            ${this.field("Text", a.match, (o) => {
      a.match = o, this.changed();
    })}
            ${this.field("Display as", a.value, (o) => {
      a.value = o, this.changed();
    })}
            <button class="icon-button danger" title="Delete mapping" aria-label="Delete mapping" @click=${() => s(r)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        `)}
        ${e.length < 12 ? l`<button class="add-button" @click=${() => {
      const a = t.type === "number" ? { minimum: 0, maximum: 100, value: "" } : { operator: "equals", match: "", value: "" };
      t.valueMappings = [...e, a], this.changed();
    }}>Add mapping</button>` : c}
      </div>
    </details>`;
  }
  colorMappingsEditor(t) {
    if (t.type !== "number" && t.type !== "text") return c;
    const e = t.colorMappings ?? [], i = (r, o, d) => {
      const n = e[r];
      d.trim() === "" ? delete n[o] : n[o] = Number(d), this.changed();
    }, s = (r, o, d) => {
      d ? r[o] = d : delete r[o], this.changed();
    }, a = (r) => {
      e.splice(r, 1), e.length || delete t.colorMappings, this.changed();
    };
    return l`<details class="mappings">
      <summary>Color mappings${e.length ? ` (${e.length})` : ""}</summary>
      <div class="mapping-list">
        <p class="mapping-copy">The first matching rule sets the card colors.</p>
        ${e.map((r, o) => t.type === "number" ? l`
          <div class="mapping-rule colors ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === o ? "dragging" : ""}" @dragover=${(d) => d.preventDefault()} @drop=${(d) => this.dropMapping(t, "color", o, d)}>
            ${this.dragHandle("color", o)}
            ${this.field("From", r.minimum, (d) => i(o, "minimum", d), "number")}
            ${this.field("To", r.maximum, (d) => i(o, "maximum", d), "number")}
            <mini-display-color-field label="Background" .value=${r.background ?? ""} @color-changed=${(d) => s(r, "background", d.detail)}></mini-display-color-field>
            <mini-display-color-field label="Text color" .value=${r.foreground ?? ""} @color-changed=${(d) => s(r, "foreground", d.detail)}></mini-display-color-field>
            <button class="icon-button danger" title="Delete color mapping" aria-label="Delete color mapping" @click=${() => a(o)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        ` : l`
          <div class="mapping-rule colors text ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === o ? "dragging" : ""}" @dragover=${(d) => d.preventDefault()} @drop=${(d) => this.dropMapping(t, "color", o, d)}>
            ${this.dragHandle("color", o)}
            ${this.select("Match", r.operator, ["equals", "starts_with", "ends_with", "contains"], (d) => {
      r.operator = d, this.changed();
    })}
            ${this.field("Text", r.match, (d) => {
      r.match = d, this.changed();
    })}
            <mini-display-color-field label="Background" .value=${r.background ?? ""} @color-changed=${(d) => s(r, "background", d.detail)}></mini-display-color-field>
            <mini-display-color-field label="Text color" .value=${r.foreground ?? ""} @color-changed=${(d) => s(r, "foreground", d.detail)}></mini-display-color-field>
            <button class="icon-button danger" title="Delete color mapping" aria-label="Delete color mapping" @click=${() => a(o)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        `)}
        ${e.length < 12 ? l`<button class="add-button" @click=${() => {
      const r = t.type === "number" ? { minimum: 0, maximum: 100 } : { operator: "equals", match: "" };
      t.colorMappings = [...e, r], this.changed();
    }}>Add color mapping</button>` : c}
      </div>
    </details>`;
  }
  cardSettings(t, e, i) {
    const s = this.dashboard.pages[this.pageIndex].rows[e].cards, a = { number: "Displays a numeric value with an optional unit and progress visualization.", text: "Displays text from an entity or the static text below.", status: "Maps a state entity to two readable labels.", clock: "Displays local time without using an entity." };
    return l`<section class="card-settings"><div class="card-head"><div><strong>${t.title || `Card ${i + 1}`}</strong>${t.visibility ? l`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : c}</div>${this.menu(l`<button @click=${() => this.openVisibility("card", e, i)}>Visibility</button><button @click=${() => {
      s.splice(i + 1, 0, structuredClone(t)), this.selected = { row: e, card: i + 1 }, this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${s.length === 1} @click=${() => {
      s.length > 1 && (s.splice(i, 1), this.selected = void 0, this.changed());
    }}>Delete</button>`)}</div><div class="grid">${this.select("Type", t.type, ["number", "text", "clock", "status"], (r) => {
      Object.keys(t).forEach((o) => delete t[o]), Object.assign(t, ae(r)), this.changed();
    })}${this.field("Title", t.title, (r) => {
      t.title = r, this.changed();
    })}<p class="hint">${a[t.type]}</p>${["number", "status", "text"].includes(t.type) ? this.entity(t) : c}${t.type === "number" ? l`${this.field("Unit", t.unit, (r) => {
      t.unit = r, this.changed();
    })}${this.select("Progress", t.progress ?? "none", ["none", "bar", "ring"], (r) => {
      t.progress = r, this.changed();
    })}${t.progress && t.progress !== "none" ? l`${this.field("Minimum", t.minimum, (r) => {
      t.minimum = Number(r), this.changed();
    }, "number")}${this.field("Maximum", t.maximum, (r) => {
      t.maximum = Number(r), this.changed();
    }, "number")}` : c}` : c}${t.type === "text" ? this.field("Static text", t.text, (r) => {
      t.text = r, this.changed();
    }) : c}${t.type === "status" ? l`${this.field("On text", t.onText, (r) => {
      t.onText = r, this.changed();
    })}${this.field("Off text", t.offText, (r) => {
      t.offText = r, this.changed();
    })}` : c}</div>${this.valueMappingsEditor(t)}${this.colorMappingsEditor(t)}${this.styleEditor(t)}</section>`;
  }
  rowEditor(t, e) {
    const i = this.dashboard.pages[this.pageIndex];
    return l`<section class="row-panel"><div class="row-head"><div class="row-title"><strong>Row ${e + 1}</strong><small>${t.cards.length} ${t.cards.length === 1 ? "card" : "cards"}</small>${t.visibility ? l`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : c}</div>${this.menu(l`<button @click=${() => this.openVisibility("row", e)}>Visibility</button><button @click=${() => {
      i.rows.splice(e + 1, 0, structuredClone(t)), this.changed();
    }}>Duplicate</button><button class="danger" ?disabled=${i.rows.length === 1} @click=${() => {
      i.rows.length > 1 && this.requestDeleteRow(e);
    }}>Delete</button>`)}</div>${this.field("Row title", t.title, (s) => {
      t.title = s, this.changed();
    })}<nav class="card-tabs" aria-label=${`Cards in row ${e + 1}`}>${t.cards.map((s, a) => l`<button draggable="true" class="tab ${this.selected?.row === e && this.selected?.card === a ? "active" : ""} ${this.draggedCard?.row === e && this.draggedCard.index === a ? "dragging" : ""}" aria-pressed=${this.selected?.row === e && this.selected?.card === a} @dragstart=${(r) => this.dragCard(e, a, r)} @dragover=${(r) => r.preventDefault()} @drop=${(r) => this.dropCard(e, a, r)} @dragend=${() => {
      this.draggedCard = void 0, this.requestUpdate();
    }} @click=${() => this.selected = { row: e, card: a }}>Card ${a + 1} · ${s.type}${s.visibility ? " · conditional" : ""}</button>`)}${t.cards.length < 3 ? l`<button class="icon-button" title="Add card" aria-label="Add card" @click=${() => {
      t.cards.push(ae()), this.selected = { row: e, card: t.cards.length - 1 }, this.changed();
    }}><ha-icon icon="mdi:plus"></ha-icon></button>` : c}</nav>${this.selected?.row === e ? this.cardSettings(t.cards[this.selected.card], e, this.selected.card) : c}</section>`;
  }
  renderEditor() {
    const t = this.dashboard, e = t?.pages[this.pageIndex], i = this.dirtyDisplays.has(this.selectedDisplayId);
    return l`<ha-card class="editor-card"><div class="editor-heading"><div class="editor-title"><strong>${this.selectedDisplay?.title}</strong><small>${this.selectedScene?.name}</small></div><div class="save-area"><div class="sync ${this.syncState}" role=${this.syncState === "error" ? "alert" : "status"} aria-live="polite"><i></i><span>${this.syncMessage}</span></div><div class="save-actions"><ha-button .disabled=${!i} @click=${this.discard}>Discard</ha-button><ha-button .disabled=${!i || this.syncState === "syncing"} @click=${() => {
      this.save();
    }}>Save</ha-button></div></div></div>${e && t ? l`<div class="editor-content"><nav class="tabs" aria-label="Dashboard pages">${t.pages.map((s, a) => l`<button class="tab ${a === this.pageIndex ? "active" : ""}" aria-pressed=${a === this.pageIndex} @click=${() => {
      this.showPage(a);
    }}>${s.title || s.id}</button>`)}<button class="icon-button" aria-label="Add page" title="Add page" @click=${() => {
      t.pages.push(Ie(t.pages.length + 1)), this.pageIndex = t.pages.length - 1, this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: this.pageIndex }, this.selected = { row: 0, card: 0 }, this.changed();
    }}><ha-icon icon="mdi:plus"></ha-icon></button></nav><details class="page-settings"><summary class="page-summary"><span>Page settings</span><button class="icon-button danger" aria-label="Delete page" title="Delete page" ?disabled=${t.pages.length <= 1} @click=${(s) => {
      s.preventDefault(), s.stopPropagation(), this.deletePage();
    }}><ha-icon icon="mdi:delete-outline"></ha-icon></button></summary><div class="grid">${this.field("Page ID", e.id, (s) => {
      e.id = s, this.changed();
    })}${this.field("Title", e.title, (s) => {
      e.title = s, this.changed();
    })}${this.field("Duration in seconds", e.durationSeconds, (s) => {
      e.durationSeconds = Number(s), this.changed();
    }, "number")}${this.checkbox("Show title", e.showTitle !== !1, (s) => {
      e.showTitle = s, this.changed();
    })}</div></details>${this.transitionEditor(e)}<div class="rows">${e.rows.map((s, a) => this.rowEditor(s, a))}</div>${e.rows.length < 6 ? l`<button class="add-button" @click=${() => {
      e.rows.push(Te()), this.changed();
    }}>Add row</button>` : c}</div>` : l`<div class="loading"><p>No layout configured for this display.</p><ha-button @click=${this.createLayout}>Create layout</ha-button></div>`}</ha-card>`;
  }
  render() {
    if (!this.loaded) return l`<div class="loading">Loading displays…</div>`;
    if (this.displays.length === 0) return l`<ha-card class="empty"><ha-icon icon="mdi:monitor-off"></ha-icon><h2>No Mini Displays yet</h2><p>Add a Mini Display integration first. Configured displays will appear here automatically.</p><ha-button @click=${() => {
      history.pushState(null, "", "/config/integrations"), window.dispatchEvent(new Event("location-changed"));
    }}><ha-icon icon="mdi:plus"></ha-icon>Add integration</ha-button></ha-card>`;
    const t = this.visibilityObject()?.visibility, e = this.visibilityTarget?.kind === "row" ? "Row" : "Card";
    return l`
      <div class="layout">
        <mini-display-scene-sidebar
          .displays=${this.displays}
          .scenes=${this.scenes}
          .selectedDisplayId=${this.selectedDisplayId}
          .selectedSceneId=${this.selectedSceneId}
          .form=${this.sceneForm}
          .sceneName=${this.sceneName}
          @display-selected=${(i) => this.selectDisplay(i.detail)}
          @scene-selected=${(i) => {
      this.selectScene(i.detail);
    }}
          @scene-create=${() => {
      this.createScene();
    }}
          @scene-rename=${this.openRenameScene}
          @scene-duplicate=${() => {
      this.duplicateScene();
    }}
          @scene-default=${() => {
      this.setDefaultScene();
    }}
          @scene-delete=${() => {
      this.deleteScene();
    }}
          @scene-name=${(i) => this.sceneName = i.detail}
          @scene-cancel=${() => this.sceneForm = null}
          @scene-save=${() => {
      this.saveSceneForm();
    }}
        ></mini-display-scene-sidebar>

        ${this.renderEditor()}

        <mini-display-preview-list
          .hass=${this.hass}
          .displays=${this.displays}
          .dashboards=${this.dashboards}
          .pages=${this.previewPages}
          .dirtyDisplays=${this.dirtyDisplays}
          .selectedDisplayId=${this.selectedDisplayId}
          .selectedSceneId=${this.selectedSceneId}
          .selectedSceneName=${this.selectedScene?.name ?? ""}
          @display-selected=${(i) => this.selectDisplay(i.detail)}
          @preview-toggle=${(i) => {
      this.togglePreview(i.detail);
    }}
          @preview-page=${(i) => this.previewPage(i.detail.displayId, i.detail.delta)}
          @scene-activate=${(i) => {
      this.activateScene(i.detail);
    }}
        ></mini-display-preview-list>
      </div>

      ${this.visibilityTarget ? l`
        <mini-display-visibility-dialog
          .hass=${this.hass}
          .targetName=${e}
          .value=${t}
          @visibility-save=${(i) => this.saveVisibility(i.detail)}
          @visibility-clear=${this.clearVisibility}
          @visibility-cancel=${() => this.visibilityTarget = void 0}
        ></mini-display-visibility-dialog>
      ` : c}

      ${this.confirmation ? l`
        <div class="modal-backdrop" @click=${this.closeConfirmation}>
          <ha-card class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" @click=${(i) => i.stopPropagation()}>
            <div class="confirm-heading">
              <ha-icon icon=${this.confirmation.kind === "delete-row" ? "mdi:delete-alert-outline" : "mdi:content-save-alert-outline"}></ha-icon>
              <h2 id="confirm-title">${this.confirmation.kind === "delete-row" ? "Delete row?" : "Discard changes?"}</h2>
            </div>
            <div class="modal-body">
              <p class="modal-copy">${this.confirmation.kind === "delete-row" ? "This row and all cards inside it will be removed." : "You have unsaved changes. Leaving Mini Displays will discard them."}</p>
            </div>
            <div class="modal-actions">
              <ha-button @click=${this.closeConfirmation}>Cancel</ha-button>
              <ha-button class="danger-action" @click=${() => {
      this.confirmAction();
    }}>${this.confirmation.kind === "delete-row" ? "Delete" : "Discard and leave"}</ha-button>
            </div>
          </ha-card>
        </div>
      ` : c}
    `;
  }
};
g.styles = I`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,Roboto,sans-serif)}*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}.layout{display:grid;grid-template-columns:220px minmax(420px,1fr) 288px;gap:16px;align-items:start;min-width:0}ha-card{overflow:hidden;border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow,none)}
    .section-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:52px;padding:10px 12px;border-bottom:1px solid var(--divider-color)}.section-heading h2{margin:0;font-size:16px;font-weight:500}.icon-button{display:inline-grid;place-items:center;width:40px;height:40px;padding:0;color:var(--primary-text-color);background:transparent;border:0;border-radius:50%}.icon-button:hover{background:var(--secondary-background-color)}.icon-button.danger{color:var(--error-color)}.icon-button:disabled{opacity:.35;cursor:default}
    .scene-list{display:grid;gap:4px;padding:8px}.scene-row{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:4px;align-items:center;border-radius:10px}.scene-row.active{background:var(--secondary-background-color)}.scene-select{display:flex;align-items:center;gap:10px;min-width:0;min-height:44px;padding:8px 10px;color:var(--primary-text-color);text-align:left;background:transparent;border:0;border-radius:10px}.scene-select ha-icon{color:var(--secondary-text-color)}.scene-row.active .scene-select ha-icon{color:var(--primary-color)}.scene-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .scene-menu,.menu{position:relative}.scene-menu>summary,.menu>summary{display:grid;place-items:center;width:36px;height:36px;list-style:none;cursor:pointer;border-radius:50%}.menu>summary{width:40px;height:40px}.scene-menu>summary::-webkit-details-marker,.menu>summary::-webkit-details-marker{display:none}.scene-menu>summary:hover,.menu>summary:hover{background:var(--card-background-color)}.scene-popover,.menu-popover{position:absolute;right:0;z-index:10;display:grid;width:150px;padding:6px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:10px;box-shadow:var(--ha-card-box-shadow)}.menu-popover{width:160px}.scene-popover button,.menu-popover button{min-height:38px;padding:8px;color:var(--primary-text-color);text-align:left;background:transparent;border:0;border-radius:6px}.scene-popover button:hover,.menu-popover button:hover{background:var(--secondary-background-color)}.scene-popover .danger,.menu-popover .danger{color:var(--error-color)}
    .display-picker{display:grid;gap:8px;padding:12px;border-bottom:1px solid var(--divider-color)}.display-picker label{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}.display-picker select{width:100%;min-height:40px;padding:8px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}.scene-form{display:grid;gap:10px;padding:12px;border-top:1px solid var(--divider-color)}.scene-form-actions{display:flex;justify-content:flex-end;gap:8px}.editor-card{min-width:0}.editor-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--divider-color)}.editor-title{min-width:0}.editor-title strong,.editor-title small{display:block}.editor-title strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.editor-title small{margin-top:2px;color:var(--secondary-text-color)}
    .save-area,.save-actions{display:flex;align-items:center;gap:8px}.save-area{flex-wrap:wrap;justify-content:flex-end}.sync{display:flex;align-items:center;gap:7px;min-height:20px;color:var(--secondary-text-color);font-size:12px;white-space:nowrap}.sync i{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.sync.syncing i{background:var(--warning-color)}.sync.success i{background:var(--success-color)}.sync.error{color:var(--error-color)}.sync.error i{background:var(--error-color)}.editor-content{display:grid;gap:14px;padding:16px}
    .tabs,.card-tabs{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px;scrollbar-width:thin}.tab{min-height:40px;padding:7px 12px;color:var(--primary-text-color);white-space:nowrap;background:var(--secondary-background-color);border:1px solid transparent;border-radius:9px}.card-tabs .tab{cursor:grab}.card-tabs .tab:active{cursor:grabbing}.tab.active{color:var(--text-primary-color);background:var(--primary-color)}.tab.dragging{opacity:.4}.page-settings,.row-panel,.card-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.page-settings[open],.card-settings{display:grid;gap:12px}.page-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;font-weight:500}.page-summary::marker{content:""}.rows{display:grid;gap:12px}.row-panel{display:grid;gap:12px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 2%)}
    .row-head,.card-head,.row-title{display:flex;align-items:center;gap:8px}.row-head,.card-head{justify-content:space-between}.row-title small{color:var(--secondary-text-color)}.card-settings{border-color:var(--primary-color);background:var(--card-background-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid>ha-form{grid-column:1/-1}.field{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}.field input,.field select{width:100%;min-height:40px;padding:8px 11px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}.check{display:flex;align-items:center;gap:8px;color:var(--primary-text-color);font-size:14px}.check input{width:18px;height:18px}.hint{grid-column:1/-1;margin:0;color:var(--secondary-text-color);font-size:12px;line-height:1.5}.add-button{width:100%;min-height:42px;color:var(--primary-color);background:transparent;border:1px dashed var(--primary-color);border-radius:10px}.style{padding-top:4px}.style>summary{cursor:pointer}
    .previews{display:grid;gap:12px;max-height:calc(100vh - 120px);overflow-y:auto;padding-right:2px;position:sticky;top:16px}.preview-title{margin:0;padding:0 2px;font-size:16px;font-weight:500}.display-card{display:grid;gap:10px;padding:12px;border:2px solid transparent;transition:border-color 150ms ease,background-color 150ms ease;cursor:pointer}.display-card.selected{border-color:var(--primary-color)}.display-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.display-name{min-width:0}.display-name strong,.display-name small{display:block}.display-name strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.display-name small{margin-top:3px;color:var(--secondary-text-color)}.status{display:inline-flex;align-items:center;gap:5px;font-size:12px}.status i{width:7px;height:7px;border-radius:50%;background:var(--error-color)}.status.online i{background:var(--success-color)}.preview-eye.active{color:var(--primary-color);background:var(--secondary-background-color)}mini-display-preview{margin:0 auto}.preview-nav{display:flex;align-items:center;justify-content:center;gap:4px;color:var(--secondary-text-color);font-size:12px}.preview-nav .icon-button{width:32px;height:32px}.activate{width:100%}
    .condition-mark{display:inline-flex;align-items:center;gap:4px;color:var(--primary-color);font-size:12px}.condition-mark ha-icon{width:16px;height:16px}.modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.48)}.visibility-modal{width:min(620px,100%);max-height:min(760px,calc(100vh - 32px));overflow:auto}.confirm-modal{width:min(440px,100%)}.confirm-heading{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--divider-color)}.confirm-heading ha-icon{color:var(--warning-color)}.confirm-heading h2{margin:0;font-size:20px;font-weight:500}.modal-body{display:grid;gap:14px;padding:16px}.modal-copy{margin:0;color:var(--secondary-text-color);font-size:13px;line-height:1.5}.condition{display:grid;grid-template-columns:minmax(180px,1fr) 150px minmax(120px,.7fr) 40px;gap:8px;align-items:end;padding:12px;border:1px solid var(--divider-color);border-radius:10px}.condition ha-form{min-width:0}.condition .icon-button{align-self:center}.modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--divider-color)}.danger-action{--mdc-theme-primary:var(--error-color);color:var(--error-color)}
    .mappings{display:grid;gap:10px;padding-top:4px}.mappings>summary{cursor:pointer}.mapping-list{display:grid;gap:8px;margin-top:10px}.mapping-rule{display:grid;grid-template-columns:28px 1fr 1fr 1.4fr 40px;gap:8px;align-items:end;padding:10px;border:1px solid var(--divider-color);border-radius:10px}.mapping-rule.text{grid-template-columns:28px 140px 1fr 1fr 40px}.mapping-rule.colors{grid-template-columns:28px 1fr 1fr 1.2fr 1.2fr 40px}.mapping-rule.colors.text{grid-template-columns:28px 130px 1fr 1.2fr 1.2fr 40px}.mapping-rule.dragging{opacity:.45}.drag-handle{align-self:center;display:grid;place-items:center;width:28px;height:40px;color:var(--secondary-text-color);cursor:grab}.drag-handle:active{cursor:grabbing}.mapping-copy{margin:0;color:var(--secondary-text-color);font-size:12px}
    .segmented-field,.position-field{display:grid;gap:7px}.segmented-field>span,.position-field>span{color:var(--secondary-text-color);font-size:12px}.segmented{display:flex;flex-wrap:wrap;gap:4px;padding:3px;background:var(--secondary-background-color);border-radius:10px}.segment{display:flex;flex:1;align-items:center;justify-content:center;gap:6px;min-width:68px;min-height:36px;padding:6px 9px;color:var(--primary-text-color);background:transparent;border:0;border-radius:7px}.segment:hover{background:color-mix(in srgb,var(--card-background-color),transparent 20%)}.segment.active{color:var(--text-primary-color);background:var(--primary-color)}.segment ha-icon{width:18px;height:18px}.position-field{grid-column:1/-1}.position-grid{display:grid;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(3,34px);gap:4px;width:max-content;padding:5px;background:var(--secondary-background-color);border-radius:10px}.position-button{display:grid;place-items:center;padding:0;background:transparent;border:0;border-radius:6px}.position-button:hover{background:var(--card-background-color)}.position-button.active{background:var(--primary-color)}.position-dot{width:7px;height:7px;background:var(--secondary-text-color);border-radius:50%}.position-button.active .position-dot{background:var(--text-primary-color)}
    .transition-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.transition-settings[open]{display:grid;gap:14px}.transition-summary{cursor:pointer;font-weight:500}.transition-summary::marker{content:""}.effect-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.effect{display:grid;justify-items:center;gap:5px;min-height:68px;padding:9px;color:var(--primary-text-color);background:var(--secondary-background-color);border:1px solid transparent;border-radius:10px}.effect:hover{border-color:var(--primary-color)}.effect.active{color:var(--primary-color);border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color),transparent 90%)}.effect ha-icon{width:22px;height:22px}.transition-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .empty{display:grid;justify-items:center;gap:14px;padding:64px 24px;text-align:center}.empty ha-icon{width:56px;height:56px;color:var(--secondary-text-color)}.empty h2{margin:0;font-size:20px}.empty p{max-width:440px;margin:0;color:var(--secondary-text-color)}.loading{padding:48px;text-align:center;color:var(--secondary-text-color)}input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
    @media(max-width:1100px){.layout{grid-template-columns:200px minmax(0,1fr)}.previews{grid-column:1/-1;grid-template-columns:repeat(auto-fit,minmax(272px,1fr));max-height:none;position:static;overflow:visible}.preview-title{grid-column:1/-1}}@media(max-width:700px){.layout{grid-template-columns:1fr}.scene-list{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.previews{grid-column:auto;grid-template-columns:1fr}.grid,.condition,.mapping-rule,.mapping-rule.text,.mapping-rule.colors,.mapping-rule.colors.text,.transition-options{grid-template-columns:1fr}.effect-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.drag-handle{display:none}.editor-heading{align-items:flex-start;flex-direction:column}.condition .icon-button,.mapping-rule .icon-button{justify-self:end}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  `;
v([
  p({ attribute: !1 })
], g.prototype, "hass", 2);
v([
  m()
], g.prototype, "displays", 2);
v([
  m()
], g.prototype, "scenes", 2);
v([
  m()
], g.prototype, "dashboards", 2);
v([
  m()
], g.prototype, "savedDashboards", 2);
v([
  m()
], g.prototype, "selectedDisplayId", 2);
v([
  m()
], g.prototype, "selectedSceneId", 2);
v([
  m()
], g.prototype, "pageIndex", 2);
v([
  m()
], g.prototype, "previewPages", 2);
v([
  m()
], g.prototype, "selected", 2);
v([
  m()
], g.prototype, "syncState", 2);
v([
  m()
], g.prototype, "syncMessage", 2);
v([
  m()
], g.prototype, "loaded", 2);
v([
  m()
], g.prototype, "sceneForm", 2);
v([
  m()
], g.prototype, "sceneName", 2);
v([
  m()
], g.prototype, "dirtyDisplays", 2);
v([
  m()
], g.prototype, "visibilityTarget", 2);
v([
  m()
], g.prototype, "confirmation", 2);
g = v([
  R("mini-display-editor")
], g);
var kt = Object.defineProperty, Dt = Object.getOwnPropertyDescriptor, G = (t, e, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Dt(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = (s ? o(e, i, a) : o(a)) || a);
  return s && a && kt(e, i, a), a;
};
let T = class extends $ {
  constructor() {
    super(...arguments), this.narrow = !1;
  }
  render() {
    return l`
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
T.styles = I`
    :host {
      display: block;
      min-height: 100%;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
      font-family: var(--ha-font-family-body, Roboto, sans-serif);
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
G([
  p({ attribute: !1 })
], T.prototype, "hass", 2);
G([
  p({ attribute: !1 })
], T.prototype, "narrow", 2);
G([
  p({ attribute: !1 })
], T.prototype, "route", 2);
G([
  p({ attribute: !1 })
], T.prototype, "panel", 2);
T = G([
  R("mini-display-panel")
], T);
//# sourceMappingURL=mini-display-panel.js.map
