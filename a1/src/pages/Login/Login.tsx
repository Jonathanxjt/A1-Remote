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
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flip, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData); // Parse the user data from JSON format
        console.log(user);
        if (user) {
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    let valid = true;
    let emailError = "";
    let passwordError = "";

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
        const response = await axios.post(
          "http://localhost:5001/authenticate",
          {
            email,
            password,
          }
        );

        if (response.data.code === 200) {
          console.log("Sign In Successful");
          const staffId = response.data.data.user.staff_id;
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

          setTimeout(() => {
            navigate("/");
          }, 1000);
        } else {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="login-page-container">
      <ToastContainer />

      <Card className="login-card">
        <CardHeader className="login-card-header">
          <CardTitle className="login-card-title">Log in</CardTitle>
          <CardDescription className="login-card-description"></CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyPress}>
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
            <br />
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
            <Button className="login-button w-full" type="submit">
              Log In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
