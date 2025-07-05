import { getPasswordStrength } from "@/lib/validation";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  const { score, feedback } = getPasswordStrength(password);
  
  const getStrengthText = (score: number) => {
    if (score <= 1) return { text: "Very Weak", color: "text-red-500" };
    if (score <= 2) return { text: "Weak", color: "text-orange-500" };
    if (score <= 3) return { text: "Fair", color: "text-yellow-500" };
    if (score <= 4) return { text: "Good", color: "text-blue-500" };
    return { text: "Strong", color: "text-green-500" };
  };

  const getProgressColor = (score: number) => {
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;

  const { text, color } = getStrengthText(score);
  const progressValue = (score / 5) * 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Password Strength</span>
        <span className={`text-sm font-medium ${color}`}>{text}</span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2 mb-3"
        style={{
          background: `linear-gradient(to right, ${getProgressColor(score)} ${progressValue}%, transparent ${progressValue}%)`
        }}
      />

      <div className="space-y-1">
        {[
          'At least 8 characters',
          'Lowercase letters',
          'Uppercase letters',
          'Numbers',
          'Special characters'
        ].map((requirement, index) => {
          const isMet = index < score || (index === 0 && password.length >= 8) ||
                       (index === 1 && /[a-z]/.test(password)) ||
                       (index === 2 && /[A-Z]/.test(password)) ||
                       (index === 3 && /\d/.test(password)) ||
                       (index === 4 && /[@$!%*?&]/.test(password));

          return (
            <div key={requirement} className="flex items-center gap-2 text-xs">
              {isMet ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span className={isMet ? "text-green-600" : "text-muted-foreground"}>
                {requirement}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};