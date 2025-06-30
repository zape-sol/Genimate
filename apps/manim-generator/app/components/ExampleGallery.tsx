"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Film } from "lucide-react"

interface ExampleGalleryProps {
  examples: {
    title: string
    description: string
    prompt: string
    icon: React.ReactNode
    category: string
  }[]
  isLoading: boolean
  setDescription: (value: string) => void
  handleSubmit: (prompt: string) => void
}

export function ExampleGallery({ examples, isLoading, setDescription, handleSubmit }: ExampleGalleryProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Film className="h-5 w-5 text-green-400" />
          Quick Start Examples
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {examples.map((example, index) => (
            <div key={index}>
              <Button
                variant="ghost"
                onClick={() => {
                  setDescription(example.prompt)
                  handleSubmit(example.prompt)
                }}
                disabled={isLoading}
                className="w-full h-auto p-4 justify-start text-left hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 rounded-xl"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-2xl flex-shrink-0 mt-1">{example.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white text-sm truncate">{example.title}</h4>
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0">
                        {example.category}
                      </Badge>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">{example.description}</p>
                  </div>
                </div>
              </Button>
              {index < examples.length - 1 && <Separator className="my-2 bg-zinc-800" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}