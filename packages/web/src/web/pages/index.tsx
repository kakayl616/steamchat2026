import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated } from "../lib/auth";

export default function IndexPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/dashboard");
    } else {
      setLocation("/login");
    }
  }, []);

  return null;
}
