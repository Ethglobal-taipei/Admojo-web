import { Loader2 } from "lucide-react";

export default function Loading() {
  // A basic themed loading skeleton that matches the page structure
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* You could add a simplified header skeleton here if needed */}
        <div className="flex items-center mb-6">
          {/* Placeholder for Back button and Title */}
          <div className="h-10 w-20 bg-gray-200 rounded mr-3 animate-pulse"></div>
          <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Placeholder for Search/Filter bar */}
        <div className="mb-4 border-[4px] border-black bg-white p-4 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-pulse">
           <div className="h-10 bg-gray-200 rounded w-full"></div>
           <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Centered loading indicator */}
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-[#0055FF]" />
        </div>
      </div>
    </main>
  );
}
  
  