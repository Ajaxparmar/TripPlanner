import { Suspense } from "react";
import { AuthPage } from "@/components/tripthread/auth-page";
import { Loading } from "@/components/tripthread/status";

export default function Home() {
  return <Suspense fallback={<Loading />}><AuthPage mode="login" /></Suspense>;
}
