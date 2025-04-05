"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export function ToastDemo() {
  return (
    <div className="flex flex-col gap-4 p-6 border-[4px] border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Toast Notifications</h2>
      <p className="text-sm mb-4">Click the buttons below to see different toast types</p>

      <div className="grid grid-cols-2 gap-4">
        <Button
          className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold rounded-none"
          onClick={() => toast("Default Notification", { description: "This is a default toast notification" })}
        >
          Default Toast
        </Button>

        <Button
          className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] transition-all font-bold rounded-none"
          onClick={() =>
            toast(
              "Success Notification",
              {
                description: "Your action was completed successfully",
                action: {
                  label: "View",
                  onClick: () => console.log("View clicked"),
                },
              },
              "success",
            )
          }
        >
          Success Toast
        </Button>

        <Button
          className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#E62E5C] transition-all font-bold rounded-none"
          onClick={() =>
            toast(
              "Error Notification",
              {
                description: "Something went wrong. Please try again.",
                action: {
                  label: "Retry",
                  onClick: () => console.log("Retry clicked"),
                },
              },
              "error",
            )
          }
        >
          Error Toast
        </Button>

        <Button
          className="bg-[#FFCC00] text-black border-[3px] border-black hover:bg-[#E6B800] transition-all font-bold rounded-none"
          onClick={() =>
            toast(
              "Warning Notification",
              {
                description: "This action may have consequences",
                action: {
                  label: "Continue",
                  onClick: () => console.log("Continue clicked"),
                },
                cancel: {
                  label: "Cancel",
                  onClick: () => console.log("Cancel clicked"),
                },
              },
              "warning",
            )
          }
        >
          Warning Toast
        </Button>

        <Button
          className="bg-[#f5f5f5] text-black border-[3px] border-black hover:bg-[#e0e0e0] transition-all font-bold rounded-none col-span-2"
          onClick={() =>
            toast(
              "Info Notification",
              {
                description: "Here's some information you might find useful",
                duration: 10000,
              },
              "info",
            )
          }
        >
          Info Toast (10s duration)
        </Button>
      </div>
    </div>
  )
}

