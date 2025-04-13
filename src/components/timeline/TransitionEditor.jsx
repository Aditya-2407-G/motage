"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Wand2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function TransitionEditor({ item, onUpdate, triggerComponent }) {
  const transitionOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide-left", label: "Slide Left" },
    { value: "slide-right", label: "Slide Right" },
    { value: "zoom-in", label: "Zoom In" },
    { value: "zoom-out", label: "Zoom Out" },
    { value: "none", label: "None" },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        {triggerComponent || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 shadow-lg">
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-slate-700 dark:text-gray-300">Enter Transition</Label>
            <Select
              value={item.inEffect || "fade"}
              onValueChange={(value) => {
                onUpdate({
                  ...item,
                  inEffect: value,
                })
              }}
            >
              <SelectTrigger className="w-full mt-1 bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-600">
                <SelectValue placeholder="Select enter transition" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-slate-700 dark:text-gray-300">Exit Transition</Label>
            <Select
              value={item.outEffect || "fade"}
              onValueChange={(value) => {
                onUpdate({
                  ...item,
                  outEffect: value,
                })
              }}
            >
              <SelectTrigger className="w-full mt-1 bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-600">
                <SelectValue placeholder="Select exit transition" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}


