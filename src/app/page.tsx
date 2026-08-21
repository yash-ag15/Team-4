import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 font-sans min-h-screen p-4">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-8 bg-white shadow-xl rounded-2xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Welcome to <span className="text-indigo-600">Katalyst</span>
        </h1>
        <p className="max-w-2xl text-xl leading-8 text-gray-600 mb-8">
          The gamified learning platform that levels you up. Submit your work, get instant feedback from your <strong>AI Coach</strong>, and earn XP. The AI advises, but your mentor decides.
        </p>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full sm:w-auto">
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
        </div>
      </main>
    </div>
  );
}
