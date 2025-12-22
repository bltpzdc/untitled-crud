const LOCAL_MODE = false;

class DiffuzzerStorage {
  constructor() {
    this.runsById = {};
    this.bugsByKey = {};
  }

  // Внутренний метод для загрузки JSON
  async _fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // Ожидаемый формат объекта испытания с бэкенда:
  // {
  //   id: string,
  //   title: string,
  //   datetime: string (ISO) или число,
  //   fs1: string,
  //   fs2: string,
  //   version: string,
  //   comment: string,
  //   tags: string[]	//массив тегов
  //   bugs: string[]   // массив хэшей вида 'XHwSwS4tX2U-fpF2paBIfw=='
  // }
  async get_runs() {
    if (LOCAL_MODE) {
      const make = (id, fs1, fs2, version) => {
        this.runsById[id] = {
          id: id,
          datetime: new Date(),
          fs1: fs1,
          fs2: fs2,
          version: version,
          comment: "a comment",
          tags: [],
          bugs: ['XHwSwS4tX2U-fpF2paBIfw=='],
        };
      };
      make(0, "xfs", "btrfs", "0xbadcoffee");
      make(1, "xfs", "btrfs", "0xbadcoffee");
      make(2, "xfs", "btrfs", "0xbadcoffee");
      make(3, "xfs", "btrfs", "0xbadcoffee");
    } else {
      const runs = await this._fetchJson("/backend/runs/metadatas");

      for (const run of runs) {
        const runbugs = await this._fetchJson(
          `/backend/runs/details/${run.id}`,
        );
        console.log(runbugs);

        this.runsById[run.id] = {
          id: run.id,
          title: run.title,
          datetime: new Date(run.datetime),
          fs1: run.fs1,
          fs2: run.fs2,
          version: run.version,
          comment: (run.comment === null || run.comment === undefined)
            ? ""
            : run.comment,
          tags: Array.isArray(run.tags) ? run.tags : [],
          bugs: runbugs,
        };
      }
    }
    return Object.values(this.runsById);
  }

  // Ожидаемый формат объекта ошибки с бэкенда:
  // {
  //   key: string,             // хэш
  //   type: string,            // тип ошибки
  //   finCode: number,		// код возврата
  //   fs1: string,
  //   fs2: string,
  //   comment: string,
  //   tags: string[]
  // }
  async get_bug_by_key(key) {
    if (this.bugsByKey[key]) {
      return this.bugsByKey[key];
    }
    //TODO set endpoint
    const bug = await this._fetchJson(`/api/bugs/${encodeURIComponent(key)}`);

    const normalized = {
      key: bug.key,
      type: bug.type,
      finCode: bug.finCode,
      fs1: bug.fs1,
      fs2: bug.fs2,
      comment: (bug.comment === null || bug.comment === undefined)
        ? ""
        : bug.comment,
      tags: Array.isArray(bug.tags) ? bug.tags : [],
    };

    this.bugsByKey[key] = normalized;
    return normalized;
  }

  /**
   * Загрузка zip-файла на бэкенд.
   * @param {File} file - объект File, например из <input type="file">
   * @returns {Promise<any>} - JSON-ответ бэкенда (или что он возвращает)
   */
  async upload_zip(file) {
    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch("/backend/v1/runs", {
      method: "POST",
      body: formData,
      // ВАЖНО: не ставить вручную headers['Content-Type'],
      // браузер сам проставит корректный multipart/form-data с boundary
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const data = await res.json();

    return {
      id: data.id,
      status: data.status,
    };
  }
}

export const datalayer = new DiffuzzerStorage();
