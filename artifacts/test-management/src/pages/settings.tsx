import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  
  // In a real app this would be derived from the current deployment
  const webhookUrl = `${window.location.origin}/api/webhooks/github`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste it into your configuration.",
    });
  };

  const yamlExample = `name: CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run tests
      run: npm run test:ci
      
    - name: Upload Test Results to TestOPS
      if: always()
      run: |
        curl -X POST ${webhookUrl} \\
          -H "Content-Type: application/json" \\
          -d '{
            "projectId": 1,
            "runName": "CI Run \${{ github.run_number }}",
            "branch": "\${{ github.ref_name }}",
            "commitHash": "\${{ github.sha }}",
            "ciProvider": "github-actions",
            "results": [
              { "testCaseId": 1, "status": "passed", "duration": 150 },
              { "testCaseId": 2, "status": "failed", "errorMessage": "AssertionError: expected true to be false" }
            ]
          }'`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Actions Integration</CardTitle>
          <CardDescription>
            Configure your CI/CD pipeline to report test results automatically to TestOPS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTitle>Webhook endpoint</AlertTitle>
            <AlertDescription>
              TestOPS provides a standard webhook endpoint that accepts JSON payloads with test results.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-sm" />
              <Button variant="secondary" onClick={() => copyToClipboard(webhookUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Example GitHub Action YAML</Label>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                {yamlExample}
              </pre>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(yamlExample)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm">Payload Schema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="font-mono text-sm text-primary mb-2">Request Body</div>
                <ul className="text-xs space-y-2 font-mono">
                  <li>projectId <span className="text-muted-foreground">(number)</span></li>
                  <li>runName <span className="text-muted-foreground">(string)</span></li>
                  <li>branch? <span className="text-muted-foreground">(string)</span></li>
                  <li>commitHash? <span className="text-muted-foreground">(string)</span></li>
                  <li>results <span className="text-muted-foreground">(Array)</span></li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <div className="font-mono text-sm text-primary mb-2">Result Object</div>
                <ul className="text-xs space-y-2 font-mono">
                  <li>testCaseId <span className="text-muted-foreground">(number)</span></li>
                  <li>status <span className="text-muted-foreground">("passed" | "failed" | "skipped")</span></li>
                  <li>duration? <span className="text-muted-foreground">(number, ms)</span></li>
                  <li>errorMessage? <span className="text-muted-foreground">(string)</span></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
