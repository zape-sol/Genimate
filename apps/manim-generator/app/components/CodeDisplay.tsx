"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "lucide-react"

interface CodeDisplayProps {
  code: string
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Code className="h-5 w-5 text-purple-400" />
          Generated Python Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => navigator.clipboard.writeText(code)}
            >
              Copy
            </Button>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 max-h-80 overflow-auto border border-zinc-800">
            <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
              <code className="language-python">{code}</code>
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}