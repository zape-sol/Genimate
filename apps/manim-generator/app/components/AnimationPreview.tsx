"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Eye, EyeOff, AlertTriangle, Film } from "lucide-react"

interface AnimationPreviewProps {
  isLoading: boolean
  error: string | null
  videoPath: string
  duration: number | null
  totalDuration: number | null
  showCode: boolean
  setShowCode: (value: boolean) => void
  setError: (value: string | null) => void
}

export function AnimationPreview({ isLoading, error, videoPath, duration, totalDuration, showCode, setShowCode, setError }: AnimationPreviewProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-green-400" />
          Animation Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[500px]">
        {/* Loading State */}
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-zinc-700 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-blue-500/10 animate-pulse"></div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-white">Creating Your Animation</h3>
              <p className="text-sm text-zinc-400 max-w-md">
                Our AI is processing your request and generating the animation code...
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-center text-sm">
                <span className="text-zinc-400">This may take a moment...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center p-6">
            <Alert className="border-red-800 bg-red-950/50 max-w-md">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <div className="space-y-3">
                  <p className="font-medium">Generation Failed</p>
                  <p className="text-sm opacity-90">{error}</p>
                  <Button
                    onClick={() => setError(null)}
                    variant="outline"
                    size="sm"
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success State - Video */}
        {videoPath && !isLoading && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <video
                src={videoPath}
                controls
                className="w-full h-full object-contain"
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaWdodD0iMzAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwOTA5MGIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNTI1MjUyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QW5pbWF0aW9uIFJlYWR5PC90ZXh0Pjwvc3ZnPg=="
              />
            </div>
            {duration !== null && (
              <p className="text-sm text-zinc-400 text-center">
                Backend rendering time: {duration.toFixed(2)} seconds.
              </p>
            )}
            {totalDuration !== null && (
              <p className="text-sm text-zinc-400 text-center">
                Total time to display: {totalDuration.toFixed(2)} seconds.
              </p>
            )}

            <Button
              onClick={() => setShowCode(!showCode)}
              variant="outline"
              className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              {showCode ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Source Code
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Source Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !videoPath && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
              <div className="mx-auto h-24 w-24 rounded-full bg-zinc-900 flex items-center justify-center">
                <Film className="h-12 w-12 text-zinc-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Ready to Create</h3>
                <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                  Enter a detailed description of your animation or choose from our examples to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
