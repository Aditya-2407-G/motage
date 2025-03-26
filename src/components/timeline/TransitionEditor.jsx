import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Wand2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function TransitionEditor({ item, onUpdate, triggerComponent }) {
  const transitionOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide-left", label: "Slide Left" },
    { value: "slide-right", label: "Slide Right" },
    { value: "zoom-in", label: "Zoom In" },
    { value: "zoom-out", label: "Zoom Out" },
    { value: "blur", label: "Blur" },
    { value: "none", label: "None" },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        {triggerComponent || (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-gray-800 border-gray-700">
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-300">Enter Transition</Label>
            <Select
              value={item.inEffect || "fade"}
              onValueChange={(value) => {
                onUpdate({
                  ...item,
                  inEffect: value,
                })
              }}
            >
              <SelectTrigger className="w-full mt-1 bg-gray-900 border-gray-700">
                <SelectValue placeholder="Select enter transition" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-300">Exit Transition</Label>
            <Select
              value={item.outEffect || "fade"}
              onValueChange={(value) => {
                onUpdate({
                  ...item,
                  outEffect: value,
                })
              }}
            >
              <SelectTrigger className="w-full mt-1 bg-gray-900 border-gray-700">
                <SelectValue placeholder="Select exit transition" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
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

