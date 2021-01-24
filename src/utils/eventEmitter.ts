class EventEmitter {
  listeners: {};
  constructor() {
    this.listeners = {};
  }

  on(type: string, cb: Function) {
    let cbs = this.listeners[type];
    if (!cbs) {
      cbs = [];
    }
    cbs.push(cb);
    this.listeners[type] = cbs;
    return () => {
      this.remove(type, cb);
    };
  }

  emit(type: string, ...args: any) {
    const cbs = this.listeners[type];
    if (Array.isArray(cbs)) {
      for (let i = 0; i < cbs.length; i++) {
        const cb = cbs[i];
        if (typeof cb === "function") {
          cb(...args);
        }
      }
    }
  }

  remove(type: string, cb: Function) {
    if (cb) {
      let cbs = this.listeners[type];
      cbs = cbs.filter((eMap: any) => eMap.cb !== cb);
      this.listeners[type] = cbs;
    } else {
      this.listeners[type] = null;
      delete this.listeners[type];
    }
  }
}

export default new EventEmitter();
