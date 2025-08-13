// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Firebase removed - system now uses Supabase exclusively

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null
  })
}));

// Mock TextEncoder/TextDecoder
class MockTextEncoder {
  encode(str: string): Uint8Array {
    return new Uint8Array([...str].map(c => c.charCodeAt(0)));
  }
}

class MockTextDecoder {
  decode(arr: Uint8Array): string {
    return String.fromCharCode(...arr);
  }
}

global.TextEncoder = MockTextEncoder as any;
global.TextDecoder = MockTextDecoder as any;

// Mock fetch
global.fetch = jest.fn(() => {
  const response = {
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    redirected: false,
    status: 200,
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: 'http://localhost:3000',
    clone: () => response,
    body: null,
    bodyUsed: false,
    bytes: () => Promise.resolve(new Uint8Array())
  };
  return Promise.resolve(response as unknown as Response);
});

// Mock react-markdown
jest.mock('react-markdown', () => {
  const React = require('react');
  return function MockReactMarkdown(props: any) {
    return React.createElement('div', {
      'data-testid': 'markdown',
      className: 'markdown'
    }, props.children);
  };
});

// Mock @fullcalendar modules (commented out due to missing package)
// jest.mock('@fullcalendar/core/locales/sv', () => ({
//   default: {
//     code: 'sv',
//     week: {
//       dow: 1,
//       doy: 4
//     },
//     buttonText: {
//       prev: 'Förra',
//       next: 'Nästa',
//       today: 'Idag',
//       month: 'Månad',
//       week: 'Vecka',
//       day: 'Dag',
//       list: 'Program'
//     },
//     weekText: 'v.',
//     allDayText: 'Heldag',
//     moreLinkText: 'till',
//     noEventsText: 'Inga händelser att visa'
//   }
// }));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Set up missing DOM environment properties
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    host: 'localhost:3000',
    hostname: 'localhost',
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    port: '3000',
    protocol: 'http:',
    search: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  },
  writable: true
});

// Mock ReadableStream
class MockReadableStream {
  constructor() {}
  getReader() {
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => {}
    };
  }
}

global.ReadableStream = MockReadableStream as any;
