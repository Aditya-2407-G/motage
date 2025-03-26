import React from 'react'
import { useTimeline } from "../../context/TimelineContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TransitionsPanel() {
  const { state, dispatch } = useTimeline()

  const transitionOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide-left", label: "Slide Left" },
    { value: "slide-right", label: "Slide Right" },
    { value: "zoom-in", label: "Zoom In" },
    { value: "zoom-out", label: "Zoom Out" },
    { value: "blur", label: "Blur" },
    { value: "none", label: "None" },
  ]

  const handleTransitionChange = (itemId, type, value) => {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      dispatch({
        type: "UPDATE_ITEM",
        payload: {
          ...item,
          [type]: value
        }
      })
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <CardHeader className="flex-none pb-3 border-b border-gray-700">
        <CardTitle className="text-gray-200">Frame Transitions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(180px-theme(spacing.12))]">
          <div className="p-4">
            {state.items.map((item, index) => (
              <div 
                key={item.id} 
                className="flex gap-4 items-center py-3 first:pt-0 last:pb-0 border-b border-gray-800 last:border-0"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-12 flex-none">
                  <img 
                    src={item.url} 
                    alt="" 
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-medium text-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Transition Controls */}
                <div className="flex-1 space-y-2 min-w-0">
                  <Select
                    value={item.inEffect || "none"}
                    onValueChange={(value) => handleTransitionChange(item.id, "inEffect", value)}
                  >
                    <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Enter transition" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {transitionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={item.outEffect || "none"}
                    onValueChange={(value) => handleTransitionChange(item.id, "outEffect", value)}
                  >
                    <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Exit transition" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {transitionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
