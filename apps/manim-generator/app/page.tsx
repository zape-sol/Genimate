"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sparkles, FunctionSquare, SquareStack, Text, Share2 } from "lucide-react"
import { InputForm } from "./components/InputForm"
import { ExampleGallery } from "./components/ExampleGallery"
import { AnimationPreview } from "./components/AnimationPreview"
import { CodeDisplay } from "./components/CodeDisplay"

export default function Home() {
  const [code, setCode] = useState("")
  const [videoPath, setVideoPath] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)

  const examples = [
    {
      title: "Mathematical Function",
      description: "Sine wave with moving particle",
      prompt: "Animate a sine wave function with a red dot moving along the curve",
      icon: <FunctionSquare className="w-5 h-5 text-blue-400" />, // colored lucide-react icon
      category: "Math",
    },
    {
      title: "Geometric Transform",
      description: "Shape morphing animation",
      prompt: "Transform a square into a circle, then into a triangle with smooth transitions",
      icon: <SquareStack className="w-5 h-5 text-purple-400" />, // colored lucide-react icon
      category: "Geometry",
    },
    {
      title: "Text Animation",
      description: "Animated mathematical equations",
      prompt: "Write 'Hello Manim' and then show the quadratic formula appearing below it",
      icon: <Text className="w-5 h-5 text-green-400" />, // colored lucide-react icon
      category: "Text",
    },
    {
      title: "Graph Theory",
      description: "Algorithm visualization",
      prompt: "Create a graph with 5 nodes and animate a breadth-first search traversal",
      icon: <Share2 className="w-5 h-5 text-yellow-400" />, // colored lucide-react icon
      category: "Algorithm",
    },
  ]

  useEffect(() => {
    if (!jobId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`)
        const data = await response.json()

        

        if (data.status === "COMPLETED") {
          setCode(data.code)
          setVideoPath(data.video_path)
          setDuration(data.duration || null)
          setIsLoading(false)
          setJobId(null)
          clearInterval(interval)
          console.log("Job completed data:", data);
          if (startTime) {
            setTotalDuration((Date.now() - startTime) / 1000);
          }
        } else if (data.status === "FAILED") {
          setError(data.details || "Failed to render animation")
          setIsLoading(false)
          setJobId(null)
          clearInterval(interval)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        setIsLoading(false)
        setJobId(null)
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId])

  const handleSubmit = async (promptText: string) => {
    setIsLoading(true)
    setError(null)
    setCode("")
    setVideoPath("")
    setShowCode(false)
    setJobId(null)
    setDuration(null)
    setTotalDuration(null)
    setStartTime(Date.now())

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: promptText }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to generate code")
      }

      const data = await response.json()
      setJobId(data.job_id)
      setCode(data.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description.trim()) {
      handleSubmit(description.trim())
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto flex h-16 items-center justify-center px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">Genimate</h1>
              <p className="text-xs text-zinc-400">AI Animation Generator</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-120px)]">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <InputForm 
              description={description}
              setDescription={setDescription}
              isLoading={isLoading}
              handleFormSubmit={handleFormSubmit}
            />
            <ExampleGallery 
              examples={examples}
              isLoading={isLoading}
              setDescription={setDescription}
              handleSubmit={handleSubmit}
            />
          </div>

          {/* Right Panel - Animation Display */}
          <div className="space-y-6">
            <AnimationPreview 
              isLoading={isLoading}
              error={error}
              videoPath={videoPath}
              duration={duration}
              totalDuration={totalDuration}
              showCode={showCode}
              setShowCode={setShowCode}
              setError={setError}
            />
            {showCode && code && <CodeDisplay code={code} />}
          </div>
        </div>
      </div>
    </div>
  )
}
