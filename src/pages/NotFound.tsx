import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb,120,120,255),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb,120,120,255),0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10 px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <Compass className="h-10 w-10 text-primary" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-7xl font-black text-primary/20 mb-2"
        >
          404
        </motion.p>

        <h1 className="text-xl font-bold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          The route <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code> doesn't exist.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Home</Link>
          </Button>
          <Button className="gradient-primary text-primary-foreground" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
