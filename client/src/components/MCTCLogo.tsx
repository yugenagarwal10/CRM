import logo from "../assets/mctc.png"

interface MCTCLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MCTCLogo({ className = "", size = "md" }: MCTCLogoProps) {
  // Height classes for image sizing
  const heightClasses = {
    sm: "h-6",
    md: "h-9",
    lg: "h-14",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={logo}
        alt="MCTC Logo"
        className={`${heightClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}
