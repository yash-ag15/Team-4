import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { dashboardPathFor, isMentorRole } from "@/lib/landing";

/**
 * The public landing page, and where a signed-in STUDENT is sent after sign-in.
 *
 * The marketing copy below is unchanged. The only addition is the signed-in state: with
 * a session, the Sign in / Sign up pair is replaced by a link into the dashboard, because
 * offering "Sign In" to somebody who just signed in is a dead end.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ?? null;

  // Someone mid-onboarding has no dashboard to go to yet — finish the gate first.
  const href = !user
    ? null
    : user.onboardingComplete
      ? dashboardPathFor(user)
      : "/onboarding";

  const label = !user
    ? null
    : !user.onboardingComplete
      ? "Finish setting up"
      : isMentorRole(user.systemRole)
        ? "Go to Mentor Dashboard"
        : "Go to Dashboard";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 font-sans min-h-screen p-4">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-8 bg-white shadow-xl rounded-2xl text-center">
        {user ? (
          <p className="mb-4 text-sm font-medium text-indigo-600">
            Signed in as {user.name || user.email}
          </p>
        ) : null}

        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Welcome to <span className="text-indigo-600">Katalyst</span>
        </h1>
        <p className="max-w-2xl text-xl leading-8 text-gray-600 mb-8">
          The gamified learning platform that levels you up. Submit your work, get instant feedback from your <strong>AI Coach</strong>, and earn XP. The AI advises, but your mentor decides.
        </p>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full sm:w-auto">
          {user ? (
            <Link
              href={href!}
              className="flex h-14 w-full sm:w-64 items-center justify-center rounded-md bg-indigo-600 px-8 text-white transition-colors hover:bg-indigo-700 shadow-lg font-bold text-lg"
            >
              {label}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="flex h-14 w-full sm:w-48 items-center justify-center rounded-md bg-indigo-600 px-8 text-white transition-colors hover:bg-indigo-700 shadow-lg font-bold text-lg"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="flex h-14 w-full sm:w-48 items-center justify-center rounded-md border-2 border-indigo-600 px-8 text-indigo-600 transition-colors hover:bg-indigo-50 font-bold text-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
