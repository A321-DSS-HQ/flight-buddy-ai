import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, CheckCircle } from "lucide-react";

export const SecurityAlert = () => {
  return (
    <Alert className="border-green-200 bg-green-50">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Security Features Active</AlertTitle>
      <AlertDescription className="text-green-700">
        <div className="flex items-start gap-2 mt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3" />
              Password strength validation
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3" />
              Input sanitization & validation
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3" />
              File upload security checks
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3" />
              Rate limiting protection
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};