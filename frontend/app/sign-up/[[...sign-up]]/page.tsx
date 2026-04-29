import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

export default function Page() {
  return (
    <AuthShell title="Get started with" subtitle="BrainDoc." variant="signup">
      <SignUp appearance={{ variables: { colorPrimary: "#8b7cff" } }} />
    </AuthShell>
  );
}
