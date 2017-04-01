import merge from 'lodash.merge'
import objectPath from 'object-path'

const defaultReducer = (state, paths) => (
  paths.length === 0 ? state : paths.reduce((substate, path) => {
    objectPath.set(substate, path, objectPath.get(state, path))
    return substate
  }, {})
)

const defaultStorage = (() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  class InternalStorage {
    setItem (key, item) {
      this[key] = item
      return item
    }

    getItem (key) {
      return this[key]
    }

    removeItem (key) {
      delete this[key]
    }

    clear () {
      Object.keys(this).forEach(key => delete this[key])
    }
  }

  return new InternalStorage()
})()

export default function createPersistedState ({
  key = 'vuex',
  paths = [],
  getState = (key, storage, cb) => {
    const value = storage.getItem(key)
    var returnValue = value && value !== 'undefined' ? JSON.parse(value) : undefined
    cb(returnValue);
    return returnValue
  },
  setState = (key, state, storage) => storage.setItem(key, JSON.stringify(state)),
  reducer = defaultReducer,
  storage = defaultStorage,
  filter = () => true,
  subscriber = store => handler => store.subscribe(handler)
} = {}) {
  return store => {
    getState(key, storage, (savedState) => {
      if (typeof savedState === 'object') {
        store.replaceState(
          merge({}, store.state, savedState)
        );
      }
    });
    subscriber(store)((mutation, state) => {
      if (filter(mutation)) {
        setState(key, reducer(state, paths), storage)
      }
    })
  }
}
