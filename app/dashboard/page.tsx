import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StepsFlow from "./components/Stepsflow";

export default function DashboardPage() {
  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex flex-col flex-1 p-6 bg-white overflow-y-auto">
        <Header />
        <StepsFlow />
      </main>
    </div>
  );
}
