import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

export default function Page() {
  return (
    <AuthShell title="Welcome back to" subtitle="BrainDoc.">
      <SignIn appearance={{ variables: { colorPrimary: "#8b7cff" } }} />
    </AuthShell>
  );
}
