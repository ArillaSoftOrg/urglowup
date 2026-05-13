import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Sign Up" };

export default function RegisterPage() {
  return <SignUp />;
}
