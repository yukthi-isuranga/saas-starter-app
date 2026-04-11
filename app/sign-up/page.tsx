// 'use client';

// import { useAuth, useSignUp } from '@clerk/nextjs';
// import { useRouter } from 'next/navigation';

// export default function Page() {
//   const { signUp, errors, fetchStatus } = useSignUp();
//   const { isSignedIn } = useAuth();
//   const router = useRouter();

//   const handleSubmit = async (formData: FormData) => {
//     const emailAddress = formData.get('email') as string;
//     const password = formData.get('password') as string;

//     const { error } = await signUp.password({
//       emailAddress,
//       password,
//     });
//     if (error) {
//       // See https://clerk.com/docs/guides/development/custom-flows/error-handling
//       // for more info on error handling
//       console.error(JSON.stringify(error, null, 2));
//       return;
//     }

//     if (!error) await signUp.verifications.sendEmailCode();
//   };

//   const handleVerify = async (formData: FormData) => {
//     const code = formData.get('code') as string;

//     await signUp.verifications.verifyEmailCode({
//       code,
//     });
//     if (signUp.status === 'complete') {
//       await signUp.finalize({
//         // Redirect the user to the home page after signing up
//         navigate: ({ session, decorateUrl }) => {
//           // Handle session tasks
//           // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
//           if (session?.currentTask) {
//             console.log(session?.currentTask);
//             return;
//           }

//           // If no session tasks, navigate the signed-in user to the home page
//           const url = decorateUrl('/');
//           if (url.startsWith('http')) {
//             window.location.href = url;
//           } else {
//             router.push(url);
//           }
//         },
//       });
//     } else {
//       // Check why the sign-up is not complete
//       console.error('Sign-up attempt not complete:', signUp);
//     }
//   };

//   if (signUp.status === 'complete' || isSignedIn) {
//     return null;
//   }

//   if (
//     signUp.status === 'missing_requirements' &&
//     signUp.unverifiedFields.includes('email_address') &&
//     signUp.missingFields.length === 0
//   ) {
//     return (
//       <>
//         <h1>Verify your account</h1>
//         <form action={handleVerify}>
//           <div>
//             <label htmlFor="code">Code</label>
//             <input id="code" name="code" type="text" />
//           </div>
//           {errors.fields.code && <p>{errors.fields.code.message}</p>}
//           <button type="submit" disabled={fetchStatus === 'fetching'}>
//             Verify
//           </button>
//         </form>
//         <button onClick={() => signUp.verifications.sendEmailCode()}>
//           I need a new code
//         </button>
//       </>
//     );
//   }

//   return (
//     <>
//       <h1>Sign up</h1>
//       <form action={handleSubmit}>
//         <div>
//           <label htmlFor="email">Enter email address</label>
//           <input id="email" type="email" name="email" />
//           {errors.fields.emailAddress && (
//             <p>{errors.fields.emailAddress.message}</p>
//           )}
//         </div>
//         <div>
//           <label htmlFor="password">Enter password</label>
//           <input id="password" type="password" name="password" />
//           {errors.fields.password && <p>{errors.fields.password.message}</p>}
//         </div>
//         <button type="submit" disabled={fetchStatus === 'fetching'}>
//           Continue
//         </button>
//       </form>
//       {/* For your debugging purposes. You can just console.log errors, but we put them in the UI for convenience */}
//       {errors && <p>{JSON.stringify(errors, null, 2)}</p>}

//       {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
//       <div id="clerk-captcha" />
//     </>
//   );
// }

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useSignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // ✅ useState instead of FormData
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!signUp) return null;

  // 🔹 SIGN UP
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { error } = await signUp.create({
        emailAddress: email,
        password,
      });

      if (error) {
        console.error(error);
        return;
      }

      await signUp.verifications.sendEmailCode();
      setStep('verify');
      setPendingVerification(true);
    } catch (error) {
      console.error(error);
      console.error(JSON.stringify(error, null, 2));
      setError(JSON.stringify(error, null, 2));
      return;
    }

    // 🔹 VERIFY
    const onPressVerify = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      await signUp.verifications.verifyEmailCode({ code });

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl('/');
            if (url.startsWith('http')) {
              window.location.href = url;
              // router.push("/dashboard");
            } else {
              router.push(url);
            }
          },
        });
      } else {
        console.error('Sign-up not complete:', signUp.status);
      }
    };

    // 🔹 Already signed in
    if (signUp.status === 'complete' || isSignedIn) {
      return null;
    }

    // 🔹 VERIFY STEP UI
    if (
      step === 'verify' ||
      (signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address'))
    ) {
      return (
        <>
          <h1>Verify your account</h1>

          <form onSubmit={onPressVerify}>
            <Input
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            {errors?.fields?.code && <p>{errors.fields.code.message}</p>}

            <button disabled={fetchStatus === 'fetching'}>Verify</button>
          </form>

          <button onClick={() => signUp.verifications.sendEmailCode()}>
            Resend Code
          </button>
        </>
      );
    }

    // 🔹 SIGNUP UI
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Sign Up for Todo Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!pendingVerification ? (
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              ) : (
                <form onSubmit={onPressVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter verification code"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full">
                    Verify Email
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/sign-in"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  };
}
