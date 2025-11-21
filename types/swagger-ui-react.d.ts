declare module "swagger-ui-react" {
  import { Component } from "react"

  export interface SwaggerUIProps {
    spec?: string | object
    url?: string
    onComplete?: (system: unknown) => void
    requestInterceptor?: (request: unknown) => unknown
    responseInterceptor?: (response: unknown) => unknown
    [key: string]: unknown
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string
  export default content
}

