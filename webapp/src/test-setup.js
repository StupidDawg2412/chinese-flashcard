let store = {}
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] },
  clear: () => { store = {} }
}

beforeEach(() => {
  store = {}
})
