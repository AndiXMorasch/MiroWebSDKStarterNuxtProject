"use strict";
export var miro = (() => {
    var O = Object.defineProperty;
    var Tt = Object.getOwnPropertyDescriptor;
    var bt = Object.getOwnPropertyNames;
    var Et = Object.prototype.hasOwnProperty;
    var o = (n, e) => O(n, "name", {value: e, configurable: !0});
    var st = (n, e) => {
        for (var t in e) O(n, t, {get: e[t], enumerable: !0})
    }, vt = (n, e, t, r) => {
        if (e && typeof e == "object" || typeof e == "function") for (let s of bt(e)) !Et.call(n, s) && s !== t && O(n, s, {
            get: () => e[s],
            enumerable: !(r = Tt(e, s)) || r.enumerable
        });
        return n
    };
    var Pt = n => vt(O({}, "__esModule", {value: !0}), n);
    var Kt = {};
    st(Kt, {board: () => Yt, clientVersion: () => It});
    var p = Symbol("EventManager"), a = Symbol("Commander");
    var F = {};
    st(F, {
        attachDragAndDropListeners: () => ye,
        detachDragAndDropListeners: () => fe,
        initDragSensor: () => Rt,
        resetDragSensor: () => Mt
    });
    var St = ["drag", "drop", "dragend", "dragstart"], _t = {
        "pointer-events": "none",
        "user-select": "none",
        "-webkit-user-select": "none",
        "-webkit-touch-callout": "none"
    }, w = class w {
        constructor() {
            this.listeners = [];
            this.originalBodyStyle = {};
            this.dragStartPosition = {x: -1 / 0, y: -1 / 0}
        }

        setDragStartPosition(e, t) {
            this.dragStartPosition = {x: e, y: t}
        }

        shouldDispatchDrag(e, t) {
            return Math.abs(e - this.dragStartPosition.x) > w.DRAG_THRESHOLD || Math.abs(t - this.dragStartPosition.y) > w.DRAG_THRESHOLD
        }

        resetDragging() {
            throw new Error("Not implemented")
        }

        addListener(e, t, r) {
            this.listeners.push({type: e, selector: t, handler: r})
        }

        removeListener(e, t, r) {
            this.listeners = this.listeners.filter(s => s.type !== e || t != null && s.selector !== t || r != null && s.handler !== r)
        }

        isDraggableElement(e) {
            return !(e instanceof HTMLElement) && !(e instanceof SVGElement) ? !1 : this.listeners.some(({selector: t}) => !!e.closest(t))
        }

        disableClickEvents() {
            Object.entries(_t).forEach(([e, t]) => {
                this.originalBodyStyle[e] = document.body.style.getPropertyValue(e), document.body.style.setProperty(e, t)
            })
        }

        restoreClickEvents() {
            Object.entries(this.originalBodyStyle).forEach(([e, t]) => {
                document.body.style.setProperty(e, t)
            }), this.originalBodyStyle = {}
        }

        dragEnd(e) {
            this.dispatch("dragend", {target: e, clientX: NaN, clientY: NaN, screenX: NaN, screenY: NaN})
        }

        dispatch(e, t) {
            this.listeners.forEach(({selector: r, handler: s, type: i}) => {
                if (e !== i) return;
                let d = t.target.closest(r);
                if (!d) return;
                let u = new CustomEvent(e, {detail: {...t, target: d, type: e}});
                s(u)
            })
        }
    };
    o(w, "BaseDragSensor"), w.DRAG_THRESHOLD = 8;
    var R = w, le = class le extends R {
        constructor() {
            super();
            this.isDragging = !1;
            this.onMouseDown = o(t => {
                let r = t.target;
                this.isDraggableElement(r) && (r.setAttribute("draggable", "false"), this.target = r, this.setDragStartPosition(t.clientX, t.clientY), document.addEventListener("mouseup", this.onMouseUp), document.addEventListener("mousemove", this.onMouseMove, {passive: !0}))
            }, "onMouseDown");
            this.onMouseMove = o(t => {
                if (!this.target) return;
                let {clientX: r, clientY: s, screenX: i, screenY: d} = t;
                if (!this.isDragging && !this.shouldDispatchDrag(r, s)) return;
                let u = this.isDragging ? "drag" : "dragstart";
                this.isDragging || this.disableClickEvents(), this.isDragging = !0, this.dispatch(u, {
                    target: this.target,
                    clientX: r,
                    clientY: s,
                    screenX: i,
                    screenY: d
                })
            }, "onMouseMove");
            this.onMouseUp = o(t => {
                if (t.preventDefault(), this.isDragging && this.target) {
                    let {clientX: r, clientY: s, screenX: i, screenY: d} = t;
                    this.dispatch("drop", {target: this.target, clientX: r, clientY: s, screenX: i, screenY: d})
                }
                window.requestAnimationFrame(() => this.resetDragging())
            }, "onMouseUp");
            this.resetDragging = o(() => {
                document.removeEventListener("mouseup", this.onMouseUp), document.removeEventListener("mousemove", this.onMouseMove), this.isDragging && this.target && this.dragEnd(this.target), this.target && this.restoreClickEvents(), this.isDragging = !1, this.target = void 0
            }, "resetDragging");
            document.addEventListener("mousedown", this.onMouseDown), window.addEventListener("blur", this.resetDragging)
        }
    };
    o(le, "MouseDragSensor");
    var de = le, Dt = 100, b = !1;
    window.addEventListener("touchmove", n => {
        b && n.preventDefault()
    }, {passive: !1});
    var pe = class pe extends R {
        constructor() {
            super();
            this.onTouchStart = o(t => {
                let {target: r} = t;
                if (!this.isDraggableElement(r)) return;
                let s = t.touches[0];
                if (!s) return;
                let {clientX: i, clientY: d, screenX: u, screenY: C} = s;
                this.setDragStartPosition(i, d), r.setAttribute("draggable", "false"), this.target = r, this.tapTimeout = window.setTimeout(() => {
                    this.startDragging({target: r, clientX: i, clientY: d, screenX: u, screenY: C})
                }, Dt), window.addEventListener("touchend", this.onTouchEnd), window.addEventListener("touchcancel", this.resetDragging), window.addEventListener("touchmove", this.resetDragging)
            }, "onTouchStart");
            this.onTouchMove = o(t => {
                if (!this.target) return;
                let r = t.touches[0];
                if (!r) return;
                let {clientX: s, clientY: i, screenX: d, screenY: u} = r;
                this.dispatch("drag", {target: this.target, clientX: s, clientY: i, screenX: d, screenY: u})
            }, "onTouchMove");
            this.onTouchEnd = o(t => {
                if (b && this.target) {
                    let s = t.changedTouches[0];
                    if (!s) return;
                    let {clientX: i, clientY: d, screenX: u, screenY: C} = s;
                    this.dispatch("dragend", {target: this.target, clientX: i, clientY: d, screenX: u, screenY: C})
                }
                window.requestAnimationFrame(() => this.resetDragging())
            }, "onTouchEnd");
            this.startDragging = o(t => {
                this.shouldDispatchDrag(t.clientX, t.clientY) && (window.removeEventListener("touchmove", this.resetDragging), window.addEventListener("touchmove", this.onTouchMove, {passive: !0}), b = !0, this.disableClickEvents(), this.dispatch("dragstart", t))
            }, "startDragging");
            this.resetDragging = o(() => {
                window.removeEventListener("touchend", this.onTouchEnd), window.removeEventListener("touchcancel", this.resetDragging), window.removeEventListener("touchmove", this.resetDragging), window.removeEventListener("touchmove", this.onTouchMove), b && this.target && (this.restoreClickEvents(), this.dragEnd(this.target)), this.target = void 0, b = !1, this.tapTimeout !== void 0 && (clearTimeout(this.tapTimeout), this.tapTimeout = void 0)
            }, "resetDragging");
            window.addEventListener("touchstart", this.onTouchStart), window.addEventListener("blur", this.resetDragging)
        }
    };
    o(pe, "TouchDragSensor");
    var ce = pe, ue = class ue {
        constructor(e) {
            this.touchSensor = new ce, this.mouseSensor = new de, Object.assign(this, e)
        }

        addListener(e, t) {
            this.mouseSensor.addListener(e, this.selector, t), this.touchSensor.addListener(e, this.selector, t)
        }

        removeListener(e, t) {
            this.mouseSensor.removeListener(e, void 0, t), this.touchSensor.removeListener(e, void 0, t)
        }

        reset() {
            St.forEach(e => {
                this.mouseSensor.removeListener(e), this.touchSensor.removeListener(e)
            })
        }

        resetDragging() {
            this.mouseSensor.resetDragging(), this.touchSensor.resetDragging()
        }
    };
    o(ue, "DragSensor");
    var M = ue;
    var I, Rt = o(() => {
        I?.reset(), I = new M({selector: ".miro-draggable"})
    }, "initDragSensor"), Mt = o(() => I?.reset(), "resetDragSensor"), A = "internal:drop", v = new Set, x = new Map, E;

    async function it(n) {
        let e = n.payload;
        if (e == null) return;
        let {x: t, y: r} = e, s = {x: t, y: r, target: E};
        v.forEach(i => i(s)), I.resetDragging()
    }

    o(it, "handleInternalDrop");
    var At = o(n => async e => {
        let {clientX: t, clientY: r, target: s} = e.detail;
        E = s;
        let i = E.dataset.dragPreview, d = parseInt(E.dataset.dragPreviewWidth ?? "", 10),
            u = parseInt(E.dataset.dragPreviewHeight ?? "", 10);
        await n.exec("UI_DRAG_START", {
            clientX: t,
            clientY: r,
            dragImage: i ? {
                width: d === Number.NaN ? void 0 : d,
                height: u === Number.NaN ? void 0 : u,
                src: i
            } : void 0
        })
    }, "onDragStart"), ge, Ft = o(n => async e => {
        if (ge) return;
        ge = requestAnimationFrame(() => {
            ge = void 0
        });
        let {clientX: t, clientY: r} = e.detail;
        await n.exec("UI_DRAG_MOVE", {clientX: t, clientY: r})
    }, "onDrag"), Lt = o(n => async e => {
        let {clientX: t, clientY: r} = e.detail;
        await n.exec("UI_DRAG_DROP", {clientX: t, clientY: r})
    }, "onDrop"), Nt = o(n => async e => {
        await n.exec("UI_DRAG_END")
    }, "onDragEnd");

    async function ye(n, e) {
        v.size === 0 && (await n.exec("UI_REGISTER_EVENT", {name: A}), n.subscribe(A, it), x.set("dragstart", At(n)), x.set("drag", Ft(n)), x.set("dragend", Nt(n)), x.set("drop", Lt(n)), I.addListener("dragstart", x.get("dragstart")), I.addListener("drag", x.get("drag")), I.addListener("dragend", x.get("dragend")), I.addListener("drop", x.get("drop"))), v.add(e)
    }

    o(ye, "attachDragAndDropListeners");

    async function fe(n, e) {
        v.delete(e), v.size === 0 && (I.removeListener("dragstart", x.get("dragstart")), I.removeListener("drag", x.get("drag")), I.removeListener("dragend", x.get("drag")), I.removeListener("drop", x.get("drop")), n.unsubscribe(A, it), await n.exec("UI_UNREGISTER_EVENT", {name: A}))
    }

    o(fe, "detachDragAndDropListeners");

    function he(n) {
        return n != null && typeof n == "object" && !Array.isArray(n) && !(n instanceof Blob)
    }

    o(he, "isObject");

    function c(n, ...e) {
        if (!e.length) return n;
        let t = e.shift();
        return he(n) && he(t) && Object.keys(t).forEach(r => {
            he(t[r]) ? (n[r] || Object.assign(n, {[r]: {}}), c(n[r], t[r])) : Object.assign(n, {[r]: t[r]})
        }), c(n, ...e)
    }

    o(c, "mergeDeep");

    function L(n) {
        let e = {};
        return Object.keys(n).forEach(t => {
            let r = n[t];
            typeof r != "function" && (e[t] = r)
        }), e
    }

    o(L, "asProps");
    var at = o(async n => new Promise((e, t) => {
        let r = new FileReader;
        r.onload = () => {
            e(r.result?.toString() ?? "")
        }, r.onerror = () => {
            t(r.error)
        }, r.onabort = () => {
            t(new Error("Aborted"))
        }, r.readAsDataURL(n)
    }), "blobToDataUrl");

    function N() {
        return Math.random().toString(36).slice(-10)
    }

    o(N, "generateId");

    function Bt(n) {
        return n instanceof ArrayBuffer
    }

    o(Bt, "isTransferableObject");

    async function Ce(n) {
        if (!n) return [];
        if (n instanceof Blob) return [await n.arrayBuffer()];
        if (Bt(n)) return [n];
        if (typeof n != "object") return [];
        let e = Object.values(n).map(r => typeof r == "object" && r !== null ? Ce(r) : Promise.resolve([]));
        return (await Promise.all(e)).flat()
    }

    o(Ce, "getTransferable");
    var mt = "sdkv2-plugin-message";

    function kt(n) {
        return n !== null && "window" in n
    }

    o(kt, "isWindow");

    function Gt(n) {
        return !(n.data?.commandId !== mt || !Array.isArray(n.data?.payload))
    }

    o(Gt, "isSdkMessage");
    var xe = class xe {
        constructor(e, t, r, s) {
            this.hostWindow = e;
            this.clientOrigin = t;
            this.messageHandler = r;
            this.windowGetter = s;
            this.waiting = new Map;
            this.handlePostMessage = o(e => {
                if (this.clientOrigin !== "*" && e.origin !== this.clientOrigin || !Gt(e) || !kt(e.source) || e.source !== this.windowGetter()) return;
                let {msgId: t, payload: r} = e.data, s = this.waiting.get(t);
                if (s) this.waiting.delete(t), s.resolve(r); else {
                    let i = o(d => {
                        d && this.dispatch(d, t)
                    }, "after");
                    this.messageHandler(r).then(i).catch(i)
                }
            }, "handlePostMessage")
        }

        init() {
            this.hostWindow.addEventListener("message", this.handlePostMessage)
        }

        destroy() {
            this.waiting.clear(), this.hostWindow.removeEventListener("message", this.handlePostMessage)
        }

        dispatch(e, t) {
            return new Promise((r, s) => Ce(e).then(i => {
                if (!this.windowGetter()) return;
                let d = !t, u = d ? N() : t, C = {commandId: mt, payload: e, msgId: u};
                this.windowGetter().postMessage(C, this.clientOrigin, i), d ? this.waiting.set(u, {
                    resolve: r,
                    reject: s
                }) : (this.waiting.delete(u), r(null))
            }).catch(s))
        }
    };
    o(xe, "SdkPostMessageBus");
    var B = xe;
    var Ie = class Ie {
        constructor(e) {
            this.waitingResponse = new Map;
            this.handlers = new Map;
            this.responseHandler = o(e => {
                let t = e;
                for (let r = 0; r < t.length; r++) {
                    let s = t[r];
                    if (!s) continue;
                    let i = this.waitingResponse.get(s.id);
                    i && (s.status === "S" ? i.resolve(s.payload) : s.status === "F" && i.reject(new Error(String(s.payload))), this.waitingResponse.delete(s.id))
                }
                return Promise.resolve([])
            }, "responseHandler");
            this.handle = o(e => {
                let t = e, r = [];
                for (let s = 0; s < t.length; s++) {
                    let i = t[s];
                    if (i?.status) {
                        this.responseHandler([i]);
                        continue
                    }
                    let d = i && this.handlers.get(i.id);
                    d && d.forEach(u => {
                        r.push(u(i))
                    })
                }
                return Promise.all(r)
            }, "handle");
            this.bus = new B(e, "*", this.handle, () => e.parent), this.bus.init()
        }

        destroy() {
            this.bus.destroy()
        }

        async exec(e, t) {
            let r = N(), i = [{name: e, payload: t, id: r}];
            return new Promise((d, u) => {
                this.waitingResponse.set(r, {resolve: d, reject: u}), this.bus.dispatch(i).then(this.responseHandler)
            })
        }

        subscribe(e, t) {
            let r = this.handlers.get(e) || [];
            this.handlers.set(e, [...r, t])
        }

        unsubscribe(e, t) {
            let r = (this.handlers.get(e) || []).filter(s => s !== t);
            r.length === 0 ? this.handlers.delete(e) : this.handlers.set(e, r)
        }

        hasEventSubscriptions(e) {
            return this.handlers.has(e)
        }
    };
    o(Ie, "IframeCommander");
    var P = Ie;
    var we = class we {
        constructor(e, t) {
            this.realCommander = e;
            this.prefix = t
        }

        exec(e, t) {
            let r = `${this.prefix.toUpperCase()}_${e}`;
            return this.realCommander.exec(r, t)
        }

        subscribe(e, t) {
            this.realCommander.subscribe(e, t)
        }

        unsubscribe(e, t) {
            this.realCommander.unsubscribe(e, t)
        }

        hasEventSubscriptions(e) {
            return this.realCommander.hasEventSubscriptions(e)
        }
    };
    o(we, "CommanderProxy");
    var S = we;
    var l = o((n, e, t) => {
        Object.defineProperty(n, e, {enumerable: !1, writable: !1, configurable: !1, value: t})
    }, "setPrivateField");
    var m = Symbol("context");
    var Ut = "custom:", Te = o(n => n.startsWith(Ut), "isCustomEvent"), be = class be {
        constructor(e) {
            this.commander = e;
            this.subscriptionsMap = new Map
        }

        async subscribe(e, t, r) {
            this.addInternalHandler(e, t, r), this.commander.hasEventSubscriptions(e) || await this.commander.exec("UI_REGISTER_EVENT", {name: e}), this.commander.subscribe(e, r)
        }

        async unsubscribe(e, t) {
            let r = this.subscriptionsMap.get(e), s = r?.get(t);
            !r || !s || (r.delete(t), this.commander.unsubscribe(e, s), this.commander.hasEventSubscriptions(e) || await this.commander.exec("UI_UNREGISTER_EVENT", {name: e}))
        }

        async unsubscribeAll() {
            this.subscriptionsMap.forEach((t, r) => {
                t.forEach(s => {
                    this.commander.unsubscribe(r, s)
                })
            });
            let e = [...this.subscriptionsMap.keys()].filter(t => !this.commander.hasEventSubscriptions(t)).map(t => this.commander.exec("UI_UNREGISTER_EVENT", {name: t}));
            return this.subscriptionsMap.clear(), Promise.all(e)
        }

        addInternalHandler(e, t, r) {
            this.subscriptionsMap.has(e) || this.subscriptionsMap.set(e, new Map), this.subscriptionsMap.get(e)?.set(t, r)
        }
    };
    o(be, "EventManager");
    var f = be;
    var Ee = class Ee {
        constructor(e) {
            l(this, m, e), l(this, p, new f(e.commander))
        }

        async openPanel(e) {
            await this[m].commander.exec("UI_OPEN_PANEL", e);
            let t = this[m].commander.exec("UI_WAIT_FOR_PANEL_CLOSE", e);
            return {waitForClose: () => t}
        }

        async getPanelData() {
            return this[m].commander.exec("UI_GET_PANEL_DATA")
        }

        async canOpenPanel() {
            return this[m].commander.exec("UI_CAN_OPEN_PANEL")
        }

        async closePanel(e) {
            await this[m].commander.exec("UI_CLOSE_PANEL", {result: e})
        }

        async openModal(e) {
            await this[m].commander.exec("UI_OPEN_MODAL", e);
            let t = this[m].commander.exec("UI_WAIT_FOR_MODAL_CLOSE", e);
            return {waitForClose: () => t}
        }

        async getModalData() {
            return this[m].commander.exec("UI_GET_MODAL_DATA")
        }

        async closeModal(e) {
            await this[m].commander.exec("UI_CLOSE_MODAL", {result: e})
        }

        async canOpenModal() {
            return this[m].commander.exec("UI_CAN_OPEN_MODAL")
        }

        on(e, t) {
            switch (e) {
                case"drop":
                    return ye(this[m].commander, t), Promise.resolve();
                case"icon:click":
                    return this[p].subscribe(e, t, async () => t());
                case"app_card:open":
                    return this[p].subscribe(e, t, async r => {
                        let {appCard: s} = r.payload, i = {appCard: this[m].convert(s)};
                        t(i)
                    });
                case"app_card:connect":
                    return this[p].subscribe(e, t, async r => {
                        let {appCard: s} = r.payload, i = {appCard: this[m].convert(s)};
                        t(i)
                    });
                case"selection:update":
                    return this[p].subscribe(e, t, async r => {
                        let {items: s} = r.payload, i = {items: s.map(d => this[m].convert(d))};
                        t(i)
                    });
                case"online_users:update":
                    return this[p].subscribe(e, t, async r => {
                        let s = r.payload;
                        t(s)
                    });
                case"items:create":
                    return this[p].subscribe(e, t, async r => {
                        let {items: s} = r.payload, i = {items: s.map(d => this[m].convert(d))};
                        t(i)
                    });
                case"experimental:items:update":
                    return this[p].subscribe(e, t, async r => {
                        let {items: s} = r.payload, i = {items: s.map(d => this[m].convert(d))};
                        t(i)
                    });
                case"items:delete":
                    return this[p].subscribe(e, t, async r => {
                        let {items: s} = r.payload, i = {items: s.map(d => this[m].convert(d))};
                        t(i)
                    });
                default:
                    if (Te(e)) {
                        let r = o(async s => {
                            let {items: i} = s.payload, d = {items: i.map(u => this[m].convert(u))};
                            t(d)
                        }, "internalHandler");
                        return this[p].subscribe(e, t, r)
                    }
                    throw new Error(`unknown event: ${e}`)
            }
        }

        off(e, t) {
            switch (e) {
                case"drop":
                    return fe(this[m].commander, t), Promise.resolve();
                case"icon:click":
                case"app_card:open":
                case"app_card:connect":
                case"selection:update":
                case"online_users:update":
                case"items:create":
                case"experimental:items:update":
                case"items:delete":
                    return this[p].unsubscribe(e, t);
                default:
                    if (Te(e)) return this[p].unsubscribe(e, t);
                    throw new Error(`unknown event: ${e}`)
            }
        }
    };
    o(Ee, "BoardUI");
    var k = Ee;
    var ve = class ve {
        constructor(e) {
            l(this, a, e)
        }

        async showInfo(e) {
            let t = {message: e, type: "info"};
            await this[a].exec("SHOW_NOTIFICATION", t)
        }

        async showError(e) {
            let t = {message: e, type: "error"};
            await this[a].exec("SHOW_NOTIFICATION", t)
        }

        async show(e) {
            await this[a].exec("SHOW_NOTIFICATION", e)
        }
    };
    o(ve, "Notifications");
    var G = ve;
    var Pe = class Pe {
        constructor(e) {
            l(this, a, e)
        }

        async get() {
            return this[a].exec("VIEWPORT_GET")
        }

        async set(e) {
            return this[a].exec("VIEWPORT_SET", e)
        }

        async zoomTo(e) {
            return Array.isArray(e) ? this[a].exec("VIEWPORT_ZOOM_TO", {items: e.map(t => t.id)}) : this.zoomTo([e])
        }

        async getZoom() {
            return this[a].exec("VIEWPORT_GET_ZOOM")
        }

        async setZoom(e) {
            return this[a].exec("VIEWPORT_SET_ZOOM", {zoomLevel: e})
        }
    };
    o(Pe, "Viewport");
    var U = Pe;
    var dt = o(n => `realtime_event:${n}`, "prefixed"), Se = class Se {
        constructor(e) {
            l(this, a, e), l(this, p, new f(e))
        }

        async broadcast(e, t) {
            await this[a].exec("SEND_REALTIME_BROADCAST_EVENT", {event: e, payload: t})
        }

        on(e, t) {
            let r = o(async i => {
                t(i.payload)
            }, "internalHandler"), s = dt(e);
            return this[p].subscribe(s, t, r)
        }

        off(e, t) {
            let r = dt(e);
            return this[p].unsubscribe(r, t)
        }
    };
    o(Se, "RealtimeEvents");
    var V = Se;
    var ct = o(n => `timer:${n}`, "prefixed"), _e = class _e {
        constructor(e) {
            l(this, a, e), l(this, p, new f(e))
        }

        async get() {
            return this[a].exec("TIMER_GET")
        }

        async start(e) {
            let t = {duration: e};
            return this[a].exec("TIMER_START", t)
        }

        async stop() {
            return this[a].exec("TIMER_STOP")
        }

        async pause() {
            return this[a].exec("TIMER_PAUSE")
        }

        async resume() {
            return this[a].exec("TIMER_RESUME")
        }

        async prolong(e) {
            let t = {duration: e};
            return this[a].exec("TIMER_PROLONG", t)
        }

        async isStarted() {
            return this[a].exec("TIMER_IS_STARTED")
        }

        async on(e, t) {
            let r = o(async i => {
                t(i.payload)
            }, "internalHandler"), s = ct(e);
            return this[p].subscribe(s, t, r)
        }

        async off(e, t) {
            let r = ct(e);
            return this[p].unsubscribe(r, t)
        }
    };
    o(_e, "Timer");
    var H = _e;
    var De = class De {
        constructor(e) {
            l(this, a, e)
        }

        async follow(e, t = {}) {
            let r = {followee: e, ...t};
            await this[a].exec("ATTENTION_FOLLOW", r)
        }

        async isFollowing() {
            return this[a].exec("ATTENTION_IS_FOLLOWING")
        }

        async getFollowedUser() {
            return this[a].exec("ATTENTION_GET_FOLLOWED_USER")
        }

        async unfollow(e) {
            await this[a].exec("ATTENTION_UNFOLLOW", e)
        }
    };
    o(De, "Attention");
    var W = De;
    var Oe = class Oe {
        constructor(e, t, r, s, i, d, u) {
            this.id = e;
            this.name = t;
            this.description = r;
            this.color = s;
            this.starterId = i;
            this.starterName = d;
            l(this, a, u), l(this, p, new f(u))
        }

        async invite(...e) {
            await this[a].exec("SESSIONS_INVITE_USERS", {sessionId: this.id, userIds: e.flat().map(t => t.id)})
        }

        async join() {
            await this[a].exec("SESSIONS_JOIN", {sessionId: this.id})
        }

        async leave() {
            await this[a].exec("SESSIONS_LEAVE", {sessionId: this.id})
        }

        getUsers() {
            throw new Error("Method not implemented.")
        }

        async hasJoined(e) {
            return this[a].exec("SESSIONS_USER_JOINED", {sessionId: this.id, userId: e})
        }

        async on(e, t) {
            if (e !== "user-left" && e !== "user-joined" && e !== "invitation-responded") return;
            let r = o(async i => {
                i.payload.sessionId === this.id && await t(i.payload)
            }, "wrappedHandler"), s = `sessions:${e}`;
            await this[p].subscribe(s, t, r)
        }

        async off(e, t) {
            if (e !== "user-left" && e !== "user-joined" && e !== "invitation-responded") return;
            let r = `sessions:${e}`;
            await this[p].unsubscribe(r, t)
        }

        async end() {
            await this[a].exec("SESSIONS_END", {id: this.id}), await this[p].unsubscribeAll()
        }
    };
    o(Oe, "Session");
    var _ = Oe;
    var Re = class Re {
        constructor(e) {
            this.attention = new W(e), l(this, a, e), l(this, p, new f(e))
        }

        async startSession(e) {
            let t = await this[a].exec("SESSIONS_START", e);
            return new _(t.id, t.name, t.description, t.color, t.starterId, t.starterName, this[a])
        }

        async getSessions() {
            return (await this[a].exec("SESSIONS_GET")).map(t => new _(t.id, t.name, t.description, t.color, t.starterId, t.starterName, this[a]))
        }

        async on(e, t) {
            if (e !== "sessions:started" && e !== "sessions:ended") throw new Error(`${e} does not exist`);
            let r = o(async s => {
                await t(s.payload)
            }, "wrappedHandler");
            return this[p].subscribe(e, t, r)
        }

        async off(e, t) {
            if (e !== "sessions:started" && e !== "sessions:ended") throw new Error(`${e} does not exist`);
            return this[p].unsubscribe(e, t)
        }

        async zoomTo(e, t) {
            return Array.isArray(t) ? this[a].exec("COLLABORATION_VIEWPORT_ZOOM_TO", {
                items: t.map(r => r.id),
                user: e
            }) : this.zoomTo(e, [t])
        }
    };
    o(Re, "Collaboration");
    var j = Re;
    var lt = o((n, e) => `storage:change:${n}:${e}`, "prefixed"), Ae = class Ae {
        constructor(e, t, r) {
            this.name = e;
            l(this, a, t), l(this, p, r)
        }

        async set(e, t) {
            return this[a].exec("STORAGE_SET", {collection: this.name, key: e, value: t})
        }

        async get(e) {
            return (await this[a].exec("STORAGE_GET", {collection: this.name, key: e})).value
        }

        async remove(e) {
            return this[a].exec("STORAGE_REMOVE", {collection: this.name, key: e})
        }

        async onValue(e, t) {
            let r = await this[a].exec("STORAGE_GET", {collection: this.name, key: e});
            t(r?.value, r?.version);
            let s = o(async d => {
                let {value: u, version: C} = d.payload;
                return t(u, C)
            }, "internalHandler"), i = lt(this.name, e);
            return this[p].subscribe(i, t, s)
        }

        async offValue(e, t) {
            let r = lt(this.name, e);
            return this[p].unsubscribe(r, t)
        }
    };
    o(Ae, "Collection");
    var Me = Ae, Fe = class Fe {
        constructor(e) {
            l(this, a, e), l(this, p, new f(e))
        }

        collection(e) {
            return new Me(e, this[a], this[p])
        }
    };
    o(Fe, "Storage");
    var $ = Fe;
    var h = o(async (n, e) => {
        let t = await n.commander.exec("WIDGET_GET", e);
        if (!Array.isArray(t)) throw new Error("Error retrieving items");
        return t.map(r => n.convert(r))
    }, "getItems");
    var Le = class Le {
        constructor(e, t) {
            l(this, m, e)
        }

        async sync() {
            let e = await this[m].commander.exec("WIDGET_UPDATE", this);
            c(this, e)
        }

        async getMetadata(e) {
            return this[m].commander.exec("WIDGET_GET_METADATA", {itemId: this.id, key: e})
        }

        async setMetadata(e, t) {
            return this[m].commander.exec("WIDGET_SET_METADATA", {itemId: this.id, key: e, value: t})
        }

        async goToLink() {
            return this[m].commander.exec("WIDGET_GO_TO_LINK", {itemId: this.id})
        }

        async bringToFront() {
            return this[m].commander.exec("BRING_TO_FRONT", {items: [this.id]})
        }

        async sendToBack() {
            return this[m].commander.exec("SEND_TO_BACK", {items: [this.id]})
        }

        async bringInFrontOf(e) {
            return this[m].commander.exec("BRING_IN_FRONT_OF", {items: [this.id], targetId: e.id})
        }

        async sendBehindOf(e) {
            return this[m].commander.exec("SEND_BEHIND_OF", {items: [this.id], targetId: e.id})
        }

        async getLayerIndex() {
            return this[m].commander.exec("GET_LAYER_INDEX", {itemId: this.id})
        }

        async getConnectors() {
            let {connectorIds: e} = this;
            return !e || e.length === 0 ? [] : h(this[m], {type: "connector", id: e})
        }
    };
    o(Le, "BaseItem");
    var g = Le;
    var Ne = class Ne extends g {
        constructor(e, t) {
            super(e, t), Object.assign(this, t)
        }
    };
    o(Ne, "Unsupported");
    var Y = Ne;

    function pt(n) {
        return n.replace(/(?:^|_)([a-z])/g, (e, t) => t.toUpperCase())
    }

    o(pt, "toCamelCase");

    function Vt(n) {
        return !n.create
    }

    o(Vt, "isConstructor");

    function ut(n) {
        return Vt(n) ? {
            constructor: n, create: async (e, t) => {
                let r = n, s = new r(e, t), i = L(s), d = await e.commander.exec("WIDGET_CREATE", i);
                return c(s, d), s
            }
        } : n
    }

    o(ut, "parseItemDeclaration");

    function K(n) {
        let e = [...n?.getRegisteredFeatures() ?? []], t = n ? new Map(n.getRegisteredWidgets()) : new Map,
            r = o(() => ({
                widget(s, i) {
                    return t.set(s, i), r()
                }, use(s) {
                    return e.push(s), r()
                }, getRegisteredFeatures() {
                    return e
                }, getRegisteredWidgets() {
                    return t
                }, build(s) {
                    let i = Object.create({}), d = {
                        convert(u) {
                            let {type: C} = u;
                            if (t.get(C)) {
                                let {constructor: D} = ut(t.get(C));
                                if (D) return new D(d, u)
                            }
                            return new Y(this, u)
                        }, get commander() {
                            return s
                        }
                    };
                    return t.forEach((u, C) => {
                        let {create: ot} = ut(u);
                        Object.assign(i, {
                            [`create${pt(C)}`](D) {
                                return ot(d, D)
                            }
                        })
                    }), e.forEach(u => Object.assign(i, u(d))), i
                }
            }), "build");
        return r()
    }

    o(K, "buildSdkClient");
    var gt = o(n => ({
        async get(e) {
            return h(n, e)
        }, async getById(e) {
            let t = await h(n, {id: e});
            if (Array.isArray(t) && t.length) return t[0];
            throw new Error(`Can not retrieve item with id ${e}`)
        }, async getSelection() {
            return (await n.commander.exec("GET_SELECTION")).map(t => n.convert(t))
        }, async select(e) {
            return (await n.commander.exec("SELECT_WIDGETS", e)).map(r => n.convert(r))
        }, async deselect(e) {
            return (await n.commander.exec("DESELECT_WIDGETS", e)).map(r => n.convert(r))
        }
    }), "baseClientFeature");
    var Be = class Be {
        constructor(e, t) {
            this.type = "connector";
            this.shape = "curved";
            this.start = void 0;
            this.end = void 0;
            this.style = {};
            this.captions = [];
            l(this, m, e), c(this, t)
        }

        async sync() {
            let e = await this[m].commander.exec("WIDGET_UPDATE", this);
            c(this, e)
        }

        async getMetadata(e) {
            return this[m].commander.exec("WIDGET_GET_METADATA", {itemId: this.id, key: e})
        }

        async setMetadata(e, t) {
            return this[m].commander.exec("WIDGET_SET_METADATA", {itemId: this.id, key: e, value: t})
        }
    };
    o(Be, "Connector");
    var X = Be;
    var Ht = o(n => ({type: "text", content: n.content, style: {}}), "viewTransformText"), Wt = o(n => ({
            type: "shape",
            shape: n.shape,
            content: n.content,
            style: {color: n.style.color, fillOpacity: n.style.fillOpacity, borderStyle: n.style.borderStyle}
        }), "viewTransformShape"),
        jt = o(n => n.type === "shape" ? Wt(n) : n.type === "text" ? Ht(n) : {}, "transformNodeView"),
        Ge = class Ge extends g {
            constructor(t, r) {
                super(t, r);
                this.type = "mindmap_node";
                c(this, r)
            }

            async sync() {
                return this.nodeView = jt(this.nodeView), super.sync()
            }

            async add(t) {
                this.childrenIds.push(t.id), await this.sync();
                let [r] = await h(this[m], {id: t.id});
                return c(t, r), t
            }

            async getChildren() {
                let t = this.childrenIds;
                return t.length === 0 ? [] : h(this[m], {id: t})
            }
        };
    o(Ge, "MindmapNode");
    var z = Ge, Ue = class Ue {
        constructor(e) {
            this.type = "mindmap_node";
            c(this, e)
        }
    };
    o(Ue, "MindmapNodeCreate");
    var ke = Ue, yt = {
        constructor: z, create: async (n, e) => {
            let t = await n.commander.exec("WIDGET_CREATE", new ke(e ?? {}));
            return new z(n, t)
        }
    };
    var Ve = class Ve extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "shape";
            this.content = "";
            this.shape = "rectangle";
            this.style = {
                fillColor: "transparent",
                fontFamily: "arial",
                fontSize: 14,
                textAlign: "center",
                textAlignVertical: "middle",
                borderStyle: "normal",
                borderOpacity: 1,
                borderColor: "#1a1a1a",
                borderWidth: 2,
                fillOpacity: 1,
                color: "#1a1a1a"
            };
            c(this, r)
        }
    };
    o(Ve, "Shape");
    var J = Ve;

    async function ft(n, e) {
        let t = L(e), r = await n.commander.exec("WIDGET_CREATE", t);
        return c(e, r), e
    }

    o(ft, "sendCreate");
    var We = class We {
        constructor(e, t) {
            this.type = "group";
            this.itemsIds = [];
            l(this, m, e), c(this, t)
        }

        async sync() {
            throw new Error("Not implemented yet.")
        }

        async getItems() {
            let e = this[m];
            return (await e.commander.exec("GROUP_GET_ITEMS", {id: this.id})).map(r => e.convert(r))
        }

        async ungroup() {
            let e = this[m];
            return (await e.commander.exec("GROUP_UNGROUP", {id: this.id})).map(r => e.convert(r))
        }
    };
    o(We, "BaseGroup");
    var He = We, je = class je extends He {
    };
    o(je, "Group");
    var T = je;
    var Q = o(n => ({
        async sync(e) {
            return e.sync()
        }, async remove(e) {
            let {id: t, type: r} = e;
            await n.commander.exec("WIDGET_REMOVE", {id: t, type: r})
        }, async getInfo() {
            return n.commander.exec("GET_BOARD_INFO")
        }, async getIdToken() {
            return n.commander.exec("GET_ID_TOKEN")
        }, async canUse(e) {
            return n.commander.exec("CHECK_FEATURE_ENTITLEMENT", {feature: e})
        }, async getAppData(e) {
            return n.commander.exec("GET_BOARD_APP_DATA", {key: e})
        }, async setAppData(e, t) {
            return n.commander.exec("SET_BOARD_APP_DATA", {key: e, value: t})
        }, async setMetadata(e, t, r) {
            return e.setMetadata(t, r)
        }, async getMetadata(e, t) {
            return e.getMetadata(t)
        }, async getUserInfo() {
            return n.commander.exec("GET_USER_INFO")
        }, async getOnlineUsers() {
            return n.commander.exec("GET_ONLINE_USERS")
        }, async group(e) {
            let {items: t} = e, r = t.map(i => i.id), s = await ft(n, new T(n, {itemsIds: r, type: "group"}));
            return await Promise.all(t.map(async i => {
                let [d] = await h(n, {id: i.id});
                c(i, d)
            })), s
        }, async goToLink(e) {
            return e.goToLink()
        }, async bringToFront(e) {
            return Array.isArray(e) ? n.commander.exec("BRING_TO_FRONT", {items: e.map(t => t.id)}) : this.bringToFront([e])
        }, async sendToBack(e) {
            return Array.isArray(e) ? n.commander.exec("SEND_TO_BACK", {items: e.map(t => t.id)}) : this.sendToBack([e])
        }, async bringInFrontOf(e, t) {
            return Array.isArray(e) ? n.commander.exec("BRING_IN_FRONT_OF", {
                items: e.map(r => r.id),
                targetId: t.id
            }) : this.bringInFrontOf([e], t)
        }, async sendBehindOf(e, t) {
            return Array.isArray(e) ? n.commander.exec("SEND_BEHIND_OF", {
                items: e.map(r => r.id),
                targetId: t.id
            }) : this.sendBehindOf([e], t)
        }, async getLayerIndex(e) {
            return e.getLayerIndex()
        }
    }), "boardFeature");
    var $e = class $e {
        constructor(e) {
            l(this, a, e)
        }

        async register(e) {
            return this[a].exec("CUSTOM_ACTION_REGISTER", e)
        }

        async deregister(e) {
            await this[a].exec("CUSTOM_ACTION_DEREGISTER", e)
        }
    };
    o($e, "CustomActionManagement");
    var q = $e;
    var ht = o(n => ({
        action: new q(n.commander), async getVotingResults() {
            return n.commander.exec("GET_VOTING_RESULTS")
        }, async findEmptySpace(e) {
            return n.commander.exec("FIND_EMPTY_SPACE", e)
        }, async group(e) {
            return Q(n).group(e)
        }
    }), "boardFeature");
    var Ye = class Ye extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "app_card";
            this.owned = !1;
            this.title = "";
            this.description = "";
            this.style = {};
            this.tagIds = [];
            this.status = "disconnected";
            this.fields = [];
            c(this, r)
        }
    };
    o(Ye, "AppCard");
    var Z = Ye;
    var Ke = class Ke extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "card";
            this.title = "";
            this.description = "";
            this.style = {};
            this.dueDate = void 0;
            this.assignee = void 0;
            this.taskStatus = "none";
            this.tagIds = [];
            this.fields = [];
            c(this, r)
        }
    };
    o(Ke, "Card");
    var ee = Ke;
    var Xe = class Xe extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "image";
            this.title = "";
            this.alt = "";
            c(this, r)
        }

        async getFile(t = "original") {
            let r = {id: this.id, format: t}, s = await this[m].commander.exec("IMAGE_GET_BLOB", r);
            return new File([s], this.title, {lastModified: +this.modifiedAt})
        }

        async getDataUrl(t) {
            let r = await this.getFile(t);
            return await at(r)
        }
    };
    o(Xe, "Image");
    var te = Xe;
    var ze = class ze extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "preview";
            c(this, r)
        }
    };
    o(ze, "Preview");
    var re = ze;
    var Je = class Je extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "shape";
            this.content = "";
            this.shape = "rectangle";
            this.style = {
                fillColor: "transparent",
                fontFamily: "arial",
                fontSize: 14,
                textAlign: "center",
                textAlignVertical: "middle",
                borderStyle: "normal",
                borderOpacity: 1,
                borderColor: "#1a1a1a",
                borderWidth: 2,
                fillOpacity: 1,
                color: "#1a1a1a"
            };
            c(this, r)
        }
    };
    o(Je, "Shape");
    var ne = Je;
    var Qe = class Qe extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "sticky_note";
            this.shape = "square";
            this.content = "";
            this.style = {fillColor: "light_yellow", textAlign: "center", textAlignVertical: "middle"};
            this.tagIds = [];
            c(this, r)
        }
    };
    o(Qe, "StickyNote");
    var oe = Qe;
    var qe = class qe extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "embed";
            this.previewUrl = "";
            this.mode = "inline";
            c(this, r)
        }
    };
    o(qe, "Embed");
    var se = qe;
    var et = class et extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "frame";
            this.title = "";
            this.childrenIds = [];
            this.style = {fillColor: "transparent"};
            c(this, r)
        }

        async add(t) {
            this.childrenIds.push(t.id), await this.sync();
            let [r] = await h(this[m], {id: t.id});
            return c(t, r), t
        }

        async remove(t) {
            let r = t.id;
            if (!r) throw new Error("trying to remove a non-existent item from a frame");
            let s = this.childrenIds.findIndex(d => d === r);
            if (s === -1) throw new Error(`Can't remove item ${r} from frame ${this.id}. The item is not a current child`);
            this.childrenIds.splice(s, 1), await this.sync();
            let [i] = await h(this[m], {id: t.id});
            c(t, i)
        }

        async getChildren() {
            return (await this[m].commander.exec("FRAME_GET_CHILDREN", {id: this.id})).map(r => this[m].convert(r))
        }
    };
    o(et, "BaseFrame");
    var Ze = et, tt = class tt extends Ze {
    };
    o(tt, "Frame");
    var ie = tt;
    var rt = class rt extends g {
        constructor(t, r) {
            super(t, r);
            this.type = "text";
            this.content = "";
            this.style = {
                fillColor: "transparent",
                fillOpacity: 1,
                fontFamily: "arial",
                fontSize: 14,
                textAlign: "left",
                color: "#1a1a1a"
            };
            c(this, r)
        }
    };
    o(rt, "Text");
    var ae = rt;
    var nt = class nt {
        constructor(e, t) {
            this.type = "tag";
            this.title = "";
            this.color = "red";
            l(this, m, e), c(this, t)
        }

        async sync() {
            return this[m].commander.exec("WIDGET_UPDATE", this).then(e => {
                c(this, e)
            })
        }
    };
    o(nt, "Tag");
    var me = nt;
    var Ct = K().widget("app_card", Z).widget("card", ee).widget("connector", X).widget("embed", se).widget("frame", ie).widget("image", te).widget("preview", re).widget("shape", ne).widget("sticky_note", oe).widget("text", ae).widget("group", T).widget("tag", me).use(n => ({
            ui: new k(n),
            notifications: new G(n.commander),
            viewport: new U(n.commander),
            storage: new $(n.commander),
            events: new V(n.commander),
            timer: new H(n.commander),
            collaboration: new j(n.commander)
        })).use(Q).use(gt),
        $t = K(Ct).use(({commander: n}) => ({experimental: K(Ct).widget("mindmap_node", yt).widget("shape", J).use(ht).build(new S(n, "experimental"))})),
        xt = o(n => $t.build(n), "createStableSdk");
    var It = "1.59151.0", wt = new P(window), Yt = xt(wt);
    wt.exec("handshake", {clientVersion: It});
    F.initDragSensor();
    typeof location < "u" && new URLSearchParams(location.search).has("autotest") && console.log("SDKv2 loaded for client version: 1.59151.0 and git commit: 3156af42e7ef4d178f341805d2edea3717353b3f");
    return Pt(Kt);
})();
