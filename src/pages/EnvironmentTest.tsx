import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { environmentManager } from "@/lib/environment";

interface ConfigTestResponse {
  success: boolean;
  message: string;
  environment: {
    db_host: string;
    db_port: string;
    db_name: string;
    is_production: boolean;
  };
  database: {
    success: boolean;
    message: string;
    version: string;
  };
  timestamp: string;
}

const EnvironmentTest: React.FC = () => {
  const [testResult, setTestResult] = useState<ConfigTestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = environmentManager.getApiUrl();
      const response = await fetch(`${apiUrl}/test-config.php`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run test on component mount
    runTest();
  }, []);

  const config = environmentManager.getConfig();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">BidKE Environment Test</h1>
        <p className="text-gray-600">Testing multi-environment configuration</p>
      </div>

      {/* Frontend Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Frontend Environment
            <Badge
              variant={
                config.environment === "development" ? "default" : "destructive"
              }
            >
              {config.environment}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>API Base URL:</strong> {config.apiBaseUrl}
          </div>
          <div>
            <strong>Database Port:</strong> {config.dbPort}
          </div>
          <div>
            <strong>CORS Origin:</strong> {config.corsOrigin}
          </div>
          <div>
            <strong>Hostname:</strong> {window.location.hostname}
          </div>
          <div>
            <strong>Port:</strong> {window.location.port}
          </div>
        </CardContent>
      </Card>

      {/* API Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Backend API Test
            <Button onClick={runTest} disabled={loading} size="sm">
              {loading ? "Testing..." : "Run Test"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Testing connection...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800">Connection Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? "Success" : "Failed"}
                </Badge>
                <span>{testResult.message}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Backend Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div>
                      <strong>Host:</strong> {testResult.environment.db_host}
                    </div>
                    <div>
                      <strong>Port:</strong> {testResult.environment.db_port}
                    </div>
                    <div>
                      <strong>Database:</strong>{" "}
                      {testResult.environment.db_name}
                    </div>
                    <div>
                      <strong>Production:</strong>{" "}
                      {testResult.environment.is_production ? "Yes" : "No"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Database Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          testResult.database.success
                            ? "default"
                            : "destructive"
                        }
                      >
                        {testResult.database.success ? "Connected" : "Failed"}
                      </Badge>
                    </div>
                    <div>
                      <strong>Message:</strong> {testResult.database.message}
                    </div>
                    {testResult.database.version && (
                      <div>
                        <strong>Version:</strong>{" "}
                        {testResult.database.version.split(",")[0]}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="text-xs text-gray-500">
                Last tested: {testResult.timestamp}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentTest;
