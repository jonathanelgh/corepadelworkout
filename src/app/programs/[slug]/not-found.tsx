import Link from "next/link";

export default function ProgramNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-24">
      <p className="text-lg font-medium text-gray-900 mb-2">Program not found</p>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
        This program may not exist or is not published yet.
      </p>
      <Link
        href="/programs"
        className="text-sm font-medium text-black underline underline-offset-4 hover:text-gray-700"
      >
        Back to programs
      </Link>
    </div>
  );
}
