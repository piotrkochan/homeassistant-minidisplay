const Ie = globalThis, it = Ie.ShadowRoot && (Ie.ShadyCSS === void 0 || Ie.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, at = /* @__PURE__ */ Symbol(), At = /* @__PURE__ */ new WeakMap();
let Bt = class {
  constructor(e, i, a) {
    if (this._$cssResult$ = !0, a !== at) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (it && e === void 0) {
      const a = i !== void 0 && i.length === 1;
      a && (e = At.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && At.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const gi = (t) => new Bt(typeof t == "string" ? t : t + "", void 0, at), T = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((a, s, r) => a + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + t[r + 1], t[0]);
  return new Bt(i, t, at);
}, mi = (t, e) => {
  if (it) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const a = document.createElement("style"), s = Ie.litNonce;
    s !== void 0 && a.setAttribute("nonce", s), a.textContent = i.cssText, t.appendChild(a);
  }
}, Et = it ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const a of e.cssRules) i += a.cssText;
  return gi(i);
})(t) : t;
const { is: fi, defineProperty: vi, getOwnPropertyDescriptor: yi, getOwnPropertyNames: bi, getOwnPropertySymbols: xi, getPrototypeOf: $i } = Object, je = globalThis, Mt = je.trustedTypes, wi = Mt ? Mt.emptyScript : "", _i = je.reactiveElementPolyfillSupport, we = (t, e) => t, Ne = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? wi : null;
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
} }, st = (t, e) => !fi(t, e), Pt = { attribute: !0, type: String, converter: Ne, reflect: !1, useDefault: !1, hasChanged: st };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), je.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ue = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = Pt) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const a = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, a, i);
      s !== void 0 && vi(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, i, a) {
    const { get: s, set: r } = yi(this.prototype, e) ?? { get() {
      return this[i];
    }, set(o) {
      this[i] = o;
    } };
    return { get: s, set(o) {
      const n = s?.call(this);
      r?.call(this, o), this.requestUpdate(e, n, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Pt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(we("elementProperties"))) return;
    const e = $i(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(we("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(we("properties"))) {
      const i = this.properties, a = [...bi(i), ...xi(i)];
      for (const s of a) this.createProperty(s, i[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [a, s] of i) this.elementProperties.set(a, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, a] of this.elementProperties) {
      const s = this._$Eu(i, a);
      s !== void 0 && this._$Eh.set(s, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const a = new Set(e.flat(1 / 0).reverse());
      for (const s of a) i.unshift(Et(s));
    } else e !== void 0 && i.push(Et(e));
    return i;
  }
  static _$Eu(e, i) {
    const a = i.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const a of i.keys()) this.hasOwnProperty(a) && (e.set(a, this[a]), delete this[a]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return mi(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, a) {
    this._$AK(e, a);
  }
  _$ET(e, i) {
    const a = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, a);
    if (s !== void 0 && a.reflect === !0) {
      const r = (a.converter?.toAttribute !== void 0 ? a.converter : Ne).toAttribute(i, a.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const a = this.constructor, s = a._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = a.getPropertyOptions(s), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Ne;
      this._$Em = s;
      const n = o.fromAttribute(i, r.type);
      this[s] = n ?? this._$Ej?.get(s) ?? n, this._$Em = null;
    }
  }
  requestUpdate(e, i, a, s = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (r = this[e]), a ??= o.getPropertyOptions(e), !((a.hasChanged ?? st)(r, i) || a.useDefault && a.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, a)))) return;
      this.C(e, i, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: a, reflect: s, wrapped: r }, o) {
    a && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? i ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (i = void 0), this._$AL.set(e, i)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [s, r] of this._$Ep) this[s] = r;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [s, r] of a) {
        const { wrapped: o } = r, n = this[s];
        o !== !0 || this._$AL.has(s) || n === void 0 || this.C(s, void 0, r, n);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((a) => a.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
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
ue.elementStyles = [], ue.shadowRootOptions = { mode: "open" }, ue[we("elementProperties")] = /* @__PURE__ */ new Map(), ue[we("finalized")] = /* @__PURE__ */ new Map(), _i?.({ ReactiveElement: ue }), (je.reactiveElementVersions ??= []).push("2.1.2");
const rt = globalThis, zt = (t) => t, Re = rt.trustedTypes, Tt = Re ? Re.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Vt = "$lit$", Q = `lit$${Math.random().toFixed(9).slice(2)}$`, Wt = "?" + Q, ki = `<${Wt}>`, re = document, _e = () => re.createComment(""), ke = (t) => t === null || typeof t != "object" && typeof t != "function", ot = Array.isArray, Si = (t) => ot(t) || typeof t?.[Symbol.iterator] == "function", Ke = `[ 	
\f\r]`, be = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, It = /-->/g, Ot = />/g, ae = RegExp(`>|${Ke}(?:([^\\s"'>=/]+)(${Ke}*=${Ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Nt = /'/g, Rt = /"/g, Yt = /^(?:script|style|textarea|title)$/i, Gt = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), l = Gt(1), ce = Gt(2), B = /* @__PURE__ */ Symbol.for("lit-noChange"), c = /* @__PURE__ */ Symbol.for("lit-nothing"), Ut = /* @__PURE__ */ new WeakMap(), se = re.createTreeWalker(re, 129);
function Xt(t, e) {
  if (!ot(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Tt !== void 0 ? Tt.createHTML(e) : e;
}
const Di = (t, e) => {
  const i = t.length - 1, a = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = be;
  for (let n = 0; n < i; n++) {
    const d = t[n];
    let p, g, h = -1, f = 0;
    for (; f < d.length && (o.lastIndex = f, g = o.exec(d), g !== null); ) f = o.lastIndex, o === be ? g[1] === "!--" ? o = It : g[1] !== void 0 ? o = Ot : g[2] !== void 0 ? (Yt.test(g[2]) && (s = RegExp("</" + g[2], "g")), o = ae) : g[3] !== void 0 && (o = ae) : o === ae ? g[0] === ">" ? (o = s ?? be, h = -1) : g[1] === void 0 ? h = -2 : (h = o.lastIndex - g[2].length, p = g[1], o = g[3] === void 0 ? ae : g[3] === '"' ? Rt : Nt) : o === Rt || o === Nt ? o = ae : o === It || o === Ot ? o = be : (o = ae, s = void 0);
    const y = o === ae && t[n + 1].startsWith("/>") ? " " : "";
    r += o === be ? d + ki : h >= 0 ? (a.push(p), d.slice(0, h) + Vt + d.slice(h) + Q + y) : d + Q + (h === -2 ? n : y);
  }
  return [Xt(t, r + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class Se {
  constructor({ strings: e, _$litType$: i }, a) {
    let s;
    this.parts = [];
    let r = 0, o = 0;
    const n = e.length - 1, d = this.parts, [p, g] = Di(e, i);
    if (this.el = Se.createElement(p, a), se.currentNode = this.el.content, i === 2 || i === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (s = se.nextNode()) !== null && d.length < n; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const h of s.getAttributeNames()) if (h.endsWith(Vt)) {
          const f = g[o++], y = s.getAttribute(h).split(Q), b = /([.?@])?(.*)/.exec(f);
          d.push({ type: 1, index: r, name: b[2], strings: y, ctor: b[1] === "." ? Ai : b[1] === "?" ? Ei : b[1] === "@" ? Mi : Le }), s.removeAttribute(h);
        } else h.startsWith(Q) && (d.push({ type: 6, index: r }), s.removeAttribute(h));
        if (Yt.test(s.tagName)) {
          const h = s.textContent.split(Q), f = h.length - 1;
          if (f > 0) {
            s.textContent = Re ? Re.emptyScript : "";
            for (let y = 0; y < f; y++) s.append(h[y], _e()), se.nextNode(), d.push({ type: 2, index: ++r });
            s.append(h[f], _e());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Wt) d.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = s.data.indexOf(Q, h + 1)) !== -1; ) d.push({ type: 7, index: r }), h += Q.length - 1;
      }
      r++;
    }
  }
  static createElement(e, i) {
    const a = re.createElement("template");
    return a.innerHTML = e, a;
  }
}
function ge(t, e, i = t, a) {
  if (e === B) return e;
  let s = a !== void 0 ? i._$Co?.[a] : i._$Cl;
  const r = ke(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(t), s._$AT(t, i, a)), a !== void 0 ? (i._$Co ??= [])[a] = s : i._$Cl = s), s !== void 0 && (e = ge(t, s._$AS(t, e.values), s, a)), e;
}
class Ci {
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
    const { el: { content: i }, parts: a } = this._$AD, s = (e?.creationScope ?? re).importNode(i, !0);
    se.currentNode = s;
    let r = se.nextNode(), o = 0, n = 0, d = a[0];
    for (; d !== void 0; ) {
      if (o === d.index) {
        let p;
        d.type === 2 ? p = new Ae(r, r.nextSibling, this, e) : d.type === 1 ? p = new d.ctor(r, d.name, d.strings, this, e) : d.type === 6 && (p = new Pi(r, this, e)), this._$AV.push(p), d = a[++n];
      }
      o !== d?.index && (r = se.nextNode(), o++);
    }
    return se.currentNode = re, s;
  }
  p(e) {
    let i = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(e, a, i), i += a.strings.length - 2) : a._$AI(e[i])), i++;
  }
}
class Ae {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, a, s) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = a, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = ge(this, e, i), ke(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== B && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Si(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && ke(this._$AH) ? this._$AA.nextSibling.data = e : this.T(re.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: a } = e, s = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = Se.createElement(Xt(a.h, a.h[0]), this.options)), a);
    if (this._$AH?._$AD === s) this._$AH.p(i);
    else {
      const r = new Ci(s, this), o = r.u(this.options);
      r.p(i), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let i = Ut.get(e.strings);
    return i === void 0 && Ut.set(e.strings, i = new Se(e)), i;
  }
  k(e) {
    ot(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let a, s = 0;
    for (const r of e) s === i.length ? i.push(a = new Ae(this.O(_e()), this.O(_e()), this, this.options)) : a = i[s], a._$AI(r), s++;
    s < i.length && (this._$AR(a && a._$AB.nextSibling, s), i.length = s);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const a = zt(e).nextSibling;
      zt(e).remove(), e = a;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Le {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, a, s, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = s, this.options = r, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = c;
  }
  _$AI(e, i = this, a, s) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = ge(this, e, i, 0), o = !ke(e) || e !== this._$AH && e !== B, o && (this._$AH = e);
    else {
      const n = e;
      let d, p;
      for (e = r[0], d = 0; d < r.length - 1; d++) p = ge(this, n[a + d], i, d), p === B && (p = this._$AH[d]), o ||= !ke(p) || p !== this._$AH[d], p === c ? e = c : e !== c && (e += (p ?? "") + r[d + 1]), this._$AH[d] = p;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ai extends Le {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class Ei extends Le {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Mi extends Le {
  constructor(e, i, a, s, r) {
    super(e, i, a, s, r), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = ge(this, e, i, 0) ?? c) === B) return;
    const a = this._$AH, s = e === c && a !== c || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, r = e !== c && (a === c || s);
    s && this.element.removeEventListener(this.name, this, a), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Pi {
  constructor(e, i, a) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ge(this, e);
  }
}
const zi = rt.litHtmlPolyfillSupport;
zi?.(Se, Ae), (rt.litHtmlVersions ??= []).push("3.3.3");
const Ti = (t, e, i) => {
  const a = i?.renderBefore ?? e;
  let s = a._$litPart$;
  if (s === void 0) {
    const r = i?.renderBefore ?? null;
    a._$litPart$ = s = new Ae(e.insertBefore(_e(), r), r, void 0, i ?? {});
  }
  return s._$AI(t), s;
};
const nt = globalThis;
let D = class extends ue {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ti(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return B;
  }
};
D._$litElement$ = !0, D.finalized = !0, nt.litElementHydrateSupport?.({ LitElement: D });
const Ii = nt.litElementPolyfillSupport;
Ii?.({ LitElement: D });
(nt.litElementVersions ??= []).push("4.2.2");
const R = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
const Oi = { attribute: !0, type: String, converter: Ne, reflect: !1, hasChanged: st }, Ni = (t = Oi, e, i) => {
  const { kind: a, metadata: s } = i;
  let r = globalThis.litPropertyMetadata.get(s);
  if (r === void 0 && globalThis.litPropertyMetadata.set(s, r = /* @__PURE__ */ new Map()), a === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(i.name, t), a === "accessor") {
    const { name: o } = i;
    return { set(n) {
      const d = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(o, d, t, !0, n);
    }, init(n) {
      return n !== void 0 && this.C(o, void 0, t, n), n;
    } };
  }
  if (a === "setter") {
    const { name: o } = i;
    return function(n) {
      const d = this[o];
      e.call(this, n), this.requestUpdate(o, d, t, !0, n);
    };
  }
  throw Error("Unsupported decorator location: " + a);
};
function m(t) {
  return (e, i) => typeof i == "object" ? Ni(t, e, i) : ((a, s, r) => {
    const o = s.hasOwnProperty(r);
    return s.constructor.createProperty(r, a), o ? Object.getOwnPropertyDescriptor(s, r) : void 0;
  })(t, e, i);
}
function v(t) {
  return m({ ...t, state: !0, attribute: !1 });
}
const Oe = (t = "number") => t === "weather" ? { type: t, source: "", weather: { period: "current", fields: ["icon", "condition", "temperature"], layout: "vertical" } } : t === "chart" ? { type: t, source: "", graph: Kt() } : t === "clock" ? { type: t, format: "24h", showDate: !0 } : t === "image" ? { type: t, image: "", imageFit: "cover", showTitle: !1 } : t === "text" ? { type: t, text: "Text" } : t === "status" ? { type: t, source: "", onText: "On", offText: "Off" } : { type: t, source: "", progress: "none" }, Kt = () => ({ type: "bar", points: 48, intervalSeconds: 300, aggregation: "mean", color: "accent", opacity: 50, labelEvery: 6, decimals: 1 }), tt = () => ({
  weight: 1,
  gap: "small",
  cards: [Oe("clock")]
}), Jt = (t) => ({
  id: `page_${t}`,
  title: `Page ${t}`,
  durationSeconds: 10,
  enabled: !0,
  transition: { type: "none" },
  rows: [tt()]
}), Ri = () => ({
  version: 1,
  defaults: { pageDurationSeconds: 10, theme: "dark" },
  pages: [Jt(1)]
}), Ui = (t, e) => {
  if (t.type === "number") {
    const i = Number(e);
    if (Number.isFinite(i)) {
      for (const a of t.valueMappings ?? [])
        if ((a.minimum === void 0 || i >= a.minimum) && (a.maximum === void 0 || i <= a.maximum))
          return { value: a.value, mapped: !0 };
    }
  }
  if (t.type === "text") {
    for (const i of t.valueMappings ?? [])
      if (i.operator === "equals" ? e === i.match : i.operator === "starts_with" ? e.startsWith(i.match) : i.operator === "ends_with" ? e.endsWith(i.match) : e.includes(i.match)) return { value: i.value, mapped: !0 };
  }
  return { value: e, mapped: !1 };
}, Fi = (t, e) => {
  if (t.type === "number") {
    const i = Number(e);
    if (Number.isFinite(i))
      return (t.colorMappings ?? []).find(
        (a) => (a.minimum === void 0 || i >= a.minimum) && (a.maximum === void 0 || i <= a.maximum)
      );
  }
  if (t.type === "text")
    return (t.colorMappings ?? []).find(
      (i) => i.operator === "equals" ? e === i.match : i.operator === "starts_with" ? e.startsWith(i.match) : i.operator === "ends_with" ? e.endsWith(i.match) : e.includes(i.match)
    );
};
var ji = Object.defineProperty, Zt = (t, e, i, a) => {
  for (var s = void 0, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = o(e, i, s) || s);
  return s && ji(e, i, s), s;
};
const K = {
  background: "#000000",
  surface: "#1e222a",
  primary: "#ffffff",
  secondary: "#9e9e9e",
  muted: "#666666",
  accent: "#00ffff",
  success: "#00ff00",
  warning: "#ffa500",
  error: "#ff0000"
}, dt = class dt extends D {
  constructor() {
    super(...arguments), this.label = "Color", this.value = "";
  }
  render() {
    const e = this.value.startsWith("#"), i = e ? "custom" : this.value || "default";
    return l`
      <span>${this.label}</span>
      <div class="control">
        <select .value=${i} @change=${this.selectColor}>
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
        <input type="color" aria-label="Custom color" .value=${e ? this.value : K[i] ?? "#ffffff"} ?disabled=${!e} @input=${this.customColor}>
      </div>
    `;
  }
  selectColor(e) {
    const i = e.target.value;
    this.emit(i === "default" ? "" : i === "custom" ? "#ffffff" : i);
  }
  customColor(e) {
    this.emit(e.target.value);
  }
  emit(e) {
    this.dispatchEvent(new CustomEvent("color-changed", { detail: e, bubbles: !0, composed: !0 }));
  }
};
dt.styles = T`
    :host { display: grid; gap: 5px; color: var(--secondary-text-color); font: 12px var(--ha-font-family-body,Roboto,sans-serif); }
    .control { display: grid; grid-template-columns: minmax(0,1fr) 42px; gap: 8px; }
    select, input { width: 100%; min-height: 40px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; }
    select { padding: 8px; font: inherit; font-size: 14px; }
    input { height: 40px; padding: 3px; cursor: pointer; }
  `;
let De = dt;
Zt([
  m()
], De.prototype, "label");
Zt([
  m()
], De.prototype, "value");
customElements.get("mini-display-color-field") || customElements.define("mini-display-color-field", De);
var Li = Object.defineProperty, Hi = Object.getOwnPropertyDescriptor, me = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? Hi(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && Li(e, i, s), s;
};
let ee = class extends D {
  constructor() {
    super(...arguments), this.source = "", this.series = [], this.width = 240, this.height = 80;
  }
  render() {
    const t = this.graph;
    if (!t) return c;
    const e = this.series.find((h) => h.source === (t.source || this.source) && h.points === (t.points ?? 48) && h.intervalSeconds === (t.intervalSeconds ?? 300) && h.aggregation === (t.aggregation ?? "mean"));
    if (!e) return c;
    const i = e.values.filter((h) => h !== null && Number.isFinite(h));
    if (!i.length) return c;
    const a = t.minimum ?? Math.min(...i, ...t.type === "line" ? [] : [0]), s = Math.max(a + 1, t.maximum ?? Math.max(...i)), r = Math.max(4, this.width - 4), o = Math.max(6, this.height - 4), n = t.showValues ? 6 : 0, d = (h) => n + (o - n - 1) * (1 - Math.max(0, Math.min(1, (h - a) / (s - a)))), p = K[t.color ?? "accent"] ?? t.color ?? "#00ffff";
    let g;
    return ce`<svg viewBox="0 0 ${r} ${o}" preserveAspectRatio="none" aria-label="Recorded values">
      ${e.values.map((h, f) => {
      if (h === null || !Number.isFinite(h))
        return g = void 0, c;
      const y = f * r / e.points, b = (f + 1) * r / e.points, $ = t.type === "line" ? f * (r - 1) / (e.points - 1) : (y + b) / 2, A = d(h), j = g;
      return g = { x: $, y: A }, ce`<g fill=${p} stroke=${p} opacity=${(t.opacity ?? 50) / 100}>
          ${t.type === "line" ? j ? ce`<line x1=${j.x} y1=${j.y} x2=${$} y2=${A} stroke-width="1"/>` : ce`<circle cx=${$} cy=${A} r="0.6"/>` : ce`<rect x=${y} y=${Math.min(A, d(0))} width=${Math.max(1, b - y - 1)} height=${Math.max(1, Math.abs(d(0) - A))} stroke="none"/>`}
        </g>${t.showValues && f % (t.labelEvery ?? 6) === 0 ? ce`<text x=${Math.max(10, Math.min(r - 10, $))} y=${Math.max(5, A - 1)} font-size="5" text-anchor="middle" fill=${p}>${h.toFixed(t.decimals ?? 1)}</text>` : c}`;
    })}
    </svg>`;
  }
};
ee.styles = T`:host{position:absolute;inset:2px;display:block;pointer-events:none}svg{display:block;width:100%;height:100%;overflow:hidden}`;
me([
  m({ attribute: !1 })
], ee.prototype, "graph", 2);
me([
  m()
], ee.prototype, "source", 2);
me([
  m({ attribute: !1 })
], ee.prototype, "series", 2);
me([
  m({ type: Number })
], ee.prototype, "width", 2);
me([
  m({ type: Number })
], ee.prototype, "height", 2);
ee = me([
  R("mini-display-graph-preview")
], ee);
var qi = Object.defineProperty, Bi = Object.getOwnPropertyDescriptor, Ee = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? Bi(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && qi(e, i, s), s;
};
const Ft = [
  "night",
  "cloudy",
  "fog",
  "hail",
  "lightning",
  "lightning-rainy",
  "partly-cloudy",
  "pouring",
  "rainy",
  "snowy",
  "snowy-rainy",
  "sunny",
  "windy",
  "windy-variant",
  "cloudy-alert",
  "cloudy-alert"
], Vi = [
  "Clear night",
  "Cloudy",
  "Fog",
  "Hail",
  "Thunder",
  "Thunder / rain",
  "Partly cloudy",
  "Heavy rain",
  "Rain",
  "Snow",
  "Sleet",
  "Sunny",
  "Windy",
  "Wind / clouds",
  "Exceptional",
  "Unavailable"
], Wi = [
  "Pogodna noc",
  "Pochmurno",
  "Mgła",
  "Grad",
  "Burza",
  "Burza / deszcz",
  "Zachmurzenie",
  "Ulewa",
  "Deszcz",
  "Śnieg",
  "Deszcz / śnieg",
  "Słonecznie",
  "Wiatr",
  "Wiatr / chmury",
  "Ekstremalnie",
  "Brak danych"
];
let oe = class extends D {
  constructor() {
    super(...arguments), this.signature = "", this.generation = 0, this.pending = !1;
  }
  connectedCallback() {
    super.connectedCallback(), this.timer = window.setInterval(() => {
      this.refresh();
    }, 6e4), this.refresh();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this.timer), this.generation++;
  }
  updated(t) {
    t.has("signature") && (this.generation++, this.data = void 0, this.refresh());
  }
  async refresh() {
    if (!this.hass || !this.card?.source || this.pending) return;
    const t = this.generation;
    this.pending = !0;
    try {
      const e = await this.hass.callWS({
        type: "mini_display/weather",
        card: { source: this.card.source, weather: this.card.weather }
      });
      this.isConnected && t === this.generation && (this.data = e);
    } catch {
      t === this.generation && (this.data = void 0);
    } finally {
      this.pending = !1, this.isConnected && t !== this.generation && this.refresh();
    }
  }
  render() {
    const t = this.card?.weather ?? {}, e = t.fields ?? ["icon", "condition", "temperature"], i = t.period === "current" ? 1 : t.count ?? 1, a = t.language === "pl" ? Wi : Vi;
    return l`${Array.from({ length: i }, (s, r) => {
      const o = this.data?.values[this.data.weather.sources[r]], n = o?.available, d = n ? o.state.split("|") : [], p = n ? Number(d[0]) : 15, g = this.data?.weather.temperatureUnit ?? "", h = this.data?.weather.windUnit ?? "", f = (y, b) => e.includes(y) ? l`<div class="line ${y}" title=${b}>${b}</div>` : c;
      return l`<div
        class="cell ${t.layout ?? "vertical"} ${e.length === 1 && e[0] === "icon" ? "solo" : ""}"
      >
        ${e.includes("icon") ? l`<ha-icon icon=${`mdi:weather-${Ft[p] ?? Ft[15]}`} style=${t.iconStyle === "mono" ? "" : `color:${p === 11 ? "#ffff00" : p === 0 ? "#d3d3d3" : p === 4 || p === 5 ? "#ffa500" : "#00ffff"}`}></ha-icon>` : c}
        ${e.some((y) => y !== "icon") ? l`<div class="lines">
                ${f("label", d[6] || "--")}${f("condition", a[p] ?? a[15])}
                ${f("temperature", (d[1] || "--") + g)}${f("low", "Min " + (d[2] || "--") + g)}
                ${f("humidity", "RH " + (d[3] || "--") + "%")}${f("precipitation", (t.language === "pl" ? "Deszcz " : "Rain ") + (d[4] || "--") + "%")}
                ${f("wind", (d[5] || "--") + " " + h)}
              </div>` : c}
      </div>`;
    })}`;
  }
};
oe.styles = T`
    :host {
      position: absolute;
      inset: 5px;
      display: flex;
      pointer-events: none;
      overflow: hidden;
    }
    .cell {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-direction: column;
    }
    .cell.horizontal {
      flex-direction: row;
    }
    .lines {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 0;
      flex: 1;
      gap: 1px;
      overflow: hidden;
    }
    .line {
      font-size: 12px;
      line-height: 1.2;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .temperature {
      font-size: clamp(13px, 1.5em, 36px);
      font-weight: 600;
    }
    ha-icon {
      --mdc-icon-size: 48px;
      flex-shrink: 0;
    }
    .compact ha-icon {
      --mdc-icon-size: 24px;
    }
    .solo ha-icon {
      --mdc-icon-size: 96px;
    }
  `;
Ee([
  m({ attribute: !1 })
], oe.prototype, "hass", 2);
Ee([
  m({ attribute: !1 })
], oe.prototype, "card", 2);
Ee([
  m()
], oe.prototype, "signature", 2);
Ee([
  v()
], oe.prototype, "data", 2);
oe = Ee([
  R("mini-display-weather-preview")
], oe);
const Yi = /* @__PURE__ */ new Set(["unknown", "unavailable"]), Gi = /* @__PURE__ */ new Set([
  "range",
  "number_equals",
  "number_not_equals",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal"
]);
function Xi(t, e, i) {
  const a = e.source === "card" ? i?.source ? t?.states[i.source]?.state : i?.type === "text" ? i.text : void 0 : e.entity ? t?.states[e.entity]?.state : void 0, s = a !== void 0 && !Yi.has(a);
  if (e.operator === "available") return s;
  if (e.operator === "unavailable") return !s;
  if (!s) return !1;
  if (Gi.has(e.operator)) {
    const o = Number(a);
    if (!Number.isFinite(o)) return !1;
    if (e.operator === "range") return (e.minimum === void 0 || o >= e.minimum) && (e.maximum === void 0 || o <= e.maximum);
    const n = e.value;
    return Number.isFinite(n) ? e.operator === "number_equals" ? o === n : e.operator === "number_not_equals" ? o !== n : e.operator === "greater_than" ? o > n : e.operator === "greater_than_or_equal" ? o >= n : e.operator === "less_than" ? o < n : o <= n : !1;
  }
  const r = e.match ?? "";
  return e.operator === "equals" ? a === r : e.operator === "not_equals" ? a !== r : e.operator === "starts_with" ? a.startsWith(r) : e.operator === "ends_with" ? a.endsWith(r) : a.includes(r);
}
function Te(t, e, i) {
  if (!e) return !0;
  const a = new Map(e.rules.map((r) => [r.id, r])), s = (r) => {
    const o = r.type === "rule" ? Xi(t, a.get(r.ruleId), i) : r.operator === "and" ? r.children.every(s) : r.children.some(s);
    return r.negate ? !o : o;
  };
  return s(e.expression);
}
var Ki = Object.defineProperty, C = (t, e, i, a) => {
  for (var s = void 0, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = o(e, i, s) || s);
  return s && Ki(e, i, s), s;
};
const ct = class ct extends D {
  constructor() {
    super(...arguments), this.assets = [], this.page = 0, this.autoRotate = !1, this.width = 240, this.height = 240, this.displayId = "", this.interactive = !1, this.showHidden = !1, this.now = /* @__PURE__ */ new Date(), this.autoPage = 0, this.dragTarget = "", this.dragPoint = { x: 0, y: 0 }, this.pageShownAt = Date.now(), this.suppressClickUntil = 0, this.historySeries = [], this.historyPending = !1, this.historyFetched = 0, this.preventClickAfterDrag = (e) => {
      Date.now() >= this.suppressClickUntil || (e.preventDefault(), e.stopImmediatePropagation());
    }, this.pointerDown = (e) => {
      if (!this.interactive) return;
      const i = this.dashboard?.pages[this.page];
      if (i?.layout === "free") {
        const $ = e.composedPath().filter((Y) => Y instanceof HTMLElement), A = $.find((Y) => Y.classList.contains("card"));
        if (!A || e.pointerType === "mouse" && e.button !== 0) return;
        const j = Number(A.dataset.row), ie = Number(A.dataset.card), L = i.rows[j]?.cards[ie]?.frame;
        if (!L) return;
        e.preventDefault(), this.freeDrag = { row: j, card: ie, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, resize: $.some((Y) => Y.classList.contains("resize-handle")), moved: !1, start: { ...L }, frame: { ...L } };
        return;
      }
      const a = e.composedPath().filter(($) => $ instanceof HTMLElement), s = a.find(
        ($) => $.matches?.(".card-label,.value,.page-title span")
      );
      if (!s) return;
      if (s.matches(".page-title span")) {
        this.startPointer(e, {
          kind: "page-title",
          label: s.textContent?.trim() || "Page title"
        });
        return;
      }
      const r = a.find(($) => $.classList?.contains("card")), o = a.find(($) => $.classList?.contains("group"));
      if (!r || !o) return;
      const n = Array.from(
        this.shadowRoot?.querySelectorAll(".group") ?? []
      ), d = Array.from(
        o.querySelectorAll(".card")
      ), p = n.indexOf(o), g = d.indexOf(r), h = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page];
      if (!h || p < 0 || g < 0) return;
      const f = h.rows.map(($, A) => {
        const j = Te(this.hass, $.visibility), ie = $.cards.map((L, Y) => ({
          cardIndex: Y,
          hidden: !j || !Te(this.hass, L.visibility, L)
        })).filter(({ hidden: L }) => this.showHidden || !L);
        return { rowIndex: A, cards: ie };
      }).filter(({ cards: $ }) => $.length > 0), y = f[p]?.rowIndex, b = f[p]?.cards[g]?.cardIndex;
      y === void 0 || b === void 0 || this.startPointer(
        e,
        {
          kind: s.classList.contains("card-label") ? "title" : "value",
          row: y,
          card: b,
          label: s.textContent?.trim() || (s.classList.contains("card-label") ? "Title" : "Value")
        },
        r
      );
    }, this.pointerMove = (e) => {
      if (this.freeDrag?.pointerId === e.pointerId) {
        const g = this.freeDrag, h = this.shadowRoot.querySelector(".screen").getBoundingClientRect(), f = (e.clientX - g.startX) * 100 / h.width, y = (e.clientY - g.startY) * 100 / h.height;
        if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < 4) return;
        e.preventDefault();
        const b = (A) => Math.round(A * 2) / 2, $ = g.resize ? { ...g.start, width: Math.min(100 - g.start.x, Math.max(2, b(g.start.width + f))), height: Math.min(100 - g.start.y, Math.max(2, b(g.start.height + y))) } : { ...g.start, x: Math.min(100 - g.start.width, Math.max(0, b(g.start.x + f))), y: Math.min(100 - g.start.height, Math.max(0, b(g.start.y + y))) };
        this.freeDrag = { ...g, moved: !0, frame: $ };
        return;
      }
      const i = this.pointerCandidate;
      if (!i || i.pointerId !== e.pointerId) return;
      const a = Math.hypot(
        e.clientX - i.startX,
        e.clientY - i.startY
      );
      if (!this.dragging && a < 5) return;
      e.preventDefault(), this.dragging || (this.dragging = {
        kind: i.kind,
        row: i.row,
        card: i.card,
        label: i.label
      }), this.dragPoint = { x: e.clientX, y: e.clientY };
      const s = this.shadowRoot?.querySelector(".screen");
      if (!s) return;
      const r = s.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        this.dragTarget = "";
        return;
      }
      if (i.kind === "page-title") {
        const g = [
          { target: "top", value: e.clientY - r.top },
          { target: "right", value: r.right - e.clientX },
          { target: "bottom", value: r.bottom - e.clientY },
          { target: "left", value: e.clientX - r.left }
        ];
        this.dragTarget = g.reduce(
          (h, f) => f.value < h.value ? f : h
        ).target;
        return;
      }
      const o = i.cardElement;
      if (!o) return;
      const n = o.getBoundingClientRect();
      if (e.clientX < n.left || e.clientX > n.right || e.clientY < n.top || e.clientY > n.bottom) {
        this.dragTarget = "";
        return;
      }
      const d = ["left", "center", "right"][Math.min(2, Math.floor((e.clientX - n.left) / (n.width / 3)))], p = ["top", "middle", "bottom"][Math.min(2, Math.floor((e.clientY - n.top) / (n.height / 3)))];
      this.dragTarget = `${d}-${p}`;
    }, this.pointerUp = (e) => {
      if (this.freeDrag?.pointerId === e.pointerId) {
        const a = this.freeDrag;
        this.freeDrag = void 0, this.suppressClickUntil = Date.now() + 350, this.emit(a.moved ? "preview-frame" : "preview-select", a.moved ? { row: a.row, card: a.card, frame: a.frame } : { row: a.row, card: a.card, kind: "card" });
        return;
      }
      const i = this.pointerCandidate;
      if (!(!i || i.pointerId !== e.pointerId)) {
        if (this.dragging) {
          if (e.preventDefault(), e.stopPropagation(), i.kind === "page-title" && ["top", "right", "bottom", "left"].includes(this.dragTarget))
            this.emit("preview-position", {
              kind: "page-title",
              position: this.dragTarget
            });
          else {
            const [a, s] = this.dragTarget.split("-");
            ["left", "center", "right"].includes(a) && ["top", "middle", "bottom"].includes(s) && this.emit("preview-position", {
              kind: i.kind,
              row: i.row,
              card: i.card,
              horizontalAlign: a,
              verticalAlign: s
            });
          }
          this.suppressClickUntil = Date.now() + 350;
        } else
          this.emit("preview-select", {
            kind: i.kind,
            row: i.row,
            card: i.card
          }), this.suppressClickUntil = Date.now() + 100;
        this.stopDrag();
      }
    }, this.pointerCancel = (e) => {
      this.freeDrag?.pointerId === e.pointerId && (this.freeDrag = void 0), this.pointerCandidate?.pointerId === e.pointerId && this.stopDrag();
    };
  }
  connectedCallback() {
    super.connectedCallback(), this.addEventListener("pointerdown", this.pointerDown), this.addEventListener("click", this.preventClickAfterDrag, !0), window.addEventListener("pointermove", this.pointerMove, {
      passive: !1
    }), window.addEventListener("pointerup", this.pointerUp, !0), window.addEventListener("pointercancel", this.pointerCancel, !0), this.clockTimer = window.setInterval(() => {
      this.now = /* @__PURE__ */ new Date(), Date.now() - this.historyFetched > 3e4 && this.fetchData();
      const e = this.dashboard?.pages ?? [], i = (e[this.autoPage]?.durationSeconds ?? 10) * 1e3;
      this.autoRotate && e.length > 1 && Date.now() - this.pageShownAt >= i && (this.autoPage = (this.autoPage + 1) % e.length, this.pageShownAt = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    window.clearInterval(this.clockTimer), this.removeEventListener("pointerdown", this.pointerDown), this.removeEventListener("click", this.preventClickAfterDrag, !0), window.removeEventListener("pointermove", this.pointerMove), window.removeEventListener("pointerup", this.pointerUp, !0), window.removeEventListener("pointercancel", this.pointerCancel, !0), super.disconnectedCallback();
  }
  emit(e, i) {
    this.dispatchEvent(
      new CustomEvent(e, {
        detail: {
          displayId: this.displayId,
          page: this.autoRotate ? this.autoPage : this.page,
          ...i
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  clickSelect(e, i) {
    e.stopPropagation(), !(Date.now() < this.suppressClickUntil) && this.emit("preview-select", i);
  }
  startPointer(e, i, a) {
    !this.interactive || e.pointerType === "mouse" && e.button !== 0 || (e.preventDefault(), e.stopPropagation(), this.pointerCandidate = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      ...i,
      cardElement: a
    });
  }
  startDrag(e, i) {
    e.preventDefault();
  }
  stopDrag() {
    this.pointerCandidate = void 0, this.dragging = void 0, this.dragTarget = "";
  }
  positionGrid(e, i) {
    if (!this.dragging || this.dragging.kind === "page-title" || this.dragging.row !== e || this.dragging.card !== i)
      return null;
    const a = ["left", "center", "right"];
    return l`<div class="drop-grid" aria-label="Choose text position">
      ${["top", "middle", "bottom"].flatMap(
      (r) => a.map((o) => {
        const n = `${o}-${r}`;
        return l`<div
            class="drop-cell ${this.dragTarget === n ? "active" : ""}"
          ></div>`;
      })
    )}
    </div>`;
  }
  pageDropzones() {
    const e = this.dragging ? l`<div
          class="drag-ghost"
          style=${`left:${this.dragPoint.x}px;top:${this.dragPoint.y}px`}
        >
          ${this.dragging.label}
        </div>` : null;
    if (this.dragging?.kind !== "page-title") return e;
    const i = ["top", "right", "bottom", "left"], a = {
      top: "mdi:arrow-up",
      right: "mdi:arrow-right",
      bottom: "mdi:arrow-down",
      left: "mdi:arrow-left"
    };
    return l`${e}
      <div class="page-dropzones">
        ${i.map((s) => l`<div class="page-dropzone ${s} ${this.dragTarget === s ? "active" : ""}"><ha-icon icon=${a[s]}></ha-icon></div>`)}
      </div>`;
  }
  cardValue(e) {
    if (e.type === "image" || e.type === "chart" || e.type === "weather") return "";
    if (e.type === "clock")
      return this.now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: e.showSeconds ? "2-digit" : void 0,
        hour12: e.format === "12h"
      });
    const i = e.source ? this.hass?.states[e.source]?.state ?? "—" : e.text ?? "—";
    if (e.type === "status")
      return ["on", "true", "1", "open", "home"].includes(i.toLowerCase()) ? e.onText ?? "On" : e.offText ?? "Off";
    const a = Ui(e, i);
    return `${a.value}${!a.mapped && e.unit ? ` ${e.unit}` : ""}`;
  }
  imageUrl(e) {
    return this.assets.find((i) => i.id === e)?.preview ?? "";
  }
  valueFontSize(e, i, a, s) {
    const r = [18, 24, 36, 48], o = [22, 29, 42, 56], n = e.valueStyle?.fontSize ?? "auto";
    let d = n === "small" ? 0 : n === "medium" ? 1 : n === "large" ? 2 : n === "xlarge" || s >= 58 ? 3 : s >= 42 ? 2 : s >= 28 ? 1 : 0;
    const p = "sans-serif";
    if ((e.valueStyle?.textFlow ?? "default") !== "default")
      return r[n === "auto" ? Math.min(d, 1) : d];
    for (this.measureContext ??= document.createElement("canvas").getContext("2d"); d > 0 && !(o[d] <= s && (!this.measureContext || (this.measureContext.font = `700 ${r[d]}px ${p}`, this.measureContext.measureText(i).width <= a - 6))); )
      d -= 1;
    return r[d];
  }
  fontLineHeight(e) {
    return { 13: 17, 18: 22, 24: 29, 36: 42, 48: 56 }[e];
  }
  titleFontSize(e, i, a, s, r) {
    const o = e.titleStyle?.fontSize ?? "auto", n = e.titleStyle?.fontFamily ?? "sans", d = ["default", "sans", "sans-bold"].includes(n);
    if ((e.titleStyle?.textFlow ?? "default") !== "default")
      return o === "auto" ? 13 : { small: 13, medium: 24, large: 36, xlarge: 48 }[o];
    const p = o === "small" ? 13 : o === "medium" ? 24 : o === "large" ? 36 : o === "xlarge" ? 48 : r >= 48 ? 24 : r >= 24 ? 18 : 13, g = [48, 36, 24, 18, 13].filter(
      (h) => h <= p && (h !== 13 || d)
    );
    this.measureContext ??= document.createElement("canvas").getContext("2d");
    for (const h of g)
      if (!(this.fontLineHeight(h) > s) && (!this.measureContext || (this.measureContext.font = `700 ${h}px sans-serif`, this.measureContext.measureText(i).width <= a - 6)))
        return h;
    return d ? 13 : 18;
  }
  textEffectCss(e) {
    const i = e?.textEffect ?? "none";
    if (i === "none") return "";
    const a = e?.effectColor ?? "background", s = K[a] ?? a, r = Math.max(
      1,
      Math.min(3, Math.round(e?.effectThickness ?? 1))
    ), o = [];
    if (i === "outline")
      for (let n = 1; n <= r; n += 1)
        for (const [d, p] of [
          [-n, 0],
          [n, 0],
          [0, -n],
          [0, n],
          [-n, -n],
          [n, -n],
          [-n, n],
          [n, n]
        ])
          o.push(`${d}px ${p}px 0 ${s}`);
    else {
      const n = Math.max(-6, Math.min(6, e?.effectOffsetX ?? 2)), d = Math.max(-6, Math.min(6, e?.effectOffsetY ?? 2)), p = r - 1;
      for (let g = -p; g <= p; g += 1)
        for (let h = -p; h <= p; h += 1)
          o.push(`${n + g}px ${d + h}px 0 ${s}`);
    }
    return `text-shadow:${o.join(",")}`;
  }
  textFlowCss(e, i) {
    return e?.textFlow === "overflow" ? "white-space:pre;overflow:visible;max-width:none;flex-shrink:0;text-overflow:clip" : e?.textFlow === "wrap" ? `white-space:pre-wrap;overflow-wrap:anywhere;overflow:hidden;max-width:100%;max-height:min(100%,${6 * this.fontLineHeight(i)}px);line-height:${this.fontLineHeight(i)}px;text-overflow:clip` : "";
  }
  async fetchData() {
    if (!(!this.hass || !this.displayId || this.historyPending) && (this.historyFetched = Date.now(), !!this.dashboard?.pages.some((e) => e.rows.some((i) => i.cards.some((a) => a.graph))))) {
      this.historyPending = !0;
      try {
        const e = await this.hass.callWS({ type: "mini_display/data", config_entry_id: this.displayId });
        this.isConnected && (this.historySeries = e.series);
      } catch {
      } finally {
        this.historyPending = !1;
      }
    }
  }
  render() {
    const e = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page], i = `aspect-ratio:${Math.max(1, this.width)}/${Math.max(1, this.height)}`;
    if (!e)
      return l`<div class="screen-frame" style=${i}>
        <div class="screen loading" aria-label="Loading display preview"></div>
      </div>`;
    const a = e.layout === "free", s = e.rows.map((_, E) => {
      const fe = Te(this.hass, _.visibility), Z = _.cards.map((H, u) => ({
        card: H,
        cardIndex: u,
        hidden: !fe || !Te(this.hass, H.visibility, H)
      })).filter(({ hidden: H }) => this.showHidden || !H);
      return { row: _, rowIndex: E, hidden: !fe, cards: Z };
    }).filter(({ cards: _ }) => _.length > 0);
    if (s.length === 0 && !a)
      return l`<div class="screen-frame" style=${i}>
        <div class="screen">
          <div class="card"><div class="value">No visible content</div></div>
        </div>
      </div>`;
    const r = !a && !!(e.title && e.showTitle !== !1), o = e.titlePosition ?? "top", n = e.style?.background ?? "", d = (K[n] ?? n) || "#000000", p = e.titleStyle?.background ?? "", g = e.titleStyle?.foreground ?? "", h = (K[p] ?? p) || d, f = (K[g] ?? g) || "#ffffff", y = e.titleStyle?.fontSize ?? "small", b = {
      small: 25,
      medium: 32,
      large: 46,
      xlarge: 61,
      auto: 25
    }[y], $ = {
      small: 18,
      medium: 24,
      large: 36,
      xlarge: 48,
      auto: 18
    }[y], A = r && (o === "top" || o === "bottom") ? b : 0, j = r && (o === "left" || o === "right") ? b : 0, ie = this.width - 12 - j, L = this.height - 12 - A - 4 * Math.max(0, s.length - 1), Y = s.reduce((_, E) => _ + (E.row.weight ?? 1), 0) || 1, ei = r ? o === "top" ? `top:${b + 6}px;right:6px;bottom:6px;left:6px` : o === "bottom" ? `top:6px;right:6px;bottom:${b + 6}px;left:6px` : o === "left" ? `top:6px;right:6px;bottom:6px;left:${b + 6}px` : `top:6px;right:${b + 6}px;bottom:6px;left:6px` : "inset:6px", pt = this.imageUrl(e.backgroundImage), ti = `${o === "top" || o === "bottom" ? `height:${b}px` : `width:${b}px`};background:${h};color:${f};font-size:${$}px`;
    return l`<div class="screen-frame" style=${i}>
      <div
        class="screen"
        style=${`background-color:${d};${pt ? `background-image:url(${pt});background-size:cover;background-position:center` : ""}`}
      >
        ${r ? l`<div
                class="page-title ${o} ${this.interactive ? "interactive" : ""}"
                style=${ti}
                @click=${(_) => {
      _.stopPropagation(), this.emit("preview-select", { kind: "page-title" });
    }}
              >
                <span
                  .draggable=${this.interactive}
                  @dragstart=${(_) => this.startDrag(_, { kind: "page-title" })}
                  @dragend=${() => this.stopDrag()}
                  >${e.title}</span
                >
              </div>` : null}${this.pageDropzones()}
        <div class="page-content ${a ? "free-layout" : ""}" style=${a ? "inset:0" : ei}>
          ${s.map(({ row: _, rowIndex: E, hidden: fe, cards: Z }) => {
      const H = L * (_.weight ?? 1) / Y;
      return H - (_.title && _.showTitle !== !1 && H >= 24 ? 17 : 0), (ie - 4 * Math.max(0, Z.length - 1)) / Z.length, l`<div
              class="group ${fe ? "hidden-item" : ""}"
              style="flex:${_.weight ?? 1}"
            >
              ${_.title && _.showTitle !== !1 ? l`<div
                      class="title ${this.interactive ? "interactive" : ""}"
                      @click=${(u) => {
        u.stopPropagation(), this.emit("preview-select", {
          kind: "row",
          row: E
        });
      }}
                    >
                      ${_.title}
                    </div>` : null}
              <div
                class="row"
                style="grid-template-columns:repeat(${Z.length},minmax(0,1fr))"
              >
                ${Z.map(({ card: u, cardIndex: G, hidden: ii }) => {
        const ht = this.freeDrag?.row === E && this.freeDrag.card === G, M = ht ? this.freeDrag.frame : u.frame, ve = a ? (M?.width ?? 50) * this.width / 100 : (ie - 4 * Math.max(0, Z.length - 1)) / Z.length, He = a ? (M?.height ?? 25) * this.height / 100 : H - (_.title && _.showTitle !== !1 && H >= 24 ? 17 : 0), ut = u.source ? this.hass?.states[u.source]?.state ?? "—" : u.text ?? "—", gt = Number(ut), qe = u.minimum ?? 0, mt = u.maximum ?? 100, ft = Number.isFinite(gt) && mt > qe ? Math.max(
          0,
          Math.min(100, (gt - qe) / (mt - qe) * 100)
        ) : 0, ai = "sans-serif", Be = this.cardValue(u), vt = !!(u.title && u.showTitle !== !1 && He >= 28), X = u.titleStyle?.verticalAlign ?? "top", Ve = vt && (X === "top" || X === "bottom"), We = u.progress === "bar" ? 14 : 5, le = He - (u.progress === "bar" ? 9 : 0), yt = this.valueFontSize(
          u,
          Be,
          ve,
          Math.max(1, le - 17)
        ), Ye = Math.max(
          1,
          Math.min(
            le / 2,
            le - this.fontLineHeight(yt)
          )
        ), ye = vt ? this.titleFontSize(
          u,
          u.title ?? "",
          ve - 10,
          Ve ? Ye : le,
          yt
        ) : 13, de = Ve && u.titleStyle?.textFlow === "wrap" ? Ye : Ve ? Math.min(
          Ye,
          this.fontLineHeight(ye)
        ) : 0, si = u.progress === "ring" ? Math.min(
          22,
          Math.max(12, (le - de) / 4)
        ) : le - de, bt = this.valueFontSize(
          u,
          Be,
          ve,
          si
        ), xt = Fi(u, ut), $t = xt?.background ?? u.style?.background ?? "", wt = xt?.foreground ?? u.style?.foreground ?? "", _t = (K[$t] ?? $t) || "#20242d", kt = u.backgroundMode ?? (u.transparentBackground ? "transparent" : u.backgroundImage ? "image" : "color"), St = this.imageUrl(
          u.type === "image" ? u.image : kt === "image" ? u.backgroundImage : void 0
        ), Dt = K[u.style?.accent ?? ""] ?? u.style?.accent ?? "#42a5f5", ri = (K[wt] ?? wt) || "white", oi = {
          left: "flex-start",
          center: "center",
          right: "flex-end"
        }[u.valueStyle?.horizontalAlign ?? "center"], ni = {
          top: "flex-start",
          middle: "center",
          bottom: "flex-end"
        }[u.valueStyle?.verticalAlign ?? "middle"], li = u.valueStyle?.horizontalAlign ?? "center", di = {
          left: "flex-start",
          center: "center",
          right: "flex-end"
        }[u.titleStyle?.horizontalAlign ?? "left"], ci = {
          top: "flex-start",
          middle: "center",
          bottom: "flex-end"
        }[X], pi = 5 + (X === "top" ? de : 0), hi = We + (X === "bottom" ? de : 0), Ge = `top:${pi}px;right:5px;bottom:${hi}px;left:5px`, ui = X === "top" ? `top:5px;right:5px;height:${de}px;left:5px` : X === "bottom" ? `right:5px;bottom:${We}px;height:${de}px;left:5px` : `top:5px;right:5px;bottom:${We}px;left:5px`;
        this.measureContext ??= document.createElement("canvas").getContext("2d"), this.measureContext && (this.measureContext.font = `700 ${ye}px sans-serif`);
        const Xe = u.title ? Math.max(
          0,
          (this.measureContext?.measureText(u.title).width ?? 0) - (ve - 10)
        ) : 0, Pe = (u.titleStyle?.textFlow ?? "default") === "default" && Xe > 0 && (X === "top" || X === "bottom"), Ct = l`<div
                    class="value"
                    .draggable=${this.interactive}
                    style=${`font-family:${ai};font-size:${bt}px;font-weight:700;${this.textEffectCss(u.valueStyle)};${this.textFlowCss(u.valueStyle, bt)}`}
                    @click=${(S) => {
          S.stopPropagation(), this.emit("preview-select", {
            kind: "value",
            row: E,
            card: G
          });
        }}
                    @dragstart=${(S) => this.startDrag(S, { kind: "value", row: E, card: G })}
                    @dragend=${() => this.stopDrag()}
                  >
                    ${Be}
                  </div>`;
        return l`<div
                    class="card ${u.valueStyle?.textFlow === "overflow" || u.titleStyle?.textFlow === "overflow" ? "flow-overflow" : ""} ${ht ? "moving" : ""} ${u.type === "image" ? "image-card" : ""} ${this.interactive ? "interactive" : ""} ${ii && !fe ? "hidden-item" : ""}"
                    data-row=${E} data-card=${G}
                    tabindex=${a && this.interactive ? 0 : -1}
                    aria-label=${u.title || u.text || u.source || "Item"}
                    @keydown=${(S) => {
          if (!a || !M || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(S.key)) return;
          S.preventDefault();
          const ze = S.shiftKey ? 5 : 0.5;
          this.emit("preview-frame", { row: E, card: G, frame: { ...M, x: Math.max(0, Math.min(100 - M.width, M.x + (S.key === "ArrowLeft" ? -ze : S.key === "ArrowRight" ? ze : 0))), y: Math.max(0, Math.min(100 - M.height, M.y + (S.key === "ArrowUp" ? -ze : S.key === "ArrowDown" ? ze : 0))) } });
        }}
                    style=${`${a && M ? `left:${M.x}%;top:${M.y}%;width:${M.width}%;height:${M.height}%;` : ""}${e.transparentCards || kt === "transparent" ? "background:transparent" : `background-color:${_t}`};${!e.transparentCards && St ? `background-image:url(${St});background-size:${u.imageFit === "contain" ? "contain" : u.imageFit === "stretch" ? "100% 100%" : "cover"};background-position:center;background-repeat:no-repeat;` : ""}color:${ri}`}
                    @click=${(S) => {
          S.stopPropagation(), this.emit("preview-select", {
            kind: "card",
            row: E,
            card: G
          });
        }}
                  >
                    ${u.graph ? l`<mini-display-graph-preview .graph=${u.graph} .source=${u.source ?? ""} .series=${this.historySeries} .width=${ve} .height=${He}></mini-display-graph-preview>` : c}
                    ${a && this.interactive ? l`<button class="resize-handle" aria-label="Resize item" @click=${(S) => S.stopPropagation()}></button>` : c}
                    ${u.title && u.showTitle !== !1 ? l`<small
                            style=${`${ui};overflow:${u.titleStyle?.textFlow === "overflow" ? "visible" : "hidden"};align-items:${ci};justify-content:${Pe ? "flex-start" : di};text-align:${Pe ? "left" : u.titleStyle?.horizontalAlign ?? "left"};font-size:${ye}px;line-height:${this.fontLineHeight(ye)}px`}
                            ><span
                              class="card-label ${Pe ? "marquee" : ""}"
                              style=${`${Pe ? `--marquee-distance:-${Xe}px;--marquee-duration:${Math.max(3, 1.7 + Xe * 0.035)}s;` : ""}${this.textEffectCss(u.titleStyle)};${this.textFlowCss(u.titleStyle, ye)}`}
                              .draggable=${this.interactive}
                              @click=${(S) => {
          S.stopPropagation(), this.emit("preview-select", {
            kind: "title",
            row: E,
            card: G
          });
        }}
                              @dragstart=${(S) => this.startDrag(S, { kind: "title", row: E, card: G })}
                              @dragend=${() => this.stopDrag()}
                              >${u.title}</span
                            ></small
                          >` : null}${u.type === "weather" ? l`<mini-display-weather-preview style=${Ge} .hass=${this.hass} .card=${u} .signature=${JSON.stringify([u.source, u.weather])}></mini-display-weather-preview>` : u.type === "image" || u.type === "chart" ? c : u.progress === "ring" ? l`<div class="ring-stack" style=${Ge}>
                              <div
                                class="ring"
                                style=${`background:conic-gradient(${Dt} ${ft}%,#3d424e 0);--ring-bg:${_t}`}
                              ></div>
                              ${Ct}
                            </div>` : l`<div
                              class="value-wrap"
                              style=${`${Ge};align-items:${ni};justify-content:${oi};text-align:${li}`}
                            >
                              ${Ct}
                            </div>`}${this.positionGrid(E, G)}${u.type !== "image" && u.progress === "bar" ? l`<div class="bar"><i style=${`width:${ft}%;background:${Dt}`}></i></div>` : null}
                  </div>`;
      })}
              </div>
            </div>`;
    })}
        </div>
      </div>
    </div>`;
  }
};
ct.styles = T`
    .free-layout .group,.free-layout .row{display:contents}
    .free-layout .card {position:absolute; margin:0; cursor:move; touch-action:none}
    .free-layout .card:focus {outline:2px solid var(--primary-color,#03a9f4);outline-offset:-2px}
    .free-layout .card.moving {outline:2px dashed #03a9f4;outline-offset:-2px;opacity:.8}
    .resize-handle {position:absolute;right:0;bottom:0;width:18px;height:18px;z-index:10;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,#03a9f4 50%);border:0;opacity:0}
    .card:hover .resize-handle,.card:focus-within .resize-handle,.card.moving .resize-handle{opacity:1}
    :host {
      display: block;
      width: 240px;
      max-width: 100%;
    }
    .screen-frame {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    }
    .screen {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      padding: 6px;
      background: #090b10;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow: hidden;
    }
    .page-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .page-title {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: sans-serif;
      font-weight: 700;
      white-space: nowrap;
    }
    .page-title.interactive,
    .card.interactive,
    .title.interactive {
      cursor: pointer;
    }
    .page-title.interactive span,
    .card-label,
    .value {
      cursor: grab;
    }
    .page-title.interactive span:active,
    .card-label:active,
    .value:active {
      cursor: grabbing;
    }
    .page-title.top {
      top: 0;
      right: 0;
      left: 0;
    }
    .page-title.bottom {
      right: 0;
      bottom: 0;
      left: 0;
    }
    .page-title.left,
    .page-title.right {
      top: 0;
      bottom: 0;
    }
    .page-title.left {
      left: 0;
    }
    .page-title.right {
      right: 0;
    }
    .page-title.left span {
      transform: rotate(-90deg);
    }
    .page-title.right span {
      transform: rotate(90deg);
    }
    .loading {
      background: linear-gradient(
        110deg,
        #090b10 30%,
        #181c24 45%,
        #090b10 60%
      );
      background-size: 220% 100%;
      animation: loading 1.4s linear infinite;
    }
    h3 {
      font: 700 13px sans-serif;
      text-align: center;
      margin: 0;
    }
    .row {
      display: grid;
      gap: 4px;
      min-height: 0;
      flex: 1;
    }
    .group {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .title {
      font: 700 13px/17px sans-serif;
      color: #aaa;
    }
    .card {
      position: relative;
      min-width: 0;
      background: #20242d;
      border-radius: 6px;
      overflow: hidden;
    }
    .card.image-card {
      background-position: center;
      background-repeat: no-repeat;
    }
    .card.flow-overflow { overflow: visible; }
    .card-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    .card.image-card small {
      background: rgba(0, 0, 0, 0.45);
      border-radius: 3px;
      padding: 0 2px;
    }
    .card small,
    .value-wrap {
      position: absolute;
      display: flex;
      min-width: 0;
      min-height: 0;
      pointer-events: none;
    }
    .card small {
      z-index: 2;
      height: auto;
      font: 700 13px/17px sans-serif;
      color: #bbb;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-label,
    .value {
      pointer-events: auto;
    }
    .card-label.marquee {
      display: inline-block;
      max-width: none;
      text-overflow: clip;
      animation: card-title-marquee var(--marquee-duration) linear infinite;
    }
    .value-wrap {
      z-index: 1;
    }
    .value {
      max-width: 100%;
      font: 700 14px sans-serif;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hidden-item {
      opacity: 0.48;
      outline: 1px dashed rgba(255, 255, 255, 0.85);
      outline-offset: -2px;
    }
    .hidden-item.card {
      background-image: repeating-linear-gradient(
        135deg,
        transparent 0,
        transparent 7px,
        rgba(255, 255, 255, 0.08) 7px,
        rgba(255, 255, 255, 0.08) 9px
      );
    }
    .drop-grid {
      position: absolute;
      inset: 3px;
      z-index: 8;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 2px;
      padding: 2px;
      background: rgba(0, 0, 0, 0.24);
      border: 1px dashed rgba(255, 255, 255, 0.7);
      border-radius: 5px;
    }
    .drop-cell {
      display: grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid transparent;
      border-radius: 3px;
    }
    .drop-cell::after {
      content: "";
      width: 5px;
      height: 5px;
      background: rgba(255, 255, 255, 0.58);
      border-radius: 50%;
    }
    .drop-cell.active {
      background: rgba(3, 169, 244, 0.38);
      border-color: #29b6f6;
    }
    .drop-cell.active::after {
      background: white;
    }
    .page-dropzones {
      position: absolute;
      inset: 0;
      z-index: 10;
      pointer-events: none;
    }
    .page-dropzone {
      position: absolute;
      display: grid;
      place-items: center;
      color: white;
      background: rgba(0, 0, 0, 0.45);
      border: 1px dashed rgba(255, 255, 255, 0.75);
      pointer-events: auto;
    }
    .page-dropzone ha-icon {
      width: 18px;
      height: 18px;
    }
    .page-dropzone.active {
      background: rgba(3, 169, 244, 0.58);
      border-color: #4fc3f7;
    }
    .page-dropzone.top,
    .page-dropzone.bottom {
      right: 18%;
      left: 18%;
      height: 25%;
    }
    .page-dropzone.top {
      top: 3px;
    }
    .page-dropzone.bottom {
      bottom: 3px;
    }
    .page-dropzone.left,
    .page-dropzone.right {
      top: 26%;
      bottom: 26%;
      width: 25%;
    }
    .page-dropzone.left {
      left: 3px;
    }
    .page-dropzone.right {
      right: 3px;
    }
    .bar {
      position: absolute;
      right: 5px;
      bottom: 5px;
      left: 5px;
      height: 5px;
      background: #3d424e;
      border-radius: 2px;
    }
    .bar i {
      display: block;
      height: 100%;
      background: #42a5f5;
      border-radius: 2px;
    }
    .ring-stack {
      position: absolute;
      inset: 5px;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      pointer-events: none;
    }
    .ring {
      width: min(42px, calc(100% - 8px));
      max-height: calc(100% - 18px);
      aspect-ratio: 1;
      border-radius: 50%;
      flex: 0 1 auto;
    }
    .ring:after {
      content: "";
      display: block;
      width: 72%;
      aspect-ratio: 1;
      margin: 14%;
      border-radius: 50%;
      background: var(--ring-bg, #20242d);
    }
    .ring-stack .value {
      flex: none;
      pointer-events: auto;
    }
    .page-title.interactive span,
    .card-label,
    .value {
      touch-action: none;
      user-select: none;
    }
    .drag-ghost {
      position: fixed;
      z-index: 10000;
      max-width: 180px;
      padding: 6px 10px;
      color: white;
      background: rgba(30, 34, 42, 0.94);
      border: 1px solid #4fc3f7;
      border-radius: 6px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
      font: 600 13px sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      transform: translate(-50%, -50%);
    }
    @keyframes loading {
      to {
        background-position: -220% 0;
      }
    }
    @keyframes card-title-marquee {
      0%,
      22% {
        transform: translateX(0);
      }
      78%,
      100% {
        transform: translateX(var(--marquee-distance));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .loading {
        animation: none;
      }
      .drag-ghost {
        box-shadow: none;
      }
    }
  `;
let k = ct;
C([
  m({ attribute: !1 })
], k.prototype, "dashboard");
C([
  m({ attribute: !1 })
], k.prototype, "hass");
C([
  m({ attribute: !1 })
], k.prototype, "assets");
C([
  m({ type: Number })
], k.prototype, "page");
C([
  m({ type: Boolean })
], k.prototype, "autoRotate");
C([
  m({ type: Number })
], k.prototype, "width");
C([
  m({ type: Number })
], k.prototype, "height");
C([
  m()
], k.prototype, "displayId");
C([
  m({ type: Boolean })
], k.prototype, "interactive");
C([
  m({ type: Boolean })
], k.prototype, "showHidden");
C([
  v()
], k.prototype, "now");
C([
  v()
], k.prototype, "autoPage");
C([
  v()
], k.prototype, "dragging");
C([
  v()
], k.prototype, "dragTarget");
C([
  v()
], k.prototype, "dragPoint");
C([
  v()
], k.prototype, "historySeries");
C([
  v()
], k.prototype, "freeDrag");
customElements.get("mini-display-preview") || customElements.define("mini-display-preview", k);
var Ji = Object.defineProperty, Zi = Object.getOwnPropertyDescriptor, U = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? Zi(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && Ji(e, i, s), s;
};
const xe = (t, e, i) => {
  t.dispatchEvent(
    new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 })
  );
};
let P = class extends D {
  constructor() {
    super(...arguments), this.displays = [], this.dashboards = {}, this.pages = {}, this.dirtyDisplays = /* @__PURE__ */ new Set(), this.assets = {}, this.selectedDisplayId = "", this.selectedSceneId = "", this.selectedSceneName = "", this.showHidden = !1;
  }
  render() {
    return l`
      ${this.displays.map((t) => this.renderDisplay(t))}
      <div class="preview-footer">
        <label class="show-hidden"
          ><input
            type="checkbox"
            .checked=${this.showHidden}
            @change=${(t) => this.showHidden = t.target.checked}
          />Show hidden cards</label
        >
      </div>
    `;
  }
  renderDisplay(t) {
    const e = this.dashboards[t.config_entry_id], i = Math.min(
      this.pages[t.config_entry_id] ?? 0,
      Math.max(0, (e?.pages.length ?? 1) - 1)
    ), a = t.preview_scene_id === this.selectedSceneId, s = t.active_scene_id === this.selectedSceneId, r = !!e;
    return l`
      <ha-card
        class=${t.config_entry_id === this.selectedDisplayId ? "selected" : ""}
        @click=${() => xe(this, "display-selected", t.config_entry_id)}
      >
        <header>
          <div>
            <strong>${t.title}</strong
            ><small>Active: ${t.active_scene_name ?? "Unknown"}</small>
          </div>
          <button
            class="icon ${a ? "active" : ""}"
            title=${a ? "Stop temporary preview" : e ? "Show temporarily for 5 minutes" : "Add a layout first"}
            aria-label=${a ? "Stop temporary preview" : "Show temporary preview"}
            ?disabled=${!a && !r}
            @click=${(o) => {
      o.stopPropagation(), xe(this, "preview-toggle", t);
    }}
          >
            <ha-icon
              icon=${a ? "mdi:eye" : "mdi:eye-off-outline"}
            ></ha-icon>
          </button>
        </header>
        ${e ? l`
                <mini-display-preview
                  .dashboard=${e}
                  .hass=${this.hass}
                  .assets=${this.assets[t.config_entry_id] ?? []}
                  .page=${i}
                  .width=${t.width}
                  .height=${t.height}
                  .displayId=${t.config_entry_id}
                  .interactive=${!0}
                  .showHidden=${this.showHidden}
                  @click=${(o) => o.stopPropagation()}
                ></mini-display-preview>
                ${e.pages.length > 1 ? l`
                  <nav>
                    <button
                      class="icon"
                      aria-label="Previous page"
                      @click=${(o) => {
      o.stopPropagation(), xe(this, "preview-page", {
        displayId: t.config_entry_id,
        delta: -1
      });
    }}
                    >
                      <ha-icon icon="mdi:chevron-left"></ha-icon>
                    </button>
                    <span>${i + 1} / ${e.pages.length}</span>
                    <button
                      class="icon"
                      aria-label="Next page"
                      @click=${(o) => {
      o.stopPropagation(), xe(this, "preview-page", {
        displayId: t.config_entry_id,
        delta: 1
      });
    }}
                    >
                      <ha-icon icon="mdi:chevron-right"></ha-icon>
                    </button>
                  </nav>
                ` : c}
              ` : l`<ha-alert alert-type="info"
                >No layout in this scene.</ha-alert
              >`}
        ${!s && e ? l`<ha-button
                .disabled=${this.dirtyDisplays.has(t.config_entry_id)}
                @click=${(o) => {
      o.stopPropagation(), xe(this, "scene-activate", t);
    }}
                >Activate ${this.selectedSceneName}</ha-button
              >` : c}
      </ha-card>
    `;
  }
};
P.styles = T`
    :host {
      display: grid;
      gap: 12px;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      position: sticky;
      top: 16px;
      font-family: var(--ha-font-family-body, Roboto, sans-serif);
    }
    .preview-footer {
      display: flex;
      justify-content: center;
    }
    .show-hidden {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 40px;
      color: var(--secondary-text-color);
      font-size: 12px;
      cursor: pointer;
    }
    .show-hidden input {
      width: 18px;
      height: 18px;
      margin: 0;
    }
    ha-card {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 2px solid transparent;
      cursor: pointer;
    }
    ha-card.selected {
      border-color: var(--primary-color);
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    strong,
    small {
      display: block;
    }
    strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    small {
      margin-top: 3px;
      color: var(--secondary-text-color);
    }
    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--secondary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }
    .icon:hover,
    .icon.active {
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    mini-display-preview {
      margin: auto;
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    nav .icon {
      width: 32px;
      height: 32px;
    }
    ha-button {
      width: 100%;
    }
    @media (max-width: 1100px) {
      :host {
        grid-column: 1/-1;
        grid-template-columns: repeat(auto-fit, minmax(272px, 1fr));
        max-height: none;
        overflow: visible;
        position: static;
      }
      .preview-footer {
        grid-column: 1/-1;
      }
    }
    @media (max-width: 700px) {
      :host {
        grid-column: auto;
        grid-template-columns: 1fr;
      }
    }
  `;
U([
  m({ attribute: !1 })
], P.prototype, "hass", 2);
U([
  m({ attribute: !1 })
], P.prototype, "displays", 2);
U([
  m({ attribute: !1 })
], P.prototype, "dashboards", 2);
U([
  m({ attribute: !1 })
], P.prototype, "pages", 2);
U([
  m({ attribute: !1 })
], P.prototype, "dirtyDisplays", 2);
U([
  m({ attribute: !1 })
], P.prototype, "assets", 2);
U([
  m()
], P.prototype, "selectedDisplayId", 2);
U([
  m()
], P.prototype, "selectedSceneId", 2);
U([
  m()
], P.prototype, "selectedSceneName", 2);
U([
  v()
], P.prototype, "showHidden", 2);
P = U([
  R("mini-display-preview-list")
], P);
var Qi = Object.defineProperty, ea = Object.getOwnPropertyDescriptor, J = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? ea(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && Qi(e, i, s), s;
};
const I = (t, e, i) => {
  t.dispatchEvent(
    new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 })
  );
};
let N = class extends D {
  constructor() {
    super(...arguments), this.displays = [], this.scenes = [], this.selectedDisplayId = "", this.selectedSceneId = "", this.section = "scenes", this.imageCount = 0, this.form = null, this.sceneName = "", this.closeActionMenusOnOutsideClick = (t) => {
      const e = t.composedPath();
      this.renderRoot.querySelectorAll("details.action-menu[open]").forEach((i) => {
        e.includes(i) || (i.open = !1);
      });
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener(
      "pointerdown",
      this.closeActionMenusOnOutsideClick,
      !0
    );
  }
  disconnectedCallback() {
    window.removeEventListener(
      "pointerdown",
      this.closeActionMenusOnOutsideClick,
      !0
    ), super.disconnectedCallback();
  }
  actionMenuToggled(t) {
    const e = t.currentTarget;
    e.open && this.renderRoot.querySelectorAll("details.action-menu[open]").forEach((i) => {
      i !== e && (i.open = !1);
    });
  }
  closeActionMenu(t) {
    const e = t.composedPath().find(
      (a) => a instanceof HTMLButtonElement
    );
    if (!e || e.disabled) return;
    const i = t.currentTarget.closest("details");
    i && (i.open = !1);
  }
  actionMenuKeydown(t) {
    if (t.key !== "Escape") return;
    const e = t.currentTarget.closest("details");
    e && (e.open = !1, e.querySelector("summary")?.focus(), t.preventDefault(), t.stopPropagation());
  }
  render() {
    const t = this.displays.find(
      (e) => e.config_entry_id === this.selectedDisplayId
    );
    return l`
      <ha-card>
        <header><h2>Display</h2></header>
        <div class="picker">
          <label>
            Display
            <select
              .value=${this.selectedDisplayId}
              @change=${(e) => I(this, "display-selected", e.target.value)}
            >
              ${this.displays.map((e) => l`<option value=${e.config_entry_id}>${e.title}</option>`)}
            </select>
          </label>
          <span class="status ${t?.available ? "online" : ""}"
            ><i></i>${t?.available ? "Online" : "Offline"}</span
          >
        </div>
        <div class="navigation">
          <button
            class="nav-item ${this.section === "images" ? "active" : ""}"
            @click=${() => I(this, "images-selected")}
          >
            <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
            <span>Images (${this.imageCount})</span>
          </button>
        </div>
        <header>
          <h2>Scenes</h2>
          <button
            class="icon"
            title="Add scene"
            aria-label="Add scene"
            @click=${() => I(this, "scene-create")}
          >
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
        </header>
        <div class="list">
          ${this.scenes.map(
      (e) => l`
              <div
                class="row ${this.section === "scenes" && e.id === this.selectedSceneId ? "active" : ""}"
              >
                <button
                  class="scene"
                  @click=${() => I(this, "scene-selected", e.id)}
                >
                  <ha-icon icon="mdi:layers-outline"></ha-icon>
                  <span>${e.name}</span>
                  ${e.is_default ? l`<ha-icon class="default" icon="mdi:star" title="Default scene"></ha-icon>` : c}
                </button>
                ${e.id === this.selectedSceneId ? l`
                        <details
                          class="action-menu"
                          @toggle=${this.actionMenuToggled}
                          @keydown=${this.actionMenuKeydown}
                        >
                          <summary
                            aria-label="Scene actions"
                            aria-haspopup="menu"
                          >
                            <ha-icon icon="mdi:dots-vertical"></ha-icon>
                          </summary>
                          <div
                            class="menu"
                            role="menu"
                            @click=${this.closeActionMenu}
                          >
                            <button @click=${() => I(this, "scene-rename")}>
                              Rename
                            </button>
                            <button
                              @click=${() => I(this, "scene-duplicate")}
                            >
                              Duplicate
                            </button>
                            ${e.is_default ? c : l`<button @click=${() => I(this, "scene-default")}>Set as default</button>`}
                            ${e.is_default ? c : l`<button class="danger" @click=${() => I(this, "scene-delete")}>Delete</button>`}
                          </div>
                        </details>
                      ` : c}
              </div>
            `
    )}
        </div>
        ${this.form ? l`
                <div class="form">
                  <strong>Rename scene</strong>
                  <ha-textfield
                    label="Scene name"
                    .value=${this.sceneName}
                    @input=${(e) => I(this, "scene-name", e.target.value)}
                    @keydown=${(e) => {
      e.key === "Enter" && I(this, "scene-save");
    }}
                  ></ha-textfield>
                  <div class="actions">
                    <ha-button @click=${() => I(this, "scene-cancel")}
                      >Cancel</ha-button
                    >
                    <ha-button
                      .disabled=${!this.sceneName.trim()}
                      @click=${() => I(this, "scene-save")}
                      >Save</ha-button
                    >
                  </div>
                </div>
              ` : c}
      </ha-card>
    `;
  }
};
N.styles = T`
    :host {
      display: block;
      font-family: var(--ha-font-family-body, Roboto, sans-serif);
    }
    ha-card {
      overflow: visible;
      border: 1px solid var(--divider-color);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 52px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    .picker,
    .form {
      display: grid;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    label {
      display: grid;
      gap: 5px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    select {
      width: 100%;
      min-height: 40px;
      padding: 8px;
      color: var(--primary-text-color);
      font: inherit;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }
    .status i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--error-color);
    }
    .status.online i {
      background: var(--success-color);
    }
    .list {
      display: grid;
      gap: 4px;
      padding: 8px;
    }
    .navigation {
      display: grid;
      gap: 4px;
      padding: 8px;
      border-bottom: 1px solid var(--divider-color);
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      padding: 8px 10px;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 10px;
      cursor: pointer;
    }
    .nav-item:hover,
    .nav-item.active {
      background: var(--secondary-background-color);
    }
    .nav-item ha-icon {
      color: var(--secondary-text-color);
    }
    .nav-item.active ha-icon {
      color: var(--primary-color);
    }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 36px;
      align-items: center;
      border-radius: 10px;
    }
    .row.active {
      background: var(--secondary-background-color);
    }
    .scene {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      padding: 8px 10px;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      background: transparent;
      border: 0;
      cursor: pointer;
    }
    .scene span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .scene .default {
      flex: none;
      color: var(--primary-color);
    }
    .scene ha-icon {
      color: var(--secondary-text-color);
    }
    .active .scene ha-icon {
      color: var(--primary-color);
    }
    .icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      padding: 0;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }
    .icon:hover {
      background: var(--card-background-color);
    }
    details {
      position: relative;
    }
    summary {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      list-style: none;
      cursor: pointer;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    .menu {
      position: absolute;
      right: 0;
      z-index: 20;
      display: grid;
      width: 150px;
      padding: 6px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      box-shadow: var(--ha-card-box-shadow);
    }
    .menu button {
      min-height: 38px;
      padding: 8px;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      background: transparent;
      border: 0;
      cursor: pointer;
    }
    .menu .danger {
      color: var(--error-color);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .form strong {
      font-size: 14px;
    }
    .form small {
      color: var(--secondary-text-color);
      line-height: 1.4;
    }
  `;
J([
  m({ attribute: !1 })
], N.prototype, "displays", 2);
J([
  m({ attribute: !1 })
], N.prototype, "scenes", 2);
J([
  m()
], N.prototype, "selectedDisplayId", 2);
J([
  m()
], N.prototype, "selectedSceneId", 2);
J([
  m()
], N.prototype, "section", 2);
J([
  m({ type: Number })
], N.prototype, "imageCount", 2);
J([
  m()
], N.prototype, "form", 2);
J([
  m()
], N.prototype, "sceneName", 2);
N = J([
  R("mini-display-scene-sidebar")
], N);
const pe = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, ta = (t) => (...e) => ({ _$litDirective$: t, values: e });
class ia {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, i, a) {
    this._$Ct = e, this._$AM = i, this._$Ci = a;
  }
  _$AS(e, i) {
    return this.update(e, i);
  }
  update(e, i) {
    return this.render(...i);
  }
}
const aa = (t) => t.strings === void 0, sa = {}, ra = (t, e = sa) => t._$AH = e;
const he = ta(class extends ia {
  constructor(t) {
    if (super(t), t.type !== pe.PROPERTY && t.type !== pe.ATTRIBUTE && t.type !== pe.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!aa(t)) throw Error("`live` bindings can only contain a single expression");
  }
  render(t) {
    return t;
  }
  update(t, [e]) {
    if (e === B || e === c) return e;
    const i = t.element, a = t.name;
    if (t.type === pe.PROPERTY) {
      if (e === i[a]) return B;
    } else if (t.type === pe.BOOLEAN_ATTRIBUTE) {
      if (!!e === i.hasAttribute(a)) return B;
    } else if (t.type === pe.ATTRIBUTE && i.getAttribute(a) === e + "") return B;
    return ra(t), e;
  }
});
var oa = Object.defineProperty, na = Object.getOwnPropertyDescriptor, te = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? na(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && oa(e, i, s), s;
};
const jt = {
  range: "is in number range",
  number_equals: "equals",
  number_not_equals: "does not equal",
  greater_than: "is greater than",
  greater_than_or_equal: "is greater than or equal to",
  less_than: "is less than",
  less_than_or_equal: "is less than or equal to",
  equals: "equals",
  not_equals: "does not equal",
  starts_with: "starts with",
  ends_with: "ends with",
  contains: "contains",
  available: "is available",
  unavailable: "is unavailable"
}, Ue = [
  "number_equals",
  "number_not_equals",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "range"
], Je = new Set(Ue.filter((t) => t !== "range")), Ze = ["equals", "not_equals", "starts_with", "ends_with", "contains"], $e = ["available", "unavailable"], Qe = (t) => Ue.includes(t), Lt = () => ({
  rules: [{ id: "rule_a", source: "entity", entity: "", operator: "equals", match: "" }],
  expression: { type: "group", operator: "and", children: [{ type: "rule", ruleId: "rule_a" }] }
}), Ht = ["#039be5", "#8e24aa", "#fb8c00", "#43a047", "#e53935", "#00897b", "#d81b60", "#3949ab", "#f9a825", "#00acc1", "#f4511e", "#7cb342"], q = (t) => t.replace("rule_", "").toUpperCase(), qt = (t) => Ht[Math.max(0, t.charCodeAt(t.length - 1) - 97) % Ht.length], et = (t, e, i) => {
  t.dispatchEvent(new CustomEvent(e, { detail: i, bubbles: !0, composed: !0 }));
};
let V = class extends D {
  constructor() {
    super(...arguments), this.targetName = "", this.targetKind = "card", this.draft = Lt(), this.advanced = !1, this.draftInitialized = !1;
  }
  connectedCallback() {
    super.connectedCallback(), this.valueRefreshTimer = window.setInterval(() => this.requestUpdate(), 3e3);
  }
  willUpdate() {
    this.draftInitialized || (this.draftInitialized = !0, this.draft = structuredClone(this.value ?? Lt()), !this.value && this.canUseCardValue && (this.draft.rules[0].source = "card", this.card?.type === "number" && (this.draft.rules[0].operator = "range")));
  }
  disconnectedCallback() {
    this.valueRefreshTimer !== void 0 && window.clearInterval(this.valueRefreshTimer), this.valueRefreshTimer = void 0, super.disconnectedCallback();
  }
  render() {
    const t = this.validationError;
    return l`
      <ha-card role="dialog" aria-modal="true" aria-labelledby="visibility-title" @click=${(e) => e.stopPropagation()}>
        <header><h2 id="visibility-title">${this.targetName} visibility</h2></header>
        <main>
          <div class="mode-switch" role="tablist" aria-label="Visibility editor mode"><button class=${this.advanced ? "" : "active"} role="tab" aria-selected=${!this.advanced} @click=${() => this.advanced = !1}>Simple</button><button class=${this.advanced ? "active" : ""} role="tab" aria-selected=${this.advanced} @click=${() => this.advanced = !0}>Advanced</button></div>
          <p>${this.advanced ? "Name reusable conditions, then combine them in a nested logic tree." : "Show this item when the selected conditions match."}</p>
          ${!this.advanced && this.draft.rules.length > 1 ? l`<label>Match<select .value=${he(this.draft.expression.operator)} @change=${(e) => this.updateGroup([], { operator: e.target.value })}><option value="and">All conditions</option><option value="or">Any condition</option></select></label>` : c}
          ${!this.advanced && this.hasAdvancedLogic ? l`<p class="error">Nested or inverted logic is active. Use Advanced mode to edit it.</p>` : c}
          <section><div class="section-head"><h3>Conditions</h3><ha-button .disabled=${this.draft.rules.length >= 12} @click=${this.addRule}>Add condition</ha-button></div><div class="rule-list">${this.draft.rules.map((e, i) => this.renderRule(e, i))}</div></section>
          ${this.advanced ? l`<section><div class="section-head"><h3>Logic</h3></div><div class="logic">${this.renderGroup(this.draft.expression, [])}</div></section>` : c}
          ${t ? l`<p class="error" role="alert">${t}</p>` : c}
        </main>
        <footer class="actions"><ha-button @click=${() => et(this, "visibility-clear")}>Always visible</ha-button><div class="right"><ha-button @click=${() => et(this, "visibility-cancel")}>Cancel</ha-button><ha-button .disabled=${!!t} @click=${this.save}>Save</ha-button></div></footer>
      </ha-card>`;
  }
  get canUseCardValue() {
    return this.targetKind === "card" && !!(this.card?.source || this.card?.type === "text" && this.card.text !== void 0);
  }
  renderRule(t, e) {
    const i = t.source === "entity", a = Ze.includes(t.operator), s = Je.has(t.operator);
    return l`<article class="rule">
      <div class="rule-head">
        <span class="rule-marker" style=${`background:${qt(t.id)}`}>${q(t.id)}</span>
        <label>Value source<select .value=${he(t.source)} @change=${(r) => this.changeSource(e, r.target.value)}><option value="card" ?disabled=${!this.canUseCardValue}>This card</option><option value="entity">Another entity</option></select></label>
        <button class="icon danger" ?disabled=${this.draft.rules.length === 1} aria-label=${`Remove condition ${q(t.id)}`} @click=${() => this.removeRule(e)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>
      <div class="rule-fields">
        <label>Comparison<select .value=${he(t.operator)} @change=${(r) => this.changeOperator(e, r.target.value)}>${this.operatorOptions(t).map((r) => l`<option value=${r}>${jt[r]}</option>`)}</select></label>
        ${i ? l`<div class="entity-source"><ha-form .hass=${this.hass} .data=${{ entity: t.entity ?? "" }} .schema=${[{ name: "entity", required: !0, selector: { entity: this.entitySelector(t) } }]} .computeLabel=${() => "Entity"} @value-changed=${(r) => this.updateRule(e, { entity: r.detail.value.entity })}></ha-form>${this.currentValue(t)}</div>` : l`<div class="entity-source">${this.currentValue(t)}</div>`}
        ${t.operator === "range" ? l`<div class="range">${this.numberField("From", t.minimum, (r) => this.updateRule(e, { minimum: r }))}${this.numberField("To", t.maximum, (r) => this.updateRule(e, { maximum: r }))}</div>` : s ? this.numberField("Value", t.value, (r) => this.updateRule(e, { value: r })) : a ? this.matchField(t, e) : c}
      </div>
    </article>`;
  }
  numberField(t, e, i) {
    return l`<label>${t}<input type="number" .value=${e === void 0 ? "" : String(e)} @input=${(a) => {
      const s = a.target.value;
      i(s === "" ? void 0 : Number(s));
    }}></label>`;
  }
  renderGroup(t, e) {
    return l`<div class="group ${e.length ? "nested" : ""}">
      <div class="group-head"><label>Group logic<select .value=${he(t.operator)} @change=${(i) => this.updateGroup(e, { operator: i.target.value })}><option value="and">All must match (AND)</option><option value="or">Any may match (OR)</option></select></label><label class="invert"><input type="checkbox" .checked=${t.negate === !0} @change=${(i) => this.updateGroup(e, { negate: i.target.checked })}>Invert result</label></div>
      ${t.children.map((i, a) => this.renderExpression(i, [...e, a], a, t.children.length))}
      <div class="group-actions"><ha-button @click=${() => this.addRuleReference(e)}>Add condition</ha-button><ha-button .disabled=${e.length >= 3} @click=${() => this.addGroup(e)}>Add group</ha-button></div>
    </div>`;
  }
  renderExpression(t, e, i, a) {
    return t.type === "group" ? l`<div class="logic-child"><span class="logic-index">${i + 1}</span>${this.renderGroup(t, e)}${this.moveButtons(e, i, a)}<button class="icon danger" ?disabled=${a === 1} aria-label="Remove group" @click=${() => this.removeExpression(e)}><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>` : l`<div class="logic-child"><span class="logic-index">${i + 1}</span><div><div class="rule-reference"><span class="rule-marker" style=${`background:${qt(t.ruleId)}`}>${q(t.ruleId)}</span><label>Condition<select .value=${he(t.ruleId)} @change=${(s) => this.updateExpression(e, { ...t, ruleId: s.target.value })}>${this.draft.rules.map((s) => l`<option value=${s.id}>Condition ${q(s.id)}</option>`)}</select></label></div><label class="invert"><input type="checkbox" .checked=${t.negate === !0} @change=${(s) => this.updateExpression(e, { ...t, negate: s.target.checked })}>Invert condition</label></div>${this.moveButtons(e, i, a)}<button class="icon danger" ?disabled=${a === 1} aria-label="Remove condition from logic" @click=${() => this.removeExpression(e)}><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`;
  }
  moveButtons(t, e, i) {
    return l`<div class="move"><button class="icon" ?disabled=${e === 0} aria-label="Move up" @click=${() => this.moveExpression(t, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button><button class="icon" ?disabled=${e === i - 1} aria-label="Move down" @click=${() => this.moveExpression(t, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>`;
  }
  updateRule(t, e) {
    this.draft = { ...this.draft, rules: this.draft.rules.map((i, a) => a === t ? { ...i, ...e } : i) };
  }
  changeSource(t, e) {
    const i = this.draft.rules[t];
    if (e === "card" && this.card?.type === "number" && ![...Ue, ...$e].includes(i.operator)) {
      this.changeOperator(t, "range"), this.updateRule(t, { source: e });
      return;
    }
    if (e === "card" && this.card?.type !== "number" && Qe(i.operator)) {
      this.changeOperator(t, "equals"), this.updateRule(t, { source: e });
      return;
    }
    this.updateRule(t, { source: e });
  }
  operatorOptions(t) {
    return t.source !== "card" ? Object.keys(jt) : this.card?.type === "number" ? [...Ue, ...$e] : [...Ze, ...$e];
  }
  entitySelector(t) {
    if (["available", "unavailable"].includes(t.operator)) return {};
    const e = Qe(t.operator);
    return { include_entities: Object.entries(this.hass?.states ?? {}).filter(([a, s]) => a === t.entity || this.isNumericState(a, s) === e).map(([a]) => a) };
  }
  isNumericState(t, e) {
    if (["number", "input_number", "counter"].includes(t.split(".", 1)[0]) || e.attributes?.unit_of_measurement !== void 0) return !0;
    const i = e.state.trim();
    return i !== "" && !["unknown", "unavailable"].includes(i) && Number.isFinite(Number(i));
  }
  sourceState(t) {
    const e = t.source === "card" ? this.card?.source : t.entity;
    return e ? this.hass?.states[e] : void 0;
  }
  currentValue(t) {
    if (t.source === "entity" && !t.entity) return l`<div class="current-value">Select an entity to see its current value.</div>`;
    if (t.source === "card" && this.card?.type === "text" && !this.card.source)
      return l`<div class="current-value"><span>Current value: </span><strong>${this.card.text ?? ""}</strong></div>`;
    const e = t.source === "card" ? this.card?.source : t.entity, i = e ? this.hass?.states[e] : void 0;
    if (!i) return l`<div class="current-value unavailable"><span>Current value: </span><strong>not available</strong></div>`;
    const a = typeof i.attributes?.unit_of_measurement == "string" ? ` ${i.attributes.unit_of_measurement}` : "", s = ["unknown", "unavailable"].includes(i.state);
    return l`<div class="current-value ${s ? "unavailable" : ""}"><span>Current value: </span><strong>${i.state}${a}</strong></div>`;
  }
  knownValues(t) {
    if (!["equals", "not_equals"].includes(t.operator)) return [];
    if (t.source === "card" && this.card?.type === "status") return ["on", "off"];
    const e = t.source === "card" ? this.card?.source : t.entity, a = this.sourceState(t)?.attributes?.options;
    if (Array.isArray(a)) return [...new Set(a.map(String))];
    const s = e?.split(".", 1)[0];
    return s && ["binary_sensor", "switch", "input_boolean", "light", "fan", "lock", "cover"].includes(s) ? ["on", "off"] : [];
  }
  matchField(t, e) {
    const i = this.knownValues(t);
    if (i.length) {
      const s = t.match && !i.includes(t.match) ? [t.match, ...i] : i;
      return l`<label>Value<select .value=${he(t.match ?? "")} @change=${(r) => this.updateRule(e, { match: r.target.value })}><option value="" disabled>Select value</option>${s.map((r) => l`<option value=${r}>${r}</option>`)}</select></label>`;
    }
    const a = this.sourceState(t)?.state;
    return l`<label>Value<input maxlength="64" placeholder=${a ? `Current: ${a}` : "Value"} .value=${t.match ?? ""} @input=${(s) => this.updateRule(e, { match: s.target.value })}></label>`;
  }
  changeOperator(t, e) {
    const i = this.draft.rules[t], a = { id: i.id, source: i.source, entity: i.entity, operator: e };
    e === "range" ? (a.minimum = i.minimum, a.maximum = i.maximum) : Je.has(e) ? a.value = i.value : $e.includes(e) || (a.match = i.match ?? "");
    const s = a.entity ? this.hass?.states[a.entity] : void 0;
    a.source === "entity" && a.entity && s && !$e.includes(e) && this.isNumericState(a.entity, s) !== Qe(e) && delete a.entity, this.draft = { ...this.draft, rules: this.draft.rules.map((r, o) => o === t ? a : r) };
  }
  addRule() {
    const t = new Set(this.draft.rules.map((s) => s.id));
    let e = 97;
    for (; t.has(`rule_${String.fromCharCode(e)}`); ) e += 1;
    const i = this.canUseCardValue && this.card?.type === "number", a = { id: `rule_${String.fromCharCode(e)}`, source: this.canUseCardValue ? "card" : "entity", entity: "", operator: i ? "range" : "equals", ...i ? {} : { match: "" } };
    this.draft = { rules: [...this.draft.rules, a], expression: { ...this.draft.expression, children: [...this.draft.expression.children, { type: "rule", ruleId: a.id }] } };
  }
  removeRule(t) {
    if (this.draft.rules.length === 1) return;
    const e = this.draft.rules[t].id, i = this.draft.rules.filter((r, o) => o !== t), a = i[0].id, s = (r) => r.type === "rule" ? r.ruleId === e ? { ...r, ruleId: a } : r : { ...r, children: r.children.map(s) };
    this.draft = { rules: i, expression: s(this.draft.expression) };
  }
  groupAt(t, e) {
    let i = t;
    for (const a of e) {
      const s = i.children[a];
      if (!s || s.type !== "group") throw new Error("Invalid visibility group path");
      i = s;
    }
    return i;
  }
  parentAt(t, e) {
    return this.groupAt(t, e.slice(0, -1));
  }
  mutateExpression(t) {
    const e = structuredClone(this.draft.expression);
    t(e), this.draft = { ...this.draft, expression: e };
  }
  updateGroup(t, e) {
    this.mutateExpression((i) => Object.assign(this.groupAt(i, t), e));
  }
  updateExpression(t, e) {
    this.mutateExpression((i) => {
      this.parentAt(i, t).children[t.at(-1)] = e;
    });
  }
  addRuleReference(t) {
    this.mutateExpression((e) => this.groupAt(e, t).children.push({ type: "rule", ruleId: this.draft.rules[0].id }));
  }
  addGroup(t) {
    this.mutateExpression((e) => this.groupAt(e, t).children.push({ type: "group", operator: "and", children: [{ type: "rule", ruleId: this.draft.rules[0].id }] }));
  }
  removeExpression(t) {
    this.mutateExpression((e) => {
      const i = this.parentAt(e, t);
      i.children.length > 1 && i.children.splice(t.at(-1), 1);
    });
  }
  moveExpression(t, e) {
    this.mutateExpression((i) => {
      const a = this.parentAt(i, t), s = t.at(-1), r = s + e;
      r < 0 || r >= a.children.length || ([a.children[s], a.children[r]] = [a.children[r], a.children[s]]);
    });
  }
  get hasAdvancedLogic() {
    const t = (e) => e.negate === !0 || e.type === "group" && e.children.some((i) => i.type === "group" || t(i));
    return t(this.draft.expression);
  }
  get validationError() {
    for (const t of this.draft.rules) {
      if (t.source === "card" && !this.canUseCardValue) return "This item has no card value to test.";
      if (t.source === "entity" && !t.entity?.trim()) return `Condition ${q(t.id)} needs an entity.`;
      if (t.operator === "range") {
        if (t.minimum === void 0 && t.maximum === void 0) return `Condition ${q(t.id)} needs a lower or upper limit.`;
        if (t.minimum !== void 0 && !Number.isFinite(t.minimum) || t.maximum !== void 0 && !Number.isFinite(t.maximum)) return `Condition ${q(t.id)} needs valid number limits.`;
        if (t.minimum !== void 0 && t.maximum !== void 0 && t.minimum > t.maximum) return `Condition ${q(t.id)} has an invalid range.`;
      }
      if (Je.has(t.operator) && !Number.isFinite(t.value)) return `Condition ${q(t.id)} needs a numeric value.`;
      if (Ze.includes(t.operator) && !t.match?.length) return `Condition ${q(t.id)} needs a value.`;
    }
  }
  save() {
    if (this.validationError) return;
    const t = structuredClone(this.draft);
    for (const e of t.rules) e.entity !== void 0 && (e.entity = e.entity.trim());
    et(this, "visibility-save", t);
  }
};
V.styles = T`
    :host{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;font-family:var(--ha-font-family-body,Roboto,sans-serif);background:rgba(0,0,0,.48)}
    ha-card{width:min(760px,100%);max-height:min(880px,calc(100vh - 32px));overflow:auto}header{padding:16px;border-bottom:1px solid var(--divider-color)}
    h2,h3{margin:0;font-weight:500}h2{font-size:20px}h3{font-size:16px}main{display:grid;gap:20px;padding:16px}section{display:grid;gap:10px}
    .section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}p{margin:0;color:var(--secondary-text-color);font-size:13px;line-height:1.45}
    .mode-switch{display:grid;grid-template-columns:1fr 1fr;padding:3px;background:var(--secondary-background-color);border-radius:10px}.mode-switch button{min-height:36px;padding:6px 16px;color:var(--secondary-text-color);font:inherit;background:transparent;border:0;border-radius:8px;cursor:pointer}.mode-switch button.active{color:var(--primary-text-color);font-weight:500;background:var(--card-background-color);box-shadow:0 1px 3px rgba(0,0,0,.18)}
    label{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}select,input{box-sizing:border-box;width:100%;min-height:40px;padding:8px;color:var(--primary-text-color);font:inherit;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}
    select:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.rule-list{display:grid;gap:10px}
    .rule{display:grid;gap:10px;padding:12px;border:1px solid var(--divider-color);border-radius:12px;background:var(--card-background-color)}
    .rule-head{display:grid;grid-template-columns:34px 1fr 40px;gap:8px;align-items:end}.rule-fields{display:grid;grid-template-columns:150px minmax(180px,1fr) minmax(180px,1fr);gap:8px;align-items:end}.range{display:grid;grid-template-columns:1fr 1fr;gap:8px}.entity-source{display:grid;gap:4px}.current-value{min-height:18px;padding:0 4px;color:var(--secondary-text-color);font-size:12px;line-height:18px}.current-value strong{color:var(--primary-text-color);font-weight:500}.current-value.unavailable strong{color:var(--warning-color)}
    .rule-marker{display:grid;place-items:center;align-self:center;width:28px;height:28px;color:#fff;font-size:13px;font-weight:700;border-radius:50%}.rule-reference{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:end}.rule-reference .rule-marker{margin-bottom:6px}
    .icon{display:grid;place-items:center;width:40px;height:40px;padding:0;color:var(--secondary-text-color);background:transparent;border:0;border-radius:50%;cursor:pointer}.icon.danger{color:var(--error-color)}.icon:disabled{opacity:.38;cursor:default}
    .logic{padding:12px;border:1px solid var(--divider-color);border-radius:12px;background:color-mix(in srgb,var(--secondary-background-color) 60%,transparent)}.group{display:grid;gap:8px}.group.nested{margin-left:18px;padding:10px 0 4px 12px;border-left:3px solid var(--primary-color)}
    .group-head{display:flex;align-items:end;gap:8px}.group-head label:first-child{width:170px}.invert{display:flex;align-items:center;gap:7px;min-height:40px;color:var(--primary-text-color);font-size:13px}.invert input{width:18px;min-height:18px}
    .logic-child{display:grid;grid-template-columns:28px minmax(180px,1fr) auto 40px;gap:6px;align-items:center}.logic-index{display:grid;place-items:center;width:24px;height:24px;color:var(--text-primary-color);font-size:12px;font-weight:600;background:var(--primary-color);border-radius:50%}
    .move{display:flex}.move .icon{width:34px;height:34px}.group-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:4px}.error{color:var(--error-color)}
    .actions{display:flex;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--divider-color)}.right{display:flex;gap:8px}
    @media(max-width:700px){.rule-head,.rule-fields{grid-template-columns:1fr}.rule-head .icon{justify-self:end}.logic-child{grid-template-columns:28px minmax(0,1fr) 40px}.move{grid-column:2}.group.nested{margin-left:8px}.actions{align-items:stretch;flex-direction:column}.right{justify-content:flex-end}}
  `;
te([
  m({ attribute: !1 })
], V.prototype, "hass", 2);
te([
  m()
], V.prototype, "targetName", 2);
te([
  m()
], V.prototype, "targetKind", 2);
te([
  m({ attribute: !1 })
], V.prototype, "card", 2);
te([
  m({ attribute: !1 })
], V.prototype, "value", 2);
te([
  v()
], V.prototype, "draft", 2);
te([
  v()
], V.prototype, "advanced", 2);
V = te([
  R("mini-display-visibility-dialog")
], V);
var la = Object.defineProperty, da = Object.getOwnPropertyDescriptor, F = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? da(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && la(e, i, s), s;
};
const ca = (t) => {
  let e = "";
  for (let i = 0; i < t.length; i += 32768)
    e += String.fromCharCode(...t.subarray(i, i + 32768));
  return btoa(e);
}, pa = (t) => {
  let e = 0xcbf29ce484222325n;
  for (const i of t)
    e ^= BigInt(i), e = BigInt.asUintN(64, e * 0x100000001b3n);
  return e.toString(16).padStart(16, "0");
}, ha = async (t, e, i) => {
  const a = await createImageBitmap(t), s = Math.min(
    1,
    e / a.width,
    i / a.height
  ), r = Math.max(1, Math.round(a.width * s)), o = Math.max(1, Math.round(a.height * s)), n = document.createElement("canvas");
  n.width = r, n.height = o;
  const d = n.getContext("2d", { alpha: !1 });
  if (!d) throw new Error("This browser cannot optimize images");
  d.fillStyle = "#000", d.fillRect(0, 0, r, o), d.imageSmoothingEnabled = !0, d.imageSmoothingQuality = "high", d.drawImage(a, 0, 0, r, o), a.close();
  const p = d.getImageData(0, 0, r, o).data, g = new Uint8Array(8 + r * o * 2);
  g.set([77, 68, 73, 49], 0), g[4] = r & 255, g[5] = r >> 8, g[6] = o & 255, g[7] = o >> 8;
  const h = new DataView(g.buffer);
  for (let f = 0, y = 8; f < p.length; f += 4, y += 2) {
    const b = (p[f] & 248) << 8 | (p[f + 1] & 252) << 3 | p[f + 2] >> 3;
    h.setUint16(y, b, !0);
  }
  return {
    id: pa(g),
    name: t.name,
    width: r,
    height: o,
    bytes: g.length,
    data: ca(g),
    preview: n.toDataURL("image/webp", 0.82)
  };
};
let z = class extends D {
  constructor() {
    super(...arguments), this.assets = [], this.displayId = "", this.label = "Image", this.value = "", this.uploadOnly = !1, this.maximumWidth = 240, this.maximumHeight = 240, this.busy = !1, this.error = "", this.upload = async (t) => {
      const e = t.target, i = e.files?.[0];
      if (!(!i || !this.hass || !this.displayId)) {
        this.busy = !0, this.error = "";
        try {
          const a = await ha(
            i,
            Math.max(1, this.maximumWidth),
            Math.max(1, this.maximumHeight)
          );
          await this.hass.callWS({
            type: "mini_display/asset/upload",
            config_entry_id: this.displayId,
            asset_id: a.id,
            name: a.name,
            width: a.width,
            height: a.height,
            data: a.data,
            preview: a.preview
          }), this.dispatchEvent(
            new CustomEvent("asset-uploaded", {
              detail: a,
              bubbles: !0,
              composed: !0
            })
          ), this.uploadOnly || this.select(a.id);
        } catch (a) {
          this.error = a instanceof Error ? a.message : String(a);
        } finally {
          this.busy = !1, e.value = "";
        }
      }
    };
  }
  render() {
    const t = this.assets.find((e) => e.id === this.value);
    return l`<div class="field">
      <span class="label">${this.label}</span>
      <div class="picker">
        ${t?.preview ? l`<img class="thumb" src=${t.preview} alt="" />` : l`<div class="thumb empty"><ha-icon icon="mdi:image-outline"></ha-icon></div>`}
        <div>
          ${this.uploadOnly ? l`<strong>Add a new image</strong><br /><small
                    >Optimized for this display before upload</small
                  >` : l`<select
                    .value=${this.value}
                    ?disabled=${this.busy}
                    @change=${(e) => this.select(e.target.value)}
                  >
                    <option value="">No image</option>
                    ${this.assets.map((e) => l`<option value=${e.id}>${e.name} · ${e.width}×${e.height}</option>`)}</select
                  >${t ? l`<small>${Math.ceil(t.bytes / 1024)} KB on display</small>` : c}`}
        </div>
        <div class="actions">
          ${t && !this.uploadOnly ? l`<button
                  class="detach"
                  title="Detach image"
                  aria-label="Detach image"
                  ?disabled=${this.busy}
                  @click=${() => this.select("")}
                >
                  <ha-icon icon="mdi:image-remove-outline"></ha-icon>
                </button>` : c}
          <label class="upload" title="Upload image"
            ><ha-icon icon=${this.busy ? "mdi:loading" : "mdi:upload"}></ha-icon
            ><input
              type="file"
              accept="image/*"
              ?disabled=${this.busy}
              @change=${this.upload}
          /></label>
        </div>
      </div>
      ${this.error ? l`<div class="error" role="alert">${this.error}</div>` : c}
    </div>`;
  }
  select(t) {
    this.dispatchEvent(
      new CustomEvent("image-changed", {
        detail: t,
        bubbles: !0,
        composed: !0
      })
    );
  }
};
z.styles = T`
    :host {
      display: block;
    }
    .field {
      display: grid;
      gap: 8px;
    }
    .label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .picker {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      min-height: 72px;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
    }
    .thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      background: var(--secondary-background-color);
      border-radius: 7px;
    }
    .empty {
      display: grid;
      place-items: center;
      color: var(--secondary-text-color);
    }
    select {
      width: 100%;
      min-height: 40px;
      padding: 0 10px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .upload {
      position: relative;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      color: var(--primary-color);
      background: var(--secondary-background-color);
      cursor: pointer;
    }
    .actions {
      display: flex;
      gap: 4px;
    }
    .detach {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--secondary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }
    .detach:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }
    .upload input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    .error {
      font-size: 12px;
      color: var(--error-color);
    }
    small {
      color: var(--secondary-text-color);
    }
  `;
F([
  m({ attribute: !1 })
], z.prototype, "hass", 2);
F([
  m({ attribute: !1 })
], z.prototype, "assets", 2);
F([
  m()
], z.prototype, "displayId", 2);
F([
  m()
], z.prototype, "label", 2);
F([
  m()
], z.prototype, "value", 2);
F([
  m({ type: Boolean })
], z.prototype, "uploadOnly", 2);
F([
  m({ type: Number })
], z.prototype, "maximumWidth", 2);
F([
  m({ type: Number })
], z.prototype, "maximumHeight", 2);
F([
  v()
], z.prototype, "busy", 2);
F([
  v()
], z.prototype, "error", 2);
z = F([
  R("mini-display-image-field")
], z);
var ua = Object.defineProperty, ga = Object.getOwnPropertyDescriptor, W = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? ga(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && ua(e, i, s), s;
};
let O = class extends D {
  constructor() {
    super(...arguments), this.assets = [], this.displayId = "", this.displayName = "", this.maximumWidth = 240, this.maximumHeight = 240, this.busy = !1, this.error = "";
  }
  render() {
    return l`
      <ha-card>
        <header>
          <div>
            <h2>Images</h2>
            <p>
              ${this.displayName} · ${this.assets.length}
              ${this.assets.length === 1 ? "image" : "images"}
            </p>
          </div>
        </header>
        <div class="uploader">
          <mini-display-image-field
            .hass=${this.hass}
            .assets=${this.assets}
            .displayId=${this.displayId}
            label="Add image"
            .maximumWidth=${this.maximumWidth}
            .maximumHeight=${this.maximumHeight}
            .uploadOnly=${!0}
            @asset-uploaded=${(t) => this.dispatchEvent(
      new CustomEvent("asset-uploaded", {
        detail: t.detail,
        bubbles: !0,
        composed: !0
      })
    )}
          ></mini-display-image-field>
        </div>
        ${this.error ? l`<div class="error" role="alert">${this.error}</div>` : c}
        ${this.assets.length ? l`<div class="grid">
                ${this.assets.map((t) => this.renderAsset(t))}
              </div>` : l`<div class="empty">
                <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
                <h2>No images</h2>
                <p>Add an image here or directly from an image field.</p>
              </div>`}
      </ha-card>
      ${this.pendingDelete ? l`<div
              class="backdrop"
              @click=${() => this.pendingDelete = void 0}
            >
              <ha-card
                class="dialog"
                role="dialog"
                aria-modal="true"
                @click=${(t) => t.stopPropagation()}
              >
                <h2>Delete image?</h2>
                <p>
                  <strong>${this.pendingDelete.name}</strong> will be removed
                  from Home Assistant and the display.
                </p>
                <div class="dialog-actions">
                  <ha-button @click=${() => this.pendingDelete = void 0}
                    >Cancel</ha-button
                  >
                  <ha-button
                    class="danger"
                    @click=${() => {
      this.deletePending();
    }}
                    >Delete</ha-button
                  >
                </div>
              </ha-card>
            </div>` : c}
    `;
  }
  renderAsset(t) {
    const e = t.used_by ?? [];
    return l`<article class="asset">
      <div class="preview">
        ${t.preview ? l`<img src=${t.preview} alt=${t.name} />` : l`<ha-icon icon="mdi:image-outline"></ha-icon>`}
      </div>
      <div class="details">
        <div>
          <div class="name" title=${t.name}>${t.name}</div>
          <div class="meta">
            ${t.width}×${t.height} · ${Math.ceil(t.bytes / 1024)} KB
          </div>
          <div class="meta ${e.length ? "used" : ""}">
            ${e.length ? `Used in ${e.join(", ")}` : "Not used"}
          </div>
        </div>
        <button
          title=${e.length ? "Detach this image before deleting it" : "Delete image"}
          aria-label="Delete image"
          ?disabled=${e.length > 0 || this.busy}
          @click=${() => this.pendingDelete = t}
        >
          <ha-icon icon="mdi:delete-outline"></ha-icon>
        </button>
      </div>
    </article>`;
  }
  async deletePending() {
    const t = this.pendingDelete;
    if (!(!t || !this.hass || !this.displayId)) {
      this.busy = !0, this.error = "";
      try {
        await this.hass.callWS({
          type: "mini_display/asset/delete",
          config_entry_id: this.displayId,
          asset_id: t.id
        }), this.dispatchEvent(
          new CustomEvent("asset-deleted", {
            detail: t.id,
            bubbles: !0,
            composed: !0
          })
        ), this.pendingDelete = void 0;
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
      } finally {
        this.busy = !1;
      }
    }
  }
};
O.styles = T`
    :host {
      display: block;
      min-width: 0;
      font-family: var(--ha-font-family-body, Roboto, sans-serif);
    }
    * {
      box-sizing: border-box;
    }
    ha-card {
      min-height: 360px;
      overflow: hidden;
      border: 1px solid var(--divider-color);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 64px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    h2,
    p {
      margin: 0;
    }
    h2 {
      font-size: 18px;
      font-weight: 500;
    }
    header p,
    .meta,
    .empty p {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .uploader {
      padding: 16px 16px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 16px;
      padding: 16px;
    }
    .asset {
      overflow: hidden;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }
    .preview {
      display: grid;
      place-items: center;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background:
        linear-gradient(
          45deg,
          var(--secondary-background-color) 25%,
          transparent 25%
        ),
        linear-gradient(
          -45deg,
          var(--secondary-background-color) 25%,
          transparent 25%
        ),
        linear-gradient(
          45deg,
          transparent 75%,
          var(--secondary-background-color) 75%
        ),
        linear-gradient(
          -45deg,
          transparent 75%,
          var(--secondary-background-color) 75%
        );
      background-size: 16px 16px;
      background-position:
        0 0,
        0 8px,
        8px -8px,
        -8px 0;
    }
    .preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .details {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 40px;
      gap: 8px;
      align-items: center;
      padding: 10px 10px 10px 12px;
    }
    .name {
      overflow: hidden;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      margin-top: 3px;
    }
    .used {
      color: var(--primary-color);
    }
    button {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--error-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: var(--secondary-background-color);
    }
    button:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .empty {
      display: grid;
      justify-items: center;
      gap: 10px;
      padding: 72px 24px;
      text-align: center;
    }
    .empty ha-icon {
      width: 54px;
      height: 54px;
      color: var(--secondary-text-color);
    }
    .error {
      margin: 16px 16px 0;
      padding: 12px;
      color: var(--error-color);
      background: color-mix(in srgb, var(--error-color), transparent 90%);
      border-radius: 10px;
    }
    .backdrop {
      position: fixed;
      z-index: 1000;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgb(0 0 0 / 55%);
    }
    .dialog {
      width: min(420px, 100%);
      min-height: 0;
      padding: 20px;
    }
    .dialog h2 {
      margin-bottom: 10px;
    }
    .dialog p {
      color: var(--secondary-text-color);
      line-height: 1.45;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
    .dialog-actions ha-button.danger {
      --mdc-theme-primary: var(--error-color);
    }
  `;
W([
  m({ attribute: !1 })
], O.prototype, "hass", 2);
W([
  m({ attribute: !1 })
], O.prototype, "assets", 2);
W([
  m()
], O.prototype, "displayId", 2);
W([
  m()
], O.prototype, "displayName", 2);
W([
  m({ type: Number })
], O.prototype, "maximumWidth", 2);
W([
  m({ type: Number })
], O.prototype, "maximumHeight", 2);
W([
  v()
], O.prototype, "busy", 2);
W([
  v()
], O.prototype, "error", 2);
W([
  v()
], O.prototype, "pendingDelete", 2);
O = W([
  R("mini-display-image-manager")
], O);
var ma = Object.defineProperty, fa = Object.getOwnPropertyDescriptor, lt = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? fa(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && ma(e, i, s), s;
};
let Ce = class extends D {
  patchGraph(t) {
    this.dispatchEvent(new CustomEvent("graph-changed", { detail: { ...this.card.graph, ...t }, bubbles: !0, composed: !0 }));
  }
  numeric(t, e, i, a, s) {
    return l`<label>${t}<input type="number" min=${a} max=${s} .value=${i === void 0 ? "" : String(i)} placeholder="Auto" @change=${(r) => {
      const o = r.target.value;
      this.patchGraph({ [e]: o === "" ? void 0 : Math.min(s, Math.max(a, Number(o))) });
    }}></label>`;
  }
  select(t, e, i, a) {
    return l`<label>${t}<select @change=${(s) => this.patchGraph({ [e]: s.target.value })}>${a.map(([s, r]) => l`<option value=${s} .selected=${i === s}>${r}</option>`)}</select></label>`;
  }
  render() {
    const t = this.card.graph;
    return l`
      ${this.card.type !== "chart" ? l`<label class="check"><input type="checkbox" .checked=${!!t} @change=${(e) => this.dispatchEvent(new CustomEvent("graph-changed", { detail: e.target.checked ? Kt() : void 0, bubbles: !0, composed: !0 }))}>Background chart</label>` : c}
      ${t ? l`
        ${this.card.type === "number" || this.card.type === "chart" ? l`<label class="check"><input type="checkbox" .checked=${!t.source} @change=${(e) => this.patchGraph({ source: e.target.checked ? void 0 : this.card.source || "" })}>Use this card’s entity</label>` : c}
        <ha-form .hass=${this.hass} .data=${{ entity: t.source ?? this.card.source ?? "" }}
          .schema=${[{ name: "entity", selector: { entity: { domain: ["sensor", "number", "input_number", "counter"] } } }]}
          .computeLabel=${() => "Chart entity"} @value-changed=${(e) => this.patchGraph({ source: e.detail.value.entity })}></ha-form>
        <div class="grid">
          ${this.select("Chart", "type", t.type ?? "bar", [["bar", "Columns"], ["line", "Line"]])}
          ${this.select("Aggregation", "aggregation", t.aggregation ?? "mean", [["mean", "Average"], ["min", "Minimum"], ["max", "Maximum"], ["last", "Last value"]])}
          ${this.numeric("Points", "points", t.points ?? 48, 2, 120)}
          ${this.numeric("Bucket (seconds)", "intervalSeconds", t.intervalSeconds ?? 300, 30, 86400)}
          <mini-display-color-field label="Color" .value=${t.color ?? "accent"} @color-changed=${(e) => this.patchGraph({ color: e.detail || "accent" })}></mini-display-color-field>
          ${this.numeric("Opacity (%)", "opacity", t.opacity ?? 50, 0, 100)}
        </div>
        <label class="check"><input type="checkbox" .checked=${t.showValues ?? !1} @change=${(e) => this.patchGraph({ showValues: e.target.checked })}>Show values</label>
        ${t.showValues ? l`<div class="grid">${this.numeric("Label every N points", "labelEvery", t.labelEvery ?? 6, 1, 120)}${this.numeric("Decimal places", "decimals", t.decimals ?? 1, 0, 3)}</div>` : c}
        <details><summary>Scale</summary><div class="grid">${this.numeric("Minimum", "minimum", t.minimum, -1e12, 1e12)}${this.numeric("Maximum", "maximum", t.maximum, -1e12, 1e12)}</div></details>
      ` : c}`;
  }
};
Ce.styles = T`
    :host { display:block; color:var(--primary-text-color); font:inherit; }
    * { box-sizing:border-box; } .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:12px; }
    label { display:grid; gap:6px; font-size:14px; } label.check { display:flex; align-items:center; }
    input,select { width:100%; min-height:40px; border:1px solid var(--divider-color); border-radius:8px; padding:8px; font:inherit; color:inherit; background:var(--card-background-color); }
    input[type=checkbox] { width:auto; min-height:0; } input:focus,select:focus { outline:2px solid var(--primary-color); }
    ha-form { display:block; margin-top:12px; } details { margin-top:12px; } summary { cursor:pointer; }
    @media(max-width:450px) { .grid { grid-template-columns:1fr; } }
  `;
lt([
  m({ attribute: !1 })
], Ce.prototype, "card", 2);
lt([
  m({ attribute: !1 })
], Ce.prototype, "hass", 2);
Ce = lt([
  R("mini-display-graph-editor")
], Ce);
var va = Object.defineProperty, ya = Object.getOwnPropertyDescriptor, Qt = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? ya(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && va(e, i, s), s;
};
let Fe = class extends D {
  constructor() {
    super(...arguments), this.settings = {};
  }
  patch(t) {
    this.dispatchEvent(
      new CustomEvent("weather-changed", {
        detail: { ...this.settings, ...t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  choice(t, e, i, a) {
    return l`<label
      >${t}<select
        aria-label=${t}
        @change=${(s) => this.patch({ [e]: s.target.value })}
      >
        ${i.map(([s, r]) => l`<option value=${s} ?selected=${(this.settings[e] ?? a) === s}>${r}</option>`)}
      </select></label
    >`;
  }
  number(t, e, i, a, s) {
    return l`<label
      >${t}<input
        type="number"
        min=${a}
        max=${s}
        step="1"
        .value=${String(this.settings[e] ?? i)}
        @change=${(r) => {
      const o = r.target;
      o.reportValidity() && this.patch({ [e]: Number(o.value) });
    }}
    /></label>`;
  }
  render() {
    const t = this.settings, e = t.fields ?? ["icon", "condition", "temperature"];
    return l`<div class="grid">
        <label
          >Weather data<select
            aria-label="Weather data"
            @change=${(i) => {
      const a = i.target.value;
      this.patch({
        period: a,
        ...a === "current" ? { offset: 0, count: 1 } : {}
      });
    }}
          >
            ${[
      ["current", "Current weather"],
      ["daily", "Daily forecast"],
      ["hourly", "Hourly forecast"],
      ["twice_daily", "Day / night forecast"]
    ].map(
      ([i, a]) => l`<option
                  value=${i}
                  ?selected=${(t.period ?? "current") === i}
                >
                  ${a}
                </option>`
    )}
          </select></label
        >
        ${this.choice(
      "Arrangement",
      "layout",
      [
        ["vertical", "Icon above text"],
        ["horizontal", "Icon beside text"],
        ["compact", "Compact"]
      ],
      "vertical"
    )}
        ${(t.period ?? "current") !== "current" ? l` ${this.number(t.period === "daily" ? "Start day (0 today, 1 tomorrow)" : t.period === "hourly" ? "Hour offset (0 first available)" : "Period offset (0 current)", "offset", 0, 0, 14)}
            ${this.number("Number of forecasts", "count", 1, 1, 5)}
            ${this.number(t.period === "hourly" ? "Step (hours)" : "Step", "step", 1, 1, 24)}` : c}
        ${this.choice(
      "Icons",
      "iconStyle",
      [
        ["color", "Weather colors"],
        ["mono", "Use text color"]
      ],
      "color"
    )}
        ${this.choice(
      "Descriptions",
      "language",
      [
        ["en", "English"],
        ["pl", "Polski"]
      ],
      "en"
    )}
      </div>
      <div class="presets" aria-label="Weather presets">
        <button @click=${() => this.patch({ fields: ["icon"] })}>
          Icon only
        </button>
        <button
          @click=${() => this.patch({ fields: ["condition", "temperature"] })}
        >
          Text only
        </button>
        <button @click=${() => this.patch({ fields: ["icon", "temperature"] })}>
          Icon + temperature
        </button>
        <button
          @click=${() => this.patch({ fields: ["label", "icon", "condition", "temperature", "low"] })}
        >
          Forecast
        </button>
      </div>
      <div class="fields">
        ${[
      ["icon", "Icon"],
      ["condition", "Description"],
      ["temperature", "Temperature / high"],
      ["low", "Low temperature"],
      ["label", "Time / date"],
      ["humidity", "Humidity"],
      ["precipitation", "Rain probability"],
      ["wind", "Wind speed"]
    ].map(
      ([i, a]) => l`<label>
          <input
            type="checkbox"
            .checked=${e.includes(i)}
            @change=${(s) => {
        const o = s.target.checked ? [...e, i] : e.filter((n) => n !== i);
        o.length ? this.patch({ fields: o }) : s.target.checked = !0;
      }}
          />${a}</label
        >`
    )}
      </div>`;
  }
};
Fe.styles = T`
    :host {
      display: block;
      font: inherit;
      color: var(--primary-text-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    select,
    input {
      font: inherit;
      color: inherit;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 10px;
      min-width: 0;
    }
    .fields {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 16px 0;
    }
    .fields label {
      flex-direction: row;
      align-items: center;
    }
    .presets {
      display: flex;
      gap: 8px;
      margin: 16px 0;
      flex-wrap: wrap;
    }
    button {
      font: inherit;
      color: var(--primary-color);
      background: transparent;
      border: 1px solid var(--divider-color);
      padding: 8px 12px;
      border-radius: 18px;
      cursor: pointer;
    }
    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--primary-color);
    }
  `;
Qt([
  m({ attribute: !1 })
], Fe.prototype, "settings", 2);
Fe = Qt([
  R("mini-display-weather-editor")
], Fe);
var ba = Object.defineProperty, xa = Object.getOwnPropertyDescriptor, w = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? xa(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && ba(e, i, s), s;
};
let x = class extends D {
  constructor() {
    super(...arguments), this.displays = [], this.scenes = [], this.dashboards = {}, this.assets = {}, this.savedDashboards = {}, this.selectedDisplayId = "", this.selectedSceneId = "", this.section = "scenes", this.pageIndex = 0, this.cardSection = "content", this.previewPages = {}, this.syncState = "idle", this.syncMessage = "", this.loaded = !1, this.sceneForm = null, this.sceneName = "", this.dirtyDisplays = /* @__PURE__ */ new Set(), this.previewsStarted = /* @__PURE__ */ new Set(), this.allowNavigation = !1, this.closeActionMenusOnOutsideClick = (t) => {
      const e = t.composedPath();
      this.renderRoot.querySelectorAll("details.menu[open]").forEach((i) => {
        e.includes(i) || (i.open = !1);
      });
    }, this.beforeUnload = (t) => {
      this.stopPanelPreviews(), !(!this.dirtyDisplays.size || this.allowNavigation) && (t.preventDefault(), t.returnValue = "");
    }, this.interceptNavigation = (t) => {
      if (!this.dirtyDisplays.size || this.allowNavigation || t.defaultPrevented || t.button !== 0)
        return;
      const e = t.composedPath().find(
        (a) => a instanceof HTMLAnchorElement
      );
      if (!e?.href || e.target === "_blank" || e.hasAttribute("download"))
        return;
      const i = new URL(e.href, window.location.href);
      i.pathname === window.location.pathname && i.search === window.location.search && i.hash === window.location.hash || (t.preventDefault(), t.stopImmediatePropagation(), this.confirmation = { kind: "leave", href: i.href });
    };
  }
  updated(t) {
    t.has("hass") && !this.loaded && this.load();
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("beforeunload", this.beforeUnload), window.addEventListener("click", this.interceptNavigation, !0), window.addEventListener(
      "pointerdown",
      this.closeActionMenusOnOutsideClick,
      !0
    );
  }
  disconnectedCallback() {
    this.stopPanelPreviews(), window.removeEventListener("beforeunload", this.beforeUnload), window.removeEventListener("click", this.interceptNavigation, !0), window.removeEventListener(
      "pointerdown",
      this.closeActionMenusOnOutsideClick,
      !0
    ), super.disconnectedCallback();
  }
  actionMenuToggled(t) {
    const e = t.currentTarget;
    e.open && this.renderRoot.querySelectorAll("details.menu[open]").forEach((i) => {
      i !== e && (i.open = !1);
    });
  }
  closeActionMenu(t) {
    const e = t.composedPath().find(
      (a) => a instanceof HTMLButtonElement
    );
    if (!e || e.disabled) return;
    const i = t.currentTarget.closest("details");
    i && (i.open = !1);
  }
  actionMenuKeydown(t) {
    if (t.key !== "Escape") return;
    const e = t.currentTarget.closest("details");
    e && (e.open = !1, e.querySelector("summary")?.focus(), t.preventDefault(), t.stopPropagation());
  }
  stopPanelPreviews() {
    if (!this.hass) return;
    const t = new Set(this.previewsStarted);
    for (const e of this.displays)
      e.preview_scene_id && t.add(e.config_entry_id);
    for (const e of t)
      this.hass.callWS({
        type: "mini_display/scene/preview/stop",
        config_entry_id: e
      });
    this.previewsStarted.clear();
  }
  get selectedDisplay() {
    return this.displays.find(
      (t) => t.config_entry_id === this.selectedDisplayId
    );
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
      e[i] && (this.syncMessage = `Retrying save (${i + 1}/${e.length})`, await new Promise(
        (a) => window.setTimeout(a, e[i])
      ));
      try {
        await this.hass.callWS(t);
        return;
      } catch (a) {
        if (i === e.length - 1 || !this.retryableSaveError(a))
          throw a;
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
        this.displays = e, this.scenes = i, e.some(
          (r) => r.config_entry_id === this.selectedDisplayId
        ) || (this.selectedDisplayId = e[0]?.config_entry_id ?? "");
        const a = this.selectedDisplay?.active_scene_id ?? i[0]?.id ?? "", s = t ?? this.selectedSceneId;
        this.selectedSceneId = i.some((r) => r.id === s) ? s : a, await Promise.all([this.loadSceneDashboards(), this.loadAssets()]), this.syncState = "idle", this.syncMessage = "";
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
    }
  }
  async loadAssets() {
    if (!this.hass) return;
    const t = await Promise.all(
      this.displays.map(
        async (e) => [
          e.config_entry_id,
          await this.hass.callWS({
            type: "mini_display/assets",
            config_entry_id: e.config_entry_id,
            include_data: !1
          })
        ]
      )
    );
    this.assets = Object.fromEntries(t);
  }
  imageField(t, e, i) {
    return l`<mini-display-image-field
      .hass=${this.hass}
      .assets=${this.assets[this.selectedDisplayId] ?? []}
      .displayId=${this.selectedDisplayId}
      .label=${t}
      .value=${e ?? ""}
      .maximumWidth=${this.selectedDisplay?.width ?? 240}
      .maximumHeight=${this.selectedDisplay?.height ?? 240}
      @image-changed=${(a) => i(a.detail)}
      @asset-uploaded=${(a) => {
      const s = this.assets[this.selectedDisplayId] ?? [];
      this.assets = {
        ...this.assets,
        [this.selectedDisplayId]: [
          ...s.filter((r) => r.id !== a.detail.id),
          a.detail
        ]
      };
    }}
    ></mini-display-image-field>`;
  }
  async loadSceneDashboards() {
    if (!this.hass || !this.selectedSceneId) {
      this.dashboards = {};
      return;
    }
    const t = await Promise.all(
      this.displays.map(async (e) => {
        const i = await this.hass.callWS({
          type: "mini_display/dashboard/get",
          config_entry_id: e.config_entry_id,
          scene_id: this.selectedSceneId
        });
        return [e.config_entry_id, i];
      })
    );
    this.dashboards = Object.fromEntries(t), this.savedDashboards = structuredClone(this.dashboards), this.dirtyDisplays = /* @__PURE__ */ new Set(), this.previewPages = Object.fromEntries(
      this.displays.map((e) => [e.config_entry_id, 0])
    ), this.pageIndex = 0, this.selected = { row: 0, card: 0 };
  }
  async selectScene(t) {
    this.section = "scenes", t !== this.selectedSceneId && (this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and switch scene?") || (this.stopPanelPreviews(), this.displays = this.displays.map((e) => ({
      ...e,
      preview_scene_id: null
    })), this.selectedSceneId = t, this.syncState = "idle", this.syncMessage = "", await this.loadSceneDashboards()));
  }
  selectDisplay(t) {
    this.selectedDisplayId = t, this.pageIndex = this.previewPages[t] ?? 0, this.selected = { row: 0, card: 0 };
  }
  changed() {
    this.changedDisplay(this.selectedDisplayId);
  }
  changedDisplay(t) {
    const e = this.dashboards[t];
    e && (this.stopPreviewFor(t), this.dashboards = {
      ...this.dashboards,
      [t]: structuredClone(e)
    }, this.dirtyDisplays = new Set(this.dirtyDisplays).add(t), this.syncState = "idle", this.syncMessage = "Unsaved changes");
  }
  async save() {
    if (!(!this.hass || !this.dashboard || !this.selectedDisplayId || !this.selectedSceneId))
      try {
        this.syncState = "syncing", this.syncMessage = "Saving", await this.saveDashboardWithRetry({
          type: "mini_display/dashboard/set",
          config_entry_id: this.selectedDisplayId,
          scene_id: this.selectedSceneId,
          dashboard: this.dashboard
        }), this.savedDashboards = {
          ...this.savedDashboards,
          [this.selectedDisplayId]: structuredClone(this.dashboard)
        };
        const t = new Set(this.dirtyDisplays);
        t.delete(this.selectedDisplayId), this.dirtyDisplays = t, this.syncState = "success", this.syncMessage = "Saved";
      } catch (t) {
        this.syncState = "error", this.syncMessage = this.errorMessage(t);
      }
  }
  async showPage(t) {
    await this.stopPreviewFor(this.selectedDisplayId), this.pageIndex = t, this.previewPages = {
      ...this.previewPages,
      [this.selectedDisplayId]: t
    }, this.selected = { row: 0, card: 0 };
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
    const e = this.displays.find(
      (i) => i.config_entry_id === t
    );
    if (!(!this.hass || !e?.preview_scene_id))
      try {
        await this.hass.callWS({
          type: "mini_display/scene/preview/stop",
          config_entry_id: t
        }), this.previewsStarted.delete(t), this.displays = this.displays.map(
          (i) => i.config_entry_id === t ? { ...i, preview_scene_id: null } : i
        );
      } catch (i) {
        this.syncState = "error", this.syncMessage = this.errorMessage(i);
      }
  }
  async activateScene(t) {
    if (this.hass)
      try {
        await this.hass.callWS({
          type: "mini_display/scene/activate",
          config_entry_id: t.config_entry_id,
          scene_id: this.selectedSceneId
        }), this.previewsStarted.delete(t.config_entry_id), this.displays = this.displays.map(
          (e) => e.config_entry_id === t.config_entry_id ? {
            ...e,
            active_scene_id: this.selectedSceneId,
            active_scene_name: this.selectedScene?.name ?? null,
            preview_scene_id: null
          } : e
        ), this.syncState = "success", this.syncMessage = "Scene activated";
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
  }
  async togglePreview(t) {
    if (!this.hass) return;
    const e = t.preview_scene_id === this.selectedSceneId;
    try {
      if (e)
        await this.hass.callWS({
          type: "mini_display/scene/preview/stop",
          config_entry_id: t.config_entry_id
        }), this.previewsStarted.delete(t.config_entry_id);
      else {
        const i = this.dashboards[t.config_entry_id], a = this.previewPages[t.config_entry_id] ?? 0;
        await this.hass.callWS({
          type: "mini_display/scene/preview/start",
          config_entry_id: t.config_entry_id,
          scene_id: this.selectedSceneId,
          page_id: i?.pages[a]?.id,
          dashboard: i
        }), this.previewsStarted.add(t.config_entry_id);
      }
      this.displays = this.displays.map(
        (i) => i.config_entry_id === t.config_entry_id ? {
          ...i,
          preview_scene_id: e ? null : this.selectedSceneId
        } : i
      ), this.syncState = "success", this.syncMessage = e ? "Preview stopped" : "Preview shown for 5 minutes";
    } catch (i) {
      this.syncState = "error", this.syncMessage = this.errorMessage(i);
    }
  }
  async createScene() {
    if (!this.hass || this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and create a scene?"))
      return;
    const t = new Set(
      this.scenes.map((a) => a.name.toLocaleLowerCase())
    );
    let e = "New scene", i = 1;
    for (; t.has(e.toLocaleLowerCase()); )
      e = `New scene (${i++})`;
    try {
      this.section = "scenes";
      const a = await this.hass.callWS({
        type: "mini_display/scene/create",
        name: e
      });
      await this.load(a.id), this.syncState = "success", this.syncMessage = "Scene created";
    } catch (a) {
      this.syncState = "error", this.syncMessage = this.errorMessage(a);
    }
  }
  openRenameScene() {
    this.sceneForm = "rename", this.sceneName = this.selectedScene?.name ?? "";
  }
  async saveSceneForm() {
    const t = this.sceneName.trim();
    if (!(!this.hass || !t))
      try {
        this.sceneForm === "rename" && this.selectedSceneId && (await this.hass.callWS({
          type: "mini_display/scene/rename",
          scene_id: this.selectedSceneId,
          name: t
        }), this.sceneForm = null, await this.load(this.selectedSceneId));
      } catch (e) {
        this.syncState = "error", this.syncMessage = this.errorMessage(e);
      }
  }
  async deleteScene() {
    if (!(!this.hass || this.selectedScene?.is_default || !window.confirm(`Delete scene "${this.selectedScene?.name}"?`)))
      try {
        await this.hass.callWS({
          type: "mini_display/scene/delete",
          scene_id: this.selectedSceneId
        }), await this.load(this.scenes.find((t) => t.is_default)?.id);
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
      [this.selectedDisplayId]: Ri()
    }, this.pageIndex = 0, this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: 0 }, this.selected = { row: 0, card: 0 }, this.dirtyDisplays = new Set(this.dirtyDisplays).add(
      this.selectedDisplayId
    ), this.syncState = "idle", this.syncMessage = "Unsaved changes");
  }
  deletePage() {
    if (!this.dashboard || this.dashboard.pages.length <= 1) return;
    const t = this.dashboard.pages[this.pageIndex];
    window.confirm(`Delete page "${t.title || t.id}"?`) && (this.dashboard.pages.splice(this.pageIndex, 1), this.pageIndex = Math.min(this.pageIndex, this.dashboard.pages.length - 1), this.previewPages = {
      ...this.previewPages,
      [this.selectedDisplayId]: this.pageIndex
    }, this.selected = { row: 0, card: 0 }, this.changed());
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
    e && (e.visibility = t, this.visibilityTarget = void 0, this.changed());
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
      if (!i || i.rows.length <= 1 || !i.rows[t.row])
        return;
      i.rows.splice(t.row, 1), this.selected = void 0, this.changed();
      return;
    }
    this.allowNavigation = !0, this.stopPanelPreviews();
    const e = new URL(t.href);
    e.origin === window.location.origin ? (history.pushState(
      null,
      "",
      `${e.pathname}${e.search}${e.hash}`
    ), window.dispatchEvent(new Event("location-changed"))) : window.location.assign(e.href);
  }
  async previewPage(t, e) {
    await this.stopPreviewFor(t);
    const i = this.dashboards[t];
    if (!i) return;
    const s = ((this.previewPages[t] ?? 0) + e + i.pages.length) % i.pages.length;
    this.previewPages = { ...this.previewPages, [t]: s }, t === this.selectedDisplayId && (this.pageIndex = s, this.selected = { row: 0, card: 0 });
  }
  async openFromPreview(t) {
    this.selectedDisplayId = t.displayId, this.pageIndex = t.page, this.previewPages = {
      ...this.previewPages,
      [t.displayId]: t.page
    }, this.selected = t.row !== void 0 && t.card !== void 0 ? { row: t.row, card: t.card } : void 0, await this.updateComplete;
    let e = null;
    if (t.kind === "page-title") {
      const i = this.shadowRoot?.querySelector(".page-settings");
      i && (i.open = !0);
      const a = this.shadowRoot?.querySelector(".page-appearance");
      a && (a.open = !0), e = a ?? i ?? null;
    } else if (t.row !== void 0 && (e = this.shadowRoot?.querySelectorAll(".row-panel")[t.row] ?? null, t.card !== void 0)) {
      const i = e?.querySelector(".card-settings") ?? null;
      if (t.kind === "title" || t.kind === "value") {
        const a = i?.querySelector(".style");
        a && (a.open = !0), e = a ?? i ?? e;
      } else
        e = i ?? e;
    }
    e?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  updateFromPreview(t) {
    const e = this.dashboards[t.displayId]?.pages[t.page];
    if (e) {
      if (t.kind === "page-title" && t.position)
        e.titlePosition = t.position;
      else if (t.row !== void 0 && t.card !== void 0 && t.horizontalAlign && t.verticalAlign) {
        const i = e.rows[t.row]?.cards[t.card];
        if (!i) return;
        const a = t.kind === "title" ? "titleStyle" : "valueStyle";
        i[a] = {
          ...i[a] ?? {},
          horizontalAlign: t.horizontalAlign,
          verticalAlign: t.verticalAlign
        };
      }
      this.changedDisplay(t.displayId);
    }
  }
  field(t, e, i, a = "text") {
    return l`<label class="field"
      >${t}<input
        type=${a}
        .value=${String(e ?? "")}
        @input=${(s) => i(s.target.value)}
    /></label>`;
  }
  select(t, e, i, a) {
    return l`<label class="field"
      >${t}<select
        @change=${(s) => a(s.target.value)}
      >
        ${i.map((s) => l`<option value=${s} ?selected=${s === e}>${s}</option>`)}
      </select></label
    >`;
  }
  numberField(t, e, i, a, s, r) {
    return l`<label class="field"
      >${t}<input
        type="number"
        min=${a}
        max=${s}
        step="1"
        .value=${String(e ?? i)}
        @change=${(o) => {
      const n = o.target, d = Number(n.value), p = Math.max(
        a,
        Math.min(s, Number.isFinite(d) ? d : i)
      );
      n.value = String(p), r(p);
    }}
    /></label>`;
  }
  fontSelect(t, e, i) {
    const a = this.selectedDisplay, s = e === "font1" || e === "font2" ? e : "default", r = new Map(
      (a?.fonts ?? []).map((p) => [p.id, p])
    ), o = a?.default_font, d = [
      { value: "default", label: `Default · ${o && o !== "builtin" && r.get(o)?.installed ? r.get(o)?.name || (o === "font1" ? "Font 1" : "Font 2") : "Inter Tight Bold"}` },
      ...["font1", "font2"].map((p, g) => {
        const h = r.get(p);
        return {
          value: p,
          label: `Font ${g + 1} · ${h?.installed ? h.name || "Installed" : "Empty"}`
        };
      })
    ];
    return l`<label class="field"
      >${t}<select
        @change=${(p) => i(
      p.target.value
    )}
      >
        ${d.map(
      (p) => l`<option
              value=${p.value}
              ?selected=${p.value === s}
            >
              ${p.label}
            </option>`
    )}
      </select></label
    >`;
  }
  checkbox(t, e, i, a = !1, s = "") {
    return l`<label class="check" title=${s}
      ><input
        type="checkbox"
        .checked=${e}
        ?disabled=${a}
        @change=${(r) => i(r.target.checked)}
      />${t}</label
    >`;
  }
  segmented(t, e, i, a) {
    return l`<div class="segmented-field">
      <span>${t}</span>
      <div class="segmented" role="radiogroup" aria-label=${t}>
        ${i.map((s) => l`<button class="segment ${s.value === e ? "active" : ""}" role="radio" aria-checked=${s.value === e} title=${s.label} @click=${() => a(s.value)}>${s.icon ? l`<ha-icon icon=${s.icon}></ha-icon>` : c}<span>${s.label}</span></button>`)}
      </div>
    </div>`;
  }
  textPosition(t, e, i = "center", a = "middle") {
    const s = e.horizontalAlign ?? i, r = e.verticalAlign ?? a, o = [
      { horizontal: "left", vertical: "top", label: "Top left" },
      { horizontal: "center", vertical: "top", label: "Top center" },
      { horizontal: "right", vertical: "top", label: "Top right" },
      { horizontal: "left", vertical: "middle", label: "Middle left" },
      { horizontal: "center", vertical: "middle", label: "Center" },
      { horizontal: "right", vertical: "middle", label: "Middle right" },
      { horizontal: "left", vertical: "bottom", label: "Bottom left" },
      { horizontal: "center", vertical: "bottom", label: "Bottom center" },
      { horizontal: "right", vertical: "bottom", label: "Bottom right" }
    ], n = o.find(
      (d) => d.horizontal === s && d.vertical === r
    );
    return l`<details class="position-field">
      <summary>${t} · ${n.label}</summary>
      <div class="position-grid" role="radiogroup" aria-label=${t}>
        ${o.map((d) => {
      const p = d.horizontal === s && d.vertical === r;
      return l`<button
            class="position-button ${p ? "active" : ""}"
            role="radio"
            aria-checked=${p}
            aria-label=${d.label}
            title=${d.label}
            @click=${() => {
        e.horizontalAlign = d.horizontal, e.verticalAlign = d.vertical, this.changed();
      }}
          >
            <span class="position-dot"></span>
          </button>`;
    })}
      </div>
    </details>`;
  }
  textEffectEditor(t, e) {
    const i = e.textEffect ?? "none";
    return l`<details class="position-field effect-field">
      <summary>${t} · ${i === "shadow" ? "Shadow" : i === "outline" ? "Outline" : "None"}</summary>
      <div class="grid effect-grid">
        ${this.select(
      "Effect",
      i,
      ["none", "shadow", "outline"],
      (s) => {
        e.textEffect = s, this.changed();
      }
    )}
        ${i !== "none" ? l`<mini-display-color-field
                  label="Effect color"
                  .value=${e.effectColor ?? "background"}
                  @color-changed=${(s) => {
      e.effectColor = s.detail || "background", this.changed();
    }}
                ></mini-display-color-field>
                ${this.numberField(
      "Thickness",
      e.effectThickness,
      1,
      1,
      3,
      (s) => {
        e.effectThickness = s, this.changed();
      }
    )}
                ${i === "shadow" ? l`${this.numberField(
      "Horizontal offset",
      e.effectOffsetX,
      2,
      -6,
      6,
      (s) => {
        e.effectOffsetX = s, this.changed();
      }
    )}${this.numberField(
      "Vertical offset",
      e.effectOffsetY,
      2,
      -6,
      6,
      (s) => {
        e.effectOffsetY = s, this.changed();
      }
    )}` : c}` : c}
      </div>
    </details>`;
  }
  entity(t) {
    const e = {
      weather: ["weather"],
      number: ["sensor", "number", "input_number", "counter"],
      chart: ["sensor", "number", "input_number", "counter"],
      status: [
        "binary_sensor",
        "switch",
        "input_boolean",
        "lock",
        "cover",
        "person",
        "device_tracker"
      ],
      text: ["sensor", "text", "input_text", "select", "input_select"],
      clock: [],
      image: []
    };
    return l`<ha-form
      .hass=${this.hass}
      .data=${{ entity: t.source ?? "" }}
      .schema=${[{ name: "entity", required: t.type !== "text", selector: { entity: { domain: e[t.type] } } }]}
      .computeLabel=${() => t.type === "number" ? "Numeric entity" : t.type === "status" ? "State entity" : "Text entity (optional)"}
      @value-changed=${(i) => {
      t.source = i.detail.value.entity, this.changed();
    }}
    ></ha-form>`;
  }
  menu(t) {
    return l`<details
      class="menu"
      @toggle=${this.actionMenuToggled}
      @keydown=${this.actionMenuKeydown}
    >
      <summary aria-label="More actions" aria-haspopup="menu">
        <ha-icon icon="mdi:dots-vertical"></ha-icon>
      </summary>
      <div class="menu-popover" role="menu" @click=${this.closeActionMenu}>
        ${t}
      </div>
    </details>`;
  }
  appearanceEditor(t) {
    const e = this.dashboard?.pages[this.pageIndex]?.layout === "free", i = t.style ??= {}, a = t.valueStyle ??= {}, s = t.titleStyle ??= {}, r = t.backgroundMode ?? (t.transparentBackground ? "transparent" : t.backgroundImage ? "image" : "color"), o = !!(t.title?.trim() && t.showTitle !== !1);
    return l`<div class="grid appearance-grid">
      <section class="appearance-section">
        <header><ha-icon icon="mdi:card-outline"></ha-icon>Card</header>
        ${this.segmented(
      "Background",
      r,
      [
        { value: "color", label: "Color", icon: "mdi:palette" },
        { value: "transparent", label: "Page", icon: "mdi:checkerboard" },
        { value: "image", label: "Image", icon: "mdi:image-outline" }
      ],
      (n) => {
        t.backgroundMode = n, t.transparentBackground = n === "transparent", this.changed();
      }
    )}
        ${r === "image" ? this.imageField(
      "Card background image",
      t.backgroundImage,
      (n) => {
        t.backgroundImage = n || void 0, this.changed();
      }
    ) : c}
        ${r === "color" ? l`<mini-display-color-field
                label="Background color"
                .value=${i.background ?? ""}
                @color-changed=${(n) => {
      i.background = n.detail || void 0, this.changed();
    }}
              ></mini-display-color-field>` : c}
        <mini-display-color-field
          label="Accent"
          .value=${i.accent ?? ""}
          @color-changed=${(n) => {
      i.accent = n.detail || void 0, this.changed();
    }}
        ></mini-display-color-field>
      </section>
      ${t.type !== "image" ? l`<section class="appearance-section">
              <header><ha-icon icon="mdi:format-text"></ha-icon>Value</header>
              <mini-display-color-field
                label="Text color"
                .value=${i.foreground ?? ""}
                @color-changed=${(n) => {
      i.foreground = n.detail || void 0, this.changed();
    }}
              ></mini-display-color-field>
              ${this.fontSelect("Font", a.fontFamily, (n) => {
      a.fontFamily = n, this.changed();
    })}
              ${this.select(
      "Font size",
      a.fontSize ?? "auto",
      ["auto", "small", "medium", "large", "xlarge"],
      (n) => {
        a.fontSize = n, this.changed();
      }
    )}
              ${e ? c : this.textPosition("Position", a)}
              ${this.select("Text flow", a.textFlow ?? "default", ["default", "overflow", "wrap"], (n) => {
      a.textFlow = n, this.changed();
    })}
              ${this.textEffectEditor("Effect", a)}
            </section>` : c}
      ${o ? l`<section class="appearance-section">
              <header><ha-icon icon="mdi:format-title"></ha-icon>Title</header>
              <mini-display-color-field
                label="Text color"
                .value=${s.foreground ?? ""}
                @color-changed=${(n) => {
      s.foreground = n.detail || void 0, this.changed();
    }}
              ></mini-display-color-field>
              ${this.fontSelect("Font", s.fontFamily, (n) => {
      s.fontFamily = n, this.changed();
    })}
              ${this.select(
      "Font size",
      s.fontSize ?? "auto",
      ["auto", "small", "medium", "large", "xlarge"],
      (n) => {
        s.fontSize = n, this.changed();
      }
    )}
              ${e ? c : this.textPosition("Position", s, "left", "top")}
              ${this.select("Text flow", s.textFlow ?? "default", ["default", "overflow", "wrap"], (n) => {
      s.textFlow = n, this.changed();
    })}
              ${this.textEffectEditor("Effect", s)}
            </section>` : c}
    </div>`;
  }
  transitionEditor(t) {
    const e = t.transition ?? { type: "none" }, i = (d) => {
      t.transition = d, this.changed();
    }, a = (d) => i({ ...e, ...d }), s = [
      { type: "none", label: "None", icon: "mdi:cancel" },
      { type: "random", label: "Random", icon: "mdi:shuffle-variant" },
      { type: "slide", label: "Slide", icon: "mdi:arrow-right-bold" },
      {
        type: "bounce",
        label: "Bounce",
        icon: "mdi:arrow-up-bold-circle-outline"
      },
      { type: "fade", label: "Fade", icon: "mdi:brightness-6" },
      { type: "wipe", label: "Wipe", icon: "mdi:transition-masked" },
      { type: "dissolve", label: "Dissolve", icon: "mdi:dots-grid" },
      { type: "curtain", label: "Curtain", icon: "mdi:curtains" },
      { type: "blinds", label: "Blinds", icon: "mdi:blinds-horizontal" },
      { type: "mosaic", label: "Mosaic", icon: "mdi:view-grid-plus" },
      { type: "doors", label: "Doors", icon: "mdi:door-sliding" },
      { type: "spiral", label: "Spiral", icon: "mdi:reload" }
    ], r = (d) => d === "none" ? { type: d } : d === "random" ? { type: d, speed: "normal" } : ["dissolve", "mosaic", "spiral"].includes(d) ? { type: d, speed: "normal", tileSize: "medium" } : d === "fade" ? { type: d, speed: "normal", intensity: "strong" } : d === "bounce" ? {
      type: d,
      direction: "left",
      speed: "normal",
      intensity: "subtle"
    } : ["curtain", "blinds"].includes(d) ? { type: d, direction: "left", speed: "normal" } : { type: d, direction: "left", speed: "normal" }, o = [
      { value: "left", label: "Left", icon: "mdi:arrow-left" },
      { value: "right", label: "Right", icon: "mdi:arrow-right" },
      { value: "up", label: "Up", icon: "mdi:arrow-up" },
      { value: "down", label: "Down", icon: "mdi:arrow-down" }
    ], n = [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ];
    return l`<details class="transition-settings">
      <summary class="transition-summary">
        Transition to next page ·
        ${s.find((d) => d.type === e.type)?.label ?? "None"}
      </summary>
      <div class="effect-grid">
        ${s.map((d) => l`<button class="effect ${e.type === d.type ? "active" : ""}" aria-pressed=${d.type === e.type} @click=${() => i(r(d.type))}><ha-icon icon=${d.icon}></ha-icon><span>${d.label}</span></button>`)}
      </div>
      ${e.type !== "none" ? l`<div class="transition-options">
              ${["slide", "bounce", "wipe", "curtain", "blinds"].includes(e.type) ? this.segmented("Direction", e.direction ?? "left", o, (d) => a({ direction: d })) : c}${this.segmented("Speed", e.speed ?? "normal", n, (d) => a({ speed: d }))}${["bounce", "fade"].includes(e.type) ? this.segmented(
      "Intensity",
      e.intensity ?? "subtle",
      [
        { value: "subtle", label: "Subtle" },
        { value: "strong", label: "Strong" }
      ],
      (d) => a({ intensity: d })
    ) : c}${["dissolve", "mosaic", "spiral"].includes(e.type) ? this.segmented(
      "Tile size",
      e.tileSize ?? "medium",
      [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" }
      ],
      (d) => a({ tileSize: d })
    ) : c}
            </div>` : c}
    </details>`;
  }
  dragMapping(t, e, i) {
    this.draggedMapping = { kind: t, index: e }, i.dataTransfer?.setData("text/plain", `${t}:${e}`), i.dataTransfer && (i.dataTransfer.effectAllowed = "move"), this.requestUpdate();
  }
  dropMapping(t, e, i, a) {
    a.preventDefault();
    const s = this.draggedMapping;
    if (this.draggedMapping = void 0, !s || s.kind !== e || s.index === i) {
      this.requestUpdate();
      return;
    }
    const r = e === "value" ? t.valueMappings : t.colorMappings;
    if (!r) return;
    const [o] = r.splice(s.index, 1);
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
      ><ha-icon icon="mdi:drag-vertical"></ha-icon
    ></span>`;
  }
  dragCard(t, e, i) {
    this.draggedCard = { row: t, index: e }, i.dataTransfer?.setData("text/plain", `card:${t}:${e}`), i.dataTransfer && (i.dataTransfer.effectAllowed = "move"), this.requestUpdate();
  }
  dropCard(t, e, i) {
    i.preventDefault();
    const a = this.draggedCard;
    if (this.draggedCard = void 0, !a || a.row !== t || a.index === e) {
      this.requestUpdate();
      return;
    }
    const s = this.dashboard?.pages[this.pageIndex]?.rows[t]?.cards;
    if (!s) return;
    const [r] = s.splice(a.index, 1);
    s.splice(e, 0, r), this.selected = { row: t, card: e }, this.changed();
  }
  valueMappingsEditor(t) {
    if (t.type !== "number" && t.type !== "text") return c;
    const e = t.valueMappings ?? [], i = (s, r, o) => {
      const n = e[s];
      o.trim() === "" ? delete n[r] : n[r] = Number(o), this.changed();
    }, a = (s) => {
      e.splice(s, 1), e.length || delete t.valueMappings, this.changed();
    };
    return l`<details class="mappings">
      <summary>
        Value mappings${e.length ? ` (${e.length})` : ""}
      </summary>
      <div class="mapping-list">
        <p class="mapping-copy">
          Rules are checked from top to bottom. The first match wins.
        </p>
        ${e.map(
      (s, r) => t.type === "number" ? l`
                <div
                  class="mapping-rule ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === r ? "dragging" : ""}"
                  @dragover=${(o) => o.preventDefault()}
                  @drop=${(o) => this.dropMapping(t, "value", r, o)}
                >
                  ${this.dragHandle("value", r)}
                  ${this.field("From", s.minimum, (o) => i(r, "minimum", o), "number")}
                  ${this.field("To", s.maximum, (o) => i(r, "maximum", o), "number")}
                  ${this.field("Display as", s.value, (o) => {
        s.value = o, this.changed();
      })}
                  <button
                    class="icon-button danger"
                    title="Delete mapping"
                    aria-label="Delete mapping"
                    @click=${() => a(r)}
                  >
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              ` : l`
                <div
                  class="mapping-rule text ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === r ? "dragging" : ""}"
                  @dragover=${(o) => o.preventDefault()}
                  @drop=${(o) => this.dropMapping(t, "value", r, o)}
                >
                  ${this.dragHandle("value", r)}
                  ${this.select(
        "Match",
        s.operator,
        ["equals", "starts_with", "ends_with", "contains"],
        (o) => {
          s.operator = o, this.changed();
        }
      )}
                  ${this.field(
        "Text",
        s.match,
        (o) => {
          s.match = o, this.changed();
        }
      )}
                  ${this.field("Display as", s.value, (o) => {
        s.value = o, this.changed();
      })}
                  <button
                    class="icon-button danger"
                    title="Delete mapping"
                    aria-label="Delete mapping"
                    @click=${() => a(r)}
                  >
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              `
    )}
        ${e.length < 12 ? l`<button
                class="add-button"
                @click=${() => {
      const s = t.type === "number" ? { minimum: 0, maximum: 100, value: "" } : { operator: "equals", match: "", value: "" };
      t.valueMappings = [...e, s], this.changed();
    }}
              >
                Add mapping
              </button>` : c}
      </div>
    </details>`;
  }
  colorMappingsEditor(t) {
    if (t.type !== "number" && t.type !== "text") return c;
    const e = t.colorMappings ?? [], i = (r, o, n) => {
      const d = e[r];
      n.trim() === "" ? delete d[o] : d[o] = Number(n), this.changed();
    }, a = (r, o, n) => {
      n ? r[o] = n : delete r[o], this.changed();
    }, s = (r) => {
      e.splice(r, 1), e.length || delete t.colorMappings, this.changed();
    };
    return l`<details class="mappings">
      <summary>
        Color mappings${e.length ? ` (${e.length})` : ""}
      </summary>
      <div class="mapping-list">
        <p class="mapping-copy">
          The first matching rule sets the card colors.
        </p>
        ${e.map(
      (r, o) => t.type === "number" ? l`
                <div
                  class="mapping-rule colors ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === o ? "dragging" : ""}"
                  @dragover=${(n) => n.preventDefault()}
                  @drop=${(n) => this.dropMapping(t, "color", o, n)}
                >
                  ${this.dragHandle("color", o)}
                  ${this.field("From", r.minimum, (n) => i(o, "minimum", n), "number")}
                  ${this.field("To", r.maximum, (n) => i(o, "maximum", n), "number")}
                  <mini-display-color-field
                    label="Background"
                    .value=${r.background ?? ""}
                    @color-changed=${(n) => a(r, "background", n.detail)}
                  ></mini-display-color-field>
                  <mini-display-color-field
                    label="Text color"
                    .value=${r.foreground ?? ""}
                    @color-changed=${(n) => a(r, "foreground", n.detail)}
                  ></mini-display-color-field>
                  <button
                    class="icon-button danger"
                    title="Delete color mapping"
                    aria-label="Delete color mapping"
                    @click=${() => s(o)}
                  >
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              ` : l`
                <div
                  class="mapping-rule colors text ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === o ? "dragging" : ""}"
                  @dragover=${(n) => n.preventDefault()}
                  @drop=${(n) => this.dropMapping(t, "color", o, n)}
                >
                  ${this.dragHandle("color", o)}
                  ${this.select(
        "Match",
        r.operator,
        ["equals", "starts_with", "ends_with", "contains"],
        (n) => {
          r.operator = n, this.changed();
        }
      )}
                  ${this.field(
        "Text",
        r.match,
        (n) => {
          r.match = n, this.changed();
        }
      )}
                  <mini-display-color-field
                    label="Background"
                    .value=${r.background ?? ""}
                    @color-changed=${(n) => a(r, "background", n.detail)}
                  ></mini-display-color-field>
                  <mini-display-color-field
                    label="Text color"
                    .value=${r.foreground ?? ""}
                    @color-changed=${(n) => a(r, "foreground", n.detail)}
                  ></mini-display-color-field>
                  <button
                    class="icon-button danger"
                    title="Delete color mapping"
                    aria-label="Delete color mapping"
                    @click=${() => s(o)}
                  >
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              `
    )}
        ${e.length < 12 ? l`<button
                class="add-button"
                @click=${() => {
      const r = t.type === "number" ? { minimum: 0, maximum: 100 } : { operator: "equals", match: "" };
      t.colorMappings = [...e, r], this.changed();
    }}
              >
                Add color mapping
              </button>` : c}
      </div>
    </details>`;
  }
  cardSettings(t, e, i) {
    const a = this.dashboard.pages[this.pageIndex].rows[e].cards, s = {
      number: "Displays a numeric value with an optional unit and progress visualization.",
      text: "Displays text from an entity or the static text below.",
      status: "Maps a state entity to two readable labels.",
      clock: "Displays local time without using an entity.",
      image: "Displays an optimized image without an entity.",
      chart: "Displays recorded values as a chart.",
      weather: "Current conditions and forecasts from Home Assistant."
    }, r = (t.visibility ? 1 : 0) + (t.valueMappings?.length ?? 0) + (t.colorMappings?.length ?? 0), o = (n) => {
      const d = t.frame;
      Object.keys(t).forEach(
        (p) => delete t[p]
      ), Object.assign(t, Oe(n)), d && (t.frame = d), this.changed();
    };
    return l`<section class="card-settings">
      <div class="card-head">
        <div class="card-title">
          <strong>${t.title?.trim() || l`<em>Unnamed card</em>`}</strong
          >${t.title?.trim() && t.showTitle === !1 ? l`<span class="condition-mark"><ha-icon icon="mdi:eye-off-outline"></ha-icon>Title hidden</span>` : c}${t.visibility ? l`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : c}
        </div>
        ${this.menu(
      l`<button
              @click=${() => {
        a.splice(i + 1, 0, structuredClone(t)), this.selected = { row: e, card: i + 1 }, this.changed();
      }}
            >
              Duplicate</button
            ><button
              class="danger"
              ?disabled=${a.length === 1 && this.dashboard.pages[this.pageIndex].layout !== "free"}
              @click=${() => {
        (a.length > 1 || this.dashboard.pages[this.pageIndex].layout === "free") && (a.splice(i, 1), this.selected = void 0, this.changed());
      }}
            >
              Delete
            </button>`
    )}
      </div>
      <nav class="card-section-tabs" aria-label="Card settings sections">
        ${[
      ["content", "Content", "mdi:text-box-outline"],
      ["appearance", "Appearance", "mdi:palette-outline"],
      ["rules", "Rules", "mdi:source-branch"]
    ].map(
      ([n, d, p]) => l`<button
              class="card-section-tab ${this.cardSection === n ? "active" : ""}"
              role="tab"
              aria-selected=${this.cardSection === n}
              @click=${() => this.cardSection = n}
            >
              <ha-icon icon=${p}></ha-icon><span>${d}</span>${n === "rules" && r ? l`<span class="section-count">${r}</span>` : c}
            </button>`
    )}
      </nav>
      <div class="card-pane" role="tabpanel">
        ${this.cardSection === "content" ? l`
                <section class="settings-group">
                  <div class="settings-heading">
                    <ha-icon icon="mdi:card-text-outline"></ha-icon>
                    <div>
                      <strong>Card</strong><small>${s[t.type]}</small>
                    </div>
                  </div>
                  ${this.segmented(
      "Card type",
      t.type,
      [
        { value: "number", label: "Number", icon: "mdi:numeric" },
        { value: "text", label: "Text", icon: "mdi:format-text" },
        { value: "chart", label: "Chart", icon: "mdi:chart-bar" },
        { value: "weather", label: "Weather", icon: "mdi:weather-partly-cloudy" },
        {
          value: "status",
          label: "Status",
          icon: "mdi:toggle-switch-outline"
        },
        {
          value: "clock",
          label: "Clock",
          icon: "mdi:clock-outline"
        },
        {
          value: "image",
          label: "Image",
          icon: "mdi:image-outline"
        }
      ],
      o
    )}
                  <div class="grid compact-grid">
                    ${this.field("Title", t.title, (n) => {
      t.title = n, this.changed();
    })}
                    <div class="inline-option">
                      ${this.checkbox(
      "Show title on display",
      t.showTitle !== !1,
      (n) => {
        t.showTitle = n, this.changed();
      },
      !t.title?.trim()
    )}
                    </div>
                  </div>
                </section>
                ${t.type === "image" ? l`<section class="settings-group">
                        <div class="settings-heading">
                          <ha-icon icon="mdi:image-outline"></ha-icon>
                          <div>
                            <strong>Image</strong
                            ><small>Displayed without an entity value</small>
                          </div>
                        </div>
                        ${this.imageField("Image", t.image, (n) => {
      t.image = n, this.changed();
    })}
                        ${this.segmented(
      "Fit",
      t.imageFit ?? "cover",
      [
        {
          value: "cover",
          label: "Cover",
          icon: "mdi:image-size-select-actual"
        },
        {
          value: "contain",
          label: "Contain",
          icon: "mdi:image-size-select-large"
        },
        {
          value: "stretch",
          label: "Stretch",
          icon: "mdi:fit-to-screen-outline"
        }
      ],
      (n) => {
        t.imageFit = n, this.changed();
      }
    )}
                      </section>` : c}
                ${["number", "status", "text", "chart", "weather"].includes(t.type) ? l`<section class="settings-group">
                        <div class="settings-heading">
                          <ha-icon icon="mdi:database-outline"></ha-icon>
                          <div>
                            <strong>Data</strong
                            ><small>Value shown by this card</small>
                          </div>
                        </div>
                        <div class="grid">
                          ${this.entity(t)}
                          ${t.type === "weather" ? l`<mini-display-weather-editor style="grid-column:1/-1" .settings=${t.weather ?? {}}
                            @weather-changed=${(n) => {
      t.weather = n.detail, this.changed();
    }}></mini-display-weather-editor>` : c}
                          ${t.type === "number" ? l`${this.field(
      "Unit",
      t.unit,
      (n) => {
        t.unit = n, this.changed();
      }
    )}${this.select(
      "Progress",
      t.progress ?? "none",
      ["none", "bar", "ring"],
      (n) => {
        t.progress = n, this.changed();
      }
    )}${t.progress && t.progress !== "none" ? l`${this.field(
      "Minimum",
      t.minimum,
      (n) => {
        t.minimum = Number(n), this.changed();
      },
      "number"
    )}${this.field(
      "Maximum",
      t.maximum,
      (n) => {
        t.maximum = Number(n), this.changed();
      },
      "number"
    )}` : c}` : c}
                          ${t.type === "text" ? l`${this.field(
      "Static text",
      t.text,
      (n) => {
        t.text = n, this.changed();
      }
    )}${this.field("Unit", t.unit, (n) => {
      t.unit = n, this.changed();
    })}` : c}
                          ${t.type === "status" ? l`${this.field(
      "On text",
      t.onText,
      (n) => {
        t.onText = n, this.changed();
      }
    )}${this.field(
      "Off text",
      t.offText,
      (n) => {
        t.offText = n, this.changed();
      }
    )}` : c}
                        </div>
                      </section>` : c}
                <section class="settings-group"><mini-display-graph-editor .card=${t} .hass=${this.hass}
                  @graph-changed=${(n) => {
      t.graph = n.detail, this.changed();
    }}
                ></mini-display-graph-editor></section>
              ` : this.cardSection === "appearance" ? l`<section class="settings-group">
                  <div class="settings-heading">
                    <ha-icon icon="mdi:palette-outline"></ha-icon>
                    <div>
                      <strong>Appearance</strong
                      ><small>Colors, typography and placement</small>
                    </div>
                  </div>
                  ${this.appearanceEditor(t)}
                </section>` : l`
                  <section class="settings-group">
                    <div class="setting-action">
                      <ha-icon icon="mdi:eye-settings-outline"></ha-icon>
                      <div>
                        <strong>Visibility</strong>
                        <small
                          >${t.visibility ? "Shown when configured conditions match" : "Always visible"}</small
                        >
                      </div>
                      <ha-button
                        @click=${() => this.openVisibility("card", e, i)}
                        >${t.visibility ? "Edit" : "Configure"}</ha-button
                      >
                    </div>
                  </section>
                  <section class="settings-group rule-groups">
                    <div class="settings-heading">
                      <ha-icon icon="mdi:swap-horizontal"></ha-icon>
                      <div>
                        <strong>Mappings</strong
                        ><small
                          >Transform values and colors in rule order</small
                        >
                      </div>
                    </div>
                    ${this.valueMappingsEditor(t)}${this.colorMappingsEditor(t)}
                  </section>
                `}
      </div>
    </section>`;
  }
  rowEditor(t, e) {
    const i = this.dashboard.pages[this.pageIndex];
    return l`<section class="row-panel">
      <div class="row-head">
        <div class="row-title">
          ${this.editingRowTitle === e ? l`<input
                  class="row-title-input"
                  aria-label="Row title"
                  autofocus
                  .value=${t.title ?? ""}
                  placeholder=${`Row ${e + 1}`}
                  @input=${(a) => {
      t.title = a.target.value, this.changed();
    }}
                  @blur=${() => this.editingRowTitle = void 0}
                  @keydown=${(a) => {
      (a.key === "Enter" || a.key === "Escape") && a.currentTarget.blur();
    }}
                />` : l`<strong
                    >${t.title?.trim() || `Row ${e + 1}`}</strong
                  ><button
                    class="inline-icon-button"
                    aria-label="Edit row title"
                    title="Edit row title"
                    @click=${() => this.editingRowTitle = e}
                  >
                    <ha-icon icon="mdi:pencil-outline"></ha-icon>
                  </button>`}<small
            >${t.cards.length}
            ${t.cards.length === 1 ? "card" : "cards"}</small
          >${t.visibility ? l`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : c}
        </div>
        ${this.menu(
      l`<button @click=${() => this.openVisibility("row", e)}>
              Visibility</button
            ><button
              @click=${() => {
        i.rows.splice(e + 1, 0, structuredClone(t)), this.changed();
      }}
            >
              Duplicate</button
            ><button
              class="danger"
              ?disabled=${i.rows.length === 1}
              @click=${() => {
        i.rows.length > 1 && this.requestDeleteRow(e);
      }}
            >
              Delete
            </button>`
    )}
      </div>
      ${t.title?.trim() ? this.fontSelect(
      "Row title font",
      t.titleStyle?.fontFamily,
      (a) => {
        t.titleStyle = {
          ...t.titleStyle ?? {},
          fontFamily: a
        }, this.changed();
      }
    ) : c}
      <nav class="card-tabs" aria-label=${`Cards in row ${e + 1}`}>
        ${t.cards.map((a, s) => {
      const r = this.selected?.row === e && this.selected?.card === s;
      return l`<button
            draggable="true"
            class="tab ${r ? "active" : ""} ${this.draggedCard?.row === e && this.draggedCard.index === s ? "dragging" : ""}"
            aria-label=${a.title?.trim() || `Unnamed card ${s + 1}`}
            aria-expanded=${r}
            @dragstart=${(o) => this.dragCard(e, s, o)}
            @dragover=${(o) => o.preventDefault()}
            @drop=${(o) => this.dropCard(e, s, o)}
            @dragend=${() => {
        this.draggedCard = void 0, this.requestUpdate();
      }}
            @click=${() => this.selected = r ? void 0 : { row: e, card: s }}
          >
            ${a.title?.trim() || l`<em>Unnamed card</em>`}
          </button>`;
    })}${t.cards.length < 3 ? l`<button
                class="icon-button"
                title="Add card"
                aria-label="Add card"
                @click=${() => {
      t.cards.push(Oe()), this.selected = { row: e, card: t.cards.length - 1 }, this.changed();
    }}
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>` : c}
      </nav>
      ${this.selected?.row === e ? this.cardSettings(t.cards[this.selected.card], e, this.selected.card) : c}
    </section>`;
  }
  setLayout(t) {
    const e = this.dashboard.pages[this.pageIndex];
    if (t === "free")
      e.rows.forEach((i, a) => i.cards.forEach((s, r) => {
        s.frame ??= { x: r * 100 / i.cards.length, y: a * 100 / e.rows.length, width: 100 / i.cards.length, height: 100 / e.rows.length };
      }));
    else {
      const i = e.rows.flatMap((a) => a.cards);
      e.rows = [];
      for (let a = 0; a < i.length; a += 3) e.rows.push({ weight: 1, gap: "small", cards: i.slice(a, a + 3) });
      e.rows.length || (e.rows = [tt()]);
    }
    e.layout = t, this.selected = void 0, this.changed();
  }
  freeEditor(t) {
    const e = t.rows.flatMap((r, o) => r.cards.map((n, d) => ({ card: n, ri: o, ci: d }))), i = this.selected && t.rows[this.selected.row]?.cards[this.selected.card], a = (r) => {
      if (e.length >= 18) {
        this.syncState = "error", this.syncMessage = "This display supports up to 18 items per page";
        return;
      }
      const o = Oe(r);
      o.frame = { x: 5, y: 5, width: 50, height: 30 }, o.backgroundMode = "transparent", t.rows[0].cards.push(o), this.selected = { row: 0, card: t.rows[0].cards.length - 1 }, this.changed();
    }, s = (r) => {
      if (!i) return;
      const o = e.map((p) => p.card), n = o.indexOf(i), d = n + r;
      d < 0 || d >= o.length || (o.splice(d, 0, o.splice(n, 1)[0]), t.rows = [{ cards: o }], this.selected = { row: 0, card: d }, this.changed());
    };
    return l`<section class="row-panel">
      <nav class="tabs" aria-label="Add item">${["number", "text", "image", "chart", "weather", "clock", "status"].map((r) => l`<button class="tab" @click=${() => a(r)}><ha-icon icon="mdi:plus"></ha-icon>${r}</button>`)}</nav>
      <nav class="card-tabs" aria-label="Items">${e.map(({ card: r, ri: o, ci: n }) => l`<button class="tab ${this.selected?.row === o && this.selected.card === n ? "active" : ""}" @click=${() => this.selected = { row: o, card: n }}>${r.title || r.text || r.source || l`<em>Unnamed card</em>`}</button>`)}</nav>
      ${i?.frame ? l`<div class="grid compact-grid">${["x", "y", "width", "height"].map((r) => this.numberField(r.toUpperCase() + " (%)", i.frame[r], 0, r === "x" || r === "y" ? 0 : 2, 100, (o) => {
      const n = i.frame;
      n[r] = o, n.x = Math.min(n.x, 100 - n.width), n.y = Math.min(n.y, 100 - n.height), this.changed();
    }))}</div><div class="tabs"><button class="tab" @click=${() => s(-1)}>Send backward</button><button class="tab" @click=${() => s(1)}>Bring forward</button></div>` : c}
      ${i && this.selected ? this.cardSettings(i, this.selected.row, this.selected.card) : c}
    </section>`;
  }
  renderEditor() {
    const t = this.dashboard, e = t?.pages[this.pageIndex], i = this.dirtyDisplays.has(this.selectedDisplayId), a = t?.pages.filter((o) => o.enabled !== !1).length ?? 0, s = e?.style ?? {}, r = e?.titleStyle ?? {};
    return l`
      <ha-card class="editor-card">
        <div class="editor-heading">
          <div class="editor-title">
            <strong>${this.selectedDisplay?.title}</strong
            ><small>${this.selectedScene?.name}</small>
          </div>
          <div class="save-area">
            <div
              class="sync ${this.syncState}"
              role=${this.syncState === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              <i></i><span>${this.syncMessage}</span>
            </div>
            <div class="save-actions">
              <ha-button .disabled=${!i} @click=${this.discard}
                >Discard</ha-button
              ><ha-button
                .disabled=${!i || this.syncState === "syncing"}
                @click=${() => {
      this.save();
    }}
                >Save</ha-button
              >
            </div>
          </div>
        </div>
        ${e && t ? l`
                <div class="editor-content">
                  <nav class="tabs" aria-label="Dashboard pages">
                    ${t.pages.map(
      (o, n) => l`
                        <button
                          class="tab ${n === this.pageIndex ? "active" : ""} ${o.enabled === !1 ? "inactive" : ""}"
                          aria-pressed=${n === this.pageIndex}
                          @click=${() => {
        this.showPage(n);
      }}
                        >
                          ${o.enabled === !1 ? l`<ha-icon icon="mdi:eye-off-outline"></ha-icon>` : c}${o.title || o.id}
                        </button>
                      `
    )}
                    <button
                      class="icon-button"
                      aria-label="Add page"
                      title="Add page"
                      @click=${() => {
      t.pages.push(
        Jt(t.pages.length + 1)
      ), this.pageIndex = t.pages.length - 1, this.previewPages = {
        ...this.previewPages,
        [this.selectedDisplayId]: this.pageIndex
      }, this.selected = { row: 0, card: 0 }, this.changed();
    }}
                    >
                      <ha-icon icon="mdi:plus"></ha-icon>
                    </button>
                  </nav>
                  <details class="page-settings">
                    <summary class="page-summary">
                      <span class="page-summary-copy"
                        ><span>Page settings</span
                        ><small
                          >${e.durationSeconds ?? 10}s ·
                          ${e.enabled === !1 ? "Disabled" : "Enabled"}${e.showTitle === !1 ? " · title hidden" : ""}</small
                        ></span
                      ><button
                        class="icon-button danger"
                        aria-label="Delete page"
                        title="Delete page"
                        ?disabled=${t.pages.length <= 1}
                        @click=${(o) => {
      o.preventDefault(), o.stopPropagation(), this.deletePage();
    }}
                      >
                        <ha-icon icon="mdi:delete-outline"></ha-icon>
                      </button>
                    </summary>
                    <div class="page-settings-grid">
                      ${this.field("Page title", e.title, (o) => {
      e.title = o, this.changed();
    })}
                      ${this.field(
      "Duration (seconds)",
      e.durationSeconds,
      (o) => {
        e.durationSeconds = Number(o), this.changed();
      },
      "number"
    )}
                      <div class="page-options">
                        ${this.checkbox(
      "Enabled",
      e.enabled !== !1,
      (o) => {
        e.enabled = o, this.changed();
      },
      e.enabled !== !1 && a <= 1,
      "At least one page must stay enabled"
    )}
                        ${this.checkbox(
      "Show title",
      e.showTitle !== !1,
      (o) => {
        e.showTitle = o, this.changed();
      }
    )}
                      </div>
                      ${e.showTitle !== !1 ? l`<div class="page-title-position">
                              ${this.segmented(
      "Title position",
      e.titlePosition ?? "top",
      [
        {
          value: "top",
          label: "Top",
          icon: "mdi:format-vertical-align-top"
        },
        {
          value: "right",
          label: "Right",
          icon: "mdi:format-horizontal-align-right"
        },
        {
          value: "bottom",
          label: "Bottom",
          icon: "mdi:format-vertical-align-bottom"
        },
        {
          value: "left",
          label: "Left",
          icon: "mdi:format-horizontal-align-left"
        }
      ],
      (o) => {
        e.titlePosition = o, this.changed();
      }
    )}
                            </div>` : c}
                      <details class="page-appearance">
                        <summary>Page appearance</summary>
                        <div class="page-appearance-grid">
                          <mini-display-color-field
                            label="Page background"
                            .value=${s.background ?? ""}
                            @color-changed=${(o) => {
      e.style = {
        ...e.style ?? {},
        background: o.detail || void 0
      }, this.changed();
    }}
                          ></mini-display-color-field>
                          ${this.imageField(
      "Page background image",
      e.backgroundImage,
      (o) => {
        e.backgroundImage = o || void 0, this.changed();
      }
    )}
                          <div class="inline-option">
                            ${this.checkbox(
      "Transparent card backgrounds",
      e.transparentCards === !0,
      (o) => {
        e.transparentCards = o, this.changed();
      },
      !1,
      "Keeps each card background setting but does not render it on this page"
    )}
                          </div>
                          ${e.showTitle !== !1 ? l`
                                  <mini-display-color-field
                                    label="Title background"
                                    .value=${r.background ?? ""}
                                    @color-changed=${(o) => {
      e.titleStyle = {
        ...e.titleStyle ?? {},
        background: o.detail || void 0
      }, this.changed();
    }}
                                  ></mini-display-color-field>
                                  <mini-display-color-field
                                    label="Title text"
                                    .value=${r.foreground ?? ""}
                                    @color-changed=${(o) => {
      e.titleStyle = {
        ...e.titleStyle ?? {},
        foreground: o.detail || void 0
      }, this.changed();
    }}
                                  ></mini-display-color-field>
                                  ${this.fontSelect(
      "Title font",
      r.fontFamily,
      (o) => {
        e.titleStyle = {
          ...e.titleStyle ?? {},
          fontFamily: o
        }, this.changed();
      }
    )}
                                  ${this.select(
      "Title font size",
      r.fontSize ?? "small",
      ["small", "medium", "large", "xlarge"],
      (o) => {
        e.titleStyle = {
          ...e.titleStyle ?? {},
          fontSize: o
        }, this.changed();
      }
    )}
                                ` : c}
                        </div>
                      </details>
                      <details class="advanced-settings">
                        <summary>Advanced</summary>
                        <div class="advanced-settings-content">
                          ${this.field("Page ID", e.id, (o) => {
      e.id = o, this.changed();
    })}
                        </div>
                      </details>
                    </div>
                  </details>
                  ${this.transitionEditor(e)}
                  ${this.segmented("Layout", e.layout ?? "rows", [{ value: "rows", label: "Rows", icon: "mdi:view-agenda-outline" }, { value: "free", label: "Free layout", icon: "mdi:vector-square" }], (o) => this.setLayout(o))}
                  <div class="rows">
                    ${e.layout === "free" ? this.freeEditor(e) : e.rows.map((o, n) => this.rowEditor(o, n))}
                  </div>
                  ${e.layout !== "free" && e.rows.length < 6 ? l`<button
                          class="add-button"
                          @click=${() => {
      e.rows.push(tt()), this.changed();
    }}
                        >
                          Add row
                        </button>` : c}
                </div>
              ` : l`<div class="loading">
                <p>No layout configured for this display.</p>
                <ha-button @click=${this.createLayout}>Create layout</ha-button>
              </div>`}
      </ha-card>
    `;
  }
  render() {
    if (!this.loaded) return l`<div class="loading">Loading displays…</div>`;
    if (this.displays.length === 0)
      return l`<ha-card class="empty"
        ><ha-icon icon="mdi:monitor-off"></ha-icon>
        <h2>No Mini Displays yet</h2>
        <p>
          Add a Mini Display integration first. Configured displays will appear
          here automatically.
        </p>
        <ha-button
          @click=${() => {
        history.pushState(null, "", "/config/integrations"), window.dispatchEvent(new Event("location-changed"));
      }}
          ><ha-icon icon="mdi:plus"></ha-icon>Add integration</ha-button
        ></ha-card
      >`;
    const t = this.visibilityObject()?.visibility, e = this.visibilityTarget?.kind === "row" ? "Row" : "Card", i = this.visibilityTarget?.kind === "card" ? this.visibilityObject() : void 0;
    return l`
      <div class="layout">
        <mini-display-scene-sidebar
          .displays=${this.displays}
          .scenes=${this.scenes}
          .selectedDisplayId=${this.selectedDisplayId}
          .selectedSceneId=${this.selectedSceneId}
          .section=${this.section}
          .imageCount=${this.assets[this.selectedDisplayId]?.length ?? 0}
          .form=${this.sceneForm}
          .sceneName=${this.sceneName}
          @display-selected=${(a) => this.selectDisplay(a.detail)}
          @scene-selected=${(a) => {
      this.selectScene(a.detail);
    }}
          @images-selected=${() => this.section = "images"}
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
          @scene-name=${(a) => this.sceneName = a.detail}
          @scene-cancel=${() => this.sceneForm = null}
          @scene-save=${() => {
      this.saveSceneForm();
    }}
        ></mini-display-scene-sidebar>

        ${this.section === "images" ? l`<mini-display-image-manager
                class="images-view"
                .hass=${this.hass}
                .assets=${this.assets[this.selectedDisplayId] ?? []}
                .displayId=${this.selectedDisplayId}
                .displayName=${this.selectedDisplay?.title ?? "Display"}
                .maximumWidth=${this.selectedDisplay?.width ?? 240}
                .maximumHeight=${this.selectedDisplay?.height ?? 240}
                @asset-uploaded=${(a) => {
      const s = this.assets[this.selectedDisplayId] ?? [];
      this.assets = {
        ...this.assets,
        [this.selectedDisplayId]: [
          ...s.filter((r) => r.id !== a.detail.id),
          a.detail
        ]
      };
    }}
                @asset-deleted=${(a) => {
      this.assets = {
        ...this.assets,
        [this.selectedDisplayId]: (this.assets[this.selectedDisplayId] ?? []).filter((s) => s.id !== a.detail)
      };
    }}
              ></mini-display-image-manager>` : l`${this.renderEditor()}

                <mini-display-preview-list
                  .hass=${this.hass}
                  .displays=${this.displays}
                  .dashboards=${this.dashboards}
                  .pages=${this.previewPages}
                  .dirtyDisplays=${this.dirtyDisplays}
                  .selectedDisplayId=${this.selectedDisplayId}
                  .selectedSceneId=${this.selectedSceneId}
                  .selectedSceneName=${this.selectedScene?.name ?? ""}
                  .assets=${this.assets}
                  @preview-frame=${(a) => {
      const s = a.detail, r = this.dashboards[s.displayId]?.pages[s.page]?.rows[s.row]?.cards[s.card];
      r && (r.frame = s.frame, this.selectedDisplayId = s.displayId, this.pageIndex = s.page, this.selected = { row: s.row, card: s.card }, this.changed());
    }}
                  @display-selected=${(a) => this.selectDisplay(a.detail)}
                  @preview-toggle=${(a) => {
      this.togglePreview(a.detail);
    }}
                  @preview-page=${(a) => this.previewPage(a.detail.displayId, a.detail.delta)}
                  @preview-select=${(a) => {
      this.openFromPreview(a.detail);
    }}
                  @preview-position=${(a) => {
      this.updateFromPreview(a.detail);
    }}
                  @scene-activate=${(a) => {
      this.activateScene(a.detail);
    }}
                ></mini-display-preview-list>`}
      </div>

      ${this.visibilityTarget ? l`
              <mini-display-visibility-dialog
                .hass=${this.hass}
                .targetName=${e}
                .targetKind=${this.visibilityTarget.kind}
                .card=${i}
                .value=${t}
                @visibility-save=${(a) => this.saveVisibility(a.detail)}
                @visibility-clear=${this.clearVisibility}
                @visibility-cancel=${() => this.visibilityTarget = void 0}
              ></mini-display-visibility-dialog>
            ` : c}
      ${this.confirmation ? l`
              <div class="modal-backdrop" @click=${this.closeConfirmation}>
                <ha-card
                  class="confirm-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="confirm-title"
                  @click=${(a) => a.stopPropagation()}
                >
                  <div class="confirm-heading">
                    <ha-icon
                      icon=${this.confirmation.kind === "delete-row" ? "mdi:delete-alert-outline" : "mdi:content-save-alert-outline"}
                    ></ha-icon>
                    <h2 id="confirm-title">
                      ${this.confirmation.kind === "delete-row" ? "Delete row?" : "Discard changes?"}
                    </h2>
                  </div>
                  <div class="modal-body">
                    <p class="modal-copy">
                      ${this.confirmation.kind === "delete-row" ? "This row and all cards inside it will be removed." : "You have unsaved changes. Leaving Mini Displays will discard them."}
                    </p>
                  </div>
                  <div class="modal-actions">
                    <ha-button @click=${this.closeConfirmation}
                      >Cancel</ha-button
                    >
                    <ha-button
                      class="danger-action"
                      @click=${() => {
      this.confirmAction();
    }}
                      >${this.confirmation.kind === "delete-row" ? "Delete" : "Discard and leave"}</ha-button
                    >
                  </div>
                </ha-card>
              </div>
            ` : c}
    `;
  }
};
x.styles = T`
    :host {
      display: block;
      color: var(--primary-text-color);
      font-family: var(--ha-font-family-body, Roboto, sans-serif);
    }
    * {
      box-sizing: border-box;
    }
    button,
    input,
    select {
      font: inherit;
    }
    button {
      cursor: pointer;
    }
    .layout {
      display: grid;
      grid-template-columns: 220px minmax(420px, 1fr) 288px;
      gap: 16px;
      align-items: start;
      min-width: 0;
    }
    .images-view {
      grid-column: 2 / -1;
    }
    ha-card {
      overflow: hidden;
      border: 1px solid var(--divider-color);
      box-shadow: var(--ha-card-box-shadow, none);
    }
    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 52px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .section-heading h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    .icon-button {
      display: inline-grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
    }
    .icon-button:hover {
      background: var(--secondary-background-color);
    }
    .icon-button.danger {
      color: var(--error-color);
    }
    .icon-button:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .scene-list {
      display: grid;
      gap: 4px;
      padding: 8px;
    }
    .scene-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 36px;
      gap: 4px;
      align-items: center;
      border-radius: 10px;
    }
    .scene-row.active {
      background: var(--secondary-background-color);
    }
    .scene-select {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      min-height: 44px;
      padding: 8px 10px;
      color: var(--primary-text-color);
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 10px;
    }
    .scene-select ha-icon {
      color: var(--secondary-text-color);
    }
    .scene-row.active .scene-select ha-icon {
      color: var(--primary-color);
    }
    .scene-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .scene-menu,
    .menu {
      position: relative;
    }
    .scene-menu > summary,
    .menu > summary {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      list-style: none;
      cursor: pointer;
      border-radius: 50%;
    }
    .menu > summary {
      width: 40px;
      height: 40px;
    }
    .scene-menu > summary::-webkit-details-marker,
    .menu > summary::-webkit-details-marker {
      display: none;
    }
    .scene-menu > summary:hover,
    .menu > summary:hover {
      background: var(--card-background-color);
    }
    .scene-popover,
    .menu-popover {
      position: absolute;
      right: 0;
      z-index: 10;
      display: grid;
      width: 150px;
      padding: 6px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      box-shadow: var(--ha-card-box-shadow);
    }
    .menu-popover {
      width: 160px;
    }
    .scene-popover button,
    .menu-popover button {
      min-height: 38px;
      padding: 8px;
      color: var(--primary-text-color);
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: 6px;
    }
    .scene-popover button:hover,
    .menu-popover button:hover {
      background: var(--secondary-background-color);
    }
    .scene-popover .danger,
    .menu-popover .danger {
      color: var(--error-color);
    }
    .display-picker {
      display: grid;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .display-picker label {
      display: grid;
      gap: 5px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .display-picker select {
      width: 100%;
      min-height: 40px;
      padding: 8px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .scene-form {
      display: grid;
      gap: 10px;
      padding: 12px;
      border-top: 1px solid var(--divider-color);
    }
    .scene-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .editor-card {
      min-width: 0;
    }
    .editor-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .editor-title {
      min-width: 0;
    }
    .editor-title strong,
    .editor-title small {
      display: block;
    }
    .editor-title strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .editor-title small {
      margin-top: 2px;
      color: var(--secondary-text-color);
    }
    .save-area,
    .save-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .save-area {
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .sync {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 20px;
      color: var(--secondary-text-color);
      font-size: 12px;
      white-space: nowrap;
    }
    .sync i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--disabled-text-color);
    }
    .sync.syncing i {
      background: var(--warning-color);
    }
    .sync.success i {
      background: var(--success-color);
    }
    .sync.error {
      color: var(--error-color);
    }
    .sync.error i {
      background: var(--error-color);
    }
    .editor-content {
      display: grid;
      gap: 14px;
      padding: 16px;
    }
    .tabs,
    .card-tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding: 2px;
      scrollbar-width: thin;
    }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 40px;
      padding: 7px 12px;
      color: var(--primary-text-color);
      white-space: nowrap;
      background: var(--secondary-background-color);
      border: 1px solid transparent;
      border-radius: 9px;
    }
    .tab ha-icon {
      width: 16px;
      height: 16px;
    }
    .tab.inactive {
      color: var(--secondary-text-color);
      opacity: 0.72;
    }
    .card-tabs .tab {
      cursor: grab;
    }
    .card-tabs .tab:active {
      cursor: grabbing;
    }
    .tab.active {
      color: var(--text-primary-color);
      background: var(--primary-color);
      opacity: 1;
    }
    .tab.dragging {
      opacity: 0.4;
    }
    .page-settings,
    .row-panel,
    .card-settings {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      scroll-margin-top: 16px;
    }
    .page-settings[open],
    .card-settings {
      display: grid;
      gap: 10px;
    }
    .page-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
    }
    .page-summary::marker {
      content: "";
    }
    .page-summary-copy {
      display: grid;
      gap: 2px;
    }
    .page-summary-copy > span {
      font-weight: 500;
    }
    .page-summary-copy > small {
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 400;
    }
    .rows {
      display: grid;
      gap: 12px;
    }
    .row-panel {
      display: grid;
      gap: 12px;
      background: color-mix(
        in srgb,
        var(--card-background-color),
        var(--primary-color) 2%
      );
    }
    .page-settings-grid {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 130px auto;
      gap: 8px;
      align-items: end;
    }
    .page-settings .field input {
      min-height: 36px;
    }
    .page-options {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 36px;
      padding: 0 4px;
    }
    .page-options .check {
      white-space: nowrap;
    }
    .page-title-position {
      grid-column: 1/-1;
      max-width: 460px;
    }
    .page-appearance,
    .advanced-settings {
      grid-column: 1/-1;
      padding: 8px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
    }
    .page-appearance > summary,
    .advanced-settings > summary {
      width: max-content;
      color: var(--secondary-text-color);
      font-size: 13px;
      cursor: pointer;
    }
    .page-appearance-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .advanced-settings-content {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 130px;
      gap: 8px;
      margin-top: 10px;
    }
    .row-head,
    .card-head,
    .row-title,
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .row-head,
    .card-head {
      justify-content: space-between;
    }
    .row-title,
    .card-title {
      min-width: 0;
      flex-wrap: wrap;
    }
    .card-title strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-head > .menu {
      flex: none;
    }
    .row-title small {
      color: var(--secondary-text-color);
    }
    .inline-icon-button {
      display: inline-grid;
      flex: none;
      place-items: center;
      width: 30px;
      height: 30px;
      padding: 0;
      color: var(--secondary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
    }
    .inline-icon-button:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .inline-icon-button ha-icon {
      width: 17px;
      height: 17px;
    }
    .row-title-input {
      width: min(220px, 45vw);
      min-height: 34px;
      padding: 6px 9px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--primary-color);
      border-radius: 7px;
    }
    .card-settings {
      border-color: var(--primary-color);
      background: var(--card-background-color);
      padding: 0;
      overflow: hidden;
    }
    .card-settings > .card-head {
      min-height: 52px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .card-section-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
      padding: 6px;
      background: var(--secondary-background-color);
      border-bottom: 1px solid var(--divider-color);
    }
    .card-section-tab {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-width: 0;
      min-height: 40px;
      padding: 7px 10px;
      color: var(--secondary-text-color);
      background: transparent;
      border: 0;
      border-radius: 8px;
      transition:
        color 150ms ease,
        background-color 150ms ease;
    }
    .card-section-tab:hover {
      color: var(--primary-text-color);
      background: color-mix(
        in srgb,
        var(--card-background-color),
        transparent 20%
      );
    }
    .card-section-tab.active {
      color: var(--primary-color);
      background: var(--card-background-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }
    .card-section-tab ha-icon {
      width: 19px;
      height: 19px;
    }
    .section-count {
      display: inline-grid;
      place-items: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      color: var(--text-primary-color);
      font-size: 11px;
      font-weight: 600;
      background: var(--primary-color);
      border-radius: 10px;
    }
    .card-pane {
      display: grid;
      gap: 12px;
      padding: 12px;
    }
    .settings-group {
      display: grid;
      gap: 12px;
      min-width: 0;
      padding: 12px;
      background: color-mix(
        in srgb,
        var(--secondary-background-color),
        transparent 45%
      );
      border: 1px solid var(--divider-color);
      border-radius: 10px;
    }
    .settings-heading {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .settings-heading > ha-icon,
    .setting-action > ha-icon {
      flex: none;
      width: 22px;
      height: 22px;
      color: var(--primary-color);
    }
    .settings-heading > div,
    .setting-action > div {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .settings-heading strong,
    .setting-action strong {
      font-size: 14px;
      font-weight: 500;
    }
    .settings-heading small,
    .setting-action small {
      color: var(--secondary-text-color);
      font-size: 12px;
      line-height: 1.35;
    }
    .setting-action {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
    }
    .compact-grid {
      align-items: end;
    }
    .inline-option {
      display: flex;
      align-items: center;
      min-height: 40px;
    }
    .appearance-grid {
      gap: 12px;
    }
    .appearance-section {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
    }
    .appearance-section > header {
      display: flex;
      grid-column: 1 / -1;
      align-items: center;
      gap: 8px;
      color: var(--primary-text-color);
      font-size: 13px;
      font-weight: 600;
    }
    .appearance-section > header ha-icon {
      width: 18px;
      height: 18px;
      color: var(--secondary-text-color);
    }
    .appearance-section > mini-display-image-field,
    .appearance-section > .segmented-field,
    .appearance-section > details {
      grid-column: 1 / -1;
    }
    .rule-groups .mappings {
      padding: 0;
    }
    .rule-groups .mappings + .mappings {
      padding-top: 10px;
      border-top: 1px solid var(--divider-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .grid > ha-form {
      grid-column: 1/-1;
    }
    .field {
      display: grid;
      gap: 5px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .field input,
    .field select {
      width: 100%;
      min-height: 40px;
      padding: 8px 11px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-text-color);
      font-size: 14px;
    }
    .check input {
      width: 18px;
      height: 18px;
    }
    .hint {
      grid-column: 1/-1;
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 12px;
      line-height: 1.5;
    }
    .add-button {
      width: 100%;
      min-height: 42px;
      color: var(--primary-color);
      background: transparent;
      border: 1px dashed var(--primary-color);
      border-radius: 10px;
    }
    .style {
      padding-top: 4px;
    }
    .style > summary {
      cursor: pointer;
    }
    .previews {
      display: grid;
      gap: 12px;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      padding-right: 2px;
      position: sticky;
      top: 16px;
    }
    .preview-title {
      margin: 0;
      padding: 0 2px;
      font-size: 16px;
      font-weight: 500;
    }
    .display-card {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 2px solid transparent;
      transition:
        border-color 150ms ease,
        background-color 150ms ease;
      cursor: pointer;
    }
    .display-card.selected {
      border-color: var(--primary-color);
    }
    .display-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .display-name {
      min-width: 0;
    }
    .display-name strong,
    .display-name small {
      display: block;
    }
    .display-name strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .display-name small {
      margin-top: 3px;
      color: var(--secondary-text-color);
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
    }
    .status i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--error-color);
    }
    .status.online i {
      background: var(--success-color);
    }
    .preview-eye.active {
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    mini-display-preview {
      margin: 0 auto;
    }
    .preview-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .preview-nav .icon-button {
      width: 32px;
      height: 32px;
    }
    .activate {
      width: 100%;
    }
    .condition-mark {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--primary-color);
      font-size: 12px;
    }
    .condition-mark ha-icon {
      width: 16px;
      height: 16px;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.48);
    }
    .visibility-modal {
      width: min(620px, 100%);
      max-height: min(760px, calc(100vh - 32px));
      overflow: auto;
    }
    .confirm-modal {
      width: min(440px, 100%);
    }
    .confirm-heading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .confirm-heading ha-icon {
      color: var(--warning-color);
    }
    .confirm-heading h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    .modal-body {
      display: grid;
      gap: 14px;
      padding: 16px;
    }
    .modal-copy {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 13px;
      line-height: 1.5;
    }
    .condition {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 150px minmax(120px, 0.7fr) 40px;
      gap: 8px;
      align-items: end;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
    }
    .condition ha-form {
      min-width: 0;
    }
    .condition .icon-button {
      align-self: center;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color);
    }
    .danger-action {
      --mdc-theme-primary: var(--error-color);
      color: var(--error-color);
    }
    .mappings {
      display: grid;
      gap: 10px;
      padding-top: 4px;
    }
    .mappings > summary {
      cursor: pointer;
    }
    .mapping-list {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }
    .mapping-rule {
      display: grid;
      grid-template-columns: 28px 1fr 1fr 1.4fr 40px;
      gap: 8px;
      align-items: end;
      padding: 10px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
    }
    .mapping-rule.text {
      grid-template-columns: 28px 140px 1fr 1fr 40px;
    }
    .mapping-rule.colors {
      grid-template-columns: 28px 1fr 1fr 1.2fr 1.2fr 40px;
    }
    .mapping-rule.colors.text {
      grid-template-columns: 28px 130px 1fr 1.2fr 1.2fr 40px;
    }
    .mapping-rule.dragging {
      opacity: 0.45;
    }
    .drag-handle {
      align-self: center;
      display: grid;
      place-items: center;
      width: 28px;
      height: 40px;
      color: var(--secondary-text-color);
      cursor: grab;
    }
    .drag-handle:active {
      cursor: grabbing;
    }
    .mapping-copy {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .segmented-field {
      display: grid;
      gap: 7px;
    }
    .segmented-field > span {
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .segmented {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 3px;
      background: var(--secondary-background-color);
      border-radius: 10px;
    }
    .segment {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: 68px;
      min-height: 36px;
      padding: 6px 9px;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      border-radius: 7px;
    }
    .segment:hover {
      background: color-mix(
        in srgb,
        var(--card-background-color),
        transparent 20%
      );
    }
    .segment.active {
      color: var(--text-primary-color);
      background: var(--primary-color);
    }
    .segment ha-icon {
      width: 18px;
      height: 18px;
    }
    .position-field {
      grid-column: 1/-1;
      padding: 8px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
    }
    .position-field > summary {
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .effect-grid {
      margin-top: 10px;
    }
    .position-grid {
      display: grid;
      grid-template-columns: repeat(3, 38px);
      grid-template-rows: repeat(3, 34px);
      gap: 4px;
      width: max-content;
      margin-top: 9px;
      padding: 5px;
      background: var(--secondary-background-color);
      border-radius: 10px;
    }
    .position-button {
      display: grid;
      place-items: center;
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: 6px;
    }
    .position-button:hover {
      background: var(--card-background-color);
    }
    .position-button.active {
      background: var(--primary-color);
    }
    .position-dot {
      width: 7px;
      height: 7px;
      background: var(--secondary-text-color);
      border-radius: 50%;
    }
    .position-button.active .position-dot {
      background: var(--text-primary-color);
    }
    .transition-settings {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }
    .transition-settings[open] {
      display: grid;
      gap: 14px;
    }
    .transition-summary {
      cursor: pointer;
      font-weight: 500;
    }
    .transition-summary::marker {
      content: "";
    }
    .effect-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .effect {
      display: grid;
      justify-items: center;
      gap: 5px;
      min-height: 68px;
      padding: 9px;
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
      border: 1px solid transparent;
      border-radius: 10px;
    }
    .effect:hover {
      border-color: var(--primary-color);
    }
    .effect.active {
      color: var(--primary-color);
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color), transparent 90%);
    }
    .effect ha-icon {
      width: 22px;
      height: 22px;
    }
    .transition-options {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .empty {
      display: grid;
      justify-items: center;
      gap: 14px;
      padding: 64px 24px;
      text-align: center;
    }
    .empty ha-icon {
      width: 56px;
      height: 56px;
      color: var(--secondary-text-color);
    }
    .empty h2 {
      margin: 0;
      font-size: 20px;
    }
    .empty p {
      max-width: 440px;
      margin: 0;
      color: var(--secondary-text-color);
    }
    .loading {
      padding: 48px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    input:focus-visible,
    select:focus-visible,
    button:focus-visible,
    summary:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    @media (max-width: 1250px) {
      .page-settings-grid {
        grid-template-columns: minmax(160px, 1fr) 130px;
      }
      .page-options {
        grid-column: 1/-1;
      }
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 200px minmax(0, 1fr);
      }
      .previews {
        grid-column: 1/-1;
        grid-template-columns: repeat(auto-fit, minmax(272px, 1fr));
        max-height: none;
        position: static;
        overflow: visible;
      }
      .preview-title {
        grid-column: 1/-1;
      }
    }
    @media (max-width: 700px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .images-view {
        grid-column: 1;
      }
      .scene-list {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      .previews {
        grid-column: auto;
        grid-template-columns: 1fr;
      }
      .grid,
      .page-settings-grid,
      .page-appearance-grid,
      .advanced-settings-content,
      .condition,
      .mapping-rule,
      .mapping-rule.text,
      .mapping-rule.colors,
      .mapping-rule.colors.text,
      .transition-options {
        grid-template-columns: 1fr;
      }
      .page-options {
        grid-column: auto;
        flex-wrap: wrap;
        gap: 12px 20px;
      }
      .effect-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card-section-tab {
        gap: 4px;
        padding: 6px 4px;
        font-size: 12px;
      }
      .card-section-tab ha-icon {
        width: 16px;
        height: 16px;
      }
      .section-count {
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        font-size: 10px;
      }
      .card-pane,
      .settings-group {
        padding: 10px;
      }
      .drag-handle {
        display: none;
      }
      .editor-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .condition .icon-button,
      .mapping-rule .icon-button {
        justify-self: end;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto !important;
        transition: none !important;
      }
    }
  `;
w([
  m({ attribute: !1 })
], x.prototype, "hass", 2);
w([
  v()
], x.prototype, "displays", 2);
w([
  v()
], x.prototype, "scenes", 2);
w([
  v()
], x.prototype, "dashboards", 2);
w([
  v()
], x.prototype, "assets", 2);
w([
  v()
], x.prototype, "savedDashboards", 2);
w([
  v()
], x.prototype, "selectedDisplayId", 2);
w([
  v()
], x.prototype, "selectedSceneId", 2);
w([
  v()
], x.prototype, "section", 2);
w([
  v()
], x.prototype, "pageIndex", 2);
w([
  v()
], x.prototype, "cardSection", 2);
w([
  v()
], x.prototype, "editingRowTitle", 2);
w([
  v()
], x.prototype, "previewPages", 2);
w([
  v()
], x.prototype, "selected", 2);
w([
  v()
], x.prototype, "syncState", 2);
w([
  v()
], x.prototype, "syncMessage", 2);
w([
  v()
], x.prototype, "loaded", 2);
w([
  v()
], x.prototype, "sceneForm", 2);
w([
  v()
], x.prototype, "sceneName", 2);
w([
  v()
], x.prototype, "dirtyDisplays", 2);
w([
  v()
], x.prototype, "visibilityTarget", 2);
w([
  v()
], x.prototype, "confirmation", 2);
x = w([
  R("mini-display-editor")
], x);
var $a = Object.defineProperty, wa = Object.getOwnPropertyDescriptor, Me = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? wa(e, i) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (s = (a ? o(e, i, s) : o(s)) || s);
  return a && s && $a(e, i, s), s;
};
let ne = class extends D {
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
ne.styles = T`
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
Me([
  m({ attribute: !1 })
], ne.prototype, "hass", 2);
Me([
  m({ attribute: !1 })
], ne.prototype, "narrow", 2);
Me([
  m({ attribute: !1 })
], ne.prototype, "route", 2);
Me([
  m({ attribute: !1 })
], ne.prototype, "panel", 2);
ne = Me([
  R("mini-display-panel")
], ne);
//# sourceMappingURL=mini-display-panel.js.map
