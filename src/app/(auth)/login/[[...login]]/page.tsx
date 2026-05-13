import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign In" };

export default function LoginPage() {
  return <SignIn />;
}
