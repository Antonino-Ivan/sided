/**
 * Router client basato su hash.
 *
 * Perché l'hash e non la History API: il sito gira su un Worker che serve una
 * sola route (`/`). Con path reali un refresh su `/esplora` darebbe 404, a
 * meno di aggiungere un fallback lato server — cioè backend, che qui non
 * vogliamo. Con l'hash ogni schermata è linkabile, condivisibile e
 * ripristinabile con avanti/indietro del browser, senza toccare l'hosting.
 */

export type Route =
  | { name: "home" }
  | { name: "choice"; choiceId: string }
  | { name: "explore"; query?: string; category?: string }
  | { name: "friends" }
  | { name: "create" }
  | { name: "activity" }
  | { name: "chat"; conversationId: string }
  | { name: "profile" }
  | { name: "person"; handle: string };

export const HOME: Route = { name: "home" };

/** Tab della bottom bar a cui una route appartiene. */
export type TabId = "home" | "friends" | "create" | "activity" | "profile";

export function tabForRoute(route: Route): TabId {
  switch (route.name) {
    case "home":
    case "choice":
    case "explore":
      return "home";
    case "friends":
    case "person":
      return "friends";
    case "create":
      return "create";
    case "activity":
    case "chat":
      return "activity";
    case "profile":
      return "profile";
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "choice":
      return `#/scelta/${encodeURIComponent(route.choiceId)}`;
    case "explore": {
      const params = new URLSearchParams();
      if (route.query) params.set("q", route.query);
      if (route.category) params.set("c", route.category);
      const search = params.toString();
      return search ? `#/esplora?${search}` : "#/esplora";
    }
    case "friends":
      return "#/amici";
    case "create":
      return "#/crea";
    case "activity":
      return "#/attivita";
    case "chat":
      return `#/chat/${encodeURIComponent(route.conversationId)}`;
    case "profile":
      return "#/profilo";
    case "person":
      return `#/persona/${encodeURIComponent(route.handle.replace(/^@/, ""))}`;
  }
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [pathPart, searchPart] = clean.split("?");
  const segments = pathPart.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(searchPart ?? "");

  if (!segments.length) return HOME;

  switch (segments[0]) {
    case "scelta":
      return segments[1] ? { name: "choice", choiceId: segments[1] } : HOME;
    case "esplora":
      return {
        name: "explore",
        query: params.get("q") ?? undefined,
        category: params.get("c") ?? undefined,
      };
    case "amici":
      return { name: "friends" };
    case "crea":
      return { name: "create" };
    case "attivita":
      return { name: "activity" };
    case "chat":
      return segments[1] ? { name: "chat", conversationId: segments[1] } : { name: "activity" };
    case "profilo":
      return { name: "profile" };
    case "persona":
      return segments[1] ? { name: "person", handle: `@${segments[1]}` } : { name: "friends" };
    default:
      return HOME;
  }
}

export function sameRoute(a: Route, b: Route): boolean {
  return routeToHash(a) === routeToHash(b);
}
