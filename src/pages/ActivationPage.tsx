import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

export default function ActivationPage() {
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const [validating, setValidating] = useState(false);
    const [systemId, setSystemId] = useState("Loading...");
    const navigate = useNavigate();

    useEffect(() => {
        invoke<string>("get_system_id")
            .then(setSystemId)
            .catch(() => setSystemId("Unknown"));
    }, []);

    const handleActivate = async () => {
        setError("");
        setValidating(true);
        try {
            await invoke("activate_license", { key: key.trim() });
            navigate("/");
        } catch (err: any) {
            setError(err || "Activation failed");
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Activate Stock Star</h1>

                <p className="text-gray-600 mb-6 text-center text-sm">
                    Your trial has expired or no license was found.<br />
                    Please provide the System ID below to your administrator to receive an activation key.
                </p>

                <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
                    <label className="block text-gray-500 text-xs font-bold uppercase mb-1">
                        Your System ID
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono flex-1 select-all">
                            {systemId}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(systemId)}
                            className="text-white bg-gray-500 hover:bg-gray-600 px-2 py-1 rounded text-xs"
                            title="Copy to clipboard"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        License Key
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none font-mono text-xs"
                        placeholder="Paste your key here..."
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
                        {error}
                    </div>
                )}

                <button
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ${validating ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={handleActivate}
                    disabled={validating}
                >
                    {validating ? "Activating..." : "Activate License"}
                </button>
            </div>
        </div>
    );
}
