# Genimate

This project is a web-based Manim animation generator. It uses a Next.js frontend to capture user input and a Python backend to render the animations.

## Architecture

The application is split into two main parts:

1.  **Frontend:** A Next.js application (`apps/manim-generator`) that provides the user interface.
2.  **Backend:** A Python Flask service (`apps/manim-service`) that uses Manim to generate animations.

This decoupled architecture allows for independent development and deployment of the frontend and backend.

## Running the Application

To run the application, you need to start both the frontend and the backend services.

### Backend (Manim Service)

The backend is a containerized Python application. You will need Docker installed to run it.

1.  **Build the Docker image:**

    ```bash
    docker build -t manim-service apps/manim-service
    ```

2.  **Run the Docker container:**

    ```bash
    docker run -p 8080:8080 manim-service
    ```

    The Manim service will now be running on `http://localhost:8080`.

### Frontend (Next.js)

The frontend is a standard Next.js application.

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    The Next.js application will be available at `http://localhost:3000`.

## Deployment

This application is designed for a hybrid deployment:

*   **Frontend:** The Next.js application can be deployed to a platform like Vercel.
*   **Backend:** The containerized Python service can be deployed to a container hosting service like Google Cloud Run, AWS Fargate, or DigitalOcean App Platform.

You will need to set the `MANIM_SERVICE_URL` environment variable in your Vercel deployment to point to the public URL of your deployed backend service.
