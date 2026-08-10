# MCP-Hands-on Interview Preparation

This document combines interview-style questions and model answers derived from the MCP-Hands-on repository. Use this for preparing system-design, backend, TypeScript, and MCP-focused interviews.

---

## Architecture & Design

**Q1:** Explain the high-level architecture of this project. What are the responsibilities of `src/index.ts` and `src/server.ts`?

**A1:** The project implements an MCP (Model Context Protocol) server that registers prompts, tools, and resources. `src/index.ts` exposes the MCP server over stdin/stdout for integration with CLI-style hosts (e.g., editors or agents). `src/server.ts` exposes the same MCP server over HTTP using a `StreamableHTTPTransport` and `Hono` for network requests. Both files share the same registration logic but present different transports.

**Q2:** Why expose both a stdio transport and an HTTP transport? Trade-offs?

**A2:** Stdio is simple for local integrations, lower friction for CLI/IDE plugins, and avoids networking. HTTP is required for external clients and cloud deployment, offers observability and scaling via web infrastructure. Trade-offs: stdio is local-only and single-process; HTTP adds networking complexity, auth needs, and scaling but supports traditional deployment.

**Q3:** How would you extend this to support multiple services (multi-tenant) safely?

**A3:** Introduce a tenant-aware routing layer and namespace registrations per tenant. Keep `McpServer` instances per tenant or implement per-request tenant context with scoped registries. Add authentication, per-tenant rate limits, and tenant-specific storage. Persist tenant configuration in a secure DB and enforce isolation in code paths handling tools/resources.

**Q4:** Propose an architecture to persist student records.

**A4:** Use a relational DB (Postgres) or document DB (Firestore) depending on query needs. Define a `students` table with typed columns (id, name, email, joined_at). Add pagination endpoints, indices on `email` and `joined_at`, and a migration path using a tool (Flyway, Liquibase, or Prisma migrations). Expose CRUD via a service layer the MCP `get_all_students` would call.

---

## TypeScript & Types

**Q5:** Identify and explain the TypeScript types used (e.g., `GetPromptResult`, `ReadResourceResult`). Why is typing important?

**A5:** `GetPromptResult` and `ReadResourceResult` represent protocol contracts for prompt outputs and resource reads. Typing ensures compile-time correctness across SDK boundaries, clarifies expected shapes, and reduces runtime errors when wiring prompts, tools, and transports.

**Q6:** How do TypeScript and runtime validation complement each other here?

**A6:** TypeScript provides development-time guarantees; runtime validation (`zod`) enforces invariants on untrusted inputs from network or external clients. Use both: TS for dev ergonomics and `zod` for runtime safety and structured error messages.

**Q7:** `limit` uses `z.string()` in prompts and `z.number()` in tools. What bugs could this cause and how to fix?

**A7:** Mismatched types permit callers to pass unexpected formats, causing slice/index errors or incorrect JSON. Solution: standardize schemas (prefer `z.number()`), coerce inputs where appropriate, and document the API. Add runtime validation and clear error responses.

---

## MCP & SDK usage

**Q8:** What is an MCP server conceptually; how do `registerPrompt`, `registerTool`, `registerResource` map to LLM workflows?

**A8:** MCP organizes model context into callable prompts (templates), tools (procedures that the model can call), and resources (documents). Prompts generate model inputs, tools provide structured external actions (e.g., DB reads), and resources supply context documents the model can reference.

**Q9:** Walk through lifecycle of a prompt request.

**A9:** Transport receives a request -> transport forwards to `McpServer` -> server validates args (via `zod`) -> server invokes registered prompt handler -> handler returns `GetPromptResult` with messages -> transport serializes and returns result to client.

**Q10:** How to add auth/authorization to tool invocations?

**A10:** Add middleware at transport level to authenticate requests (bearer tokens, mTLS). Attach user/role claims to request context and have `registerTool` handlers check authorization (RBAC or ACL). Use signed tokens with short TTLs, validate scopes, and log access for audits.

**Q11:** Upstream SDK changed `registerTool` signature. How to adapt with minimal disruption?

**A11:** Introduce an adapter layer that maps old handler signatures to new ones. Keep a compatibility shim that translates arguments and return values. Update handlers incrementally and test via a compatibility test suite.

---

## Validation & `zod`

**Q12:** Role of `zod`. Benefits?

**A12:** `zod` declares compact runtime schemas, validates untrusted inputs, and yields friendly errors. It prevents incorrect types (e.g., non-number `limit`) reaching business logic and can be reused to generate TypeScript types.

**Q13:** How to validate and return helpful errors when `limit` is invalid?

**A13:** Use `z.number().int().min(1).max(100)` and catch `zod` errors to return structured HTTP/MCP error messages showing the expectation and the received value. Provide examples of valid values in the error response.

**Q14:** Strategy for sharing and reusing `zod` schemas?

**A14:** Centralize schemas in a `schemas/` folder and export typed aliases: `export const StudentSchema = z.object({...}); export type Student = z.infer<typeof StudentSchema>`. Reuse them across prompts/tools and tests.

---

## Server transports & networking

**Q15:** Compare `StdioServerTransport` and `StreamableHTTPTransport`.

**A15:** `StdioServerTransport` communicates over process stdio streams suitable for local integrations. `StreamableHTTPTransport` maps MCP payloads to HTTP request/response streams, suitable for web clients and distributed systems requiring network interfaces.

**Q16:** What does `handleRequest` need from `context`? How to test it?

**A16:** It likely needs request body stream, headers, method, and path. Unit test by creating mock `context` objects (Hono `Context` or minimal shape) and asserting serialization and handler invocation. Integration test with an HTTP client hitting `/mcp`.

**Q17:** How is `server.connect(transport)` used and failure modes?

**A17:** `connect` binds the transport to the server, initializing protocol handshake. Failures: transport unavailable, runtime exceptions during registration, or handshake timeouts. Make robust with retries/backoff, health checks, and observable errors.

---

## Data modeling & correctness

**Q18:** Identify correctness issues in the `students` array.

**A18:** Repetition across files, duplicate data definitions, and date logic based on local time may lead to timezone inconsistencies. The dataset is in-memory and untyped; should use a shared typed model and single source of truth.

**Q19:** What happens if `limit` is `undefined` or not a number? Safer code?

**A19:** `students.slice(0, undefined)` returns full array; `JSON.stringify(students.slice(0, '2'))` may coerce string to number or produce unexpected results. Safer code (TypeScript example):

```ts
type Student = { id: string; name: string; email: string; joinedAt: string };
function getStudents(limit?: number): Student[] {
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? limit : students.length;
  return students.slice(0, safeLimit);
}
```

**Q20:** Suggest a typed interface for the student object.

**A20:**

```ts
export interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: string; // ISO date
}
const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  joinedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "joinedAt must be ISO date",
  }),
});
```

---

## Testing, error handling & observability

**Q21:** How to unit-test `get_all_students`?

**A21:** Extract the student data and logic into a pure function and test boundary cases (limit undefined, zero, negative, large). Mock time functions if date-dependent and mock database / storage when introduced. Use Jest or Vitest for tests.

**Q22:** Integration tests for MCP endpoints?

**A22:** Start the server in a test harness (stdio or HTTP) and send protocol-compliant requests. Use `supertest` for HTTP transport; spawn a child process for stdio transport tests. Assert message shapes, status codes, and schema validation.

**Q23:** Where to add logging and metrics?

**A23:** Add structured logs at transport entry/exit, tool invocation start/end, and on errors (include request id). Export metrics: request count, latency histogram, error rate per endpoint. Use Prometheus metrics and push to monitoring.

---

## Security, performance & scaling

**Q24:** Security risks for `get_all_students` and mitigations?

**A24:** Risks: data leakage, unauthorized access, injection via crafted input. Mitigate with auth, least privilege, data redaction, input validation, rate limiting, and audit logging.

**Q25:** Redesign for millions of records?

**A25:** Add server-side pagination (offset/limit or cursor-based), database indices, and streaming responses (JSONL or paginated cursor tokens). Avoid full array materialization and use DB cursors.

**Q26:** Rate-limiting, DoS protections, input sanitization?

**A26:** Apply per-IP and per-client rate limits, request-size limits, input validation schemas, and WAF protections. Use exponential backoff on retry and circuit breakers for downstream failures.

---

## Live-coding / Whiteboard problems

**Q27:** Implement paginated `get_all_students` sketch.

**A27:** Return a page object: `{ items: Student[], nextCursor?: string }`. Use DB query with `WHERE id > cursor ORDER BY id LIMIT pageSize`. Encode cursor as base64 of last id + timestamp. Validate cursor server-side.

**Q28:** Schema and storage plan for search by `name`, `email`, `joinedAt`.

**A28:** Use Postgres with GIN index on `name` (for trigram search), unique index on `email`, and B-tree index on `joined_at`. For large-scale text search use Elasticsearch or vector DB depending on semantics.

**Q29:** Ensure MCP server is horizontally scalable and stateless?

**A29:** Keep the server stateless: move persistent state to external DB, store session state in Redis if needed, and make transports stateless. Use load balancers, health checks, and sticky sessions only if required. Ensure `register` operations happen on startup and are idempotent.

---

## Behavioral & design reasoning

**Q30:** Refactor duplicate arrays across `src/index.ts` and `src/server.ts`.

**A30:** Extract shared data and registration code into a single module (e.g., `src/registrations.ts`) that exports a function to register prompts/tools/resources on a given `McpServer` instance.

**Q31:** Onboarding docs and tests to add first?

**A31:** Add a README with run instructions, an architecture overview, and a CONTRIBUTING.md. Add unit tests for tool handlers, schema validation tests, and basic integration tests for both transports.

---

## Advanced & Google-style deep questions

**Q32:** How to perform a security review of MCP SDK usage?

**A32:** Review attack surface around deserialization, input validation, and transport boundaries. Verify no eval-like behavior, ensure handlers validate inputs, audit dependency supply chain, and run dependency scanning and fuzzing on protocol inputs.

**Q33:** Propose typed contract for prompts/tools/resources.

**A33:** Create TS interfaces: `PromptDefinition`, `ToolDefinition<InputT, OutputT>`, `ResourceDefinition`. Use `zod` to validate inputs and generate OpenAPI docs or Markdown from the contract.

**Q34:** Hardening against crafted prompt content triggering unexpected `registerTool` behavior?

**A34:** Ensure registration is done at startup from static modules not dynamic prompt content. Validate any remote content before it affects server state. Run handlers in restricted contexts and avoid executing code derived from prompt content.

**Q35:** Measure and optimize end-to-end latency for prompt->tool->response.

**A35:** Instrument with request tracing (e.g., OpenTelemetry), capture spans for transport, prompt generation, tool execution, and response serialization. Analyze slow spans, add caching for repeated tool outputs, and parallelize independent IO.

---

## Next steps

- Generate a condensed top-10 question list
- Provide extended model answers
- Convert answers into runnable code changes (typed models, safer `limit` handling, pagination)

Please let me know which you'd like to proceed with.
