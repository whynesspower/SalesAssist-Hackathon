import NavBar2 from "@/components/NavBar2";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsDemo } from "@/components/TabsDemo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with increased padding for larger screens */}
      <header className="px-4 sm:px-6 lg:px-8 xl:px-12 h-14 flex items-center">
        <NavBar2 />
      </header>

      <main className="flex-1">
        <section id="features" className="w-full py-5">
          {/* Container with responsive padding */}
          <div className="container px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {/* Supporting Text */}
              <p className="max-w-[900px] text-neutral-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-neutral-400">
                License War: Enables you to search for open source licenses in
                minutes
              </p>
              {/* Heading Section */}
              <div className="w-full max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Answer questions to find best license for your use case
                </h2>
              </div>

              {/* TabsDemo Section with responsive width */}
              <div className="w-full md:w-[70%] mx-auto">
                <TabsDemo />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with responsive padding */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 sm:px-6 lg:px-8 xl:px-12 border-t">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <Link
            className="text-xs underline underline-offset-4"
            href="https://x.com/whynesspower"
            target="_blank"
          >
            © Build by whynesspower
          </Link>
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/privacy-policy"
            target="_blank"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/terms-of-usage"
            target="_blank"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function MountainIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}
