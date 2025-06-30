import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: any) {
  try {
    const { job_id } = params;
    const manimServiceUrl = process.env.MANIM_SERVICE_URL || "http://localhost:8080";
    const statusUrl = `${manimServiceUrl}/status/${job_id}`;

    const manimResponse = await fetch(statusUrl);

    if (!manimResponse.ok) {
      const errorData = await manimResponse.json();
      console.error("Manim service error:", errorData);
      return NextResponse.json(
        { error: "Failed to get job status", details: errorData.details },
        { status: 500 }
      );
    }

    const manimResult = await manimResponse.json();
    return NextResponse.json(manimResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
} 
