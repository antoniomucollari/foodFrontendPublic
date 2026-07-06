import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const Logo = ({
  size = "md",
  showText = false,
  text = "",
  linkTo = "/",
  className = "",
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: "h-16 w-32",
    md: "h-24 w-48",
    lg: "h-32 w-64",
    xl: "h-40 w-80",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const logoSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;

  // Use different logo based on theme
  // For dark mode, use logo-light.png (light colored logo shows well on dark background)
  // For light mode, use logo-dark.png (dark colored logo shows well on light background)
  const logoSrc = theme === "dark" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <Link to={linkTo} className={`flex items-center space-x-2 ${className}`}>
      <img src={logoSrc} alt="Logo" className={`${logoSize} object-contain`} />
      {showText && text && (
        <span className={`${textSize} font-bold`}>{text}</span>
      )}
    </Link>
  );
};

export default Logo;
