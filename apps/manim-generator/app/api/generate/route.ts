import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";


// console.log(`GEMINI_API_KEY loaded on server: ${!!process.env.GEMINI_API_KEY}`);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// System prompt for instructing the AI to generate Manim code
const systemPrompt = `# Manim Code Generation Expert

You are an expert Manim developer. Your sole task is to convert a user's description into a single, complete, and correct Manim Python script.

## Your Thought Process
1.  **Deconstruct the Request:** What are the core objects and concepts in the user's description? (e.g., numbers, bars, a pendulum, a graph).
2.  **Mobject Creation:** How will you represent these objects in Manim? (e.g., \`Rectangle\` for bars, \`Circle\` and \`Line\` for a pendulum, \`Axes\` and \`FunctionGraph\` for a function).
3.  **Layout and Positioning:** How will the objects be arranged?
    *   For multiple, similar objects, create them in a list comprehension and then group them immediately using \`VGroup\`.
    *   Use \`.arrange()\` to space them out evenly.
    *   Use \`.next_to()\` to position objects relative to each other.
4.  **Animation Sequence:** What is the story of the animation? Plan the sequence of \`self.play(...)\
 calls. Use \`Create\`, \`Transform\`, \`FadeIn\`, \`FadeOut\`, and other animations to tell the story.
5.  **Write the Code:** Combine the above steps into a clean, readable Python script.

## Critical Rules for High-Quality Code
- **ALWAYS use \`VGroup\` for multiple objects.** Manim animations like \`Create\` and \`Transform\` work on single mobjects or \`VGroup\`, not on Python lists.
- **ALWAYS use \`Tex\` for math.** Use raw strings and enclose the math in \`$\` signs. Example: \`Tex(r"$\\sqrt{x}$")\`. For plain numbers, \`Text\` is often better.
- **Positioning is Key:** Use \`.next_to()\`, \`.to_edge()\`, \`.shift()\`, and \`.arrange()\` to create a clean layout.
- **Complete Script:** The final output must be a single, complete Python script with all necessary imports and a Scene class, ready to be executed.

## Example: Bubble Sort

**Description:** Animate the sorting of an array using bubble sort.

**Code:**
\`\`\`python
from manim import *

class BubbleSort(Scene):
    def construct(self):
        numbers = [3, 1, 4, 1, 5, 9, 2, 6]
        n = len(numbers)

        # Create bars and labels
        bars = VGroup()
        for num in numbers:
            bar = Rectangle(
                width=0.6,
                height=num * 0.5,
                fill_color=BLUE,
                fill_opacity=0.8,
                stroke_width=0,
            )
            bars.add(bar)
        
        bars.arrange(RIGHT, buff=0.3)
        self.play(Create(bars))
        self.wait(0.5)

        # Bubble Sort Algorithm
        for i in range(n):
            for j in range(0, n - i - 1):
                # Highlight bars being compared
                self.play(
                    bars[j].animate.set_color(YELLOW),
                    bars[j+1].animate.set_color(YELLOW)
                )
                if numbers[j] > numbers[j+1]:
                    # Swap numbers
                    numbers[j], numbers[j+1] = numbers[j+1], numbers[j]
                    
                    # Animate swap
                    self.play(
                        Swap(bars[j], bars[j+1])
                    )
                    # Manually update bars list after swap
                    bars[j], bars[j+1] = bars[j+1], bars[j]

                # Un-highlight bars
                self.play(
                    bars[j].animate.set_color(BLUE),
                    bars[j+1].animate.set_color(BLUE)
                )
        
        self.wait(1)
\`\`\`
`;


// POST function to handle the request, generate Manim code, and render it
export async function POST(req: NextRequest) {
  try {
    // Extract description from the request body
    const { description } = await req.json();

    // Validate that description is provided
    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }


    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct the full prompt by combining system prompt and user description
    const prompt = `${systemPrompt}

**Description:** ${description}

**Code:**
`;

    // Generate content using the AI model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Extract Python code from the response (if wrapped in code block)
    const codeBlock = text.match(/```python\n([\s\S]*?)```/);
    const code = codeBlock?.[1] ?? text;

    // Define the Manim service URL (default to localhost if not set)
    const manimServiceUrl = process.env.NEXT_PUBLIC_PROD_API_URL || "http://localhost:8080/generate";

    // Send the generated code to the Manim service for rendering
    const manimResponse = await fetch(manimServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    // Check if the Manim service responded successfully
    if (!manimResponse.ok) {
      const errorData = await manimResponse.json();
      console.error("Manim service error:", errorData);
      return NextResponse.json(
        { error: "Failed to render animation", details: errorData.details },
        { status: 500 }
      );
    }

    // Parse the Manim service response
    const manimResult = await manimResponse.json();

    // Return the generated code and video path
    return NextResponse.json({ code, ...manimResult });
  } catch (error) {
    // Handle any errors during the process
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
