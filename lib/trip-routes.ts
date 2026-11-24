export const tripRoomPath = (id: string) => "/trips/room?trip=" + encodeURIComponent(id);
export const joinPath = (code: string) => "/join?invite=" + encodeURIComponent(code);

export function authPath(mode: "login" | "register", next = "/trips") {
  return "/" + mode + (next === "/trips" ? "" : "?next=" + encodeURIComponent(next));
}

export function authDestination(params: Pick<URLSearchParams, "get">) {
  const next = params.get("next");
  if (next && ["/trips", "/trips/room", "/join", "/profile"].includes(next.split("?")[0])) return next;
  const invite = params.get("invite");
  if (invite) return joinPath(invite);
  const trip = params.get("trip");
  return trip ? tripRoomPath(trip) : "/trips";
}
