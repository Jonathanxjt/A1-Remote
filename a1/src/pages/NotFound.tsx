import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <h1 className="text-6xl font-bold text-black">404</h1>
      <h2 className="text-2xl mt-4 text-black">Page Not Found</h2>
      <p className="mt-2 text-black">
        Sorry, the page you are looking for does not exist.
      </p>
      <Button asChild className="mt-6">
      <Link to="/">Go Back to Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
