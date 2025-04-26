import { Home, MessageSquare, Upload, FileText, Mail } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 p-4 flex flex-col justify-between h-full border-r">
      <div>
        <div className="flex items-center mb-8 space-x-2">
          <img src="/logo.png" alt="ParakeetAI" className="h-6 w-6" />
          <span className="text-xl text-black font-semibold">Sales Assist AI</span>
        </div>
        <nav className="space-y-2 text-black">
          <SidebarLink icon={<Home size={18} />} label="Home" />
          {/* <SidebarLink icon={<MessageSquare size={18} />} label="" active /> */}
          <SidebarLink icon={<Upload size={18} />} label="Upload battlecards!" active />
          <SidebarLink icon={<FileText size={18} />} label="Library" />
        </nav>
      </div> 
      <div className="text-sm text-black space-y-2">
        <div className="flex text-black items-center gap-2">
          <Mail size={16} />
          <span>Email Support</span>
        </div>
        <div className="text-xs text-black pl-6">yashrajshukla48@gmail.com</div>
      </div>
    </aside>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
        active ? "bg-white shadow font-medium" : "hover:bg-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
