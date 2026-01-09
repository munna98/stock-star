import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

export interface LicenseStatus {
    status: "Valid" | "Trial" | "Expired" | "Invalid";
    details?: any; // ValidLicenseDetails | TrialDetails
}

export default function RequireActivation({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<LicenseStatus | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkLicense();
    }, [location.pathname]); // Re-check on navigation? Or just once? Let's check on mount + focus maybe?

    const checkLicense = async () => {
        try {
            const result = await invoke<LicenseStatus>("get_license_status");
            console.log("License status:", result);
            setStatus(result);

            if (result.status === "Expired" || result.status === "Invalid") {
                navigate("/activation");
            }
        } catch (error) {
            console.error("Failed to check license:", error);
            // Fallback safe? Or strict? Strict.
            navigate("/activation");
        }
    };

    if (!status) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-600">Checking license parameters...</div>
            </div>
        );
    }

    if (status.status === "Expired" || status.status === "Invalid") {
        return null; // Should redirect
    }

    return (
        <>
            {status.status === "Trial" && (
                <div className="bg-orange-500 text-white text-xs font-bold text-center py-1 absolute top-0 w-full z-50">
                    TRIAL MODE - {status.details?.hours_remaining} Hours Remaining
                </div>
            )}
            {children}
        </>
    );
}
