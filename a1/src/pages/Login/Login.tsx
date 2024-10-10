import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./Login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "" });
  const navigate = useNavigate(); // Initialize the navigate function

  const handleSubmit = async () => {
    let valid = true;
    let emailError = "";
    let passwordError = "";

    // Basic email and password validation
    if (!email) {
      emailError = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      emailError = "Please enter a valid email";
      valid = false;
    }

    if (!password) {
      passwordError = "Password is required";
      valid = false;
    }

    setError({ email: emailError, password: passwordError });

    if (valid) {
      try {
        // Make the request to the Flask backend for authentication
        const response = await axios.post(
          "http://localhost:5001/authenticate",
          {
            email,
            password,
          }
        );

        if (response.data.code === 200) {
          // Authentication successful
          console.log("Sign In Successful");

          // Store the staff_id in sessionStorage
          const staffId = response.data.data.user.staff_id;
          console.log(response.data.data.user);
          console.log("staff_id:", staffId);
          sessionStorage.setItem("staff_id", staffId);

          setEmail("");
          setPassword("");
          toast.success("Login Successful!", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Flip,
          });

          // Redirect to the homepage after a short delay
          setTimeout(() => {
            navigate("/"); // Replace "/" with the path to your homepage
          }, 1000); // Wait for 1 second to allow the toast to close
        } else {
          console.log("Authentication failed");
          toast.error("Login failed: Incorrect email or password!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Flip,
          });
        }
      } catch (error) {
        console.error("Error during authentication", error);
        toast.error("Login failed: Incorrect email or password!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        });
      }
    }
  };

  return (
    <div className="login-page-container">
      {/* Add the ToastContainer */}
      <ToastContainer />

      <Card className="login-card">
        <CardHeader className="login-card-header">
          <CardTitle className="login-card-title">Log in</CardTitle>
          <CardDescription className="login-card-description"></CardDescription>
        </CardHeader>
        <CardContent className="login-card-content">
          <div className="login-input-group">
            <Label htmlFor="email" className="login-label">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={error.email ? "input-error" : ""}
            />
            {error.email && <p className="error-text">{error.email}</p>}
          </div>
          <br></br>
          <div className="login-input-group">
            <Label htmlFor="password" className="login-label">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error.password ? "input-error" : ""}
            />
            {error.password && <p className="error-text">{error.password}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="login-button w-full" onClick={handleSubmit}>
            Log In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
