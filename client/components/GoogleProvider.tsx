"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import { ReactNode } from "react"

export default function GoogleProvider({ children }: { children: ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder-client-id"

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    )
}
