"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, Cpu } from "lucide-react"

interface InputFormProps {
  description: string
  setDescription: (value: string) => void
  isLoading: boolean
  handleFormSubmit: (e: React.FormEvent) => void
}

const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === 'true';
const API_URL = IS_PROD ? process.env.NEXT_PUBLIC_PROD_API_URL : process.env.NEXT_PUBLIC_API_URL;

export function InputForm({ description, setDescription, isLoading, handleFormSubmit }: InputFormProps) {
  return (
    <Card className="border-none bg-zinc-900/70 backdrop-blur-lg shadow-2xl rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white/90">
          <Cpu className="h-5 w-5 text-blue-400" />
          <span className="align-middle">Animation Prompt</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="animation-description" className="block text-sm font-medium text-zinc-300 mb-1 pl-1">Describe your animation</label>
            <div className="relative">
              <Textarea
                id="animation-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your animation in detail...
Example: 'Create a bouncing ball that changes color as it bounces'"
                className="min-h-[140px] resize-none rounded-xl border border-zinc-700 bg-zinc-800/70 text-white placeholder:text-zinc-500 focus:border-transparent focus:ring-2 focus:ring-purple-500/60 focus:outline-none shadow-lg transition-all duration-300 px-4 py-3 text-base"
                disabled={isLoading}
                maxLength={500}
              />
              <div className="pointer-events-none absolute right-3 bottom-3 text-xs text-zinc-500 select-none">
                {description.length}/500
              </div>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-1 px-1">
              <span>Be specific for better results</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="w-full h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold text-white shadow-xl rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-purple-400/60 focus:outline-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Animation...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Animation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}