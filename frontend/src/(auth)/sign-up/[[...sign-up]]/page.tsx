import { SignUp } from "@clerk/clerk-react";
import AuthLayout from "../../layout";

const SignInPage = () => {
  return (
    <AuthLayout>
      <SignUp afterSignInUrl="/app" />
    </AuthLayout>
  );
};

export default SignInPage;