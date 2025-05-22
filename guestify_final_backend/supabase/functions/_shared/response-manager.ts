import { formatResponse, formatResponseHeaders } from "./mod.ts";

export class ResponseManager {
  constructor() { }

  optionsResponse(): Response {
    return new Response("ok", formatResponseHeaders({}));
  }

  // success response with message and data
  successResponse(data: any, message: string = "ok"): Response {
    return new Response(
      formatResponse({
        data,
        error: false,
        message,
      }),
      formatResponseHeaders({ status: 200 })
    );
  }

  authorizationHeaderMissingResponse(): Response {
    return new Response(
      formatResponse({
        error: true,
        message: "Authorization header is required",
      }),
      formatResponseHeaders({ status: 400 })
    );
  }

  unauthorizedUserResponse(): Response {
    return new Response(
      formatResponse({
        error: true,
        message: "User not allowed",
      }),
      formatResponseHeaders({ status: 401 })
    );
  }

  userNotAllowedResponse(): Response {
    return new Response(
      formatResponse({
        error: true,
        message: "User is not allowed to access the resource",
      }),
      formatResponseHeaders({ status: 401 })
    );
  }

  methodNotAllowedResponse(): Response {
    return new Response(
      formatResponse({
        error: true,
        message: "Method not allowed",
      }),
      formatResponseHeaders({ status: 405 })
    );
  }

  // missing data
  dataNotFoundResponse(): Response {
    return new Response(
      formatResponse({
        error: true,
        message: "Data not found",
      }),
      formatResponseHeaders({ status: 400 })
    );
  }

  // missing id or any other required field
  missingRequiredFieldResponse(message = "Missing required field"): Response {
    return new Response(
      formatResponse({
        error: true,
        message,
      }),
      formatResponseHeaders({ status: 400 })
    );
  }

  // internal server error
  serverErrorResponse(error: any): Response {
    console.log('server error>>', JSON.stringify(error, null, 4), error, error?.message);
    return new Response(
      formatResponse({
        error: true,
        message: error?.message ?? "Internal server error",
      }),
      formatResponseHeaders({ status: 500 })
    );
  }

  clientErrorResponse(message: string): Response {
    return new Response(
      formatResponse({
        error: true,
        message,
      }),
      formatResponseHeaders({ status: 400 })
    );
  }
}
