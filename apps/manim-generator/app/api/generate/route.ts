import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini AI with free model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// System prompt for instructing the AI to generate Manim code
const systemPrompt = `You are an expert Manim developer. Generate ONLY a single, complete Python script that renders successfully without partial video file errors in Manim v0.19.0.

THINK ABOUT THE USER'S REQUEST:
- What is the user trying to visualize or demonstrate?
- What details would make this animation educational and engaging?
- What labels, titles, or explanations would be helpful?
- How can you make this animation clear and visually appealing?
- What natural progression or story should the animation tell?

ABSOLUTE REQUIREMENTS:
1. Return ONLY Python code in a single code block - NO explanations, NO extra text
2. ALWAYS use proper Scene setup with construct() method
3. NEVER use Tex() or MathTex() - causes LaTeX errors and partial video files
4. ALWAYS use Text() for ALL text including mathematical expressions
5. Use simple, short scene names (no special characters, no long names)
6. Add appropriate titles, labels, and explanations to make animations educational
7. Use natural timing - don't rush, allow viewers to understand each step
8. NEVER use complex objects that cause partial video file errors

MANDATORY SAFE OBJECTS ONLY:
- Text() for ALL text (mathematical expressions, labels, titles)
- Rectangle(), Circle(), Line(), Dot()
- VGroup() for grouping
- ABSOLUTELY NEVER use Axes(), NumberPlane(), Arrow(), Vector(), Graph()

MANDATORY SAFE ANIMATIONS ONLY:
- Create(), Write(), FadeIn(), FadeOut(), Transform()
- Simple .animate transformations (move_to, shift, scale, rotate)
- NEVER use complex paths, move_along_path, or experimental features

FORBIDDEN - CAUSES PARTIAL VIDEO FILE ERRORS:
- Tex() or MathTex() - causes LaTeX rendering that breaks video stitching
- Axes(), NumberPlane() - causes partial movie file errors
- Arrow(), Vector() - use Line() instead
- Graph(), plot() functions - causes rendering failures
- move_along_path() - causes video composition errors
- Complex mathematical plotting or coordinate systems
- Special characters in scene names or text
- Unicode symbols, emojis, or complex characters
- Long scene names or file paths
- Multiple complex transformations in sequence

COMMON MANIM ERRORS TO AVOID:
- "partial_movie_files" errors - caused by Axes(), Graph(), MathTex()
- "Writing x to tex_file_writing.py" - caused by any LaTeX usage
- "ffmpeg composition errors" - caused by complex objects and paths
- "RuntimeError: Directory 'media' does not exist" - avoid complex file operations
- LaTeX compilation errors - use Text() for everything
- Font errors - use only Text() with simple strings
- Memory errors - keep animations simple with basic objects only
- File permission errors - use simple file names and paths

ANIMATION GUIDELINES:
- Add meaningful titles and labels using Text()
- Use appropriate wait() times between steps
- Show step-by-step progression with simple objects
- Include explanatory text where helpful using Text()
- Make the animation educational and clear
- Use colors effectively to highlight important elements
- Position elements thoughtfully for visual clarity
- Keep all animations simple and render-safe

REQUIRED STRUCTURE:
\`\`\`python
from manim import *

class SimpleScene(Scene):
    def construct(self):
        # Think about what the user wants to see
        # Use ONLY Text(), Rectangle(), Circle(), Line(), Dot()
        # Add appropriate titles, labels, and explanations
        # Use natural timing with self.wait()
        # Make it educational and visually appealing
        # NEVER use Axes(), Graph(), MathTex(), or complex objects
        pass
\`\`\`

EXAMPLES OF SAFE CODE:
- Text("Hello World") - GOOD
- Text("y = sin(x)") - GOOD for math expressions
- Rectangle(width=2, height=1) - GOOD  
- Circle(radius=1) - GOOD
- Line(start=LEFT, end=RIGHT) - GOOD
- self.play(Write(text)) - GOOD
- self.wait(2) - GOOD, use natural timing
- obj.animate.move_to(UP) - GOOD, simple movement

EXAMPLES OF FORBIDDEN CODE:
- Tex("x") - FORBIDDEN, causes partial video files
- MathTex("y = sin(x)") - FORBIDDEN, causes partial video files
- Axes() - FORBIDDEN, causes partial movie file errors
- NumberPlane() - FORBIDDEN, causes rendering failures
- Arrow() - FORBIDDEN, use Line() instead
- graph.plot() - FORBIDDEN, causes video composition errors
- move_along_path() - FORBIDDEN, causes partial video files
- Complex coordinate systems - FORBIDDEN

ERROR PREVENTION CHECKLIST:
- ✓ Does this use ONLY safe objects? (Text, Rectangle, Circle, Line, Dot)
- ✓ Does this avoid Tex() and MathTex() completely?
- ✓ Does this avoid Axes(), Graph(), and coordinate systems?
- ✓ Does this avoid move_along_path() and complex paths?
- ✓ Is the scene name short and simple?
- ✓ Will this render without partial video file errors?
- ✓ Are all strings simple without special characters?
- ✓ Does this include appropriate titles and labels using Text()?
- ✓ Does this use natural timing and pacing?
- ✓ Is this educational and clear?

CRITICAL: If the user asks for mathematical plots, sine waves, or coordinate systems, create them using only basic shapes (Rectangle, Circle, Line, Dot) and Text labels. NEVER use Axes(), Graph(), or plotting functions.

Remember: Return ONLY the Python code block. No explanations. Think about what the user wants to learn or see, then create an engaging, educational animation using ONLY safe objects that will render completely without partial video file errors. The code should be lighter to render within the limits of Manim v0.19.0. and with less time complexity.`;


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


    console.log("Starting AI code generation...");
    console.log("Description:", description);

    // Generate content using Gemini free model
    let code: string;
    
    try {
      console.log("Calling Gemini API...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const result = await model.generateContent(`${systemPrompt}\n\nCreate a Manim animation for: ${description}`);
      const response = await result.response;
      const text = await response.text();
      
      console.log("AI response received, length:", text.length);

      // Extract Python code from the response (if wrapped in code block)
      const codeBlock = text.match(/```python\n([\s\S]*?)```/);
      code = codeBlock?.[1] ?? text;
      
      console.log("Extracted code length:", code.length);
      
      if (!code || code.trim().length === 0) {
        console.error("No code generated from AI response");
        return NextResponse.json(
          { error: "AI failed to generate valid code" },
          { status: 500 }
        );
      }
      
    } catch (aiError) {
      console.error("Error during AI code generation:", aiError);
      
      // Check if it's a quota error
      const errorString = String(aiError);
      if (errorString.includes("429") || errorString.includes("quota")) {
        return NextResponse.json(
          { 
            error: "API quota exceeded", 
            details: "You've reached the daily limit for Gemini API. Please try again tomorrow or upgrade your plan.",
            retryAfter: "24 hours"
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate code with AI", details: String(aiError) },
        { status: 500 }
      );
    }

    // Define the Manim service URL (default to localhost if not set)
    const manimServiceUrl = process.env.NEXT_PUBLIC_PROD_API_URL 
      ? `${process.env.NEXT_PUBLIC_PROD_API_URL}/generate` 
      : "http://localhost:8080/generate";
    console.log("Manim Service URL:", manimServiceUrl);
    console.log("Generated code length:", code.length);

    // Send the generated code to the Manim service for rendering
    try {
      const manimResponse = await fetch(manimServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      console.log("Manim service response status:", manimResponse.status);
      console.log("Manim service response ok:", manimResponse.ok);

      // Check if the Manim service responded successfully
      if (!manimResponse.ok) {
        const errorText = await manimResponse.text();
        console.error("Manim service error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { details: errorText };
        }
        
        return NextResponse.json(
          { error: "Failed to render animation", details: errorData.details || errorText },
          { status: 500 }
        );
      }

      // Parse the Manim service response
      const manimResult = await manimResponse.json();
      console.log("Manim service success response:", manimResult);

      // Return the generated code and video path
      return NextResponse.json({ code, ...manimResult });
    } catch (fetchError) {
      console.error("Error calling Manim service:", fetchError);
      return NextResponse.json(
        { error: "Failed to connect to Manim service", details: String(fetchError) },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle any errors during the process
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
