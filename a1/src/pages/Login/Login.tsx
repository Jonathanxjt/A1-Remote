import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import "./Login.css" 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "" });

  const handleSubmit = () => {
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
      // Handle the sign-in logic here
      setEmail("");
      setPassword("");
      console.log("Sign In Successful");
    }
  };

  return (
    <div className="login-page-container">
      <Card className="login-card">
        <CardHeader className="login-card-header">
          <CardTitle className="login-card-title">Log in</CardTitle>
          <CardDescription className="login-card-description">
          </CardDescription>
        </CardHeader>
        <CardContent className="login-card-content">
          <div className="login-input-group">
            <Label htmlFor="email" className="login-label">Email</Label>
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
            <Label htmlFor="password" className="login-label">Password</Label>
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
