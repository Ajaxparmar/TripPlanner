import { Suspense } from "react";
import { AuthPage } from "@/components/tripthread/auth-page";
import { Loading } from "@/components/tripthread/status";

export default function Register() {
  return <Suspense fallback={<Loading />}><AuthPage mode="register" /></Suspense>;
}
