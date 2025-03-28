import { SignIn } from "@clerk/clerk-react";
import AuthLayout from "../../layout";

const SignInPage = () => {
  return (
    <AuthLayout>
      <SignIn afterSignInUrl="/app" />
    </AuthLayout>
  );
};

export default SignInPage;