const RunsModel = (() => {
  class RunMetadata {
    constructor({ timestamp = null, failureCount = null, tags = [] } = {}) {
      this.timestamp = timestamp;
      this.failureCount = failureCount;
      this.tags = tags;
    }

    static fromApi(metadata = {}) {
      return new RunMetadata({
        timestamp: metadata.timestamp ? new Date(metadata.timestamp) : null,
        failureCount: typeof metadata.failureCount === "number"
          ? metadata.failureCount
          : null,
        tags: Array.isArray(metadata.tags) ? metadata.tags.slice() : [],
      });
    }

    toPlainObject() {
      return {
        timestampISO: this.timestamp ? this.timestamp.toISOString() : null,
        failureCount: this.failureCount,
        tags: this.tags,
      };
    }
  }

  class Run {
    constructor({ id, metadata }) {
      this.id = id;
      this.metadata = metadata;
    }

    static fromApiObject(data) {
      return new Run({
        id: data.id,
        metadata: RunMetadata.fromApi(data.metadata || {}),
      });
    }

    static listFromApiArray(dataArray) {
      if (!Array.isArray(dataArray)) return [];
      return dataArray.map(obj => Run.fromApiObject(obj));
    }

    toFlatObject() {
      const m = this.metadata || new RunMetadata();
      const plain = m.toPlainObject();
      return {
        id: this.id,
        timestampISO: plain.timestampISO,
        failureCount: plain.failureCount,
        tags: plain.tags,
      };
    }
  }

  class Store {
    constructor() {
      this._runs = new Map();
    }

    upsertFromApiObject(obj) {
      const run = Run.fromApiObject(obj);
      this._runs.set(run.id, run);
      return run;
    }

    upsertListFromApiArray(arr) {
      const list = Run.listFromApiArray(arr);
      for (const run of list) {
        this._runs.set(run.id, run);
      }
      return list;
    }

    getById(id) {
      return this._runs.get(id) || null;
    }

    getAll() {
      return Array.from(this._runs.values());
    }

    toFlatArray() {
      return this.getAll().map(r => r.toFlatObject());
    }

    clear() {
      this._runs.clear();
    }
  }

  return {
    RunMetadata,
    Run,
    Store,
    store: new Store(),
  };
})();
