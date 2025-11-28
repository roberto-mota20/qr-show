import '@testing-library/jest-dom'

// Mock (simulação) do window.alert e scroll, que não existem no ambiente de teste puro
window.alert = jest.fn();
window.scrollTo = jest.fn();

// Mock do LocalStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});