// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    }
  },
  useParams() {
    return {}
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return "/"
  },
}))

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react")
    return React.createElement("img", props)
  },
}))

// Mock Next.js server components
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server")
  return {
    ...actual,
    NextRequest: class NextRequest {
      constructor(url, options = {}) {
        this.url = url
        this.method = options.method || "GET"
        this.headers = new Headers(options.headers || {})
        this.nextUrl = new URL(url)
      }
    },
    NextResponse: {
      json: (data, init = {}) => {
        const headers = new Headers(init.headers || {})
        return {
          status: init.status || 200,
          statusText: init.statusText || "OK",
          headers,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        }
      },
    },
  }
})

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

// Mock setInterval globally to prevent issues with rate-limit module
if (typeof global.setInterval === "undefined") {
  global.setInterval = jest.fn()
}

// Polyfill for Request/Response in Node.js environment
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || "GET"
      this.headers = new Headers(options.headers || {})
      this.nextUrl = new URL(url)
    }
  }
}

if (typeof global.Headers === "undefined") {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {}
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers[key.toLowerCase()] = value
        })
      } else if (typeof init === "object") {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value
        })
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }
    has(name) {
      return name.toLowerCase() in this._headers
    }
    forEach(callback) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this)
      })
    }
  }
}

// Polyfill for Response in Node.js environment
if (typeof global.Response === "undefined") {
  global.Response = class Response {
    constructor(body, options = {}) {
      this.body = body
      this.status = options.status || 200
      this.statusText = options.statusText || "OK"
      this.headers = new Headers(options.headers || {})
      this.ok = this.status >= 200 && this.status < 300
    }

    json() {
      return Promise.resolve(typeof this.body === "string" ? JSON.parse(this.body) : this.body)
    }

    text() {
      return Promise.resolve(typeof this.body === "string" ? this.body : JSON.stringify(this.body))
    }

    static json(data, options = {}) {
      return new Response(JSON.stringify(data), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
    }
  }
}

